// Vine rail in the right margin: a thin stem with one leaf per entry. The stem
// fills in green as you scroll, each leaf unfolds when you reach its entry, and
// each section label sits where that section falls on the page.
// CSS only shows it on screens 1180px and wider.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var rail = document.querySelector('.rail');
  if (!rail) return;

  var svg = rail.querySelector('svg');
  var links = Array.prototype.slice.call(rail.querySelectorAll('a'));
  var headings = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var height = 0, pageHeight = 1, tops = [], clip = null, leaves = [];

  function make(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    parent.appendChild(node);
    return node;
  }
  function pageTop(node) { return node.getBoundingClientRect().top + window.scrollY; }
  function stemX(y) { return 14 + 3 * Math.sin(y / 55); }
  function leafPath(s) {
    return 'M0,0 C' + 4 * s + ',' + -6 * s + ' ' + 12 * s + ',' + -7 * s + ' ' + 18 * s + ',0' +
           ' C' + 12 * s + ',' + 7 * s + ' ' + 4 * s + ',' + 6 * s + ' 0,0 Z';
  }

  function layout() {
    height = Math.max(240, Math.min(window.innerHeight - 176, 600));
    rail.style.setProperty('--rail-h', height + 'px');
    pageHeight = document.documentElement.scrollHeight;
    tops = headings.map(pageTop);

    svg.innerHTML = '';
    svg.setAttribute('width', 40);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', '0 0 40 ' + height);

    var clipPath = make('clipPath', { id: 'vine-clip' }, make('defs', {}, svg));
    clip = make('rect', { x: -30, y: -10, width: 100, height: 0 }, clipPath);

    var d = 'M' + stemX(0) + ',0';
    for (var y = 4; y <= height; y += 4) d += ' L' + stemX(y).toFixed(2) + ',' + y;
    make('path', { d: d, 'class': 'vine-stem' }, svg);
    make('path', { d: d, 'class': 'vine-stem is-grown', 'clip-path': 'url(#vine-clip)' }, svg);

    // One leaf per entry, alternating sides. The first leaf in each section is full size.
    leaves = [];
    var side = 1;
    headings.forEach(function (heading, i) {
      var items = heading.closest('section').querySelectorAll('.entry, .skills dt');
      var itemTops = items.length ? Array.prototype.map.call(items, pageTop) : [tops[i]];
      itemTops.forEach(function (top, j) {
        var ly = top / pageHeight * height;
        var g = make('g', {
          transform: 'translate(' + stemX(ly).toFixed(2) + ',' + ly.toFixed(2) + ') rotate(' + (side > 0 ? -28 : 208) + ')'
        }, svg);
        leaves.push({ top: top, node: make('path', { d: leafPath(j === 0 ? 1 : 0.68), 'class': 'vine-leaf' }, g) });
        side = -side;
      });
    });

    links.forEach(function (a, i) { a.style.top = (tops[i] / pageHeight * height) + 'px'; });
    update();
  }

  function update() {
    var maxScroll = pageHeight - window.innerHeight;
    var f = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 1;
    // The reading line starts 30% down the screen and eases to the very
    // bottom of the page, so the last section still lights up at the end.
    var line = window.scrollY + window.innerHeight * (0.3 + 0.7 * f * f * f);
    clip.setAttribute('height', Math.min(1, line / pageHeight) * height + 10);

    var current = -1;
    tops.forEach(function (t, i) { if (t <= line + 1) current = i; });
    links.forEach(function (a, i) {
      a.classList.toggle('is-current', i === current);
      a.classList.toggle('is-past', i < current);
      if (i === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    leaves.forEach(function (leaf) { leaf.node.classList.toggle('is-open', leaf.top <= line); });
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
