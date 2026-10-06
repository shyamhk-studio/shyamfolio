/* Squircle Runner — a tiny arcade easter egg.
   Opened from the "SH" monogram in the footer or the Konami code
   (↑ ↑ ↓ ↓ ← → ← → B A). Plain canvas + requestAnimationFrame. */
(function () {
  var dialog = document.getElementById('arcade');
  var canvas = document.getElementById('arcade-canvas');
  var closer = document.getElementById('arcade-close');
  if (!dialog || !canvas || !canvas.getContext) return;
  // inline mode: the game lives on the page (Game Lab) instead of in a pop-up
  var inline = dialog.hasAttribute('data-inline');
  var visible = !inline;
  function isOpen() { return inline ? visible : dialog.open; }
  var ctx = canvas.getContext('2d');

  /* ---------- palette (matches styles.css) ---------- */
  var C = {
    salmon: '#ff7d75', butter: '#ffe08f', cream: '#fcf4d6', ink: '#18191f',
    lavender: '#928cf8', lilac: '#c9c6fd', white: '#ffffff', dot: 'rgba(33,24,20,0.07)',
    skyTop: '#4ec0ca', skyLow: '#9ee3e8', cloud: '#f4fbfb', cloudShade: '#d6f0f2',
    bush: '#6fd85a', bushDark: '#3f9b3a', grass: '#8ad84c', grassDark: '#73bf2e', grassEdge: '#4d8f2a',
    sand: '#ded895', sandShade: '#c9c178', sandDot: 'rgba(84,56,71,0.18)'
  };
  var FONT = '"Montserrat", system-ui, sans-serif';

  /* ---------- world (logical units; canvas scales to fit) ---------- */
  var W = 720, H = 270, GROUND = 222;
  var GRAVITY = 2700, JUMP_V = -860, CUT_V = -320;
  var PLAYER = { x: 84, size: 46 };

  /* unit squircle outline, reused for every squircle we draw */
  var SQ = (function () {
    var pts = [], n = 4, N = 40;
    for (var i = 0; i < N; i++) {
      var t = (i / N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      pts.push([Math.sign(c) * Math.pow(Math.abs(c), 2 / n), Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]);
    }
    return pts;
  })();
  function squirclePath(cx, cy, rx, ry) {
    ctx.beginPath();
    for (var i = 0; i < SQ.length; i++) {
      var x = cx + SQ[i][0] * rx, y = cy + SQ[i][1] * ry;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }


  /* scenery helpers */
  function bump(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function puffCloud(x, y, s) {
    ctx.fillStyle = C.cloud;
    bump(x, y + 6 * s, 14 * s); bump(x + 18 * s, y, 18 * s); bump(x + 38 * s, y + 6 * s, 13 * s);
    ctx.fillRect(x, y + 6 * s, 38 * s, 14 * s);
    ctx.fillStyle = C.cloudShade; ctx.fillRect(x - 4 * s, y + 16 * s, 46 * s, 4 * s);
  }

  /* the cat doodle: squircle head, pointy ears, wagging tail, whiskers */
  function drawCat(rx, ry, mood, phase) {
    var body = mood === 'dead' ? C.salmon : C.lavender;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // tail (behind everything)
    var wag = Math.sin(phase) * ry * 0.35;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.7, ry * 0.45);
    ctx.quadraticCurveTo(-rx * 1.55, ry * 0.5, -rx * 1.45, -ry * 0.35 + wag);
    ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = body; ctx.stroke();
    // ears
    [-1, 1].forEach(function (side) {
      ctx.beginPath();
      ctx.moveTo(side * rx * 0.92, -ry * 0.25);
      ctx.lineTo(side * rx * 0.72, -ry * 1.32);
      ctx.lineTo(side * rx * 0.12, -ry * 0.78);
      ctx.closePath();
      ctx.fillStyle = body; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(side * rx * 0.74, -ry * 0.55);
      ctx.lineTo(side * rx * 0.68, -ry * 1.05);
      ctx.lineTo(side * rx * 0.36, -ry * 0.78);
      ctx.closePath();
      ctx.fillStyle = C.lilac; ctx.fill();
    });
    // head with the site's hard shadow
    squirclePath(4, 4, rx, ry); ctx.fillStyle = C.ink; ctx.fill();
    squirclePath(0, 0, rx, ry); ctx.fillStyle = body; ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke();
    // eyes
    ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 2.6;
    [-1, 1].forEach(function (side) {
      var ex = side * rx * 0.36, ey = -ry * 0.12, e = rx * 0.14;
      if (mood === 'dead') {
        ctx.beginPath(); ctx.moveTo(ex - e, ey - e); ctx.lineTo(ex + e, ey + e);
        ctx.moveTo(ex + e, ey - e); ctx.lineTo(ex - e, ey + e); ctx.stroke();
      } else if (mood === 'jump') {
        ctx.beginPath(); ctx.moveTo(ex - e, ey + e * 0.5); ctx.lineTo(ex, ey - e * 0.6); ctx.lineTo(ex + e, ey + e * 0.5); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(ex, ey, rx * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex + rx * 0.035, ey - rx * 0.04, rx * 0.035, 0, Math.PI * 2);
        ctx.fillStyle = C.white; ctx.fill(); ctx.fillStyle = C.ink;
      }
    });
    // nose + "w" mouth
    var ny = ry * 0.14;
    ctx.beginPath(); ctx.moveTo(-rx * 0.08, ny); ctx.lineTo(rx * 0.08, ny); ctx.lineTo(0, ny + ry * 0.09); ctx.closePath();
    ctx.fillStyle = C.salmon; ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.lineWidth = 2.2;
    if (mood === 'dead') { ctx.moveTo(-rx * 0.14, ny + ry * 0.3); ctx.lineTo(rx * 0.14, ny + ry * 0.3); }
    else {
      ctx.moveTo(-rx * 0.2, ny + ry * 0.17);
      ctx.quadraticCurveTo(-rx * 0.1, ny + ry * 0.34, 0, ny + ry * 0.12);
      ctx.quadraticCurveTo(rx * 0.1, ny + ry * 0.34, rx * 0.2, ny + ry * 0.17);
    }
    ctx.stroke();
    // whiskers
    ctx.lineWidth = 1.8;
    [-1, 1].forEach(function (side) {
      ctx.beginPath();
      ctx.moveTo(side * rx * 0.5, ny + ry * 0.05); ctx.lineTo(side * rx * 1.18, ny - ry * 0.06);
      ctx.moveTo(side * rx * 0.5, ny + ry * 0.18); ctx.lineTo(side * rx * 1.18, ny + ry * 0.24);
      ctx.stroke();
    });
  }

  /* ---------- best score (per browser; optional) ---------- */
  var best = 0;
  try { best = parseInt(localStorage.getItem('squircle-runner-best'), 10) || 0; } catch (e) {}
  function saveBest() { try { localStorage.setItem('squircle-runner-best', String(best)); } catch (e) {} }

  /* ---------- state ---------- */
  var S;
  function reset() {
    S = {
      mode: 'ready',          // ready | run | over
      t: 0, speed: 380, dist: 0, coins: 0,
      y: GROUND - PLAYER.size, vy: 0, grounded: true, holding: false,
      squash: 0, spin: 0,
      obstacles: [], coinsList: [], puffs: [],
      nextGap: 420, scroll: 0, flash: 0, shake: 0
    };
  }
  reset();

  function score() { return Math.floor(S.dist / 12) + S.coins * 25; }

  /* ---------- spawning ---------- */
  function spawn() {
    var kind = Math.random();
    var o;
    if (kind < 0.45) {                 // a little yellow card
      var h = 34 + Math.random() * 30;
      o = { type: 'card', w: 34 + Math.random() * 22, h: h };
    } else if (kind < 0.8) {           // a chunky white button
      o = { type: 'btn', w: 58 + Math.random() * 26, h: 30 };
    } else {                           // a stack: button on a card
      o = { type: 'stack', w: 46, h: 62 };
    }
    o.x = W + 20;
    S.obstacles.push(o);
    if (Math.random() < 0.55) {
      S.coinsList.push({ x: W + 20 + o.w / 2 + 140 + Math.random() * 60, y: GROUND - 110 - Math.random() * 40, got: false, bob: Math.random() * 6 });
    }
    // gap grows with speed so it always stays jumpable
    var minGap = S.speed * 0.78, maxGap = S.speed * 1.55;
    S.nextGap = minGap + Math.random() * (maxGap - minGap);
  }

  /* ---------- input ---------- */
  function press() {
    if (S.mode === 'ready') { S.mode = 'run'; }
    if (S.mode === 'over') { if (S.t > 0.45) { reset(); S.mode = 'run'; } return; }
    S.holding = true;
    if (S.grounded) {
      S.vy = JUMP_V; S.grounded = false; S.squash = -0.25;
      puff(PLAYER.x + PLAYER.size / 2, GROUND, 5);
    }
  }
  function release() {
    S.holding = false;
    if (S.vy < CUT_V) S.vy = CUT_V;  // short tap = short hop
  }
  function puff(x, y, n) {
    for (var i = 0; i < n; i++) S.puffs.push({ x: x + (Math.random() - 0.5) * 20, y: y - 2, vx: -60 - Math.random() * 80, vy: -40 - Math.random() * 60, life: 0.4 });
  }

  var JUMP_KEYS = { ' ': 1, Spacebar: 1, ArrowUp: 1, w: 1, W: 1 };
  dialog.addEventListener('keydown', function (e) {
    if (JUMP_KEYS[e.key]) { e.preventDefault(); if (!e.repeat) press(); }
  });
  dialog.addEventListener('keyup', function (e) { if (JUMP_KEYS[e.key]) release(); });
  canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); press(); });
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  /* ---------- update ---------- */
  function hit(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function update(dt) {
    S.t += dt;
    S.flash = Math.max(0, S.flash - dt * 3);
    S.shake = Math.max(0, S.shake - dt * 30);
    S.squash += (0 - S.squash) * Math.min(1, dt * 12);
    for (var p = S.puffs.length - 1; p >= 0; p--) {
      var pf = S.puffs[p]; pf.life -= dt; pf.x += pf.vx * dt; pf.y += pf.vy * dt;
      if (pf.life <= 0) S.puffs.splice(p, 1);
    }
    if (S.mode === 'ready') { S.scroll += 60 * dt; S.spin = Math.sin(S.t * 3) * 0.06; return; }
    if (S.mode === 'over') return;

    S.speed = Math.min(860, S.speed + 9 * dt);
    var dx = S.speed * dt;
    S.dist += dx; S.scroll += dx;

    // player physics
    S.vy += GRAVITY * dt;
    S.y += S.vy * dt;
    if (S.y >= GROUND - PLAYER.size) {
      if (!S.grounded) { S.squash = 0.3; puff(PLAYER.x + PLAYER.size / 2, GROUND, 4); }
      S.y = GROUND - PLAYER.size; S.vy = 0; S.grounded = true;
    }
    S.spin = S.grounded ? 0 : S.spin + dt * 6;

    // obstacles
    S.nextGap -= dx;
    if (S.nextGap <= 0) spawn();
    var px = PLAYER.x + 7, py = S.y + 7, ps = PLAYER.size - 14; // forgiving hitbox
    for (var i = S.obstacles.length - 1; i >= 0; i--) {
      var o = S.obstacles[i];
      o.x -= dx;
      if (o.x + o.w < -20) { S.obstacles.splice(i, 1); continue; }
      if (hit(px, py, ps, ps, o.x + 3, GROUND - o.h + 3, o.w - 6, o.h - 3)) gameOver();
    }
    for (var k = S.coinsList.length - 1; k >= 0; k--) {
      var c = S.coinsList[k];
      c.x -= dx;
      if (c.x < -30) { S.coinsList.splice(k, 1); continue; }
      if (!c.got && hit(PLAYER.x, S.y, PLAYER.size, PLAYER.size, c.x - 12, c.y - 12, 24, 24)) {
        c.got = true; S.coins++; S.flash = 0.6;
      }
    }
  }
  function gameOver() {
    S.mode = 'over'; S.t = 0; S.shake = 8;
    var sc = score();
    if (sc > best) { best = sc; saveBest(); S.newBest = true; }
  }

  /* ---------- draw ---------- */
  function draw() {
    var sx = canvas.width / W;
    ctx.setTransform(sx, 0, 0, sx, 0, 0);
    if (S.shake) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);

    // sky: Flappy-style blue with soft layered parallax scenery
    var sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, C.skyTop); sky.addColorStop(1, C.skyLow);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, GROUND + 12);

    // a few high drifting clouds
    var hi = S.scroll * 0.06 + S.t * 6;
    [[80, 46, 1], [330, 30, 0.8], [560, 58, 1.1]].forEach(function (cl) {
      var x = ((cl[0] - hi) % (W + 160) + W + 160) % (W + 160) - 80;
      puffCloud(x, cl[1], cl[2]);
    });

    // cloud bank along the horizon
    var coff = (S.scroll * 0.12) % 96;
    ctx.fillStyle = C.cloudShade;
    for (var cx0 = -coff - 96; cx0 < W + 96; cx0 += 96) {
      bump(cx0 + 20, GROUND - 58, 30); bump(cx0 + 58, GROUND - 66, 36); bump(cx0 + 90, GROUND - 54, 26);
    }
    ctx.fillRect(-10, GROUND - 56, W + 20, 60);
    ctx.fillStyle = C.cloud;
    for (var cx1 = -coff - 96; cx1 < W + 96; cx1 += 96) {
      bump(cx1 + 20, GROUND - 52, 28); bump(cx1 + 58, GROUND - 60, 34); bump(cx1 + 90, GROUND - 48, 24);
    }
    ctx.fillRect(-10, GROUND - 50, W + 20, 54);

    // green bushes in front of the clouds
    var boff = (S.scroll * 0.35) % 120;
    ctx.fillStyle = C.bushDark;
    for (var bx0 = -boff - 120; bx0 < W + 120; bx0 += 120) {
      bump(bx0 + 22, GROUND - 16, 24); bump(bx0 + 60, GROUND - 22, 30); bump(bx0 + 98, GROUND - 14, 22);
    }
    ctx.fillStyle = C.bush;
    for (var bx1 = -boff - 120; bx1 < W + 120; bx1 += 120) {
      bump(bx1 + 22, GROUND - 14, 21); bump(bx1 + 60, GROUND - 20, 27); bump(bx1 + 98, GROUND - 12, 19);
    }
    ctx.fillRect(-10, GROUND - 14, W + 20, 16);

    // ground: striped grass strip on top of sandy dirt
    var GR = 12;
    ctx.fillStyle = C.sand; ctx.fillRect(-10, GROUND, W + 20, H - GROUND + 10);
    ctx.save();
    ctx.beginPath(); ctx.rect(-10, GROUND, W + 20, GR); ctx.clip();
    ctx.fillStyle = C.grass; ctx.fillRect(-10, GROUND, W + 20, GR);
    ctx.fillStyle = C.grassDark;
    var goff = S.scroll % 24;
    for (var d = -goff - 24; d < W + 24; d += 24) {
      ctx.beginPath(); ctx.moveTo(d, GROUND + GR); ctx.lineTo(d + 12, GROUND + GR); ctx.lineTo(d + 22, GROUND); ctx.lineTo(d + 10, GROUND); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = C.ink;
    ctx.fillRect(-10, GROUND - 2, W + 20, 3);
    ctx.fillStyle = C.grassEdge; ctx.fillRect(-10, GROUND + GR, W + 20, 3);
    ctx.fillStyle = C.sandShade; ctx.fillRect(-10, GROUND + GR + 3, W + 20, 4);
    ctx.fillStyle = C.sandDot;
    var soff = S.scroll % 40;
    for (var sd = -soff; sd < W + 40; sd += 40) {
      ctx.fillRect(sd, GROUND + 26, 14, 3); ctx.fillRect(sd + 20, GROUND + 38, 10, 3);
    }

    // coins: small black squircles with a lilac shine
    S.coinsList.forEach(function (c) {
      if (c.got) return;
      var y = c.y + Math.sin((S.dist / 40) + c.bob) * 4;
      squirclePath(c.x, y, 11, 11); ctx.fillStyle = C.ink; ctx.fill();
      squirclePath(c.x - 3, y - 3, 4, 4); ctx.fillStyle = C.lilac; ctx.fill();
    });

    // obstacles in the site's card/button language
    S.obstacles.forEach(function (o) {
      var top = GROUND - o.h;
      if (o.type === 'card' || o.type === 'stack') {
        var ch = o.type === 'stack' ? 34 : o.h, cy = GROUND - ch;
        roundRect(o.x + 5, cy + 5, o.w, ch, 6); ctx.fillStyle = 'rgba(52,52,51,0.35)'; ctx.fill();
        roundRect(o.x, cy, o.w, ch, 6); ctx.fillStyle = C.cream; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
      }
      if (o.type === 'btn' || o.type === 'stack') {
        var bw = o.type === 'stack' ? o.w + 10 : o.w, bx = o.type === 'stack' ? o.x - 5 : o.x;
        var by = o.type === 'stack' ? top : top;
        roundRect(bx, by + 4, bw, 26, 7); ctx.fillStyle = C.ink; ctx.fill();
        roundRect(bx, by, bw, 26, 7); ctx.fillStyle = C.white; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.fillStyle = C.ink; ctx.fillRect(bx + bw / 2 - 12, by + 11, 24, 4);
      }
    });

    // dust
    S.puffs.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 0.4);
      squirclePath(p.x, p.y, 4, 4); ctx.fillStyle = C.white; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink; ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // player: a doodled squircle cat, with squash & stretch
    var s = PLAYER.size, cx = PLAYER.x + s / 2;
    var sq = S.squash, rx = (s / 2) * (1 + sq * 0.6), ry = (s / 2) * (1 - sq * 0.6);
    ctx.save();
    ctx.translate(cx, S.y + s - ry);          // keep feet on the ground while squashing
    if (!S.grounded) ctx.rotate(Math.sin(S.spin) * 0.18);
    drawCat(rx, ry, S.mode === 'over' ? 'dead' : (S.grounded ? 'run' : 'jump'), S.mode === 'run' ? S.dist / 18 : S.t * 4);
    ctx.restore();

    // HUD
    ctx.textBaseline = 'top'; ctx.textAlign = 'right';
    var sc = String(score()).padStart(5, '0');
    hudText('SCORE ' + sc, W - 18, 14, 18, S.flash > 0 ? C.lilac : C.white);
    hudText('BEST ' + String(best).padStart(5, '0'), W - 18, 40, 13, C.white);

    // overlays
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (S.mode === 'ready') {
      outlined('SQUIRCLE RUNNER', W / 2, 78, 34);
      if (Math.floor(S.t * 2) % 2 === 0) hudText('PRESS SPACE OR TAP TO START', W / 2, 124, 16, C.white);
    } else if (S.mode === 'over') {
      outlined('GAME OVER', W / 2, 78, 40);
      hudText(S.newBest ? 'NEW BEST! ' + score() : 'SCORE ' + score() + '  ·  BEST ' + best, W / 2, 118, 15, S.newBest ? C.butter : C.white);
      if (S.t > 0.45 && Math.floor(S.t * 2) % 2 === 0) hudText('PRESS SPACE OR TAP TO RETRY', W / 2, 146, 15, C.white);
    }
  }
  function hudText(text, x, y, size, fill) {
    ctx.font = '900 ' + size + 'px ' + FONT;
    ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.28; ctx.strokeStyle = C.ink;
    ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }
  function outlined(text, x, y, size) {
    ctx.font = '900 ' + size + 'px ' + FONT;
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.2; ctx.strokeStyle = C.ink;
    ctx.fillStyle = C.ink; ctx.fillText(text, x + 2.5, y + 3);
    ctx.strokeText(text, x, y);
    ctx.fillStyle = C.white; ctx.fillText(text, x, y);
  }

  /* ---------- loop & sizing ---------- */
  var raf = 0, last = 0;
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    update(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function fit() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth || W;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * (H / W) * dpr);
  }
  window.addEventListener('resize', function () { if (isOpen()) fit(); });

  function start() {
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function open() {
    if (inline) { canvas.focus({ preventScroll: true }); return; }
    if (dialog.open) return;
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    fit(); reset(); S.newBest = false;
    start();
    canvas.focus();
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (isOpen() && !raf) start();
  });
  if (inline) {
    // run only while the game is on screen
    fit();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !raf && !document.hidden) { fit(); start(); }
        if (!visible) stop();
      }).observe(canvas);
    } else { visible = true; start(); }
  } else {
    dialog.addEventListener('close', function () { stop(); document.dispatchEvent(new CustomEvent('arcade:closed')); });
    if (closer) closer.addEventListener('click', function () { dialog.close ? dialog.close() : dialog.removeAttribute('open'); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  /* ---------- Konami code ---------- */
  var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var pos = 0;
  document.addEventListener('keydown', function (e) {
    if (inline || dialog.open) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) { pos = 0; open(); }
  });

  // tiny hook for automated checks
  window.__squircleRunner = { open: open, state: function () { return S; } };
})();
