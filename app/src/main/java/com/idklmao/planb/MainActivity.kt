package com.idklmao.planb

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.CalendarContract
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import org.json.JSONObject
import java.util.Calendar

/**
 * The Plan B app: assets/index.html (screens and tabs drawn by app.js) full screen, edge to edge.
 * The page calls [Bridge] as window.PlanB for the phone bits: clipboard, haptics, the email app,
 * a calendar reminder and the back button. Ticks are kept in the page's localStorage.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    /** System bar sizes in CSS pixels, read by the page as soon as it starts. */
    @Volatile private var insetsJson = """{"top":0,"right":0,"bottom":0,"left":0}"""

    /** True while the page has somewhere to go back to (another tab, or the open sheet). */
    private var pageHandlesBack = false
    private var backCallback: Any? = null // OnBackInvokedCallback on Android 13+

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        drawBehindSystemBars()

        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#E7D4DC"))
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            // The page itself never scrolls (each screen scrolls inside it), so no glow at its edges.
            overScrollMode = View.OVER_SCROLL_NEVER
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            // Follow the phone's font size setting, within what the layout handles well.
            settings.textZoom = (resources.configuration.fontScale * 100).toInt().coerceIn(85, 130)
            addJavascriptInterface(Bridge(), "PlanB")
            webViewClient = object : WebViewClient() {
                // Anything on the web opens in the browser.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.scheme == "file") return false
                    launch(Intent(Intent.ACTION_VIEW, request.url), "No app can open that link")
                    return true
                }

                override fun onPageFinished(view: WebView, url: String) = pushInsets()
            }
        }
        web.setOnApplyWindowInsetsListener { _, insets ->
            val density = resources.displayMetrics.density
            val (left, top, right, bottom) = barSizes(insets)
            fun css(px: Int) = Math.round(px / density)
            insetsJson = """{"top":${css(top)},"right":${css(right)},"bottom":${css(bottom)},"left":${css(left)}}"""
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

    /** Status bar, navigation bar and camera cutout sizes in device pixels: left, top, right, bottom. */
    @Suppress("DEPRECATION")
    private fun barSizes(insets: WindowInsets): List<Int> {
        if (Build.VERSION.SDK_INT >= 30) {
            val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            return listOf(bars.left, bars.top, bars.right, bars.bottom)
        }
        return listOf(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
    }

    private fun pushInsets() {
        val i = JSONObject(insetsJson)
        web.evaluateJavascript(
            "window.PlanBApp && PlanBApp.setInsets(${i.getInt("top")},${i.getInt("right")},${i.getInt("bottom")},${i.getInt("left")})",
            null,
        )
    }

    private fun pageBack() = web.evaluateJavascript("window.PlanBApp && PlanBApp.back()", null)

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

    private fun toast(message: String) =
        web.evaluateJavascript("window.PlanBApp && PlanBApp.toast(${JSONObject.quote(message)})", null)

    private fun launch(intent: Intent, failMessage: String) {
        try {
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            toast(failMessage)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onPause() {
        web.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }

    /** window.PlanB in the page. These run on a background thread, so UI work is posted to the main one. */
    private inner class Bridge {
        @JavascriptInterface
        fun insets(): String = insetsJson

        @JavascriptInterface
        fun copy(text: String) {
            val clipboard = getSystemService(ClipboardManager::class.java)
            clipboard.setPrimaryClip(ClipData.newPlainText("Plan B", text))
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

        /** Opens the calendar app with a monthly "check the meter" event, starting the 1st of next month at 20:00. */
        @JavascriptInterface
        fun remindMonthly() = runOnUiThread {
            val start = Calendar.getInstance().apply {
                add(Calendar.MONTH, 1)
                set(Calendar.DAY_OF_MONTH, 1)
                set(Calendar.HOUR_OF_DAY, 20)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis
            val intent = Intent(Intent.ACTION_INSERT)
                .setData(CalendarContract.Events.CONTENT_URI)
                .putExtra(CalendarContract.Events.TITLE, "Plan B: check the Uh-Oh-Meter")
                .putExtra(CalendarContract.Events.DESCRIPTION, "Open Plan B together and tick only what is actually happening.")
                .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start)
                .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, start + 30 * 60 * 1000)
                .putExtra(CalendarContract.Events.RRULE, "FREQ=MONTHLY")
            launch(intent, "No calendar app found")
        }
    }
}
