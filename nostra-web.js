/* Nostra website mockup: auto-plays through the sections, like the Figma scroll prototype. */
(function () {
  var root = document.querySelector('.nw'); if (!root) return;
  var track = root.querySelector('.nw-track'), secs = root.querySelectorAll('.nw-sec'), btns = root.querySelectorAll('.nw-steps button');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = -1, timer = 0, visible = false, HOLD = 3800;
  function go(n, rewind) {
    if (i >= 0) secs[i].classList.remove('is-on');
    i = n;
    track.classList.toggle('is-rewind', !!rewind);
    track.style.transform = 'translateY(' + (-100 * i) + '%)';
    btns.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    var s = secs[i];
    setTimeout(function () { if (i === n) s.classList.add('is-on'); }, reduce ? 0 : (rewind ? 900 : 450));
  }
  function schedule() {
    clearTimeout(timer);
    if (reduce || !visible) return;
    timer = setTimeout(function () { var n = (i + 1) % secs.length; go(n, n === 0); schedule(); }, HOLD);
  }
  btns.forEach(function (b, k) { b.addEventListener('click', function () { go(k, false); schedule(); }); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && i < 0) go(0); schedule(); }, { threshold: 0.35 }).observe(root);
  } else { visible = true; go(0); schedule(); }
  if (reduce) { go(0); }
})();
