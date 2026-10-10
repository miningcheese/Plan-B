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
    drawKeyla(345, 194, 3, 1, true, false);
    var px = 470 + Math.sin(t * 0.05) * 30, pf = Math.cos(t * 0.05) >= 0 ? 1 : -1;
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
    drawKeyla(40, level - 13 * s, s, 1, state === 'go', false);
  }

  /* ---- closing pair ---- */
  var D = setup(document.getElementById('duo'));
  function duo(){
    ctx = D.c; ctx.clearRect(0,0,D.W,D.H);
    drawGabs(78, 82, 2.2, 1, false, false);
    drawKeyla(146, 100, 2.2, 1, false, false);
  }


  /* ---- animation: only the drawings on the open screen ---- */
  var current = 'home';
  function drawVisible(){
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
  var sheet = $('sheet'), scrim = $('scrim'), sheetYes = null;
  // openSheet({ title, text, yes, no, onYes })
  function openSheet(o){
    $('sheet-title').textContent = o.title; $('sheet-text').textContent = o.text;
    $('sheet-yes').textContent = o.yes || 'OK'; $('sheet-no').textContent = o.no || 'Cancel';
    sheetYes = o.onYes; sheet.hidden = false; scrim.hidden = false; syncBack();
  }
  function closeSheet(){ sheet.hidden = true; scrim.hidden = true; sheetYes = null; syncBack(); }
  scrim.addEventListener('click', closeSheet);
  $('sheet-no').addEventListener('click', closeSheet);
  $('sheet-yes').addEventListener('click', function(){ var f = sheetYes; closeSheet(); if (f) f(); });

  function syncBack(){ try { if (N && N.setCanGoBack) N.setCanGoBack(!sheet.hidden || current !== 'home'); } catch(e){} }

  window.PlanBApp = {
    setInsets: function(top, right, bottom, left){
      var s = document.documentElement.style;
      s.setProperty('--sat', top + 'px'); s.setProperty('--sar', right + 'px');
      s.setProperty('--sab', bottom + 'px'); s.setProperty('--sal', left + 'px');
    },
    // Android back: close the sheet, then go back to Home, then leave the app.
    back: function(){
      if (!sheet.hidden){ closeSheet(); return true; }
      if (current !== 'home'){ show('home'); return true; }
      return false;
    },
    toast: toast
  };
  try { if (N && N.insets){ var i = JSON.parse(N.insets()); window.PlanBApp.setInsets(i.top, i.right, i.bottom, i.left); } } catch(e){}

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
    syncBar(); syncBack();
    if (reduce) drawVisible();
  }
  tabs.forEach(function(b){ b.addEventListener('click', function(){ haptic('tick'); show(b.dataset.tab); }); });
  all('[data-go]').forEach(function(b){ b.addEventListener('click', function(){ show(b.dataset.go); }); });
  Object.keys(screens).forEach(function(k){ screens[k].addEventListener('scroll', function(){ if (k === current) syncBar(); }, { passive:true }); });

  // Plan: Route A / Route B / 14 days
  var segs = all('.seg button');
  function selectSeg(id){
    segs.forEach(function(x){ var on = x.dataset.seg === id; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); $(x.dataset.seg).hidden = !on; });
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
    if (N && N.remindMonthly) N.remindMonthly();
    else toast('Add a monthly "check the meter" in your calendar');
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

  /* ---- start ---- */
  update(false);
  renderGo();
  prog();
  syncBar(); syncBack();
  hero(); duo(); gauge();
  var go = function(){ if (reduce){ level = target; drawVisible(); } else requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.ready){ document.fonts.ready.then(go, go); } else { go(); }
})();
