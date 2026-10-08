// Scroll rail in the right margin: places a label for each section along a
// vertical line (scaled to where the section sits on the page) and fills the
// line as you scroll. CSS only shows it on screens 1180px and wider.
(function () {
  var rail = document.querySelector('.rail');
  if (!rail) return;

  var links = Array.prototype.slice.call(rail.querySelectorAll('a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var fill = rail.querySelector('.rail-fill');
  var dot = rail.querySelector('.rail-dot');
  var height = 0, pageHeight = 1, tops = [];

  function layout() {
    height = Math.max(240, Math.min(window.innerHeight - 176, 600));
    rail.style.setProperty('--rail-h', height + 'px');
    pageHeight = document.documentElement.scrollHeight;
    tops = sections.map(function (s) { return s.getBoundingClientRect().top + window.scrollY; });
    links.forEach(function (a, i) { a.style.top = (tops[i] / pageHeight * height) + 'px'; });
    update();
  }

  function update() {
    var maxScroll = pageHeight - window.innerHeight;
    var f = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 1;
    // The reading line starts 30% down the screen and eases to the very
    // bottom of the page, so the last section still lights up at the end.
    var line = window.scrollY + window.innerHeight * (0.3 + 0.7 * f * f * f);
    var p = Math.min(1, line / pageHeight);
    fill.style.transform = 'scaleY(' + p + ')';
    dot.style.transform = 'translateY(' + (p * height) + 'px)';

    var current = -1;
    tops.forEach(function (t, i) { if (t <= line + 1) current = i; });
    links.forEach(function (a, i) {
      a.classList.toggle('is-current', i === current);
      a.classList.toggle('is-past', i < current);
      if (i === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { update(); queued = false; });
  }, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts) document.fonts.ready.then(layout);

  document.documentElement.classList.add('rail-ready');
  layout();
})();
