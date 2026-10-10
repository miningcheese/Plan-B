/* Plan B app: screens and tabs, the meter, the to-do list, and the drawings (lifted from Kê-Kê Run / Galela Survivors).
   window.PlanB is the Android side (MainActivity.Bridge); everything still works in a plain browser without it. */
(function(){
  var N = window.PlanB || null;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
  if (!CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h){ this.rect(x,y,w,h); };
  }
  function setup(cv){
    var w = cv.width, h = cv.height, d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * d; cv.height = h * d;
    var c = cv.getContext('2d'); c.setTransform(d,0,0,d,0,0);
    return { c:c, W:w, H:h };
  }
  function $(id){ return document.getElementById(id); }
  function all(sel, root){ return [].slice.call((root || document).querySelectorAll(sel)); }
  function haptic(kind){ try { if (N && N.haptic) N.haptic(kind); } catch(e){} }
  function load(key){ try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch(e){ return {}; } }
  function save(key, boxes){
    var o = {}; boxes.forEach(function(x){ if (x.checked) o[x.id] = 1; });
    try { localStorage.setItem(key, JSON.stringify(o)); } catch(e){}
  }

  /* ---- sprites, lifted from Kê-Kê Run / Galela Survivors ---- */
  var ctx, t = 0;
  var rr = function(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); };
  var circ = function(x,y,r){ ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); };
  var tri = function(a,b,c,d,e,f){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.lineTo(e,f); ctx.closePath(); ctx.fill(); };

  function drawKeyla(x, y, s, face, hood, moving){
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
    var sw = moving ? Math.sin(t * 0.45) * 4 : 0;
    ctx.fillStyle = "#B97C3E";
    rr(-12, 4, 5, 9 + sw * 0.4, 1); rr(5, 4, 5, 9 - sw * 0.4, 1);
    ctx.fillStyle = "#C98B4B";
    rr(-7, 4, 5, 9 - sw * 0.4, 1); rr(10, 4, 5, 9 + sw * 0.4, 1);
    ctx.strokeStyle = "#2F2A2E"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-15, -4);
    ctx.quadraticCurveTo(-24, -9 + Math.sin(t * 0.5) * 3, -21, -16); ctx.stroke();
    ctx.fillStyle = "#2F2A2E"; rr(-17, -8, 32, 15, 7);
    ctx.fillStyle = "#C98B4B"; rr(-15, 1, 29, 6, 3);
    if (hood){
      ctx.fillStyle = "#16131A"; rr(-19, -10, 35, 18, 8);
      ctx.strokeStyle = "#EDE4EB"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(9.5, 5); ctx.moveTo(13, 0); ctx.lineTo(13.5, 5); ctx.stroke();
      ctx.fillStyle = "#16131A"; rr(5, -25, 24, 21, 9);
    }
    ctx.fillStyle = "#211D20";
    tri(9, -18, 12, -30, 16, -18); tri(17, -18, 21, -31, 25, -18);
    ctx.fillStyle = "#8C5C38";
    tri(11.5, -19.5, 12.5, -26, 14.5, -19.5); tri(19.5, -19.5, 21, -27, 23, -19.5);
    ctx.fillStyle = "#2F2A2E"; rr(8, -21, 18, 15, 6);
    ctx.fillStyle = "#C98B4B"; rr(19, -14, 10, 7, 3);
    ctx.beginPath(); ctx.ellipse(14, -17, 2, 1.5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(20, -17.5, 2, 1.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#171316"; circ(29, -11.5, 1.9);
    ctx.fillStyle = "#FFF"; circ(18, -14.5, 1.7);
    ctx.fillStyle = "#171316"; circ(18.5, -14.5, 1);
    ctx.restore();
  }
  function drawGabs(x, y, s, face, talk, moving){
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
    var sw = moving ? Math.sin(t * 0.45) * 3 : 0;
    var bob = moving ? Math.abs(Math.sin(t * 0.45)) * 1.2 : 0;
    ctx.translate(0, -bob);
    ctx.fillStyle = "#2B2233"; rr(-6, 8, 5, 12 + sw * 0.3, 2); rr(1, 8, 5, 12 - sw * 0.3, 2);
    ctx.fillStyle = "#EFE8EE"; rr(-7, 18 + sw * 0.3, 7, 3.5, 1.5); rr(0, 18 - sw * 0.3, 7, 3.5, 1.5);
    ctx.fillStyle = "#262A4A"; rr(-9, -9, 18, 20, 6);
    ctx.fillStyle = "#C9962F"; rr(-11, -10, 7, 17, 3); rr(4, -10, 7, 17, 3);
    ctx.fillStyle = "#C9962F"; rr(6, -8 + sw * 0.4, 5, 12, 2.5);
    ctx.fillStyle = "#F1C8B0"; circ(8.5, 5 + sw * 0.4, 2.4);
    ctx.fillStyle = "#5A3A26"; rr(-13, -27, 10, 29, 5);
    ctx.fillStyle = "#F1C8B0"; circ(0, -20, 9);
    ctx.fillStyle = "#6B4630";
    ctx.beginPath(); ctx.arc(0, -21, 9.6, Math.PI * 1.0, Math.PI * 1.96); ctx.fill();
    rr(-10, -24, 5, 14, 3);
    ctx.fillStyle = "rgba(128,82,150,.85)";
    ctx.beginPath(); ctx.ellipse(4.8, -19.5, 3.6, 2.4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#CFC6D6"; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(1.3, -20); ctx.lineTo(-3, -20.6); ctx.stroke();
    ctx.strokeStyle = "#F2ECF0"; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(-1, -21, 10.4, Math.PI * 1.08, Math.PI * 1.86); ctx.stroke();
    ctx.fillStyle = "#F2ECF0"; rr(-6, -25, 6, 9, 2.6);
    ctx.fillStyle = "#D9425E"; rr(-5, -24, 4, 7, 2);
    ctx.strokeStyle = "#CFC6D6"; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(8.6, -16.8, 1.1, 0, Math.PI * 1.25); ctx.stroke();
    if (talk){
      ctx.fillStyle = "#7A2A3A";
      ctx.beginPath(); ctx.ellipse(6.2, -14.2, 2.1, 1.7 + Math.abs(Math.sin(t * 0.6)) * 0.8, 0, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = "#A0625F"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(4.2, -14.3); ctx.lineTo(7.2, -14.6); ctx.stroke();
    }
    ctx.restore();
  }
  function drawPato(x, y, face){
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    var step = Math.sin(t * 0.4 + x * 0.05) * 2;
    ctx.fillStyle = "#E8A33C"; rr(-4, 8, 3, 5 + step * 0.5, 1); rr(2, 8, 3, 5 - step * 0.5, 1);
    ctx.fillStyle = "#A8703A"; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#7E5127"; ctx.beginPath(); ctx.ellipse(-3, -1, 8, 5.5, -0.25, 0, 7); ctx.fill();
    ctx.fillStyle = "#C08A44"; circ(10, -9, 6.5);
    ctx.fillStyle = "#F2B33C"; tri(15, -9, 22, -7, 15, -5);
    ctx.fillStyle = "#171316"; circ(11.5, -10.5, 1.4);
    ctx.restore();
  }

  /* ---- hero beach ---- */
  var H1 = setup(document.getElementById('hero'));
  function hero(){
    ctx = H1.c; var W = H1.W, H = H1.H;
    var g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#F9D6E3'); g.addColorStop(.62,'#E4DAF9'); g.addColorStop(.63,'#BFE6D8'); g.addColorStop(1,'#9FD3C3');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#FBE8C4'; circ(600, 66, 38);
    ctx.fillStyle = 'rgba(217,150,43,.35)'; circ(600, 66, 30);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (var i = 0; i < 6; i++){
      var wx = ((i * 137 + t * 1.6) % (W + 80)) - 40, wy = 200 + (i % 3) * 26;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 14, wy - 6, wx + 28, wy); ctx.stroke();
    }
    ctx.fillStyle = '#F3DDB0'; ctx.beginPath(); ctx.ellipse(350, 232, 250, 34, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#E8CB92'; ctx.beginPath(); ctx.ellipse(350, 240, 230, 22, 0, 0, Math.PI); ctx.fill();
    // palm
    ctx.strokeStyle = '#8C5C38'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(560, 236); ctx.quadraticCurveTo(552, 160, 575, 96); ctx.stroke();
    ctx.fillStyle = '#8FB79E';
    var sway = Math.sin(t * 0.12) * 0.06;
    [[-2.6,46],[-2.0,52],[-1.2,50],[-0.5,46],[0.2,40]].forEach(function(l){
      ctx.save(); ctx.translate(575, 96); ctx.rotate(l[0] + sway);
      ctx.beginPath(); ctx.ellipse(l[1]/2, 0, l[1]/2, 8, 0, 0, 7); ctx.fill(); ctx.restore();
    });
    ctx.fillStyle = '#6F9A80'; circ(575, 98, 6);
    // the two of them + a duck that Keyla has opinions about
    drawGabs(250, 166, 3, 1, false, false);
    drawKeyla(345, 194 - hop('hero'), 3, 1, true, hopping('hero'));
    var px = 470 + Math.sin(t * 0.05) * 30, pf = Math.cos(t * 0.05) >= 0 ? 1 : -1;
    duckX = px;
    drawPato(px, 214, pf);
    ctx.fillStyle = '#C44A71'; ctx.font = '600 26px Caveat, "Bradley Hand", cursive';
    ctx.fillText('us, but on a beach', 34, 52);
    ctx.font = '600 21px Caveat, "Bradley Hand", cursive'; ctx.fillStyle = '#5E3FA4';
    ctx.fillText('chi-chi é Maurícius? tem pato?', 300, 90);
  }

  /* ---- the meter ---- */
  var G = setup(document.getElementById('gauge'));
  var LV = { chill:330, prep:236, go:92 }, level = LV.chill, target = LV.chill, state = 'chill';
  function gauge(){
    ctx = G.c; var W = G.W, H = G.H;
    ctx.clearRect(0,0,W,H);
    var bx = 88, bw = 66, top = 20, bot = 384;
    ctx.fillStyle = '#F7A8C4'; ctx.strokeStyle = '#33243C'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(bx, top, bw, bot - top, 6); ctx.fill(); ctx.stroke();
    var col = state === 'go' ? '#D9557E' : state === 'prep' ? '#F2B33C' : '#2C8C7C';
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx + 7, level, bw - 14, bot - 7 - level, 3); ctx.fill();
    ctx.lineCap = 'round'; ctx.lineWidth = 8;
    ctx.strokeStyle = '#F2B33C'; ctx.beginPath(); ctx.moveTo(bx - 10, 236); ctx.lineTo(bx + bw + 10, 236); ctx.stroke();
    ctx.strokeStyle = '#E3202C'; ctx.beginPath(); ctx.moveTo(bx - 10, 116); ctx.lineTo(bx + bw + 10, 116); ctx.stroke();
    ctx.font = '600 23px Caveat, "Bradley Hand", cursive';
    ctx.fillStyle = '#B87C1C'; ctx.fillText('get ready', 172, 243);
    ctx.fillStyle = '#C44A71'; ctx.fillText('we go', 172, 123);
    ctx.fillStyle = '#2C8C7C'; ctx.fillText('chill', 172, 370);
    // Keyla stands beside the bar at the current level, facing it
    var s = 1.35;
    ctx.fillStyle = 'rgba(51,36,60,.12)'; ctx.beginPath(); ctx.ellipse(44, level + 1, 26, 3, 0, 0, 7); ctx.fill();
    drawKeyla(40, level - 13 * s - hop('gauge') * 0.6, s, 1, state === 'go', hopping('gauge'));
  }

  /* ---- closing pair ---- */
  var D = setup(document.getElementById('duo'));
  function duo(){
    ctx = D.c; ctx.clearRect(0,0,D.W,D.H);
    drawGabs(78, 82, 2.2, 1, false, false);
    drawKeyla(146, 100 - hop('duo'), 2.2, 1, false, hopping('duo'));
  }


  /* ---- animation: only the drawings on the open screen ---- */
  var current = 'home', gameOpen = false;
  function drawVisible(){
    if (gameOpen) return;
    if (current === 'home'){ hero(); duo(); }
    if (current === 'meter') gauge();
  }
  function frame(){
    t += 0.22;
    level += (target - level) * 0.08;
    drawVisible();
    requestAnimationFrame(frame);
  }

  /* ---- toast, sheet, insets, back ---- */
  var toastEl = $('toast'), toastTimer;
  function toast(msg){
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ toastEl.classList.remove('on'); }, 1800);
  }
  // Open layers (sheets, the document viewer, the game), newest last. Back closes the newest first.
  var layers = [], scrim = $('scrim');
  function openLayer(el, onClose, withScrim){
    closeLayer(el, true);
    layers.push({ el:el, onClose:onClose, scrim:withScrim });
    el.style.zIndex = 60 + layers.length * 2;   // each new layer sits above the last (a confirm over the viewer)
    el.hidden = false; hideSay(); syncScrim(); syncBack();
  }
  function closeLayer(el, quiet){
    for (var i = layers.length - 1; i >= 0; i--){
      if (layers[i].el === el){
        var l = layers.splice(i, 1)[0]; el.hidden = true;
        if (!quiet && l.onClose) l.onClose();
      }
    }
    syncScrim(); syncBack();
  }
  function closeTop(){ if (layers.length) closeLayer(layers[layers.length - 1].el); }
  function syncScrim(){
    var top = null; layers.forEach(function(l){ if (l.scrim) top = l; });
    scrim.hidden = !top;
    if (top) scrim.style.zIndex = (parseInt(getComputedStyle(top.el).zIndex, 10) || 51) - 1;
  }
  scrim.addEventListener('click', closeTop);

  var sheet = $('sheet'), sheetYes = null;
  // openSheet({ title, text, yes, no, onYes })
  function openSheet(o){
    $('sheet-title').textContent = o.title; $('sheet-text').textContent = o.text;
    $('sheet-yes').textContent = o.yes || 'OK'; $('sheet-no').textContent = o.no || 'Cancel';
    sheetYes = o.onYes; openLayer(sheet, null, true);
  }
  function closeSheet(){ sheetYes = null; closeLayer(sheet); }
  $('sheet-no').addEventListener('click', closeSheet);
  $('sheet-yes').addEventListener('click', function(){ var f = sheetYes; closeSheet(); if (f) f(); });

  // openActions({ title, text, actions:[{ label, kind:'primary'|'danger', fn }] })
  var actionsEl = $('actions');
  function openActions(o){
    $('ac-title').textContent = o.title || ''; $('ac-text').textContent = o.text || ''; $('ac-text').hidden = !o.text;
    var list = $('ac-list'); list.innerHTML = '';
    o.actions.forEach(function(a){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn wide ' + (a.kind || ''); b.textContent = a.label;
      b.addEventListener('click', function(){ closeLayer(actionsEl, true); a.fn(); });
      list.appendChild(b);
    });
    openLayer(actionsEl, null, true);
  }

  function syncBack(){ try { if (N && N.setCanGoBack) N.setCanGoBack(layers.length > 0 || current !== 'home'); } catch(e){} }

  window.PlanBApp = {
    setInsets: function(top, right, bottom, left, kb){
      var s = document.documentElement.style;
      s.setProperty('--sat', top + 'px'); s.setProperty('--sar', right + 'px');
      s.setProperty('--sab', bottom + 'px'); s.setProperty('--sal', left + 'px');
      s.setProperty('--kb', (kb || 0) + 'px');
    },
    // Android back: close the newest sheet or panel, then go back to Home, then leave the app.
    back: function(){
      if (layers.length){ closeTop(); return true; }
      if (current !== 'home'){ show('home'); return true; }
      return false;
    },
    toast: toast
  };
  try { if (N && N.insets){ var i = JSON.parse(N.insets()); window.PlanBApp.setInsets(i.top, i.right, i.bottom, i.left, i.kb); } } catch(e){}

  /* ---- screens and tabs ---- */
  var topbar = $('topbar'), topTitle = $('topbar-title');
  var screens = {}; all('.screen').forEach(function(s){ screens[s.id] = s; });
  var tabs = all('.tab');
  function syncBar(){
    var s = screens[current];
    topTitle.textContent = s.dataset.title;
    // On the meter, the bar keeps showing the level while you scroll the list.
    if (current === 'meter'){ var d = document.createElement('i'); d.className = 'tdot ' + state; topTitle.prepend(d); topTitle.append(' · ' + NAMES[state].split(':')[0]); }
    topbar.classList.toggle('scrolled', s.scrollTop > 36);
  }
  function show(id){
    if (!screens[id]) return;
    if (id === current){ screens[id].scrollTo({ top:0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    screens[current].classList.remove('is-active');
    current = id;
    screens[id].classList.add('is-active');
    tabs.forEach(function(b){ var on = b.dataset.tab === id; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    syncBar(); syncBack(); segChanged(''); hideSay();
    if (reduce) drawVisible();
  }
  tabs.forEach(function(b){ b.addEventListener('click', function(){ haptic('tick'); show(b.dataset.tab); }); });
  all('[data-go]').forEach(function(b){ b.addEventListener('click', function(){ show(b.dataset.go); }); });
  Object.keys(screens).forEach(function(k){ screens[k].addEventListener('scroll', function(){ if (k === current) syncBar(); }, { passive:true }); });

  // Segmented parts of a screen (Plan: Route A / Route B / 14 days / Packing; Papers: Documents / Keyla / Contacts)
  var segs = all('.seg button');
  function selectSeg(id){
    var b = document.querySelector('.seg button[data-seg="' + id + '"]');
    all('button', b.parentNode).forEach(function(x){ var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); $(x.dataset.seg).hidden = !on; });
    segChanged(id);
  }
  segs.forEach(function(b){ b.addEventListener('click', function(){ haptic('tick'); selectSeg(b.dataset.seg); }); });

  /* ---- meter ---- */
  var sigs = all('#meter input[type=checkbox]');
  var LINES = {
    chill:['tá tudo calmo galela. bora dandá pa esquerda-esquerda vê os pato', 'Nothing on the list is happening. We stay.'],
    prep:['galela... faz as mala. e põe meu pêmio na mala. telessante', 'Yellow. Refundable flights, start packing, call the vet about Keyla.'],
    go:['BORA GALELA! eu vô junto né? EU VÔ JUNTO. chi-chi é Maurícius?', 'Red. We go, Mauritius in 14 days, Keyla included.']
  };
  var NAMES = { chill:'Chill: we stay', prep:'Yellow: get ready', go:'Red: we go' };
  var MKEY = 'planb-meter', msaved = load(MKEY);
  sigs.forEach(function(s){ if (msaved[s.id]) s.checked = true; });
  function update(fromTap){
    var y = 0, r = 0;
    sigs.forEach(function(s){ if (s.checked){ if (s.dataset.l === 'r') r++; else y++; } });
    var was = state;
    state = (r >= 1 || y >= 2) ? 'go' : (y === 1 ? 'prep' : 'chill');
    target = LV[state];
    if (reduce){ level = target; drawVisible(); }
    $('bubble').dataset.s = state; $('keke').textContent = LINES[state][0]; $('meter-todo').textContent = LINES[state][1];
    var st = $('status'); st.dataset.s = state;
    $('status-name').textContent = NAMES[state]; $('status-keke').textContent = LINES[state][0]; $('status-sub').textContent = LINES[state][1];
    $('meter-badge').className = 'badge ' + state;
    if (current === 'meter') syncBar();
    if (fromTap) haptic(state === 'go' && was !== 'go' ? 'heavy' : 'tick');
    syncGoBanner();
    // A red line could be her trying the app out, so ask before starting the countdown.
    if (fromTap && state === 'go' && was !== 'go' && !goMode) askGo();
  }
  sigs.forEach(function(s){ s.addEventListener('change', function(){ save(MKEY, sigs); update(true); }); });
  $('reset').addEventListener('click', function(){
    if (!sigs.some(function(s){ return s.checked; })){ toast('Nothing ticked. All calm ♥'); return; }
    openSheet({ title:'Reset the meter?', text:'This clears every tick on the Uh-Oh-Meter.', yes:'Reset', no:'Keep them',
      onYes:function(){ sigs.forEach(function(s){ s.checked = false; }); save(MKEY, sigs); update(true); toast('Meter reset'); } });
  });
  $('remind').addEventListener('click', function(){
    if (N && N.remindCheck) N.remindCheck();
    else toast('Add a "check the meter" every two weeks in your calendar');
  });


  /* ---- Go mode: the 14 days as a dated countdown ---- */
  var GKEY = 'planb-go', GTKEY = 'planb-go-tasks', goMode = null;
  try { goMode = JSON.parse(localStorage.getItem(GKEY) || 'null'); } catch(e){ goMode = null; }
  var gtasks = all('.gtask input'), gsaved = load(GTKEY);
  gtasks.forEach(function(b){ if (gsaved[b.id]) b.checked = true; });
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function ymd(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(v){ var p = v.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }
  function addDays(d, n){ var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function today0(){ var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function fmt(d){ try { return d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }); } catch(e){ return ymd(d); } }
  function saveGo(){ try { if (goMode) localStorage.setItem(GKEY, JSON.stringify(goMode)); else localStorage.removeItem(GKEY); } catch(e){} }
  function startGo(){ goMode = { day0: ymd(today0()) }; saveGo(); renderGo(); haptic('heavy'); toast('Go mode is on. Day 0 is today'); }
  function endGo(){
    goMode = null; saveGo();
    gtasks.forEach(function(b){ b.checked = false; }); save(GTKEY, gtasks);
    sigs.forEach(function(s){ s.checked = false; }); save(MKEY, sigs);
    update(false); renderGo(); toast('Go mode ended. All calm ♥');
  }
  function askGo(){
    openSheet({ title:'Is this for real?', text:"A red line means we leave in 14 days. Start Go mode with today as Day 0? If you're just trying the app, nothing else happens.",
      yes:"It's real, start", no:'Just testing', onYes:startGo });
  }
  function syncGoBanner(){
    var b = $('gobanner'); if (!b) return;
    b.hidden = !!goMode || state !== 'go';
  }
  function renderGo(){
    var on = !!goMode;
    renderFly();
    document.body.classList.toggle('go', on);
    $('gocard').hidden = !on; $('gohead').hidden = !on; $('gopill').hidden = !on; $('days-hint').hidden = on;
    gtasks.forEach(function(b){ b.disabled = !on; });
    syncGoBanner();
    var days = all('#days .day');
    if (!on){ days.forEach(function(li){ li.classList.remove('now', 'late', 'done'); li.querySelector('.dates').textContent = ''; }); return; }
    var start = parseYmd(goMode.day0), d = Math.round((today0() - start) / 864e5), fly = addDays(start, 14), left = 14 - d;
    var dayText = d < 0 ? 'Starts ' + fmt(start) : d <= 14 ? 'Day ' + d + ' of 14' : 'Day ' + d;
    var flyText = d < 14 ? 'We fly ' + fmt(fly) + ' · ' + left + (left === 1 ? ' day' : ' days') + ' to go' : d === 14 ? 'We fly today ♥' : 'Flight day was ' + fmt(fly);
    var pct = Math.max(0, Math.min(100, d / 14 * 100)) + '%';
    $('gocard-day').textContent = $('gohead-day').textContent = dayText;
    $('gocard-fly').textContent = $('gohead-fly').textContent = flyText;
    $('gocard-bar').style.width = $('gohead-bar').style.width = pct;
    $('gopill').textContent = d >= 0 && d <= 14 ? 'Day ' + d + '/14' : 'Go mode';
    $('day0').value = goMode.day0;
    days.forEach(function(li){
      var from = +li.dataset.from, to = +li.dataset.to, boxes = all('input', li);
      li.querySelector('.dates').textContent = fmt(addDays(start, from)) + (from !== to ? ' – ' + fmt(addDays(start, to)) : '');
      var done = boxes.every(function(b){ return b.checked; });
      li.classList.toggle('done', done);
      li.classList.toggle('late', !done && d > to);
      li.classList.toggle('now', !done && d >= from && d <= to);
    });
    var next = gtasks.filter(function(b){ return !b.checked; })[0];
    $('gocard-next').textContent = next ? 'Next: ' + next.parentNode.lastElementChild.textContent : 'Everything done. Grab Keyla, we fly ♥';
  }
  function openCountdown(){ show('plan'); selectSeg('days'); screens.plan.scrollTo({ top:0 }); }
  $('gopill').addEventListener('click', openCountdown);
  $('gocard').addEventListener('click', openCountdown);
  $('gobanner-btn').addEventListener('click', startGo);
  $('go-end').addEventListener('click', function(){
    openSheet({ title:'End Go mode?', text:'This clears the countdown, its ticks and the meter. Use it after testing, or once things calm down.',
      yes:'End Go mode', no:'Keep going', onYes:endGo });
  });
  $('day0').addEventListener('change', function(e){ if (e.target.value){ goMode.day0 = e.target.value; saveGo(); renderGo(); } });
  gtasks.forEach(function(b){ b.addEventListener('change', function(){ save(GTKEY, gtasks); haptic(b.checked ? 'tick' : 'light'); renderGo(); }); });
  // The day changes at midnight; refresh when she comes back to the app.
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) renderGo(); });

  /* ---- packing ---- */
  var PKEY = 'planb-pack', packs = all('#pack input'), psaved = load(PKEY);
  packs.forEach(function(b){ if (psaved[b.id]) b.checked = true; b.addEventListener('change', function(){ save(PKEY, packs); haptic(b.checked ? 'tick' : 'light'); }); });
  $('pack-reset').addEventListener('click', function(){
    openSheet({ title:'Untick all packing?', text:'Clears the go bag, Keyla’s bag and the farm kit.', yes:'Untick all', no:'Keep them',
      onYes:function(){ packs.forEach(function(b){ b.checked = false; }); save(PKEY, packs); toast('Packing cleared'); } });
  });

  /* ---- to-do ---- */
  var KEY = 'planb-checks', boxes = all('#checks input'), saved = load(KEY);
  boxes.forEach(function(b){ if (saved[b.id]) b.checked = true; });
  function cheer(n, total){
    if (n === total) return 'all done. Keyla approves ♥';
    if (n === 0) return "let's get going galela";
    if (n * 3 < total) return 'good start ♥';
    if (n * 3 < total * 2) return 'halfway-ish, telessante';
    return 'almost there!!';
  }
  function prog(){
    var n = boxes.filter(function(b){ return b.checked; }).length, total = boxes.length, p = Math.round(n / total * 100);
    $('plbl').textContent = n + ' of ' + total + ' done';
    $('pcheer').textContent = cheer(n, total);
    $('ring').style.setProperty('--p', p); $('ring-n').textContent = n;
    $('home-ring').style.setProperty('--p', p); $('home-ring-n').textContent = n;
    var next = boxes.filter(function(b){ return !b.checked; })[0];
    $('home-next').textContent = next ? 'Next: ' + next.parentNode.lastElementChild.textContent.replace(/^./, function(c){ return c.toLowerCase(); }) : 'All done ♥ nothing left for now';
    return n === total;
  }
  function hearts(){
    if (reduce) return;
    for (var i = 0; i < 14; i++){
      var h = document.createElement('span'); h.className = 'heart'; h.textContent = '♥';
      h.style.left = (10 + Math.random() * 80) + 'vw'; h.style.bottom = 'calc(var(--sab) + var(--tabs) + ' + Math.round(Math.random() * 60) + 'px)';
      h.style.setProperty('--dx', Math.round(Math.random() * 80 - 40) + 'px'); h.style.animationDelay = (Math.random() * .4) + 's';
      document.body.appendChild(h); setTimeout(function(x){ return function(){ x.remove(); }; }(h), 2000);
    }
  }
  boxes.forEach(function(b){ b.addEventListener('change', function(){
    save(KEY, boxes);
    var done = prog();
    haptic(b.checked ? 'tick' : 'light');
    if (done && b.checked){ hearts(); haptic('heavy'); toast('All done! ♥'); }
  }); });

  /* ---- email to Mauritius ---- */
  function copyText(text){
    if (N && N.copy){ N.copy(text); toast('Copied'); return; }
    try { navigator.clipboard.writeText(text).then(function(){ toast('Copied'); }, function(){ toast("Couldn't copy"); }); } catch(e){ toast("Couldn't copy"); }
  }
  all('.copy').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();   // inside <summary>, don't open/close the email
      haptic('tick'); copyText($(btn.dataset.copy).textContent);
    });
  });
  $('send-mail').addEventListener('click', function(){
    var to = $('m-to').textContent, subj = $('m-subj').textContent, body = $('m-body').textContent;
    if (N && N.email) N.email(to, subj, body);
    else location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
  });


  /* ---- Kê-Kê: her lines, her voice, and tapping Keyla ---- */
  var KEKE = [
    'bom dia galela! já tem pêmio?',
    'galela galela bom dia pessoal',
    'chi-chi é pato?',
    'eu sô segurança da carnassa preta galela abe os zôio.',
    'me deixa BABIELA para de me aperta',
    'sovete mó gassado jijijiji',
    'Maurícius tem pato? se tivé pato eu vô',
    'galela tá trabalhando?',
    'é de pá-pá?',
    'hoje é dia de capuz. capuz preto, estilo',
    'jijijijijijiji',
    'babiris bora da um rolezinho eu papo um rolezinho pa esquerda-esquerda... talveizi po vêdi-má',
    'cade minha caminha babiris?',
    'Não sei esse papo de veterinario acho meio ruinho não papo veterinario babiela',
    'eu so da facção carnassa pêta galela jijijiji',
    'babiris eu acho que eu vo papa praia telessante aginha e areia acho gotoso talveizi',
    'e meu kakinho galela? da pa leva?',
    'talveizi babiris pega um pêmio pa mimigo talveizi põe pêmio no meu fuço galela',
    'a fazenda tem bicho? telessante...',
    'chi-chi é quarentena galela? acho meio ruinho..',
    'sô a chefe da segurança. aceito pagamento em pêmio',
    'hoje eu vo dar um dandazinho de leve galela nem é grandes coisa eu do um dandazinho todo dia galela..',
    'será que eu vo na queche hoje? Vê a facção mó gassado....'
  ];
  // Her impression of Keyla, cut from the voice note. One plays at random on each tap.
  var VOICES = ['voice/bomdia.ogg', 'voice/clip4-7.ogg', 'voice/clip2.ogg'], lastVoice = -1, playing = null;
  function bark(){
    try {
      if (playing){ playing.pause(); }
      var i; do { i = Math.floor(Math.random() * VOICES.length); } while (VOICES.length > 1 && i === lastVoice);
      lastVoice = i; playing = new Audio(VOICES[i]); playing.play().catch(function(){});
    } catch(e){}
  }
  var lastLine = -1;
  function randomLine(){
    var i; do { i = Math.floor(Math.random() * KEKE.length); } while (i === lastLine);
    lastLine = i; return KEKE[i];
  }
  // The line of the day: the same all day, a new one tomorrow.
  function lineOfDay(){
    var d = new Date(), n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    return KEKE[(n * 7) % KEKE.length];
  }
  $('kekeday-line').textContent = lineOfDay();
  $('kekeday').addEventListener('click', function(){ haptic('tick'); bark(); hops.hero = performance.now(); });

  // Little hops when she's tapped (read by the drawings above).
  var hops = {}, HOP_MS = 720;
  function hopping(name){ return !!hops[name] && performance.now() - hops[name] < HOP_MS; }
  function hop(name){
    if (!hopping(name)) return 0;
    var k = (performance.now() - hops[name]) / HOP_MS;
    return Math.abs(Math.sin(k * Math.PI * 2)) * 16 * (1 - k * 0.4);
  }
  var sayEl = $('say'), sayTimer;
  function hideSay(){ sayEl.hidden = true; }
  function say(text, x, y){
    sayEl.textContent = text; sayEl.hidden = false;
    var w = Math.min(280, window.innerWidth - 32);
    sayEl.style.maxWidth = w + 'px';
    var left = Math.max(16, Math.min(window.innerWidth - w - 16, x - w / 2));
    sayEl.style.left = left + 'px'; sayEl.style.top = Math.max(60, y - 20) + 'px';
    sayEl.classList.remove('pop'); void sayEl.offsetWidth; sayEl.classList.add('pop');
    clearTimeout(sayTimer); sayTimer = setTimeout(function(){ sayEl.hidden = true; }, 3800);
  }
  // Where Keyla (and the duck) are on each drawing, in the drawing's own units.
  var duckX = 470, duckTaps = [];
  function keylaBox(name){
    if (name === 'hero') return [278, 96, 436, 236];
    if (name === 'duo') return [98, 30, 214, 132];
    if (name === 'gauge'){ var y = level - 13 * 1.35; return [8, y - 46, 84, y + 22]; }
  }
  function onDrawingTap(name, cv){
    cv.addEventListener('click', function(e){
      var r = cv.getBoundingClientRect(), W = name === 'hero' ? H1.W : name === 'duo' ? D.W : G.W, H = name === 'hero' ? H1.H : name === 'duo' ? D.H : G.H;
      var x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height, b = keylaBox(name);
      if (name === 'hero' && Math.abs(x - duckX) < 30 && y > 190 && y < 236){
        // Five quick taps on the duck open Kê-Kê Run.
        var now = performance.now(); duckTaps = duckTaps.filter(function(t0){ return now - t0 < 3000; }); duckTaps.push(now);
        haptic('light');
        if (duckTaps.length >= 5){ duckTaps = []; openGame(); }
        return;
      }
      if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]){
        hops[name] = performance.now(); haptic('tick'); bark();
        say(randomLine(), e.clientX, r.top + (b[1] * r.height / H));
        if (reduce) drawVisible();
      }
    });
  }
  onDrawingTap('hero', $('hero')); onDrawingTap('duo', $('duo')); onDrawingTap('gauge', $('gauge'));

  /* ---- Papers: documents (files on the phone side, dates and notes here) ---- */
  var DOCS = [
    { g:'her', id:'passport', t:'Passport', date:'Expires on', expires:true },
    { g:'her', id:'rg', t:'RG' },
    { g:'her', id:'cpf', t:'CPF' },
    { g:'her', id:'birth', t:'Birth certificate (apostilled)' },
    { g:'her', id:'diplomas', t:'Diplomas (apostilled)' },
    { g:'her', id:'procuracao', t:'Procuração' },
    { g:'her', id:'insurance', t:'Travel & health insurance', date:'Valid until', expires:true },
    { g:'her', id:'flights', t:'Flight tickets' },
    { g:'her', id:'housing', t:'Housing booking (first month)' },
    { g:'her', id:'travelqr', t:'All-in-One Travel QR code' },
    { g:'keyla', id:'k-chip', t:'Microchip certificate' },
    { g:'keyla', id:'k-rabies', t:'Rabies vaccine', date:'Shot on' },
    { g:'keyla', id:'k-favn', t:'Rabies blood test (FAVN / RFFIT)', date:'Blood drawn on' },
    { g:'keyla', id:'k-vaccines', t:'Other vaccines (distemper, hepatitis, lepto, parvo)' },
    { g:'keyla', id:'k-spay', t:'Spay certificate' },
    { g:'keyla', id:'k-ehrlichia', t:'Ehrlichia test', date:'Test on' },
    { g:'keyla', id:'k-brucella', t:'Brucella test', date:'Test on' },
    { g:'keyla', id:'k-health', t:'Vet health certificate', date:'Issued on' },
    { g:'keyla', id:'k-permit', t:'Mauritius import permit', date:'Valid until', expires:true },
    { g:'keyla', id:'k-dna', t:'Dog DNA test' },
    { g:'keyla', id:'k-esa', t:'Support animal letter' },
    { g:'keyla', id:'k-cargo', t:'Cargo booking' }
  ];
  var XKEY = 'planb-docs-extra', MEKEY = 'planb-docs-meta';
  function loadJson(key, fallback){ try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? fallback : v; } catch(e){ return fallback; } }
  function saveJson(key, v){ try { localStorage.setItem(key, JSON.stringify(v)); } catch(e){} }
  var extraDocs = loadJson(XKEY, []), meta = loadJson(MEKEY, {}), files = {}, docsUnlocked = false;
  function allDocs(){ return DOCS.concat(extraDocs); }
  function docById(id){ return allDocs().filter(function(d){ return d.id === id; })[0]; }
  function metaOf(id){ return meta[id] || {}; }
  function setMeta(id, k, v){ meta[id] = metaOf(id); if (v) meta[id][k] = v; else delete meta[id][k]; saveJson(MEKEY, meta); }
  function longDate(d){ try { return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); } catch(e){ return ymd(d); } }
  function addMonths(d, n){ var x = new Date(d.getTime()); var day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + n); x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); return x; }
  function daysFrom(d){ return Math.round((d - today0()) / 864e5); }
  function inDays(n){ return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 0 ? 'in ' + n + ' days' : Math.abs(n) + ' days ago'; }

  function pageCount(id){ var n = 0; (files[id] || []).forEach(function(it){ n += it.pages.length; }); return n; }

  function docSub(d){
    var m = metaOf(d.id), n = pageCount(d.id), bits = [];
    bits.push(n ? n + (n === 1 ? ' page' : ' pages') : 'Add a photo or file');
    var warn = false;
    if (d.date && m.date){
      var dt = parseYmd(m.date), left = daysFrom(dt);
      if (d.expires){
        if (left < 0){ bits.push('expired ' + longDate(dt)); warn = true; }
        else { bits.push((d.id === 'passport' && left < 365 ? 'expires in ' + Math.round(left / 30) + ' months!' : d.date.toLowerCase() + ' ' + longDate(dt))); warn = d.id === 'passport' && left < 365; }
      } else bits.push(d.date.toLowerCase() + ' ' + longDate(dt));
    }
    return { text: bits.join(' · '), warn: warn };
  }

  function renderDocs(){
    ['her', 'keyla'].forEach(function(g){
      var box = $('doclist-' + g); box.innerHTML = '';
      allDocs().filter(function(d){ return d.g === g; }).forEach(function(d){
        var b = document.createElement('button'); b.type = 'button'; b.className = 'docrow' + (pageCount(d.id) ? ' has' : '');
        var sub = docSub(d);
        b.innerHTML = '<span class="dcheck" aria-hidden="true"></span><span class="dtext"><span class="dname"></span><span class="dsub"></span></span><span class="chev" aria-hidden="true"></span>';
        b.querySelector('.dname').textContent = d.t;
        var ds = b.querySelector('.dsub'); ds.textContent = sub.text; ds.classList.toggle('warn', sub.warn);
        b.addEventListener('click', function(){ haptic('tick'); openDoc(d.id); });
        box.appendChild(b);
      });
    });
    var all_ = allDocs(), done = all_.filter(function(d){ return pageCount(d.id); }).length;
    $('docs-count').textContent = done + ' of ' + all_.length + ' added';
    renderFly();
  }

  /* Keyla's flying window, from her rabies shot and blood test dates. */
  function flyInfo(){
    var shot = metaOf('k-rabies').date, blood = metaOf('k-favn').date, ehr = metaOf('k-ehrlichia').date, out = { lines:[] };
    if (!blood){
      out.head = 'When can Keyla fly?';
      out.lines.push({ t:'Add the date of her rabies blood test (Documents → Rabies blood test) and this works it out.' });
      if (!shot) out.lines.push({ t:'The blood test has to be at least 4 weeks after her rabies shot.' });
      return out;
    }
    var b = parseYmd(blood), from = addMonths(b, 3), to = addMonths(b, 12), now = today0();
    out.from = from; out.to = to;
    if (now < from){ out.head = 'She can fly from ' + longDate(from); out.chip = inDays(daysFrom(from)); out.tone = 'wait'; }
    else if (now <= to){ out.head = 'She can fly now'; out.chip = 'until ' + longDate(to); out.tone = 'ok'; }
    else { out.head = 'Her window closed on ' + longDate(to); out.chip = 'redo the blood test'; out.tone = 'bad'; }
    out.lines.push({ t:'Window: ' + longDate(from) + ' → ' + longDate(to) + ' (3 to 12 months after the blood draw).' });
    if (shot && (b - parseYmd(shot)) / 864e5 < 28) out.lines.push({ t:'The blood was drawn less than 4 weeks after the rabies shot, so it may not count. Ask the vet.', warn:true });
    if (now <= to && daysFrom(to) <= 60) out.lines.push({ t:'Only ' + daysFrom(to) + ' days left: book the vet for a new blood draw.', warn:true });
    var fly = goMode ? addDays(parseYmd(goMode.day0), 14) : null;
    if (fly){
      var e0 = addDays(fly, -45);
      if (ehr && parseYmd(ehr) >= e0 && parseYmd(ehr) <= fly) out.lines.push({ t:'Ehrlichia test on ' + longDate(parseYmd(ehr)) + ' is within 45 days of the flight ✓' });
      else out.lines.push({ t:'Ehrlichia test: do it between ' + longDate(e0) + ' and the flight on ' + longDate(fly) + '.', warn:!!ehr });
      if (fly < from || fly > to) out.lines.push({ t:'The flight on ' + longDate(fly) + ' is outside her window. All three of us go to the farm first (Route B).', warn:true });
    } else {
      out.lines.push({ t:'Close to the trip: the Ehrlichia test must be within 45 days before the flight.' });
    }
    return out;
  }
  function renderFly(){
    var f = flyInfo();
    ['flycard-docs', 'flycard-keyla', 'dv-fly'].forEach(function(id){
      var el = $(id); if (!el) return;
      el.innerHTML = '';
      var head = document.createElement('div'); head.className = 'fly-head';
      var h = document.createElement('strong'); h.textContent = f.head; head.appendChild(h);
      if (f.chip){ var c = document.createElement('span'); c.className = 'fly-chip ' + (f.tone || ''); c.textContent = f.chip; head.appendChild(c); }
      el.appendChild(head);
      f.lines.forEach(function(l){ var p = document.createElement('p'); p.className = 'fine' + (l.warn ? ' warn' : ''); p.textContent = l.t; el.appendChild(p); });
      if (f.to && N && N.remindOn){
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn small'; b.textContent = 'Remind me to redo it';
        b.addEventListener('click', function(){
          var when = addDays(f.to, -45); if (when < today0()) when = addDays(today0(), 1);
          N.remindOn("Business App: redo Keyla's rabies blood test", "Her flying window closes on " + longDate(f.to) + ". Book the vet for a new blood draw (FAVN / RFFIT).", when.getTime());
        });
        el.appendChild(b);
      }
    });
  }

  function refreshFiles(){
    try { files = docsUnlocked && N && N.docsList ? JSON.parse(N.docsList()) : {}; } catch(e){ files = {}; }
    renderDocs(); if (dvId) renderDocView();
  }
  function setLocked(locked, secure){
    docsUnlocked = !locked;
    $('docs-locked').hidden = !locked; $('docs-open').hidden = locked;
    $('docs-insecure').hidden = locked || secure !== false;
    if (locked){ closeLayer($('zoom'), true); closeLayer($('docview'), true); dvId = null; }
    refreshFiles();
  }
  $('docs-unlock').addEventListener('click', function(){
    haptic('tick');
    if (N && N.unlockDocs) N.unlockDocs();
    else { setLocked(false, true); toast('Browser preview: files can only be added on the phone'); }
  });
  $('docs-lock').addEventListener('click', function(){ if (N && N.lockDocs) N.lockDocs(); else setLocked(true); });

  // The document viewer
  var dvId = null;
  function openDoc(id){
    dvId = id; renderDocView();
    openLayer($('docview'), function(){ dvId = null; }, false);
    $('docview').querySelector('.panel-body').scrollTop = 0;
  }
  function renderDocView(){
    var d = docById(dvId); if (!d){ closeLayer($('docview'), true); return; }
    var m = metaOf(d.id), items = files[d.id] || [], box = $('dv-pages');
    $('dv-title').textContent = d.t;
    box.innerHTML = '';
    items.forEach(function(it){
      it.pages.forEach(function(src, i){
        var card = document.createElement('div'); card.className = 'dvpage card';
        var img = document.createElement('img'); img.src = src; img.alt = d.t + ', page'; img.loading = 'lazy';
        img.addEventListener('click', function(){ openZoom(src); });
        card.appendChild(img);
        if (i === 0){
          var bar = document.createElement('div'); bar.className = 'dvbar';
          var lab = document.createElement('span'); lab.textContent = it.kind === 'pdf' ? 'PDF · ' + it.pages.length + (it.pages.length === 1 ? ' page' : ' pages') : 'Photo';
          bar.appendChild(lab);
          if (N && N.openDocItem){
            var op = document.createElement('button'); op.type = 'button'; op.className = 'copy'; op.textContent = 'Open in app';
            op.addEventListener('click', function(){ N.openDocItem(d.id, it.id); }); bar.appendChild(op);
          }
          var del = document.createElement('button'); del.type = 'button'; del.className = 'copy danger'; del.textContent = 'Delete';
          del.addEventListener('click', function(){
            openSheet({ title:'Delete this ' + (it.kind === 'pdf' ? 'PDF' : 'photo') + '?', text:'It is removed from the app. Copies you exported stay where they are.', yes:'Delete', no:'Keep it',
              onYes:function(){ if (N && N.deleteDocItem) N.deleteDocItem(d.id, it.id); } });
          });
          bar.appendChild(del);
          card.insertBefore(bar, img);
        }
        box.appendChild(card);
      });
    });
    var has = items.length > 0;
    $('dv-empty').hidden = has;
    $('dv-cam').textContent = has ? 'Add a photo' : 'Take a photo';
    $('dv-file').textContent = has ? 'Add a file' : 'Choose a file';
    $('dv-date-row').hidden = !d.date;
    $('dv-date-label').textContent = d.date || 'Date';
    $('dv-date').value = m.date || '';
    $('dv-note').value = m.note || '';
    $('dv-fly').hidden = ['k-rabies', 'k-favn', 'k-ehrlichia'].indexOf(d.id) < 0;
    $('dv-remove').hidden = !d.custom;
  }
  $('dv-close').addEventListener('click', function(){ closeLayer($('docview')); });
  $('dv-date').addEventListener('change', function(e){ setMeta(dvId, 'date', e.target.value); renderDocs(); });
  $('dv-note').addEventListener('input', function(e){ setMeta(dvId, 'note', e.target.value); });
  $('dv-cam').addEventListener('click', function(){ if (N && N.addFromCamera) N.addFromCamera(dvId); else toast('The camera works in the app on the phone'); });
  $('dv-file').addEventListener('click', function(){ if (N && N.addFromFiles) N.addFromFiles(dvId); else toast('Picking files works in the app on the phone'); });
  $('dv-remove').addEventListener('click', function(){
    var d = docById(dvId);
    openSheet({ title:'Remove "' + d.t + '"?', text:'Its photos and files are deleted from the app.', yes:'Remove', no:'Keep it', onYes:function(){
      if (N && N.deleteDoc) N.deleteDoc(d.id);
      extraDocs = extraDocs.filter(function(x){ return x.id !== d.id; }); saveJson(XKEY, extraDocs);
      delete meta[d.id]; saveJson(MEKEY, meta);
      closeLayer($('docview')); renderDocs();
    } });
  });
  $('doc-add').addEventListener('click', function(){
    openActions({ title:'Add another document', text:'Whose is it?', actions:[
      { label:'Mine', kind:'primary', fn:function(){ askDocName('her'); } },
      { label:"Keyla's", fn:function(){ askDocName('keyla'); } }
    ] });
  });
  var askEl = $('ask'), askOk = null;
  function openAsk(title, label, onOk){
    $('ask-title').textContent = title; $('ask-label').textContent = label; $('ask-input').value = ''; askOk = onOk;
    openLayer(askEl, null, true); setTimeout(function(){ $('ask-input').focus(); }, 250);
  }
  $('ask-cancel').addEventListener('click', function(){ closeLayer(askEl); });
  $('ask-ok').addEventListener('click', function(){
    var v = $('ask-input').value.trim(); if (!v){ $('ask-input').focus(); return; }
    closeLayer(askEl); if (askOk) askOk(v);
  });
  function askDocName(g){
    openAsk(g === 'keyla' ? "A new document for Keyla" : 'A new document', 'What is it called?', function(name){
      var d = { g:g, id:'x-' + Date.now().toString(36), t:name.slice(0, 80), custom:true };
      extraDocs.push(d); saveJson(XKEY, extraDocs); renderDocs(); openDoc(d.id);
    });
  }

  // Pinch to zoom on one page
  var zoomImg = $('zoom-img'), zs = 1, zx = 0, zy = 0, pinch = null, pan = null, lastTap = 0;
  function zoomApply(){ zoomImg.style.transform = 'translate(' + zx + 'px,' + zy + 'px) scale(' + zs + ')'; }
  // cap: { title, credit } for a photo of Mauritius; none for her documents
  function openZoom(src, cap){
    zoomImg.src = src; zs = 1; zx = zy = 0; zoomApply();
    $('zoom-cap').hidden = !cap;
    if (cap){ $('zoom-title').textContent = cap.title; $('zoom-credit').textContent = cap.credit; }
    openLayer($('zoom'), null, false);
  }
  $('zoom-close').addEventListener('click', function(){ closeLayer($('zoom')); });
  var zoomEl = $('zoom');
  zoomEl.addEventListener('touchstart', function(e){
    if (e.touches.length === 2){
      var a = e.touches[0], b = e.touches[1];
      pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: zs, cx:(a.clientX + b.clientX) / 2, cy:(a.clientY + b.clientY) / 2, x:zx, y:zy };
    } else if (e.touches.length === 1){
      var now = Date.now();
      if (now - lastTap < 300){ zs = zs > 1 ? 1 : 2.5; if (zs === 1){ zx = zy = 0; } zoomApply(); }
      lastTap = now;
      pan = { x:e.touches[0].clientX - zx, y:e.touches[0].clientY - zy };
    }
  }, { passive:true });
  zoomEl.addEventListener('touchmove', function(e){
    if (pinch && e.touches.length === 2){
      var a = e.touches[0], b = e.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      zs = Math.max(1, Math.min(6, pinch.s * d / pinch.d));
      zx = pinch.x + ((a.clientX + b.clientX) / 2 - pinch.cx); zy = pinch.y + ((a.clientY + b.clientY) / 2 - pinch.cy);
      zoomApply();
    } else if (pan && e.touches.length === 1 && zs > 1){
      zx = e.touches[0].clientX - pan.x; zy = e.touches[0].clientY - pan.y; zoomApply();
    }
  }, { passive:true });
  zoomEl.addEventListener('touchend', function(e){ if (e.touches.length < 2) pinch = null; if (!e.touches.length) pan = null; if (zs === 1){ zx = zy = 0; zoomApply(); } });

  // Export: one zip with a folder per document and a README with her dates and notes
  function exportIndex(){
    var lines = ['Business App documents, exported ' + longDate(new Date()), ''];
    allDocs().forEach(function(d){
      var m = metaOf(d.id), n = pageCount(d.id);
      if (!n && !m.date && !m.note) return;
      lines.push('* ' + d.t + (d.g === 'keyla' ? ' (Keyla)' : ''));
      if (m.date) lines.push('  ' + (d.date || 'Date') + ': ' + longDate(parseYmd(m.date)));
      if (m.note) lines.push('  Notes: ' + m.note);
      lines.push('  ' + (n ? n + ' page(s)' : 'no file yet'));
    });
    var f = flyInfo(); if (f.from) lines.push('', 'Keyla can fly from ' + longDate(f.from) + ' to ' + longDate(f.to) + '.');
    return lines.join('\n');
  }
  function exportDocs(toDrive){
    if (!(N && N.exportDocs)){ toast('Export works in the app on the phone'); return; }
    var titles = {}; allDocs().forEach(function(d){ titles[d.id] = (d.g === 'keyla' ? 'Keyla - ' : '') + d.t; });
    N.exportDocs(JSON.stringify(titles), exportIndex(), toDrive);
  }
  $('export-drive').addEventListener('click', function(){ exportDocs(true); });
  $('export-save').addEventListener('click', function(){ exportDocs(false); });

  window.PlanBApp.onLock = function(on, secure){ setLocked(!on, secure); if (on) haptic('tick'); };
  window.PlanBApp.docsChanged = function(){ refreshFiles(); };
  window.PlanBApp.docsBusy = function(on){ $('busy').hidden = !on; };

  /* ---- Papers: contacts ---- */
  var CKEY = 'planb-contacts';
  var PRESETS = [
    { id:'embassy', name:'Embassy of Brazil in Pretoria', role:'Covers Mauritius (there is no embassy on the island)', phone:'+27 12 366 5200', phone2:'+27 82 653 6468', phone2Label:'Emergencies for Brazilians',
      email:'brasemb.pretoria@itamaraty.gov.br', notes:'152 Dallas Avenue, Waterkloof Glen, Pretoria, South Africa. Emergency line: missing people, hospital, arrest, death, violence. The consular section (consular.pretoria@itamaraty.gov.br) takes no calls: book on e-consular.' },
    { id:'consulate', name:'Honorary Consulate of Brazil', role:'Port Louis, Mauritius', phone:'+230 207 3000', email:'charles.harel@harelmallac.com',
      notes:'Honorary consul Charles Harel, Harel Mallac & Co., 18 Edith Cavell Street, Port Louis. Helps Brazilians in trouble, but cannot issue passports or visas. Number from directories: check it before we go.' },
    { id:'petimport', name:'Mauritius pet import', role:'Livestock and Veterinary Division', email:'petimport@govmu.org',
      notes:"Keyla's import permit. They want our flight number at least 4 days before landing." }
  ];
  var contacts = loadJson(CKEY, null);
  if (!contacts){ contacts = PRESETS.slice(); saveJson(CKEY, contacts); }
  function digits(p){ return (p || '').replace(/[^0-9+]/g, ''); }
  // The number in international form without the +, as wa.me and signal.me want it.
  function waNumber(p){
    var d = digits(p);
    if (d.charAt(0) === '+') return d.slice(1);
    d = d.replace(/^0+/, '');
    return d.length <= 11 ? '55' + d : d;   // a Brazilian number without +55
  }
  function renderContacts(){
    var box = $('contactlist'); box.innerHTML = '';
    contacts.forEach(function(c){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'contact card';
      b.innerHTML = '<span class="avatar" aria-hidden="true"></span><span class="ctext"><span class="cname"></span><span class="crole"></span><span class="cphone"></span></span><span class="chev" aria-hidden="true"></span>';
      b.querySelector('.avatar').textContent = (c.name || '?').trim().charAt(0).toUpperCase();
      b.querySelector('.cname').textContent = c.name;
      b.querySelector('.crole').textContent = c.role || '';
      b.querySelector('.cphone').textContent = c.phone || c.email || '';
      b.addEventListener('click', function(){ haptic('tick'); contactActions(c); });
      box.appendChild(b);
    });
    if (!contacts.length){ var p = document.createElement('p'); p.className = 'fine center'; p.textContent = 'No contacts yet. Tap + to add one.'; box.appendChild(p); }
  }
  function contactActions(c){
    var acts = [];
    if (c.phone) acts.push({ label:'Call ' + c.phone, kind:'primary', fn:function(){ call(c.phone); } });
    if (c.phone2) acts.push({ label:(c.phone2Label || 'Call') + ': ' + c.phone2, fn:function(){ call(c.phone2); } });
    // Signal first: it's what she uses. Both open the app straight on that number's chat.
    if (c.phone) acts.push({ label:'Signal', fn:function(){ location.href = 'https://signal.me/#p/+' + waNumber(c.phone); } });
    if (c.phone) acts.push({ label:'WhatsApp', fn:function(){ location.href = 'https://wa.me/' + waNumber(c.phone); } });
    if (c.email) acts.push({ label:'Email ' + c.email, fn:function(){ if (N && N.email) N.email(c.email, '', ''); else location.href = 'mailto:' + c.email; } });
    acts.push({ label:'Edit', fn:function(){ contactForm(c); } });
    acts.push({ label:'Delete', kind:'danger', fn:function(){
      openSheet({ title:'Delete ' + c.name + '?', text:'Only from this app. Your phone contacts stay as they are.', yes:'Delete', no:'Keep',
        onYes:function(){ contacts = contacts.filter(function(x){ return x !== c; }); saveJson(CKEY, contacts); renderContacts(); } });
    } });
    openActions({ title:c.name, text:c.notes || '', actions:acts });
  }
  function call(n){ if (N && N.dial) N.dial(n); else location.href = 'tel:' + digits(n); }
  var editing = null, cform = $('cform');
  function contactForm(c){
    editing = c || null;
    $('cf-title').textContent = c ? 'Edit contact' : 'New contact';
    $('cf-name').value = c ? c.name : ''; $('cf-role').value = c ? (c.role || '') : '';
    $('cf-phone').value = c ? (c.phone || '') : ''; $('cf-email').value = c ? (c.email || '') : ''; $('cf-notes').value = c ? (c.notes || '') : '';
    $('cf-pick').hidden = !(N && N.pickContact);
    openLayer(cform, null, true);
  }
  $('contact-add').addEventListener('click', function(){ haptic('tick'); contactForm(null); });
  $('cf-pick').addEventListener('click', function(){ N.pickContact(); });
  all('#cf-chips button').forEach(function(b){ b.addEventListener('click', function(){ $('cf-role').value = b.textContent; }); });
  $('cf-cancel').addEventListener('click', function(){ closeLayer(cform); });
  $('cf-save').addEventListener('click', function(){
    var name = $('cf-name').value.trim();
    if (!name){ toast('Give them a name'); $('cf-name').focus(); return; }
    var c = editing || { id:'c' + Date.now().toString(36) };
    c.name = name; c.role = $('cf-role').value.trim(); c.phone = $('cf-phone').value.trim(); c.email = $('cf-email').value.trim(); c.notes = $('cf-notes').value.trim();
    if (!editing) contacts.push(c);
    saveJson(CKEY, contacts); renderContacts(); closeLayer(cform); toast('Saved ✓');
  });
  window.PlanBApp.contactPicked = function(p){
    if (p.name && !$('cf-name').value) $('cf-name').value = p.name;
    if (p.phone) $('cf-phone').value = p.phone;
  };

  // The + button shows only on Contacts
  var papersPart = 'docs';
  function segChanged(id){
    if (['docs', 'keyla', 'contacts'].indexOf(id) >= 0) papersPart = id;
    $('contact-add').hidden = !(current === 'papers' && papersPart === 'contacts');
  }
  renderContacts();
  setLocked(true);

  /* ---- Kê-Kê Run: tap to jump over the crate, the crabs and the vet; grab pêmios and ducks ---- */
  var gameEl = $('game'), gcv = $('game-cv'), gctx = gcv.getContext('2d'), RKEY = 'planb-run-best';
  var G2 = null, gW = 0, gH = 0, gRaf = 0, gLast = 0;
  function bestScore(){ try { return +(localStorage.getItem(RKEY) || 0); } catch(e){ return 0; } }
  function sizeGame(){
    var d = Math.min(2, window.devicePixelRatio || 1);
    gW = gameEl.clientWidth; gH = gameEl.clientHeight;
    gcv.width = gW * d; gcv.height = gH * d; gctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function newRun(){
    return { phase:'ready', speed:250, dist:0, bonus:0, y:0, vy:0, jumps:0, things:[], next:1.2, popups:[], over:0, best:bestScore(), newBest:false };
  }
  function openGame(){
    gameOpen = true; haptic('heavy');
    openLayer(gameEl, function(){ gameOpen = false; cancelAnimationFrame(gRaf); }, false);
    sizeGame(); G2 = newRun(); gLast = performance.now();
    cancelAnimationFrame(gRaf); gRaf = requestAnimationFrame(gameLoop);
  }
  $('game-close').addEventListener('click', function(e){ e.stopPropagation(); closeLayer(gameEl); });
  window.addEventListener('resize', function(){ if (gameOpen) sizeGame(); });
  gameEl.addEventListener('pointerdown', function(e){
    if (e.target.closest && e.target.closest('#game-close')) return;
    if (G2.phase === 'ready'){ G2.phase = 'run'; }
    if (G2.phase === 'over'){ if (performance.now() - G2.over > 700) G2 = newRun(), G2.phase = 'run'; return; }
    if (G2.jumps < 2){ G2.vy = G2.jumps ? -720 : -860; G2.jumps++; haptic('light'); }
  });

  var KS = 2;                        // Keyla's size in the game
  function groundY(){ return Math.round(gH * 0.74); }
  function keylaX(){ return Math.round(gW * 0.24); }
  function spawn(){
    var r = Math.random(), gy = groundY(), x = gW + 40;
    if (r < 0.34) G2.things.push({ k:'crate', x:x, y:gy - 44, w:50, h:44, bad:true });
    else if (r < 0.58) G2.things.push({ k:'crab', x:x, y:gy - 22, w:40, h:22, bad:true });
    else if (r < 0.72) G2.things.push({ k:'vet', x:x, y:gy - 74, w:34, h:74, bad:true });
    else if (r < 0.9) G2.things.push({ k:'bone', x:x, y:gy - (Math.random() < 0.5 ? 70 : 170), w:34, h:16 });
    else G2.things.push({ k:'duck', x:x, y:gy - 26, w:34, h:26, walk:60 });
    if (Math.random() < 0.3) G2.things.push({ k:'bone', x:x + 70, y:gy - 120, w:34, h:16 });
    G2.next = (0.9 + Math.random() * 1.1) * 260 / G2.speed + 0.35;
  }
  function gameLoop(now){
    var dt = Math.min(0.033, (now - gLast) / 1000); gLast = now;
    if (G2.phase === 'run'){
      G2.speed = Math.min(640, G2.speed + 7 * dt);
      G2.dist += G2.speed * dt;
      G2.vy += 2300 * dt; G2.y = Math.min(0, G2.y + G2.vy * dt);
      if (G2.y === 0){ G2.vy = 0; G2.jumps = 0; }
      G2.next -= dt; if (G2.next <= 0) spawn();
      var kx = keylaX(), ky = groundY() + G2.y, kb = [kx - 20 * KS + 8, ky - 30 * KS + 6, kx + 29 * KS - 8, ky - 2];
      G2.things.forEach(function(o){
        o.x -= (G2.speed - (o.walk || 0)) * dt;
        if (o.got) return;
        var hit = o.x < kb[2] && o.x + o.w > kb[0] && o.y < kb[3] && o.y + o.h > kb[1];
        if (!hit) return;
        if (o.bad){
          G2.phase = 'over'; G2.over = performance.now(); haptic('heavy');
          var score = Math.floor(G2.dist / 10) + G2.bonus;
          if (score > G2.best){ G2.best = score; G2.newBest = true; try { localStorage.setItem(RKEY, score); } catch(e){} bark(); }
        } else {
          o.got = true; var pts = o.k === 'duck' ? 25 : 10; G2.bonus += pts; haptic('tick');
          G2.popups.push({ x:o.x, y:o.y - 10, t:0, text: o.k === 'duck' ? 'PATO! +25' : 'pêmio +10' });
        }
      });
      G2.things = G2.things.filter(function(o){ return o.x > -80 && !(o.got && o.k !== 'duck'); });
    }
    G2.popups.forEach(function(p){ p.t += dt; p.y -= 40 * dt; });
    G2.popups = G2.popups.filter(function(p){ return p.t < 1; });
    drawGame();
    gRaf = requestAnimationFrame(gameLoop);
  }
  function drawGame(){
    var c = gctx, W = gW, H = gH, gy = groundY(), off = G2.dist;
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#F9D6E3'); g.addColorStop(.5, '#E4DAF9'); g.addColorStop(.51, '#BFE6D8'); g.addColorStop(.62, '#9FD3C3'); g.addColorStop(.63, '#F3DDB0'); g.addColorStop(1, '#E8CB92');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#FBE8C4'; c.beginPath(); c.arc(W * 0.8, H * 0.18, 34, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2.5; c.lineCap = 'round';
    for (var i = 0; i < 8; i++){
      var wx = ((i * 157 - off * 0.3) % (W + 80) + W + 80) % (W + 80) - 40, wy = H * 0.53 + (i % 3) * 14;
      c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 12, wy - 5, wx + 24, wy); c.stroke();
    }
    c.fillStyle = 'rgba(51,36,60,.08)'; c.fillRect(0, gy, W, 3);
    ctx = c;
    G2.things.forEach(function(o){ drawThing(c, o); });
    var kx = keylaX(), ky = groundY() + G2.y;
    c.fillStyle = 'rgba(51,36,60,.14)'; c.beginPath(); c.ellipse(kx + 4, gy + 2, 30 + G2.y * 0.05, 4, 0, 0, 7); c.fill();
    drawKeyla(kx, ky - 13 * KS, KS, 1, G2.phase === 'over', G2.phase === 'run' && G2.y === 0);
    G2.popups.forEach(function(p){ c.globalAlpha = 1 - p.t; c.fillStyle = '#C44A71'; c.font = '600 22px Caveat, cursive'; c.fillText(p.text, p.x, p.y); c.globalAlpha = 1; });
    var score = Math.floor(G2.dist / 10) + G2.bonus;
    c.fillStyle = '#33243C'; c.font = '700 18px Karla, sans-serif'; c.textAlign = 'left';
    c.fillText(score, 18, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat'), 10) + 36 || 36);
    c.fillStyle = '#6E5D7A'; c.font = '500 14px Karla, sans-serif';
    c.fillText('best ' + G2.best, 18, (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat'), 10) || 0) + 56);
    c.textAlign = 'center';
    if (G2.phase === 'ready'){
      card(c, W / 2, H * 0.3, 'Kê-Kê Run', 'tap to jump, tap again in the air for a double jump', 'desvia da caixinha e do veterinário! pega os pêmio e os pato');
    } else if (G2.phase === 'over'){
      card(c, W / 2, H * 0.3, G2.newBest ? 'NOVO RECORDE! ' + score : 'BORA DE NOVO?', G2.newBest ? 'galela galela bom dia pessoal' : score + ' points · best ' + G2.best, 'tap to play again');
    }
    c.textAlign = 'left';
  }
  function card(c, x, y, title, line1, line2){
    c.fillStyle = 'rgba(242,229,235,.94)';
    c.beginPath(); c.roundRect(x - Math.min(160, gW / 2 - 16), y - 54, Math.min(320, gW - 32), 120, 18); c.fill();
    c.fillStyle = '#C44A71'; c.font = '600 34px Caveat, cursive'; c.fillText(title, x, y - 12);
    c.fillStyle = '#33243C'; c.font = '500 14px Karla, sans-serif'; c.fillText(line1, x, y + 18);
    c.fillStyle = '#6E5D7A'; c.fillText(line2, x, y + 40);
  }
  function drawThing(c, o){
    var x = o.x, y = o.y;
    if (o.k === 'crate'){        // the pink crate she protests
      c.fillStyle = '#F7A8C4'; c.beginPath(); c.roundRect(x, y, o.w, o.h, 6); c.fill();
      c.strokeStyle = '#C44A71'; c.lineWidth = 2.5; c.beginPath(); c.roundRect(x, y, o.w, o.h, 6); c.stroke();
      c.lineWidth = 2; for (var i = 1; i < 4; i++){ c.beginPath(); c.moveTo(x + 10, y + i * o.h / 4); c.lineTo(x + o.w - 10, y + i * o.h / 4); c.stroke(); }
    } else if (o.k === 'crab'){
      c.fillStyle = '#E3202C'; c.beginPath(); c.ellipse(x + 20, y + 14, 16, 9, 0, 0, 7); c.fill();
      c.beginPath(); c.arc(x + 4, y + 5, 5, 0, 7); c.arc(x + 36, y + 5, 5, 0, 7); c.fill();
      c.fillStyle = '#171316'; c.beginPath(); c.arc(x + 15, y + 8, 1.8, 0, 7); c.arc(x + 25, y + 8, 1.8, 0, 7); c.fill();
    } else if (o.k === 'vet'){   // the vet's sign
      c.fillStyle = '#8C5C38'; c.fillRect(x + 15, y + 30, 4, o.h - 30);
      c.fillStyle = '#FBF6F9'; c.beginPath(); c.roundRect(x, y, o.w, 32, 5); c.fill();
      c.strokeStyle = '#33243C'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#E3202C'; c.fillRect(x + 14, y + 7, 6, 18); c.fillRect(x + 8, y + 13, 18, 6);
    } else if (o.k === 'bone'){
      c.fillStyle = '#FBF0D9'; c.strokeStyle = '#C98B4B'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(x + 6, y + 4, o.w - 12, 8, 3); c.fill(); c.stroke();
      [[x + 5, y + 4], [x + 5, y + 12], [x + o.w - 5, y + 4], [x + o.w - 5, y + 12]].forEach(function(p){ c.beginPath(); c.arc(p[0], p[1], 4.5, 0, 7); c.fill(); c.stroke(); });
    } else if (o.k === 'duck'){
      drawPato(x + 17, y + 12, 1);
    }
  }

  /* ---- Get the vibe: photos of Mauritius (assets/photos, from Wikimedia Commons; credits in photos.js) ---- */
  (window.PLANB_PHOTOS || []).forEach(function(p){
    var box = $(p.group === 'city' ? 'photos-city' : 'photos-beach'); if (!box) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'photo card';
    b.innerHTML = '<img alt="" loading="lazy"><span class="ph-cap"><strong></strong><span></span></span>';
    b.querySelector('img').src = 'photos/' + p.file; b.querySelector('img').alt = p.title;
    b.querySelector('strong').textContent = p.title; b.querySelector('.ph-cap span').textContent = p.where;
    b.addEventListener('click', function(){
      haptic('tick');
      openZoom('photos/' + p.file, { title:p.title + ' · ' + p.where, credit:'Photo: ' + p.author + ' · ' + p.license + ' · Wikimedia Commons' });
    });
    box.appendChild(b);
  });

  /* ---- shared with survivors.js (Galela Survivors) ---- */
  var openSurvivors = null;
  window.PlanBKit = {
    drawGabs:drawGabs, drawKeyla:drawKeyla, drawPato:drawPato,
    setCtx:function(c){ ctx = c; }, setGameOpen:function(v){ gameOpen = v; },
    openLayer:openLayer, closeLayer:closeLayer, haptic:haptic, bark:bark,
    onOpenSurvivors:function(fn){ openSurvivors = fn; }
  };
  $('arcade-surv').addEventListener('click', function(){ if (openSurvivors) openSurvivors(); });
  $('arcade-run').addEventListener('click', function(){ openGame(); });

  /* ---- start ---- */
  update(false);
  renderGo();
  prog();
  syncBar(); syncBack();
  hero(); duo(); gauge();
  var go = function(){ if (reduce){ level = target; drawVisible(); } else requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.ready){ document.fonts.ready.then(go, go); } else { go(); }
})();
