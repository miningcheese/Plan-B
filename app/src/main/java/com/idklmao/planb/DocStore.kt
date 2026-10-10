package com.idklmao.planb

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.pdf.PdfRenderer
import android.media.ExifInterface
import android.net.Uri
import android.os.ParcelFileDescriptor
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * Her documents, kept only in the app's private storage (files/docs, left out of backups).
 *
 *   docs/<docId>/<stamp>.jpg              a photo or image (scaled to 2400 px, upright)
 *   docs/<docId>/<stamp>.pdf              a PDF as it was picked, for export
 *   docs/<docId>/<stamp>.pdf.pages/N.jpg  its pages drawn as pictures, for the viewer
 *
 * The page shows them through [URL_BASE] URLs that MainActivity answers from these files.
 */
class DocStore(private val context: Context) {

    val root = File(context.filesDir, "docs")

    /** {docId: [{id, kind: "image"|"pdf", pages: [url, ...]}, ...]} for every document with files. */
    fun list(): JSONObject {
        val out = JSONObject()
        root.listFiles()?.filter { it.isDirectory }?.forEach { dir ->
            val items = JSONArray()
            dir.listFiles()?.filter { it.isFile }?.sortedBy { it.name }?.forEach { f ->
                val pages = JSONArray()
                val kind = if (f.name.endsWith(".pdf")) "pdf" else "image"
                if (kind == "pdf") {
                    pageFiles(f).forEach { pages.put(url(it)) }
                } else {
                    pages.put(url(f))
                }
                items.put(JSONObject().put("id", f.name).put("kind", kind).put("pages", pages))
            }
            if (items.length() > 0) out.put(dir.name, items)
        }
        return out
    }

    /** Copies a picked photo or PDF into the document. */
    fun importUri(docId: String, uri: Uri) {
        val type = context.contentResolver.getType(uri).orEmpty()
        val dir = docDir(docId)
        val stamp = stamp()
        if (type == "application/pdf" || uri.toString().lowercase().endsWith(".pdf")) {
            val pdf = File(dir, "$stamp.pdf")
            context.contentResolver.openInputStream(uri)!!.use { input -> pdf.outputStream().use { input.copyTo(it) } }
            renderPdf(pdf)
        } else {
            saveImage({ context.contentResolver.openInputStream(uri)!! }, File(dir, "$stamp.jpg"))
        }
    }

    /** Moves a photo the camera wrote into the document. */
    fun importPhoto(docId: String, photo: File) {
        saveImage({ photo.inputStream() }, File(docDir(docId), "${stamp()}.jpg"))
        photo.delete()
    }

    fun deleteItem(docId: String, itemId: String) {
        val f = File(docDir(docId), itemId)
        if (!inside(f)) return
        File(f.path + ".pages").deleteRecursively()
        f.delete()
    }

    fun deleteDoc(docId: String) {
        val d = File(root, safe(docId))
        if (inside(d)) d.deleteRecursively()
    }

    /** The file behind one of our URLs, or null if it isn't one of her documents. */
    fun fileFor(url: Uri): File? {
        val path = url.path?.removePrefix("/") ?: return null
        val f = File(root, path)
        return if (inside(f) && f.isFile) f else null
    }

    /**
     * Zips every document into cache/export, one folder per document named by [titles] (docId → title),
     * plus a README with [index] (her dates and notes as text). Returns the zip.
     */
    fun exportZip(titles: JSONObject, index: String): File {
        val dir = File(context.cacheDir, "export").apply { deleteRecursively(); mkdirs() }
        val day = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val zip = File(dir, "Business App documents $day.zip")
        ZipOutputStream(FileOutputStream(zip)).use { out ->
            out.putNextEntry(ZipEntry("README.txt"))
            out.write(index.toByteArray())
            out.closeEntry()
            root.listFiles()?.filter { it.isDirectory }?.forEach { d ->
                val folder = titles.optString(d.name, d.name).replace(Regex("[\\\\/:*?\"<>|]"), "-")
                d.listFiles()?.filter { it.isFile }?.sortedBy { it.name }?.forEachIndexed { i, f ->
                    out.putNextEntry(ZipEntry("$folder/${i + 1}.${f.extension}"))
                    f.inputStream().use { it.copyTo(out) }
                    out.closeEntry()
                }
            }
        }
        return zip
    }

    fun hasAny(): Boolean = root.listFiles()?.any { d -> d.listFiles()?.any { it.isFile } == true } == true

    private fun url(f: File) = "$URL_BASE${f.relativeTo(root).invariantSeparatorsPath}?v=${f.lastModified()}"

    private fun pageFiles(pdf: File): List<File> =
        File(pdf.path + ".pages").listFiles()?.sortedBy { it.nameWithoutExtension.toIntOrNull() ?: 0 } ?: emptyList()

    private fun docDir(docId: String) = File(root, safe(docId)).apply { mkdirs() }

    private fun safe(docId: String) = docId.lowercase().replace(Regex("[^a-z0-9-]"), "-").take(60)

    private fun inside(f: File) = f.canonicalPath.startsWith(root.canonicalPath + File.separator)

    private fun stamp() = SimpleDateFormat("yyyyMMdd-HHmmss-SSS", Locale.US).format(Date())

    /** Decodes an image at no more than [MAX_SIDE] px, turns it upright, and saves it as JPEG. */
    private fun saveImage(open: () -> InputStream, target: File) {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        open().use { BitmapFactory.decodeStream(it, null, bounds) }
        require(bounds.outWidth > 0) { "Not an image" }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_SIDE) sample *= 2
        var bmp = open().use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
            ?: error("Couldn't read the image")
        val rotation = try {
            open().use {
                when (ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                    else -> 0f
                }
            }
        } catch (e: Exception) {
            0f
        }
        val scale = minOf(1f, MAX_SIDE.toFloat() / maxOf(bmp.width, bmp.height))
        if (rotation != 0f || scale < 1f) {
            val m = Matrix().apply { postScale(scale, scale); postRotate(rotation) }
            val turned = Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
            if (turned != bmp) bmp.recycle()
            bmp = turned
        }
        target.outputStream().use { bmp.compress(Bitmap.CompressFormat.JPEG, 88, it) }
        bmp.recycle()
    }

    /** Draws each page of a PDF (up to [MAX_PDF_PAGES]) as a picture the viewer can show. */
    private fun renderPdf(pdf: File) {
        val pagesDir = File(pdf.path + ".pages").apply { mkdirs() }
        ParcelFileDescriptor.open(pdf, ParcelFileDescriptor.MODE_READ_ONLY).use { fd ->
            PdfRenderer(fd).use { renderer ->
                for (i in 0 until minOf(renderer.pageCount, MAX_PDF_PAGES)) {
                    renderer.openPage(i).use { page ->
                        val w = PDF_WIDTH
                        val h = (w.toFloat() * page.height / page.width).toInt().coerceAtLeast(1)
                        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                        bmp.eraseColor(Color.WHITE)
                        page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                        File(pagesDir, "${i + 1}.jpg").outputStream().use { bmp.compress(Bitmap.CompressFormat.JPEG, 85, it) }
                        bmp.recycle()
                    }
                }
            }
        }
    }

    companion object {
        const val URL_BASE = "https://planb.docs/"
        private const val MAX_SIDE = 2400
        private const val PDF_WIDTH = 1400
        private const val MAX_PDF_PAGES = 40
    }
}
