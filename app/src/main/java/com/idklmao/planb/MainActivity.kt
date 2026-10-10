package com.idklmao.planb

import android.annotation.SuppressLint
import android.app.Activity
import android.app.KeyguardManager
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.graphics.Color
import android.hardware.biometrics.BiometricManager
import android.hardware.biometrics.BiometricPrompt
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.provider.CalendarContract
import android.provider.ContactsContract
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.util.Calendar
import java.util.concurrent.Executors

/**
 * Business App (our Plan B): assets/index.html (screens and tabs drawn by app.js) full screen, edge to edge.
 * The page calls [Bridge] as window.PlanB for the phone bits: clipboard, haptics, the email app,
 * the calendar, maps and calls, her documents (camera, files, the lock, export) and the back button.
 * Ticks, dates and contacts are kept in the page's localStorage; document files in [DocStore].
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private lateinit var docs: DocStore
    private val work = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    /** System bar and keyboard sizes in CSS pixels, read by the page as soon as it starts. */
    @Volatile private var insetsJson = """{"top":0,"right":0,"bottom":0,"left":0,"kb":0}"""

    /** True while the page has somewhere to go back to (another tab, a sheet, the viewer). */
    private var pageHandlesBack = false
    private var backCallback: Any? = null // OnBackInvokedCallback on Android 13+

    /** Documents are unlocked until the app goes to the background (but not for our own camera or file picker). */
    private var unlocked = false
    private var openingOwnScreen = false

    private var pendingDocId: String? = null
    private var pendingPhoto: File? = null
    private var pendingExport: File? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        docs = DocStore(this)
        drawBehindSystemBars()

        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#E7D4DC"))
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            // The page itself never scrolls (each screen scrolls inside it), so no glow at its edges.
            overScrollMode = View.OVER_SCROLL_NEVER
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            // Her voice clips play when she taps Keyla, without needing a long press first.
            settings.mediaPlaybackRequiresUserGesture = false
            // Follow the phone's font size setting, within what the layout handles well.
            settings.textZoom = (resources.configuration.fontScale * 100).toInt().coerceIn(85, 130)
            addJavascriptInterface(Bridge(), "PlanB")
            webViewClient = object : WebViewClient() {
                // Anything on the web opens in its app (Maps, WhatsApp) or the browser.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.scheme == "file") return false
                    launch(Intent(Intent.ACTION_VIEW, request.url), "No app can open that link")
                    return true
                }

                // Document pictures, served from private storage only while unlocked.
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                    if (!request.url.toString().startsWith(DocStore.URL_BASE)) return null
                    val f = (if (unlocked) docs.fileFor(request.url) else null)
                        ?: return WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, null)
                    return WebResourceResponse("image/jpeg", null, f.inputStream())
                }

                override fun onPageFinished(view: WebView, url: String) = pushInsets()
            }
        }
        web.setOnApplyWindowInsetsListener { _, insets ->
            val density = resources.displayMetrics.density
            val (left, top, right, bottom, kb) = barSizes(insets)
            fun css(px: Int) = Math.round(px / density)
            insetsJson = """{"top":${css(top)},"right":${css(right)},"bottom":${css(bottom)},"left":${css(left)},"kb":${css(kb)}}"""
            pushInsets()
            insets
        }
        setContentView(web)
        if (Build.VERSION.SDK_INT >= 30) {
            val light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            window.insetsController?.setSystemBarsAppearance(light, light)
        }

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl("file:///android_asset/index.html")
        }
    }

    /** The page's top bar and tab bar sit under the status and navigation bars, like a native app. */
    @Suppress("DEPRECATION") // the pre-Android 11 flags, and the bar colours Android 15 ignores
    private fun drawBehindSystemBars() {
        val w = window
        w.statusBarColor = Color.TRANSPARENT
        // Android 8.0 can't draw dark navigation buttons, so keep a soft dark bar behind its white ones.
        w.navigationBarColor = if (Build.VERSION.SDK_INT >= 27) Color.TRANSPARENT else Color.parseColor("#9933243C")
        if (Build.VERSION.SDK_INT >= 29) w.isNavigationBarContrastEnforced = false
        if (Build.VERSION.SDK_INT >= 28) {
            w.attributes = w.attributes.apply {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        if (Build.VERSION.SDK_INT >= 30) {
            w.setDecorFitsSystemWindows(false)
        } else {
            var flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            if (Build.VERSION.SDK_INT >= 27) flags = flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            w.decorView.systemUiVisibility = flags
        }
    }

    /** Bars and camera cutout in device pixels (left, top, right, bottom), then the keyboard height. */
    @Suppress("DEPRECATION")
    private fun barSizes(insets: WindowInsets): List<Int> {
        if (Build.VERSION.SDK_INT >= 30) {
            val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            val ime = insets.getInsets(WindowInsets.Type.ime()).bottom
            return listOf(bars.left, bars.top, bars.right, bars.bottom, ime)
        }
        val kb = (insets.systemWindowInsetBottom - insets.stableInsetBottom).coerceAtLeast(0)
        return listOf(insets.stableInsetLeft, insets.stableInsetTop, insets.stableInsetRight, insets.stableInsetBottom, kb)
    }

    private fun pushInsets() {
        val i = JSONObject(insetsJson)
        js("PlanBApp.setInsets(${i.getInt("top")},${i.getInt("right")},${i.getInt("bottom")},${i.getInt("left")},${i.getInt("kb")})")
    }

    /** Calls the page (window.PlanBApp) on the main thread. */
    private fun js(code: String) = main.post { web.evaluateJavascript("window.PlanBApp && $code", null) }

    private fun pageBack() = js("PlanBApp.back()")

    private fun setPageHandlesBack(handles: Boolean) {
        pageHandlesBack = handles
        if (Build.VERSION.SDK_INT >= 33) {
            val dispatcher = onBackInvokedDispatcher
            val existing = backCallback as OnBackInvokedCallback?
            if (handles && existing == null) {
                val cb = OnBackInvokedCallback { pageBack() }
                dispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, cb)
                backCallback = cb
            } else if (!handles && existing != null) {
                dispatcher.unregisterOnBackInvokedCallback(existing)
                backCallback = null
            }
        }
    }

    @Deprecated("Android 12 and older; newer versions use the OnBackInvokedCallback above")
    override fun onBackPressed() {
        if (pageHandlesBack) pageBack() else super.onBackPressed()
    }

    private fun toast(message: String) = js("PlanBApp.toast(${JSONObject.quote(message)})")

    private fun launch(intent: Intent, failMessage: String) {
        try {
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            toast(failMessage)
        }
    }

    /** Starts one of our own pickers (camera, files, contacts); the documents stay unlocked meanwhile. */
    private fun launchForResult(intent: Intent, request: Int, failMessage: String) {
        try {
            openingOwnScreen = true
            startActivityForResult(intent, request)
        } catch (e: ActivityNotFoundException) {
            openingOwnScreen = false
            toast(failMessage)
        }
    }

    private fun fileUri(f: File): Uri = FileProvider.getUriForFile(this, "$packageName.files", f)

    // ---------- the lock ----------

    private fun unlock() {
        val keyguard = getSystemService(KeyguardManager::class.java)
        if (!keyguard.isDeviceSecure) {
            // No screen lock on the phone, so there is nothing to check against.
            setUnlocked(true, secure = false)
            return
        }
        if (Build.VERSION.SDK_INT >= 29) {
            try {
                showBiometricPrompt()
            } catch (e: Exception) {
                // Some phones refuse the fingerprint prompt; the phone's own PIN screen still works.
                confirmWithScreenLock(keyguard)
            }
        } else {
            confirmWithScreenLock(keyguard)
        }
    }

    @android.annotation.TargetApi(29)
    private fun showBiometricPrompt() {
        val builder = BiometricPrompt.Builder(this)
            .setTitle("Unlock documents")
            .setSubtitle("Her papers stay behind the phone's lock")
        if (Build.VERSION.SDK_INT >= 30) {
            builder.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
        } else {
            @Suppress("DEPRECATION")
            builder.setDeviceCredentialAllowed(true)
        }
        builder.build().authenticate(CancellationSignal(), mainExecutor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) = setUnlocked(true, secure = true)
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) = setUnlocked(false, secure = true)
        })
    }

    private fun confirmWithScreenLock(keyguard: KeyguardManager) {
        @Suppress("DEPRECATION")
        val intent = keyguard.createConfirmDeviceCredentialIntent("Unlock documents", "Her papers stay behind the phone's lock")
        if (intent == null) setUnlocked(true, secure = false) else launchForResult(intent, REQ_UNLOCK, "Couldn't open the phone's lock")
    }

    private fun setUnlocked(on: Boolean, secure: Boolean) {
        unlocked = on
        // While documents are open, keep them out of screenshots and the recent apps preview.
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_SECURE) else window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        js("PlanBApp.onLock($on,$secure)")
    }

    override fun onStop() {
        super.onStop()
        if (!openingOwnScreen && unlocked) setUnlocked(false, secure = true)
    }

    // ---------- results from the camera, the file picker, contacts and "save as" ----------

    @Deprecated("Fine for a single-activity app without AndroidX Activity")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        openingOwnScreen = false
        val ok = resultCode == RESULT_OK
        when (requestCode) {
            REQ_UNLOCK -> setUnlocked(ok, secure = true)
            REQ_FILES -> {
                val docId = pendingDocId ?: return
                val uris = mutableListOf<Uri>()
                data?.clipData?.let { c -> for (i in 0 until c.itemCount) uris += c.getItemAt(i).uri }
                if (uris.isEmpty()) data?.data?.let { uris += it }
                if (ok && uris.isNotEmpty()) importInBackground(docId) { uris.forEach { docs.importUri(docId, it) } }
            }
            REQ_CAMERA -> {
                val docId = pendingDocId ?: return
                val photo = pendingPhoto ?: return
                if (ok && photo.length() > 0) importInBackground(docId) { docs.importPhoto(docId, photo) } else photo.delete()
            }
            REQ_SAVE_ZIP -> {
                val zip = pendingExport ?: return
                val target = data?.data
                if (ok && target != null) {
                    work.execute {
                        try {
                            contentResolver.openOutputStream(target)!!.use { out -> zip.inputStream().use { it.copyTo(out) } }
                            toast("Saved ✓")
                        } catch (e: Exception) {
                            toast("Couldn't save the zip")
                        }
                    }
                }
            }
            REQ_CONTACT -> {
                val uri = data?.data
                if (ok && uri != null) contactPicked(uri)
            }
        }
    }

    private fun importInBackground(docId: String, job: () -> Unit) {
        js("PlanBApp.docsBusy(true)")
        work.execute {
            val error = try {
                job(); null
            } catch (e: Exception) {
                "Couldn't add that file"
            }
            js("PlanBApp.docsBusy(false)")
            js("PlanBApp.docsChanged(${JSONObject.quote(docId)})")
            if (error != null) toast(error)
        }
    }

    private fun contactPicked(uri: Uri) {
        val cols = arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER)
        try {
            contentResolver.query(uri, cols, null, null, null)?.use { c ->
                if (c.moveToFirst()) {
                    val picked = JSONObject().put("name", c.getString(0).orEmpty()).put("phone", c.getString(1).orEmpty())
                    js("PlanBApp.contactPicked($picked)")
                }
            }
        } catch (e: Exception) {
            toast("Couldn't read that contact")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
        outState.putString("pendingDocId", pendingDocId)
        outState.putString("pendingPhoto", pendingPhoto?.path)
    }

    override fun onRestoreInstanceState(state: Bundle) {
        super.onRestoreInstanceState(state)
        // Android may close the app while the camera is open; pick up where it was.
        pendingDocId = state.getString("pendingDocId")
        pendingPhoto = state.getString("pendingPhoto")?.let { File(it) }
    }

    override fun onResume() {
        super.onResume()
        openingOwnScreen = false
        web.onResume()
    }

    override fun onPause() {
        web.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        web.destroy()
        work.shutdown()
        super.onDestroy()
    }

    /** window.PlanB in the page. These run on a background thread, so UI work is posted to the main one. */
    private inner class Bridge {
        @JavascriptInterface
        fun insets(): String = insetsJson

        @JavascriptInterface
        fun copy(text: String) {
            val clipboard = getSystemService(ClipboardManager::class.java)
            clipboard.setPrimaryClip(ClipData.newPlainText("Business App", text))
        }

        @JavascriptInterface
        fun haptic(kind: String) = runOnUiThread {
            val effect = when (kind) {
                "heavy" -> HapticFeedbackConstants.LONG_PRESS
                "light" -> HapticFeedbackConstants.CLOCK_TICK
                else -> HapticFeedbackConstants.VIRTUAL_KEY
            }
            web.performHapticFeedback(effect)
        }

        @JavascriptInterface
        fun setCanGoBack(can: Boolean) = runOnUiThread { setPageHandlesBack(can) }

        @JavascriptInterface
        fun email(to: String, subject: String, body: String) = runOnUiThread {
            val uri = Uri.parse("mailto:$to?subject=${Uri.encode(subject)}&body=${Uri.encode(body)}")
            val intent = Intent(Intent.ACTION_SENDTO, uri)
                .putExtra(Intent.EXTRA_EMAIL, arrayOf(to))
                .putExtra(Intent.EXTRA_SUBJECT, subject)
                .putExtra(Intent.EXTRA_TEXT, body)
            launch(intent, "No email app found. Use the Copy buttons")
        }

        /** Opens the calendar app with a "check the meter" event every two weeks, starting the coming Sunday at 20:00. */
        @JavascriptInterface
        fun remindCheck() = runOnUiThread {
            val now = Calendar.getInstance()
            val start = (now.clone() as Calendar).apply {
                set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY)
                set(Calendar.HOUR_OF_DAY, 20)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                while (!after(now)) add(Calendar.WEEK_OF_YEAR, 1)
            }.timeInMillis
            calendarEvent("Business App: check the Uh-Oh-Meter", "Open Business App together and tick only what is actually happening.", start, "FREQ=WEEKLY;INTERVAL=2")
        }

        /** Opens the calendar app with a one-off all-evening reminder on [dayMillis]. */
        @JavascriptInterface
        fun remindOn(title: String, description: String, dayMillis: Long) = runOnUiThread {
            val start = Calendar.getInstance().apply {
                timeInMillis = dayMillis
                set(Calendar.HOUR_OF_DAY, 19)
                set(Calendar.MINUTE, 0)
            }.timeInMillis
            calendarEvent(title, description, start, null)
        }

        @JavascriptInterface
        fun dial(number: String) = runOnUiThread {
            launch(Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(number))), "No phone app found")
        }

        @JavascriptInterface
        fun pickContact() = runOnUiThread {
            launchForResult(Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI), REQ_CONTACT, "No contacts app found")
        }

        // ---------- documents ----------

        @JavascriptInterface
        fun unlockDocs() = runOnUiThread { unlock() }

        @JavascriptInterface
        fun lockDocs() = runOnUiThread { setUnlocked(false, secure = true) }

        @JavascriptInterface
        fun docsList(): String = if (unlocked) docs.list().toString() else "{}"

        @JavascriptInterface
        fun addFromCamera(docId: String) = runOnUiThread {
            if (!unlocked) return@runOnUiThread
            val photo = File(cacheDir, "camera/${System.currentTimeMillis()}.jpg").apply { parentFile?.mkdirs() }
            pendingDocId = docId
            pendingPhoto = photo
            val uri = fileUri(photo)
            val intent = Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
                .putExtra(android.provider.MediaStore.EXTRA_OUTPUT, uri)
                .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            intent.clipData = ClipData.newRawUri("photo", uri)
            launchForResult(intent, REQ_CAMERA, "No camera app found")
        }

        @JavascriptInterface
        fun addFromFiles(docId: String) = runOnUiThread {
            if (!unlocked) return@runOnUiThread
            pendingDocId = docId
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
                .addCategory(Intent.CATEGORY_OPENABLE)
                .setType("*/*")
                .putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "application/pdf"))
                .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            launchForResult(intent, REQ_FILES, "No file picker found")
        }

        @JavascriptInterface
        fun deleteDocItem(docId: String, itemId: String) {
            if (!unlocked) return
            docs.deleteItem(docId, itemId)
            js("PlanBApp.docsChanged(${JSONObject.quote(docId)})")
        }

        @JavascriptInterface
        fun deleteDoc(docId: String) {
            if (!unlocked) return
            docs.deleteDoc(docId)
            js("PlanBApp.docsChanged(${JSONObject.quote(docId)})")
        }

        /** Opens a document file (the original PDF, or a photo) in another app, e.g. to print or zoom. */
        @JavascriptInterface
        fun openDocItem(docId: String, itemId: String) = runOnUiThread {
            if (!unlocked) return@runOnUiThread
            val f = File(docs.root, "$docId/$itemId")
            if (!f.isFile) return@runOnUiThread
            val type = if (f.extension == "pdf") "application/pdf" else "image/jpeg"
            val intent = Intent(Intent.ACTION_VIEW).setDataAndType(fileUri(f), type).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            openingOwnScreen = true
            launch(intent, "No app can open this file")
        }

        /** Zips every document and offers it to Google Drive ([toDrive]) or a "save as" screen (phone, SD card, USB). */
        @JavascriptInterface
        fun exportDocs(titlesJson: String, index: String, toDrive: Boolean) {
            if (!unlocked) return
            if (!docs.hasAny()) {
                toast("No documents to export yet")
                return
            }
            js("PlanBApp.docsBusy(true)")
            work.execute {
                val zip = try {
                    docs.exportZip(JSONObject(titlesJson), index)
                } catch (e: Exception) {
                    null
                }
                js("PlanBApp.docsBusy(false)")
                if (zip == null) {
                    toast("Couldn't make the zip")
                    return@execute
                }
                runOnUiThread {
                    pendingExport = zip
                    if (toDrive) {
                        val send = Intent(Intent.ACTION_SEND).setType("application/zip")
                            .putExtra(Intent.EXTRA_STREAM, fileUri(zip))
                            .putExtra(Intent.EXTRA_TITLE, zip.name)
                            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        send.clipData = ClipData.newRawUri(zip.name, fileUri(zip))
                        openingOwnScreen = true
                        try {
                            startActivity(Intent(send).setPackage("com.google.android.apps.docs"))
                        } catch (e: ActivityNotFoundException) {
                            launch(Intent.createChooser(send, "Save the zip to…"), "No app to save it with")
                        }
                    } else {
                        val save = Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                            .setType("application/zip").putExtra(Intent.EXTRA_TITLE, zip.name)
                        launchForResult(save, REQ_SAVE_ZIP, "No file manager found")
                    }
                }
            }
        }
    }

    private fun calendarEvent(title: String, description: String, start: Long, rrule: String?) {
        val intent = Intent(Intent.ACTION_INSERT)
            .setData(CalendarContract.Events.CONTENT_URI)
            .putExtra(CalendarContract.Events.TITLE, title)
            .putExtra(CalendarContract.Events.DESCRIPTION, description)
            .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start)
            .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, start + 30 * 60 * 1000)
        if (rrule != null) intent.putExtra(CalendarContract.Events.RRULE, rrule)
        launch(intent, "No calendar app found")
    }

    companion object {
        private const val REQ_FILES = 1
        private const val REQ_CAMERA = 2
        private const val REQ_SAVE_ZIP = 3
        private const val REQ_CONTACT = 4
        private const val REQ_UNLOCK = 5
    }
}
