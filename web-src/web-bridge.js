/* The web version's stand-in for the Android side (MainActivity.Bridge): the same window.PlanB calls,
   done with what a browser has. Documents live in this browser's IndexedDB, on this phone only.
   Loaded before app.js by the web build (tools/build_web.py); the Android app never loads it. */
(function(){
  if (window.PlanB) return;                      // inside the Android app
  var app = function(){ return window.PlanBApp || {}; };
  function toast(m){ if (app().toast) app().toast(m); }

  /* ---------- small helpers ---------- */
  function download(blob, name){
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000);
  }
  function icsDate(ms){ return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function ics(title, desc, start, rrule){
    var esc = function(s){ return String(s).replace(/[\\,;]/g, function(c){ return '\\' + c; }).replace(/\n/g, '\\n'); };
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Business App//EN', 'BEGIN:VEVENT',
      'UID:' + Date.now() + '@business-app', 'DTSTAMP:' + icsDate(Date.now()),
      'DTSTART:' + icsDate(start), 'DTEND:' + icsDate(start + 30 * 60 * 1000),
      'SUMMARY:' + esc(title), 'DESCRIPTION:' + esc(desc)];
    if (rrule) lines.push('RRULE:' + rrule);
    lines.push('BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
    // iPhone opens a .ics file straight into "Add to Calendar"
    download(new Blob([lines.join('\r\n')], { type:'text/calendar' }), title.replace(/[^\w ]+/g, '').trim() + '.ics');
  }

  /* ---------- documents: IndexedDB ---------- */
  var db = null, items = [], urls = {}, unlocked = false;
  function openDb(){
    return new Promise(function(res, rej){
      var r = indexedDB.open('business-app-docs', 1);
      r.onupgradeneeded = function(){ r.result.createObjectStore('items', { keyPath:'id' }); };
      r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); };
    });
  }
  function tx(mode){ return db.transaction('items', mode).objectStore('items'); }
  function loadAll(){
    return new Promise(function(res){
      var out = []; var c = tx('readonly').openCursor();
      c.onsuccess = function(){ var cur = c.result; if (cur){ out.push(cur.value); cur.continue(); } else res(out); };
      c.onerror = function(){ res([]); };
    });
  }
  function refresh(docId){
    return loadAll().then(function(all){
      items = all.sort(function(a, b){ return a.id < b.id ? -1 : 1; });
      items.forEach(function(it){ if (!urls[it.id]) urls[it.id] = URL.createObjectURL(it.blob); });
      if (app().docsChanged) app().docsChanged(docId || '');
    });
  }
  var ready = ('indexedDB' in window) ? openDb().then(function(d){ db = d; return refresh(); }).catch(function(){}) : Promise.resolve();
  // Ask the browser not to clear the documents when the phone is low on space.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}

  // A page-shaped picture standing in for a PDF in the list (tap "Open in app" to read it).
  var pdfTile = (function(){
    try {
      var c = document.createElement('canvas'); c.width = 600; c.height = 780; var x = c.getContext('2d');
      x.fillStyle = '#FBF6F9'; x.fillRect(0, 0, 600, 780);
      x.fillStyle = '#E9DCE3'; for (var i = 0; i < 9; i++) x.fillRect(80, 160 + i * 52, 440 - (i % 3) * 60, 18);
      x.fillStyle = '#C44A71'; x.font = '700 64px sans-serif'; x.fillText('PDF', 80, 110);
      x.fillStyle = '#6E5D7A'; x.font = '28px sans-serif'; x.fillText('tap "Open in app" to read it', 80, 700);
      return c.toDataURL('image/png');
    } catch(e){ return ''; }
  })();

  function shrink(file){
    // Photos are scaled to 2400 px and saved as JPEG; createImageBitmap keeps them upright.
    if (!window.createImageBitmap) return Promise.resolve(file);
    return createImageBitmap(file).then(function(bmp){
      var k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function(res){ c.toBlob(function(b){ res(b || file); }, 'image/jpeg', 0.88); });
    }).catch(function(){ return file; });
  }
  function stamp(){ var d = new Date(), p = function(n){ return (n < 10 ? '0' : '') + n; }; return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + Math.random().toString(36).slice(2, 6); }
  function addFiles(docId, files){
    if (!db || !files || !files.length) return;
    if (app().docsBusy) app().docsBusy(true);
    var jobs = [].slice.call(files).map(function(f){
      var pdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      return (pdf ? Promise.resolve(f) : shrink(f)).then(function(blob){
        return new Promise(function(res){
          var it = { id: docId + '/' + stamp() + (pdf ? '.pdf' : '.jpg'), doc: docId, kind: pdf ? 'pdf' : 'image', blob: blob };
          var r = tx('readwrite').put(it); r.onsuccess = res; r.onerror = res;
        });
      });
    });
    Promise.all(jobs).then(function(){ return refresh(docId); }).catch(function(){ toast("Couldn't add that file"); })
      .then(function(){ if (app().docsBusy) app().docsBusy(false); });
  }
  function pick(docId, accept, capture, multiple){
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
    if (capture) inp.setAttribute('capture', 'environment');
    if (multiple) inp.multiple = true;
    inp.style.display = 'none'; document.body.appendChild(inp);
    inp.addEventListener('change', function(){ addFiles(docId, inp.files); inp.remove(); });
    inp.click();
  }
  function del(ids){
    return Promise.all(ids.map(function(id){
      return new Promise(function(res){ var r = tx('readwrite').delete(id); r.onsuccess = res; r.onerror = res; });
    })).then(function(){ ids.forEach(function(id){ if (urls[id]){ URL.revokeObjectURL(urls[id]); delete urls[id]; } }); });
  }

  /* ---------- a tiny zip writer (stored, no compression; photos and PDFs are compressed already) ---------- */
  var CRC = (function(){ var t = []; for (var n = 0; n < 256; n++){ var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8){ var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files){                          // files: [{ name, data: Uint8Array }]
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    files.forEach(function(f){
      var name = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      var cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true);
      cd.setUint32(16, crc, true); cd.setUint32(20, f.data.length, true); cd.setUint32(24, f.data.length, true); cd.setUint16(28, name.length, true);
      cd.setUint32(42, offset, true);
      central.push(new Uint8Array(cd.buffer), name);
      offset += 30 + name.length + f.data.length;
    });
    var size = central.reduce(function(s, p){ return s + p.length; }, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, size, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type:'application/zip' });
  }

  // Safari only opens the share sheet straight from a tap, and making the zip takes a moment,
  // so a button appears when it's ready.
  function shareButton(file, name){
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn primary';
    b.textContent = 'Zip ready: share or save it';
    b.style.cssText = 'position:fixed;z-index:300;left:50%;transform:translateX(-50%);bottom:calc(var(--sab) + 90px);box-shadow:0 10px 30px -8px rgba(51,36,60,.5)';
    b.addEventListener('click', function(){ navigator.share({ files:[file], title:name }).catch(function(){}); b.remove(); });
    document.body.appendChild(b);
    setTimeout(function(){ b.remove(); }, 20000);
  }

  /* ---------- window.PlanB ---------- */
  window.PlanB = {
    // System bar sizes from the browser's safe areas (the notch and the home bar on iPhone).
    insets: function(){
      var p = document.createElement('div');
      p.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
      document.body.appendChild(p); var s = getComputedStyle(p);
      var v = { top:parseFloat(s.paddingTop) || 0, right:parseFloat(s.paddingRight) || 0, bottom:parseFloat(s.paddingBottom) || 0, left:parseFloat(s.paddingLeft) || 0, kb:0 };
      p.remove(); return JSON.stringify(v);
    },
    copy: function(text){ try { navigator.clipboard.writeText(text); } catch(e){} },
    haptic: function(kind){ try { if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 30 : 8); } catch(e){} },
    setCanGoBack: function(){},
    email: function(to, subject, body){ location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body); },
    dial: function(n){ location.href = 'tel:' + String(n).replace(/[^0-9+]/g, ''); },
    remindCheck: function(){
      var d = new Date(); d.setHours(20, 0, 0, 0); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
      ics('Business App: check the Uh-Oh-Meter', 'Open Business App together and tick only what is actually happening.', d.getTime(), 'FREQ=WEEKLY;INTERVAL=2');
    },
    remindOn: function(title, desc, ms){ var d = new Date(ms); d.setHours(19, 0, 0, 0); ics(title, desc, d.getTime(), null); },

    // Documents: no fingerprint here; the phone's own lock protects them.
    unlockDocs: function(){ ready.then(function(){ unlocked = true; if (app().onLock) app().onLock(true, true); }); },
    lockDocs: function(){ unlocked = false; if (app().onLock) app().onLock(false, true); },
    docsList: function(){
      if (!unlocked) return '{}';
      var out = {};
      items.forEach(function(it){ (out[it.doc] = out[it.doc] || []).push({ id: it.id, kind: it.kind, pages: [it.kind === 'pdf' ? pdfTile : urls[it.id]] }); });
      return JSON.stringify(out);
    },
    addFromCamera: function(docId){ pick(docId, 'image/*', true, false); },
    addFromFiles: function(docId){ pick(docId, 'image/*,application/pdf', false, true); },
    deleteDocItem: function(docId, itemId){ del([itemId]).then(function(){ return refresh(docId); }); },
    deleteDoc: function(docId){ del(items.filter(function(it){ return it.doc === docId; }).map(function(it){ return it.id; })).then(function(){ return refresh(docId); }); },
    openDocItem: function(docId, itemId){ if (urls[itemId]) window.open(urls[itemId], '_blank'); },
    exportDocs: function(titlesJson, index, toDrive){
      if (!items.length){ toast('No documents to export yet'); return; }
      var titles = JSON.parse(titlesJson), count = {}, enc = new TextEncoder();
      Promise.all(items.map(function(it){
        return it.blob.arrayBuffer().then(function(buf){
          var folder = (titles[it.doc] || it.doc).replace(/[\\/:*?"<>|]/g, '-');
          count[folder] = (count[folder] || 0) + 1;
          return { name: folder + '/' + count[folder] + (it.kind === 'pdf' ? '.pdf' : '.jpg'), data: new Uint8Array(buf) };
        });
      })).then(function(files){
        files.unshift({ name:'README.txt', data: enc.encode(index) });
        var day = new Date().toISOString().slice(0, 10), name = 'Business App documents ' + day + '.zip';
        var blob = zip(files), file = new File([blob], name, { type:'application/zip' });
        // The share sheet has "Save to Files" and Google Drive on iPhone; otherwise it downloads.
        if (navigator.canShare && navigator.canShare({ files:[file] })) shareButton(file, name);
        else download(blob, name);
      });
    }
  };
})();
