/* ABYX demo: three presses of A/B/X/Y make one letter */
(function () {
  var ORDER = 'YXAB', buf = [], out = '';
  var elP = document.getElementById('abyx-pressed'), elO = document.getElementById('abyx-out'), root = document.getElementById('abyx-demo');
  if (!root) return;
  function render() {
    elP.textContent = [0, 1, 2].map(function (i) { return buf[i] || '_'; }).join(' ');
    elO.textContent = out;
  }
  function press(k) {
    var b = root.querySelector('[data-k="' + k + '"]');
    if (b) { b.classList.add('is-down'); setTimeout(function () { b.classList.remove('is-down'); }, 140); }
    buf.push(k);
    if (buf.length === 3) {
      var n = ORDER.indexOf(buf[0]) * 16 + ORDER.indexOf(buf[1]) * 4 + ORDER.indexOf(buf[2]);
      if (n < 26) out += String.fromCharCode(65 + n);
      buf = [];
    }
    render();
  }
  root.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) press(b.getAttribute('data-k')); });
  document.getElementById('abyx-erase').addEventListener('click', function () { if (buf.length) buf = []; else out = out.slice(0, -1); render(); });
  document.getElementById('abyx-clear').addEventListener('click', function () { buf = []; out = ''; render(); });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.closest && e.target.closest('input,textarea')) return;
    var k = e.key.toUpperCase();
    if (k.length === 1 && 'ABXY'.indexOf(k) >= 0) { e.preventDefault(); press(k); }
  });
  // game controller: standard mapping has A, B, X, Y on buttons 0 to 3
  var PAD = ['A', 'B', 'X', 'Y'], was = [false, false, false, false], polling = false;
  function poll() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [], p = null;
    for (var i = 0; i < pads.length; i++) if (pads[i]) { p = pads[i]; break; }
    if (!p) { polling = false; return; }
    for (var j = 0; j < 4; j++) {
      var down = !!(p.buttons[j] && p.buttons[j].pressed);
      if (down && !was[j]) press(PAD[j]);
      was[j] = down;
    }
    requestAnimationFrame(poll);
  }
  window.addEventListener('gamepadconnected', function () { if (!polling) { polling = true; poll(); } });
  render();
})();
