/* Motion reels: cycle a card's frames on hover/focus (desktop) or while it is in view (touch).
   A frame can set data-dur (ms); frames holding an animated logo restart it each time they show. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia && !matchMedia('(hover: hover) and (pointer: fine)').matches;
  var STEP = 1300;
  document.querySelectorAll('[data-reel]').forEach(function (reel) {
    var frames = Array.prototype.slice.call(reel.querySelectorAll('.reel__f'));
    var video = reel.querySelector('video');
    var card = reel.closest('a') || reel;
    var i = 0, timer = null, playing = false;
    function dur(f) { return parseInt(f.getAttribute('data-dur'), 10) || STEP; }
    var total = frames.slice(1).reduce(function (t, f) { return t + dur(f); }, 0);
    reel.style.setProperty('--reel-total', (video ? 4.3 : total / 1000) + 's');
    function restartAnim(f) {
      var img = f.querySelector('.reel__anim');
      if (img) { var c = img.cloneNode(true); img.parentNode.replaceChild(c, img); }
    }
    function show(n) {
      frames.forEach(function (f, k) { f.classList.toggle('is-on', k === n); });
      i = n; restartAnim(frames[n]);
    }
    function next() {
      if (!playing) return;
      var n = i + 1 >= frames.length ? 1 : i + 1;
      show(n); timer = setTimeout(next, dur(frames[n]));
    }
    function start() {
      if (playing) return; playing = true;
      reel.classList.add('is-playing', 'is-started');
      if (video) {
        show(frames.indexOf(video));
        video.preload = 'auto'; video.currentTime = 0; video.loop = true;
        var p = video.play(); if (p && p.catch) p.catch(function () {});
        return;
      }
      var first = frames.length > 1 ? 1 : 0;
      show(first); timer = setTimeout(next, dur(frames[first]));
    }
    function stop() {
      playing = false; clearTimeout(timer); timer = null;
      reel.classList.remove('is-playing', 'is-started');
      if (video) video.pause();
      show(0);
    }
    if (reduce) return;
    if (touch && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.intersectionRatio > 0.6 ? start() : stop(); });
      }, { threshold: [0, 0.6, 1] }).observe(reel);
    } else {
      card.addEventListener('mouseenter', start); card.addEventListener('mouseleave', stop);
      card.addEventListener('focus', start); card.addEventListener('blur', stop);
    }
  });
})();
