/* Full-screen image view for case study pages.
   Click or press Enter on any image in the case study to open it. */
(function () {
  var sheet = document.querySelector('.sheet');
  if (!sheet) return;
  var imgs = [].slice.call(sheet.querySelectorAll('img')).filter(function (im) {
    return !im.closest('.competitors') && !im.closest('a') && !im.closest('button') && !im.closest('[data-no-zoom]');
  });
  if (!imgs.length) return;

  var lb = document.createElement('div');
  lb.className = 'lb'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image viewer');
  lb.innerHTML =
    '<button type="button" class="lb__btn lb__close">Close</button>' +
    '<button type="button" class="lb__btn lb__nav lb__prev" aria-label="Previous image">&#8592;</button>' +
    '<img class="lb__img" alt="">' +
    '<button type="button" class="lb__btn lb__nav lb__next" aria-label="Next image">&#8594;</button>' +
    '<p class="lb__cap" aria-live="polite"></p>';
  document.body.appendChild(lb);
  var big = lb.querySelector('.lb__img'), cap = lb.querySelector('.lb__cap');
  var idx = 0, last = null;

  function caption(im) {
    var fig = im.closest('figure'), fc = fig && fig.querySelector('figcaption');
    return (fc && fc.textContent.trim()) || im.alt || '';
  }
  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    var im = imgs[idx];
    big.src = im.currentSrc || im.src; big.alt = im.alt;
    var c = caption(im);
    cap.textContent = (c ? c + ' · ' : '') + (idx + 1) + ' / ' + imgs.length;
  }
  function open(i) {
    last = document.activeElement; show(i); lb.hidden = false;
    document.documentElement.classList.add('lb-open');
    lb.querySelector('.lb__close').focus();
  }
  function close() {
    lb.hidden = true; document.documentElement.classList.remove('lb-open');
    if (last && last.focus) last.focus();
  }

  imgs.forEach(function (im, i) {
    im.classList.add('is-zoomable'); im.tabIndex = 0;
    im.setAttribute('role', 'button');
    im.setAttribute('aria-label', (im.alt ? im.alt + '. ' : '') + 'View full screen');
    im.addEventListener('click', function () { open(i); });
    im.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });
  lb.addEventListener('click', function (e) {
    if (e.target.closest('.lb__prev')) show(idx - 1);
    else if (e.target.closest('.lb__next')) show(idx + 1);
    else close();
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'Tab') {
      var f = [].slice.call(lb.querySelectorAll('button'));
      var a = document.activeElement, first = f[0], end = f[f.length - 1];
      if (e.shiftKey && a === first) { e.preventDefault(); end.focus(); }
      else if (!e.shiftKey && a === end) { e.preventDefault(); first.focus(); }
    }
  });
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { show(idx + (dx < 0 ? 1 : -1)); e.preventDefault(); }
  });
})();
