/*
  Galela Survivors, from the Very Serious Website for Business, now living in the app.
  Same game (pick Keyla or Babiela, ducks, strays and starers, Taíze and Lauren, PUM-PUM and
  SHITTALK modes), plus: full screen on the phone, the same speed on 60 and 120 Hz screens,
  level-ups every few hundred points with three choices (a sidekick, new havaianas, coxinhas),
  coxinhas that heal, a third boss (Seu Gérson do Cartório), haptics and her voice.
  Opened from Home → Arcade; app.js shares its helpers as window.PlanBKit.
*/
(function(){
  const K = window.PlanBKit; if (!K) return;
  const el = id => document.getElementById(id);
  const wrap = el("surv"), cv = el("surv-cv");
  const ctx = cv.getContext && cv.getContext("2d"); if (!ctx) return;

  let W = 390, H = 700, TOP = 64, BOT = 44;   // the arena is the whole screen, minus room for the HUD
  const MODE_LEN = 480;       // 8 seconds
  const MODE_EVERY = 1000;
  const OFFER_EVERY = 500;

  function fit(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth || 390; H = wrap.clientHeight || 700;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const css = getComputedStyle(document.documentElement);
    TOP = (parseInt(css.getPropertyValue("--sat"), 10) || 0) + 70;
    BOT = (parseInt(css.getPropertyValue("--sab"), 10) || 0) + 46;
  }
  window.addEventListener("resize", function(){ if (!wrap.hidden) fit(); });

  let best = 0;
  try { best = parseInt(localStorage.getItem("survbest") || "0", 10) || 0; } catch(e){}

  let state = "pick", who = null, t = 0, lastScore = 0;
  let P, foes, shots, eshots, fx, score, nextMode, modeT, spawnT, atkT, uid = 0;
  let stats, boss, bossT, bossCount, offer, offerIn, offerAt, volley = 0;
  let nextOffer, side, pickups, newBest = false, paused = false;
  const keys = {};
  let stick = null;

  const BOSSES = [
    { key:"taize",  name:"Taíze, Admin do Patamento", done:"RECLAMAÇÃO ENCERRADA",
      look:{ shirt:"#9C8F86", pants:"#3B3340", skin:"#F4D6C2", hair:"#1E1714", style:"bun",  prop:"clipboard", frown:true } },
    { key:"lauren", name:"Lauren, The Manager",       done:"REUNIÃO CANCELADA",
      look:{ shirt:"#2E3A5C", pants:"#2B2233", skin:"#F1C8B0", hair:"#8A4B2E", style:"pony", prop:"phone", frown:true, collar:true } },
    { key:"gerson", name:"Seu Gérson do Cartório",   done:"PROCESSO DEFERIDO",
      look:{ shirt:"#7A6A58", pants:"#3B3340", skin:"#E8C4A8", hair:"#B9B4C2", style:"short", prop:"clipboard", frown:true, collar:true } }
  ];
  const SHIRTS = ["#8FB79E","#E28E6B","#7FA0CC","#D8B45A","#B38BC7","#5E6B7A","#C96F8A"];
  const HAIRS  = ["#2A1E18","#6B4630","#B98E4F","#3B3B3B","#8A3B2E","#1A1A1A"];
  const SKINS  = ["#F1C8B0","#D9A07A","#A8704A","#7A4B2E","#F4D6C2","#C68B63"];
  const PANTS  = ["#2B2233","#3E4A63","#4A3B32","#5A5A66"];
  const STYLES = ["short","long","pony","bun","short"];
  const FURS   = [["#8C8279","#6E655E"],["#C9A26B","#A88352"],["#DCCFBC","#B09C80"],["#5A4A3E","#43372E"],["#B0663C","#8C4E2C"]];
  const pick = function(a){ return a[Math.floor(Math.random() * a.length)]; };

  /* ---------- helpers ---------- */
  const rr = function(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); };
  const circ = function(x,y,r){ ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); };
  const tri = function(a,b,c,d,e,f){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.lineTo(e,f); ctx.closePath(); ctx.fill(); };

  /* ---------- the two of them ---------- */
  function drawKeyla(x, y, s, face, hood, moving){
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
    const sw = moving ? Math.sin(t * 0.45) * 4 : 0;
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
    const sw = moving ? Math.sin(t * 0.45) * 3 : 0;
    const bob = moving ? Math.abs(Math.sin(t * 0.45)) * 1.2 : 0;
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

  /* ---------- the neighbourhood ---------- */
  function drawPato(x, y, face, flash){
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    const step = Math.sin(t * 0.4 + x * 0.05) * 2;
    ctx.fillStyle = "#E8A33C"; rr(-4, 8, 3, 5 + step * 0.5, 1); rr(2, 8, 3, 5 - step * 0.5, 1);
    ctx.fillStyle = flash ? "#FFF" : "#A8703A"; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = flash ? "#FFF" : "#7E5127"; ctx.beginPath(); ctx.ellipse(-3, -1, 8, 5.5, -0.25, 0, 7); ctx.fill();
    ctx.fillStyle = flash ? "#FFF" : "#C08A44"; circ(10, -9, 6.5);
    ctx.fillStyle = "#F2B33C"; tri(15, -9, 22, -7, 15, -5);
    ctx.fillStyle = "#171316"; circ(11.5, -10.5, 1.4);
    ctx.restore();
  }

  function drawStray(f, face){
    const flash = f.flash > 0, a = f.fur[0], b = f.fur[1];
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(face, 1);
    const sw = Math.sin(t * 0.55 + f.id) * 3;
    ctx.fillStyle = flash ? "#FFF" : b;
    rr(-11, 3, 4, 9 + sw * 0.4, 1); rr(6, 3, 4, 9 - sw * 0.4, 1);
    rr(-7, 3, 4, 9 - sw * 0.4, 1); rr(10, 3, 4, 9 + sw * 0.4, 1);
    ctx.strokeStyle = flash ? "#FFF" : b; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-13, -3); ctx.lineTo(-19, -10 + Math.sin(t * 0.8 + f.id) * 3); ctx.stroke();
    ctx.fillStyle = flash ? "#FFF" : a; rr(-14, -7, 28, 12, 6);
    tri(-7, -6, -4, -11, -1, -6); tri(0, -6, 3, -10.5, 6, -6);
    rr(8, -15, 13, 12, 5);
    ctx.fillStyle = flash ? "#FFF" : b;
    tri(9, -13, 11, -21, 14, -13);
    rr(14, -14, 4, 8, 2);
    ctx.fillStyle = "#171316"; circ(21.4, -8.6, 1.6); circ(13.2, -11, 1.1);
    ctx.fillStyle = "#EC8FAE"; rr(16, -5, 4, 4, 1.5);
    ctx.restore();
  }

  function drawPerson(x, y, s, o, lookX, lookY, moving, seed, flash){
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const walk = moving ? Math.sin(t * 0.3 + seed) * 2 : 0;
    ctx.fillStyle = flash ? "#FFF" : o.pants; rr(-6, 6, 5, 13 + walk * 0.5, 2); rr(1, 6, 5, 13 - walk * 0.5, 2);
    ctx.fillStyle = flash ? "#FFF" : o.shirt; rr(-9, -9, 18, 18, 6);
    rr(-12, -7, 4, 13, 2); rr(8, -7, 4, 13, 2);
    if (o.collar){ ctx.fillStyle = "#F4F0F2"; tri(-3.2, -9, 3.2, -9, 0, -3); }
    if (o.prop === "clipboard"){ ctx.fillStyle = "#B98E4F"; rr(8, -2, 9, 12, 1.5); ctx.fillStyle = "#FFF"; rr(9.5, 0, 6, 8.5, 1); }
    if (o.prop === "phone"){ ctx.fillStyle = "#2B2233"; rr(9, -3, 5, 8, 1.2); }
    ctx.fillStyle = flash ? "#FFF" : o.skin; circ(0, -17, 8.5);
    ctx.fillStyle = flash ? "#FFF" : o.hair;
    ctx.beginPath(); ctx.arc(0, -19, 9, Math.PI, 0); ctx.fill();
    if (o.style === "bun") circ(0, -29, 4.6);
    else if (o.style === "pony") rr(6.5, -24, 5, 15, 2.5);
    else if (o.style === "long"){ rr(-9.6, -20, 4, 15, 2); rr(5.6, -20, 4, 15, 2); }
    const ex = Math.max(-1, Math.min(1, lookX)), ey = Math.max(-1, Math.min(1, lookY));
    if (o.big){
      ctx.fillStyle = "#FFF"; circ(-3.3, -16.5, 3.1); circ(3.3, -16.5, 3.1);
      ctx.fillStyle = "#171316"; circ(-3.3 + ex * 1.5, -16.5 + ey * 1.2, 1.6); circ(3.3 + ex * 1.5, -16.5 + ey * 1.2, 1.6);
    } else {
      ctx.fillStyle = "#171316"; circ(-3 + ex, -17 + ey * 0.6, 1.2); circ(3 + ex, -17 + ey * 0.6, 1.2);
    }
    ctx.strokeStyle = "#7A3E3E"; ctx.lineWidth = 1;
    ctx.beginPath();
    if (o.frown) ctx.arc(0, -9.8, 2.6, Math.PI * 1.18, Math.PI * 1.82);
    else { ctx.moveTo(-2, -12); ctx.lineTo(2, -12); }
    ctx.stroke();
    ctx.restore();
  }

  function drawStareBubble(x, y){
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "rgba(51,36,60,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(-11, -8, 22, 12, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#33243C";
    for (let i = -1; i <= 1; i++) circ(i * 5, -2, 1.3);
    ctx.restore();
  }

  /* ---------- projectiles ---------- */
  function drawBone(s){
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    ctx.fillStyle = "#B8894A";
    rr(-9, -3.6, 18, 7.2, 3.4);
    [[-8.5,-3],[-8.5,3],[8.5,-3],[8.5,3]].forEach(function(p){ circ(p[0], p[1], 4); });
    ctx.fillStyle = "#F6E8C8";
    rr(-8, -2.4, 16, 4.8, 2.4);
    [[-8.5,-3],[-8.5,3],[8.5,-3],[8.5,3]].forEach(function(p){ circ(p[0], p[1], 2.9); });
    ctx.restore();
  }
  function drawTalk(s){
    ctx.save(); ctx.translate(s.x, s.y);
    ctx.font = "700 12px Karla, sans-serif";
    const w = ctx.measureText(s.text).width + 14;
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#C44A71"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.roundRect(-w / 2, -10, w, 19, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#C44A71"; ctx.textAlign = "center"; ctx.fillText(s.text, 0, 4);
    ctx.restore();
  }
  function drawAviso(s){
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.sin(t * 0.2 + s.x * 0.05) * 0.35);
    ctx.fillStyle = "#FFFDF8"; ctx.strokeStyle = "#5E3FA4"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(-7, -9, 14, 18, 1.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#D9425E"; ctx.font = "700 11px Karla, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("!", 0, 4);
    ctx.restore();
  }
  function drawInvite(s){
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.sin(t * 0.18 + s.y * 0.05) * 0.3);
    ctx.fillStyle = "#FFFDF8"; ctx.strokeStyle = "#2E3A5C"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(-8, -8, 16, 16, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#D9425E"; ctx.fillRect(-7.3, -7.3, 14.6, 4.5);
    ctx.fillStyle = "#2E3A5C";
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) circ(-4 + c * 4, 0.5 + r * 3.8, 0.9);
    ctx.restore();
  }
  function drawCarimbo(s){
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.sin(t * 0.25 + s.y * 0.05) * 0.4);
    ctx.fillStyle = "#8C5C38"; circ(0, -7, 4); rr(-1.8, -6, 3.6, 6, 1);
    ctx.fillStyle = "#5A3A26"; rr(-7, 0, 14, 4, 1);
    ctx.fillStyle = "#D9425E"; rr(-8, 4, 16, 4, 1);
    ctx.restore();
  }
  function drawCoxinha(c){
    if (c.life < 120 && Math.floor(t / 6) % 2) return;     // blinks before it goes
    ctx.save(); ctx.translate(c.x, c.y + Math.sin(t * 0.12 + c.x) * 1.5);
    ctx.fillStyle = "rgba(51,36,60,.12)"; ctx.beginPath(); ctx.ellipse(0, 9, 8, 2.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#D9962B";
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(10, 3, 7, 7); ctx.lineTo(-7, 7); ctx.quadraticCurveTo(-10, 3, 0, -10); ctx.fill();
    ctx.fillStyle = "#F2B33C"; circ(-2.5, 0, 2); circ(2, 3, 1.4);
    ctx.restore();
  }
  function heart(x, y, full){
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-11, -2, -6, -12, 0, -5);
    ctx.bezierCurveTo(6, -12, 11, -2, 0, 6);
    if (full){ ctx.fillStyle = "#D9557E"; ctx.fill(); }
    else { ctx.strokeStyle = "#C9A9BC"; ctx.lineWidth = 1.6; ctx.stroke(); }
    ctx.restore();
  }

  /* ---------- upgrades ---------- */
  function upgradePool(){
    const other = who === "gabs" ? "Keyla" : "Babiela";
    const pool = [
      { title:other + " joins",  sub:who === "gabs" ? "she throws bones at the closest one" : "she slaps everything around her",
                                                                            ok:stats.side === 0, apply:function(){ stats.side = 1; side = { x:P.x - 30, y:P.y + 10, face:1, cd:40 }; } },
      { title:other + " goes harder", sub:"the sidekick attacks faster",    ok:stats.side > 0 && stats.side < 3, apply:function(){ stats.side++; } },
      { title:"new havaianas", sub:"walk 12% faster",                       ok:stats.walk < 3,   apply:function(){ stats.walk++; } },
      { title:"coxinha luck",  sub:"more coxinhas drop (they heal)",        ok:stats.cox < 3,    apply:function(){ stats.cox++; } },
      { title:"+1 heart",      sub:"and heal one",                          ok:P.max < 9,        apply:function(){ P.max++; P.hp = Math.min(P.max, P.hp + 1); } },
      { title:"hit harder",    sub:"+1 damage",                             ok:stats.dmg < 5,    apply:function(){ stats.dmg++; } },
      { title:"attack faster", sub:"20% quicker",                           ok:stats.rate > 0.5, apply:function(){ stats.rate *= 0.8; } },
      { title:"longer reach",  sub:who === "keyla" ? "bones fly further" : "bigger slap",
                                                                            ok:stats.range < 5,  apply:function(){ stats.range++; } }
    ].filter(function(u){ return u.ok; });
    for (let i = pool.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const k = pool[i]; pool[i] = pool[j]; pool[j] = k; }
    return pool.slice(0, 3);
  }
  function choose(i){
    if (state !== "upgrade" || !offer || !offer[i]) return;
    if (performance.now() - offerAt < 550) return;       // no accidental picks mid-drag
    offer[i].apply();
    offer = null; state = "run"; P.inv = 60; lvlEl.hidden = true; K.haptic("tick");
  }
  const lvlEl = el("surv-lvl"), cardsEl = el("surv-cards");
  function showOffer(){
    cardsEl.innerHTML = "";
    offer.forEach(function(u, i){
      const b = document.createElement("button"); b.type = "button"; b.className = "scard " + (who === "keyla" ? "weapon" : "passive");
      b.innerHTML = '<span class="sc-top"><span class="sc-name"></span></span><span class="sc-desc"></span>';
      b.querySelector(".sc-name").textContent = u.title;
      b.querySelector(".sc-desc").textContent = u.sub;
      b.addEventListener("click", function(){ choose(i); });
      cardsEl.appendChild(b);
    });
    el("surv-lvl-n").textContent = "pick an upgrade";
    lvlEl.hidden = false; K.haptic("heavy");
  }

  /* ---------- flow ---------- */
  function start(which){
    who = which; state = "run"; t = 0;
    const hearts = which === "gabs" ? 6 : 5;             // she fights up close, so she can take more
    P = { x:W / 2, y:(TOP + H - BOT) / 2, r:15, hp:hearts, max:hearts, inv:0, face:1, moving:false };
    foes = []; shots = []; eshots = []; fx = [];
    score = 0; nextMode = MODE_EVERY; modeT = 0; spawnT = 40; atkT = 20;
    stats = { dmg:1, rate:1, range:0, side:0, walk:0, cox:0 };
    boss = null; bossT = 45 * 60; bossCount = 0; offer = null; offerIn = 0;
    nextOffer = OFFER_EVERY; side = null; pickups = []; newBest = false; lvlEl.hidden = true;
    K.haptic("tick");
  }

  let over = function(){
    state = "over"; lastScore = score; stick = null;
    K.haptic("heavy");
    if (score > best){
      best = score; newBest = true;
      try { localStorage.setItem("survbest", String(best)); } catch(e){}
      K.bark();
    }
  }

  function edge(){
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return [Math.random() * W, TOP - 40];
    if (side === 1) return [W + 28, TOP + Math.random() * (H - TOP - BOT)];
    if (side === 2) return [Math.random() * W, H - BOT + 40];
    return [-28, TOP + Math.random() * (H - TOP - BOT)];
  }

  function spawn(){
    const p = edge(), secs = t / 60, roll = Math.random();
    let f;
    if (secs > 20 && roll < 0.2){
      f = { kind:"starer", r:14, hp:2, sp:Math.min(1.3, 0.8 + secs * 0.003), pts:40,
            walk:80 + Math.random() * 90, pause:0, seed:Math.random() * 9,
            look:{ shirt:pick(SHIRTS), pants:pick(PANTS), skin:pick(SKINS), hair:pick(HAIRS), style:pick(STYLES), big:true } };
    } else if (secs > 12 && roll < 0.46){
      f = { kind:"dog", r:13, hp:1, sp:Math.min(2.9, 1.7 + secs * 0.004), pts:20, fur:pick(FURS) };
    } else {
      f = { kind:"pato", r:14, hp:(secs > 90 && Math.random() < 0.3) ? 2 : 1,
            sp:Math.min(2.5, 1.25 + secs * 0.005), pts:25 };
    }
    f.x = p[0]; f.y = p[1]; f.id = ++uid; f.flash = 0; f.maxhp = f.hp; f.dead = false;
    foes.push(f);
  }

  function spawnBoss(){
    const def = BOSSES[bossCount % BOSSES.length];
    const hp = 22 + bossCount * 8;
    const p = edge();
    boss = { kind:"boss", def:def, x:p[0], y:p[1], r:25, hp:hp, maxhp:hp, shown:hp,
             sp:0.85, pts:300, id:++uid, flash:0, dead:false, fire:110, touch:0 };
    foes.push(boss);
    fx.push({ kind:"intro", life:150, text:def.name });
    K.haptic("heavy");
  }

  function nearest(){
    let bestF = null, bd = Infinity;
    for (const f of foes){
      if (f.dead) continue;
      const d = (f.x - P.x) * (f.x - P.x) + (f.y - P.y) * (f.y - P.y);
      if (d < bd){ bd = d; bestF = f; }
    }
    return bestF;
  }

  function kill(f){
    if (f.dead) return;
    f.dead = true;
    score += f.pts;
    fx.push({ kind:"pop", x:f.x, y:f.y, life:18, r:f.r });
    if (f.kind === "boss" || Math.random() < 0.02 + 0.02 * stats.cox) pickups.push({ x:f.x, y:f.y, life:600 });
    if (score >= nextOffer && !offerIn && state === "run"){ offerIn = 30; nextOffer += OFFER_EVERY + bossCount * 150; }
    if (f.kind === "boss"){
      fx.push({ kind:"felled", life:150, text:f.def.done });
      boss = null; bossCount++; bossT = 55 * 60; offerIn = 110;
      eshots = [];
      K.haptic("heavy"); K.bark();
    }
    if (score >= nextMode){
      modeT = MODE_LEN;
      nextMode += MODE_EVERY;
      fx.push({ kind:"banner", life:100 });
      K.haptic("heavy");
    }
  }

  function hit(f, d){
    if (f.kind === "boss") d = Math.min(Math.max(d, 2), 2 + stats.dmg);   // no one-shots, but every hit lands
    f.hp -= d; f.flash = 6;
    if (f.hp <= 0) kill(f);
  }

  function aimAt(target){ return Math.atan2(target.y - P.y, target.x - P.x); }

  function fireBone(target){
    const a = aimAt(target), n = score > 5600 ? 3 : score > 2800 ? 2 : 1;
    const speed = 7.6 + stats.range * 0.5;
    for (let i = 0; i < n; i++){
      const off = (i - (n - 1) / 2) * 0.22;
      shots.push({ kind:"bone", x:P.x, y:P.y - 6, vx:Math.cos(a + off) * speed, vy:Math.sin(a + off) * speed,
        r:9, dmg:stats.dmg, pierce:1, life:95 + stats.range * 28, rot:0, hits:new Set() });
    }
  }

  const TALK = ["#@$%!", "?!", "ugh", "nah", "@#!", "tsc", "blah", "#$%", "argh", "k."];
  function fireTalk(target){
    const a = aimAt(target);
    shots.push({ kind:"talk", x:P.x, y:P.y - 26, vx:Math.cos(a) * 8.6, vy:Math.sin(a) * 8.6, r:14, dmg:99, pierce:2,
      life:85 + stats.range * 20, rot:0, hits:new Set(), text:TALK[Math.floor(Math.random() * TALK.length)] });
  }

  function slap(){
    const R = 68 + Math.min(score / 150, 40) + stats.range * 16;
    for (const f of foes){
      if (f.dead) continue;
      const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1;
      if (d < R + f.r){
        hit(f, stats.dmg);
        if (!f.dead && f.kind !== "boss"){ f.x += dx / d * 18; f.y += dy / d * 18; }
      }
    }
    fx.push({ kind:"ring", x:P.x, y:P.y - 6, r:R, life:14 });
  }

  function bossFire(b){
    const a = Math.atan2(P.y - b.y, P.x - b.x);
    if (b.def.key === "taize"){
      eshots.push({ kind:"aviso", x:b.x, y:b.y, vx:Math.cos(a) * 2.4, vy:Math.sin(a) * 2.4, r:9, life:260 });
    } else if (b.def.key === "gerson"){        // a ring of rubber stamps: INDEFERIDO
      for (let i = 0; i < 8; i++){ const r = a + i * Math.PI / 4; eshots.push({ kind:"carimbo", x:b.x, y:b.y, vx:Math.cos(r) * 2, vy:Math.sin(r) * 2, r:9, life:240 }); }
    } else {
      for (let i = -1; i <= 1; i++)
        eshots.push({ kind:"invite", x:b.x, y:b.y, vx:Math.cos(a + i * 0.32) * 2.4, vy:Math.sin(a + i * 0.32) * 2.4, r:9, life:260 });
    }
  }

  function hurt(){
    P.hp--; P.inv = 70;
    fx.push({ kind:"hurt", life:20 });
    K.haptic("light");
    if (P.hp <= 0){ over(); return true; }
    return false;
  }

  /* ---------- the loop ---------- */
  function update(){
    t++;
    const secs = t / 60;
    const pum = who === "keyla" && modeT > 0;

    // move
    let dx = 0, dy = 0;
    if (keys.left) dx--; if (keys.right) dx++; if (keys.up) dy--; if (keys.down) dy++;
    if (stick){ dx = stick.dx; dy = stick.dy; }
    const len = Math.hypot(dx, dy), sp = 3.1 * (pum ? 1.4 : 1) * (1 + 0.12 * stats.walk);
    if (len > 0.06){
      const k = Math.min(len, 1) / len;
      P.x += dx * k * sp; P.y += dy * k * sp; P.moving = true;
      if (Math.abs(dx) > 0.1) P.face = dx > 0 ? 1 : -1;
    } else P.moving = false;
    P.x = Math.max(20, Math.min(W - 20, P.x));
    P.y = Math.max(TOP + 24, Math.min(H - BOT - 20, P.y));

    // the sidekick follows a step behind and helps
    if (side){
      const tx = P.x - 30 * P.face, ty = P.y + 12;
      side.x += (tx - side.x) * 0.1; side.y += (ty - side.y) * 0.1;
      if (Math.abs(tx - side.x) > 1) side.face = tx > side.x ? 1 : -1;
      if (--side.cd <= 0){
        const n = nearest();
        if (who === "gabs" && n){
          const a = Math.atan2(n.y - side.y, n.x - side.x);
          shots.push({ kind:"bone", x:side.x, y:side.y - 6, vx:Math.cos(a) * 7.6, vy:Math.sin(a) * 7.6, r:9, dmg:stats.dmg, pierce:1, life:110, rot:0, hits:new Set() });
        } else if (who === "keyla"){
          const R = 56 + stats.side * 10;
          for (const f of foes){ if (!f.dead && Math.hypot(f.x - side.x, f.y - side.y) < R + f.r) hit(f, stats.dmg); }
          fx.push({ kind:"ring", x:side.x, y:side.y - 6, r:R, life:14 });
        }
        side.cd = Math.max(22, 62 - stats.side * 12);
      }
    }
    // coxinhas
    for (const c of pickups){
      c.life--;
      if (Math.hypot(c.x - P.x, c.y - P.y) < P.r + 12){
        c.life = 0;
        if (P.hp < P.max){ P.hp++; fx.push({ kind:"word", x:c.x, y:c.y - 14, text:"+1 \u2665", life:50 }); }
        else { score += 50; fx.push({ kind:"word", x:c.x, y:c.y - 14, text:"+50", life:50 }); }
        K.haptic("tick");
      }
    }
    pickups = pickups.filter(function(c){ return c.life > 0; });

    // attack
    atkT--;
    if (who === "keyla"){
      if (atkT <= 0){ const n = (boss && !boss.dead && (++volley % 2)) ? boss : nearest(); if (n) fireBone(n); atkT = Math.max(15, 40 - score / 280) * stats.rate; }
    } else if (modeT > 0){
      if (atkT <= 0){ const n = nearest(); if (n) fireTalk(n); atkT = Math.max(4, 7 * stats.rate); }
    } else if (atkT <= 0){
      slap(); atkT = Math.max(14, 25 - score / 400) * stats.rate;
    }

    // spawns (lighter while a boss is around)
    if (!boss && --bossT <= 0) spawnBoss();
    spawnT--;
    if (spawnT <= 0 && foes.length < 95){
      spawn();
      if (!boss && secs > 60 && Math.random() < 0.4) spawn();
      // a phone screen is smaller than the website's arena, so a little fewer at a time
      spawnT = Math.max(9, 46 - secs * 0.28) * (boss ? 1.9 : 1) / Math.max(0.6, Math.min(1.2, Math.sqrt(W * (H - TOP - BOT) / 504000)));
    }

    // her shots
    for (const s of shots){
      s.x += s.vx; s.y += s.vy; s.life--; s.rot += 0.35;
      for (const f of foes){
        if (f.dead || s.hits.has(f.id)) continue;
        if (Math.hypot(f.x - s.x, f.y - s.y) < f.r + s.r){
          s.hits.add(f.id); hit(f, s.dmg); s.pierce--;
          if (s.pierce < 0){ s.life = 0; break; }
        }
      }
    }
    shots = shots.filter(function(s){ return s.life > 0 && s.x > -40 && s.x < W + 40 && s.y > TOP - 60 && s.y < H + 40; });

    // their shots
    for (const s of eshots){
      s.x += s.vx; s.y += s.vy; s.life--;
      if (Math.hypot(P.x - s.x, P.y - 6 - s.y) < P.r + s.r){
        s.life = 0;
        if (!pum && P.inv <= 0 && hurt()) return;
      }
    }
    eshots = eshots.filter(function(s){ return s.life > 0 && s.x > -30 && s.x < W + 30 && s.y > -30 && s.y < H + 30; });

    // everyone walking at her
    for (const f of foes){
      if (f.dead) continue;
      const ax = P.x - f.x, ay = P.y - f.y, d = Math.hypot(ax, ay) || 1;
      let move = f.sp;
      if (f.kind === "starer"){
        if (f.pause > 0){ f.pause--; move = 0; if (f.pause === 0) f.walk = 70 + Math.random() * 90; }
        else if (--f.walk <= 0) f.pause = 50;
      }
      if (f.kind === "boss"){
        if (d < 120) move = f.sp * 0.35;                      // keeps a little distance to throw things
        if (--f.fire <= 0){ bossFire(f); f.fire = f.def.key === "taize" ? 115 : 150; }
        if (f.touch > 0) f.touch--;
        f.shown += (f.hp - f.shown) * 0.05;
      }
      f.x += ax / d * move; f.y += ay / d * move;
      if (f.flash > 0) f.flash--;

      if (d < f.r + P.r - 3){
        if (pum){
          if (f.kind === "boss"){ if (f.touch <= 0){ hit(f, 2 + stats.dmg); f.touch = 18; } }
          else hit(f, 99);
        } else if (P.inv <= 0){
          if (f.kind !== "boss"){ f.x -= ax / d * 26; f.y -= ay / d * 26; }
          if (hurt()) return;
        }
      }
    }
    foes = foes.filter(function(f){ return !f.dead; });

    if (P.inv > 0) P.inv--;
    if (modeT > 0) modeT--;
    if (offerIn > 0 && --offerIn === 0){
      offer = upgradePool();
      if (offer.length){ state = "upgrade"; offerAt = performance.now(); stick = null; for (const k in keys) keys[k] = false; showOffer(); }
      else offer = null;
    }
    fx.forEach(function(e){ e.life--; });
    fx = fx.filter(function(e){ return e.life > 0; });
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#F6E7EF"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#EAD5E1";
    for (let x = 30; x < W; x += 60) for (let y = 30; y < H; y += 60){ ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }

    if (state === "run" || state === "over" || state === "upgrade"){
      for (const c of pickups) drawCoxinha(c);
      for (const f of foes){
        const face = P.x >= f.x ? 1 : -1;
        const lx = (P.x - f.x) / 200, ly = (P.y - f.y) / 200;
        if (f.kind === "pato") drawPato(f.x, f.y, face, f.flash > 0);
        else if (f.kind === "dog") drawStray(f, face);
        else if (f.kind === "starer"){
          drawPerson(f.x, f.y - 2, 1, f.look, lx, ly, f.pause <= 0, f.seed, f.flash > 0);
          if (f.pause > 0) drawStareBubble(f.x, f.y - 36);
        } else if (f.kind === "boss"){
          drawPerson(f.x, f.y - 4, 1.65, f.def.look, lx, ly, true, 1, f.flash > 0);
        }
      }

      for (const e of fx){
        if (e.kind === "ring"){
          ctx.strokeStyle = "rgba(217,85,126," + (e.life / 14 * 0.55) + ")"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1.08 - e.life / 14 * 0.25), 0, 7); ctx.stroke();
        } else if (e.kind === "pop"){
          ctx.strokeStyle = "rgba(122,85,201," + (e.life / 18 * 0.6) + ")"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r + (18 - e.life) * 1.3, 0, 7); ctx.stroke();
        }
      }

      for (const s of eshots){ s.kind === "aviso" ? drawAviso(s) : s.kind === "carimbo" ? drawCarimbo(s) : drawInvite(s); }

      const pum = who === "keyla" && modeT > 0;
      if (modeT > 0 && !(modeT < 120 && Math.floor(t / 5) % 2 === 0)){
        const g = ctx.createRadialGradient(P.x, P.y - 8, 6, P.x, P.y - 8, 54);
        g.addColorStop(0, pum ? "rgba(122,85,201,.36)" : "rgba(217,85,126,.32)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y - 8, 54, 0, 7); ctx.fill();
      }
      const blink = P.inv > 0 && state === "run" && Math.floor(t / 4) % 2 === 0;
      if (side){
        if (who === "gabs") drawKeyla(side.x, side.y, 0.95, side.face, false, P.moving);
        else drawGabs(side.x, side.y - 4, 1.0, side.face, false, P.moving);
      }
      if (!blink){
        if (who === "keyla") drawKeyla(P.x, P.y, 1.05, P.face, pum, P.moving);
        else drawGabs(P.x, P.y - 4, 1.15, P.face, modeT > 0, P.moving);
      }
      for (const s of shots){ s.kind === "bone" ? drawBone(s) : drawTalk(s); }

      // hearts, score and the special meter, under the status bar
      const hy = TOP - 44;
      for (let i = 0; i < P.max; i++) heart(22 + i * 22, hy, i < P.hp);
      ctx.textAlign = "left"; ctx.fillStyle = "#33243C"; ctx.font = "700 18px Karla, sans-serif";
      ctx.fillText(score, 14, hy + 30);
      ctx.fillStyle = "#7C6B88"; ctx.font = "400 12px Karla, sans-serif";
      ctx.fillText(best ? "best " + Math.max(best, score) : "", 14 + ctx.measureText(String(score)).width * 1.6 + 10, hy + 30);
      const mx = W / 2 - 60, my = hy + 22;
      if (modeT > 0){
        ctx.textAlign = "center"; ctx.fillStyle = who === "keyla" ? "#7A55C9" : "#C44A71";
        ctx.font = "600 13px Karla, sans-serif";
        ctx.fillText(who === "keyla" ? "PUM-PUM-SEM-VERGONHA" : "SHITTALK MODE", W / 2 + 30, my - 4);
        ctx.fillStyle = "rgba(51,36,60,.12)"; ctx.fillRect(mx + 30, my + 2, 120, 5);
        ctx.fillStyle = who === "keyla" ? "#7A55C9" : "#C44A71";
        ctx.fillRect(mx + 30, my + 2, 120 * modeT / MODE_LEN, 5);
      } else {
        const pct = (score - (nextMode - MODE_EVERY)) / MODE_EVERY;
        ctx.fillStyle = "rgba(51,36,60,.10)"; ctx.fillRect(mx + 30, my + 2, 120, 5);
        ctx.fillStyle = who === "keyla" ? "#7A55C9" : "#C44A71";
        ctx.fillRect(mx + 30, my + 2, 120 * Math.max(0, Math.min(1, pct)), 5);
        ctx.fillStyle = "#7C6B88"; ctx.font = "400 11px Karla, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(who === "keyla" ? "pum-pum" : "shittalk", W / 2 + 30, my - 4);
      }

      // the boss bar, bottom of the screen, where it belongs
      if (boss && !boss.dead){
        const x0 = W * 0.1, w = W * 0.8, y0 = H - BOT + 22;
        ctx.textAlign = "left"; ctx.fillStyle = "#33243C";
        ctx.font = "500 16px Fraunces, Georgia, serif";
        ctx.fillText(boss.def.name, x0, y0 - 9);
        ctx.fillStyle = "rgba(51,36,60,.24)"; ctx.fillRect(x0, y0, w, 7);
        ctx.fillStyle = "#EFC7A2"; ctx.fillRect(x0, y0, w * Math.max(0, boss.shown) / boss.maxhp, 7);
        ctx.fillStyle = "#A92E3C"; ctx.fillRect(x0, y0, w * Math.max(0, boss.hp) / boss.maxhp, 7);
        ctx.strokeStyle = "rgba(51,36,60,.55)"; ctx.lineWidth = 1; ctx.strokeRect(x0 - 0.5, y0 - 0.5, w + 1, 8);
      }

      for (const e of fx){
        if (e.kind === "banner"){
          const a = Math.min(1, e.life / 30);
          ctx.textAlign = "center";
          ctx.fillStyle = (who === "keyla" ? "rgba(122,85,201," : "rgba(196,74,113,") + a + ")";
          ctx.font = "600 " + Math.min(34, W / 13) + "px Karla, sans-serif";
          ctx.fillText(who === "keyla" ? "PUM-PUM-SEM-VERGONHA" : "SHITTALK MODE", W / 2, H / 2 - 70);
        } else if (e.kind === "intro"){
          const a = Math.min(1, e.life / 30, (150 - e.life) / 20);
          ctx.textAlign = "center"; ctx.fillStyle = "rgba(51,36,60," + a * 0.9 + ")";
          ctx.font = "500 " + Math.min(30, W / 15) + "px Fraunces, Georgia, serif";
          ctx.fillText(e.text, W / 2, H / 2 - 40);
        } else if (e.kind === "felled"){
          const a = Math.min(1, e.life / 30, (150 - e.life) / 15);
          ctx.fillStyle = "rgba(24,16,28," + a * 0.62 + ")"; ctx.fillRect(0, H / 2 - 42, W, 70);
          ctx.textAlign = "center"; ctx.fillStyle = "rgba(233,196,122," + a + ")";
          ctx.font = "500 " + Math.min(32, W / 14) + "px Fraunces, Georgia, serif";
          ctx.fillText(e.text, W / 2, H / 2 + 4);
        } else if (e.kind === "word"){
          ctx.textAlign = "center"; ctx.fillStyle = "rgba(44,140,124," + Math.min(1, e.life / 20) + ")";
          ctx.font = "700 15px Karla, sans-serif"; ctx.fillText(e.text, e.x, e.y - (50 - e.life) * 0.4);
        } else if (e.kind === "hurt"){
          ctx.fillStyle = "rgba(217,66,94," + (e.life / 20 * 0.22) + ")";
          ctx.fillRect(0, 0, W, H);
        }
      }

      if (stick && state === "run"){
        ctx.strokeStyle = "rgba(122,85,201,.35)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 40, 0, 7); ctx.stroke();
        ctx.fillStyle = "rgba(122,85,201,.35)";
        ctx.beginPath(); ctx.arc(stick.ox + stick.dx * 40, stick.oy + stick.dy * 40, 14, 0, 7); ctx.fill();
      }
    }

    if (state === "upgrade"){ ctx.fillStyle = "rgba(246,231,239,.75)"; ctx.fillRect(0, 0, W, H); }

    if (state === "pick" || state === "over"){
      ctx.fillStyle = "rgba(246,231,239,.92)"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.fillStyle = "#33243C";
      ctx.font = "500 24px Karla, sans-serif";
      const ty = TOP - 10;
      ctx.fillText(state === "pick" ? "pick a fighter" : "overwhelmed \u00B7 " + lastScore, W / 2, ty);
      ctx.fillStyle = newBest && state === "over" ? "#C44A71" : "#7C6B88"; ctx.font = (newBest && state === "over" ? "600 " : "400 ") + "14px Karla, sans-serif";
      ctx.fillText(state === "pick" ? "tap one to start" : newBest ? "new best! tap one to go again" : "tap one to go again" + (best ? " \u00B7 best " + best : ""), W / 2, ty + 24);
      cards().forEach(function(c){
        ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.strokeStyle = "rgba(51,36,60,.12)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 18); ctx.fill(); ctx.stroke();
        const cx = c.x + c.w / 2, sy = c.y + c.h * 0.42, sc = Math.min(2.8, c.h / 95);
        if (c.who === "keyla") drawKeyla(cx - 4, sy, sc, 1, false, true);
        else drawGabs(cx, sy, sc * 0.95, 1, false, true);
        ctx.fillStyle = "#33243C"; ctx.font = "500 22px Fraunces, Georgia, serif";
        ctx.fillText(c.who === "keyla" ? "Keyla" : "Babiela", cx, c.y + c.h - 50);
        ctx.fillStyle = "#7C6B88"; ctx.font = "400 13px Karla, sans-serif";
        ctx.fillText(c.who === "keyla" ? "throws bones" : "slaps everything nearby", cx, c.y + c.h - 30);
        ctx.fillStyle = c.who === "keyla" ? "#7A55C9" : "#C44A71"; ctx.font = "500 12.5px Karla, sans-serif";
        ctx.fillText(c.who === "keyla" ? "every 1000: pum-pum-sem-vergonha" : "every 1000: shittalk mode", cx, c.y + c.h - 12);
      });
    }
  }
  // The two fighter cards: side by side on a wide screen, one above the other on a phone.
  function cards(){
    const top = TOP + 34, room = H - BOT - top - 10;
    if (W > H){
      const w = Math.min(300, (W - 60) / 2), h = Math.min(330, room);
      return [{ who:"keyla", x:W / 2 - w - 10, y:top, w:w, h:h }, { who:"gabs", x:W / 2 + 10, y:top, w:w, h:h }];
    }
    const w = Math.min(320, W - 40), h = Math.min(260, (room - 14) / 2);
    return [{ who:"keyla", x:(W - w) / 2, y:top, w:w, h:h }, { who:"gabs", x:(W - w) / 2, y:top + h + 14, w:w, h:h }];
  }
  // Fixed 60 steps a second, so it plays the same on 60, 90 and 120 Hz screens.
  let raf = 0, acc = 0, lastT = 0;
  function frame(now){
    const dt = Math.min(0.1, (now - (lastT || now)) / 1000); lastT = now;
    if (state === "run" && !paused){
      acc += dt; let n = 0;
      while (acc >= 1 / 60 && n < 5 && state === "run"){ update(); acc -= 1 / 60; n++; }
    } else acc = 0;
    draw();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- input ---------- */
  function pos(e){
    const r = cv.getBoundingClientRect();
    return { x:(e.clientX - r.left) * W / r.width, y:(e.clientY - r.top) * H / r.height };
  }
  cv.addEventListener("pointerdown", function(e){
    e.preventDefault();
    const p = pos(e);
    if (state === "upgrade") return;                    // the cards are buttons
    if (state !== "run"){
      if (state === "over" && performance.now() - overAt < 700) return;
      const c = cards().filter(function(c){ return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h; })[0];
      if (c) start(c.who);
      return;
    }
    stick = { ox:p.x, oy:p.y, dx:0, dy:0 };
    try { cv.setPointerCapture(e.pointerId); } catch(err){}
  });
  cv.addEventListener("pointermove", function(e){
    if (!stick) return;
    const p = pos(e);
    let dx = (p.x - stick.ox) / 40, dy = (p.y - stick.oy) / 40;
    const l = Math.hypot(dx, dy);
    if (l > 1){ dx /= l; dy /= l; }
    stick.dx = dx; stick.dy = dy;
  });
  const drop = function(){ stick = null; };
  cv.addEventListener("pointerup", drop);
  cv.addEventListener("pointercancel", drop);

  const MAP = { ArrowLeft:"left", a:"left", A:"left", ArrowRight:"right", d:"right", D:"right",
                ArrowUp:"up", w:"up", W:"up", ArrowDown:"down", s:"down", S:"down" };
  window.addEventListener("keydown", function(e){
    if (wrap.hidden) return;
    if (state === "upgrade"){ const i = parseInt(e.key, 10) - 1; if (i >= 0) choose(i); return; }
    if (state !== "run"){
      if (e.key === "1") start("keyla");
      if (e.key === "2") start("gabs");
      return;
    }
    if (MAP[e.key]){ e.preventDefault(); keys[MAP[e.key]] = true; }
  });
  window.addEventListener("keyup", function(e){ if (MAP[e.key]) keys[MAP[e.key]] = false; });

  /* ---------- open, close, pause ---------- */
  let overAt = 0;
  const _over = over;
  over = function(){ overAt = performance.now(); _over(); };
  const endEl = el("surv-end");
  function pause(){
    if (state !== "run" || paused) return;
    paused = true; stick = null; for (const k in keys) keys[k] = false;
    el("surv-end-title").textContent = "Pausa";
    el("surv-end-line").textContent = "tá tudo calmo galela";
    el("surv-again").textContent = "Continue";
    endEl.hidden = false;
  }
  function open(){
    K.setGameOpen(true);
    K.openLayer(wrap, function(){ K.setGameOpen(false); cancelAnimationFrame(raf); raf = 0; paused = false; endEl.hidden = true; lvlEl.hidden = true; }, false);
    fit(); state = "pick"; paused = false; newBest = false; endEl.hidden = true; lvlEl.hidden = true;
    lastT = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  K.onOpenSurvivors(open);
  el("surv-close").addEventListener("click", function(e){ e.stopPropagation(); K.closeLayer(wrap); });
  el("surv-pause").addEventListener("click", function(e){ e.stopPropagation(); pause(); });
  el("surv-again").addEventListener("click", function(){ paused = false; endEl.hidden = true; lastT = 0; });
  el("surv-quit").addEventListener("click", function(){ K.closeLayer(wrap); });
  document.addEventListener("visibilitychange", function(){ if (document.hidden && !wrap.hidden) pause(); });
})();
