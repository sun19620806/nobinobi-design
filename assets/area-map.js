/* のびのび — 対応エリア地図  <div data-nb-area></div>  (requires d3) */
(function () {
  var LINKS = {
    '27123': 'column-42.html', '27114': 'column-50.html', '27102': 'column-51.html', '27127': 'column-52.html', '27117': 'column-53.html',
    '27203': 'column-10.html', '27205': 'column-13.html', '27211': 'column-16.html', '27207': 'column-254.html', '27220': 'column-19.html',
    '27224': 'column-20.html', '27204': 'column-43.html', '28202': 'column-30.html', '28207': 'column-31.html',
    '13112': 'column-267.html', '14136': 'column-268.html', '14134': 'column-268.html', '14118': 'column-268.html', '14117': 'column-268.html'
  };
  var LABEL = { '27123': '淀川区', '27114': '東淀川区', '27102': '都島区', '27127': '北区', '27117': '旭区', '14136': '宮前区', '14134': '高津区', '14118': '都筑区', '14117': '青葉区' };
  var REGIONS = {
    osaka: { name: '大阪院', tel: '06-7777-7849', pref: ['27', '28'],
      groups: [['大阪市', ['27123', '27114', '27102', '27127', '27117']], ['大阪府', ['27203', '27205', '27211', '27207', '27220', '27224', '27204']], ['兵庫県', ['28202', '28207']]] },
    tama: { name: '玉川院', tel: '0120-641-104', pref: ['13', '14'],
      groups: [['東京都', ['13112']], ['川崎市', ['14136', '14134']], ['横浜市', ['14118', '14117']]] }
  };
  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.nbarea{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:0;background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 1px 0 var(--line,#EFE7D6),0 16px 40px rgba(120,90,20,.09)}',
      '.nbarea-map{position:relative;background:#FBF7EE;min-height:440px}',
      '.nbarea-map svg{display:block;width:100%;height:100%}',
      '.nbarea-map path{stroke:#fff;stroke-width:1.2;vector-effect:non-scaling-stroke;transition:fill .2s}',
      '.nbarea-map path.ctx{fill:#ECE6DA}',
      '.nbarea-map path.srv{fill:#F7D77A;cursor:pointer}',
      '.nbarea-map path.srv:hover,.nbarea-map path.srv.on{fill:var(--gold,#F2B417)}',
      '.nbarea-map text{font-family:var(--font-sans);font-weight:700;fill:#5B4A1E;paint-order:stroke;stroke:#FFF8E6;stroke-width:3px;stroke-linejoin:round;pointer-events:none}',
      '.nbarea-tabs{position:absolute;top:16px;left:16px;display:flex;gap:6px;background:rgba(255,255,255,.92);border-radius:999px;padding:5px;box-shadow:0 4px 14px rgba(120,90,20,.1)}',
      '.nbarea-tabs button{border:0;background:none;font:inherit;font-size:15px;font-weight:700;letter-spacing:.04em;color:var(--ink-soft,#4C525B);padding:9px 18px;border-radius:999px;cursor:pointer;min-height:40px}',
      '.nbarea-tabs button[aria-selected="true"]{background:var(--gold,#F2B417);color:#fff}',
      '.nbarea-tip{position:absolute;pointer-events:none;background:var(--ink,#2C3138);color:#fff;font-size:13.5px;font-weight:700;padding:6px 12px;border-radius:10px;white-space:nowrap;transform:translate(-50%,-130%);opacity:0;transition:opacity .15s}',
      '.nbarea-side{padding:34px 32px 30px;display:flex;flex-direction:column}',
      '.nbarea-side h3{margin:0 0 4px;font-family:var(--font-serif);font-weight:800;font-size:clamp(21px,18px + .7vw,25px);letter-spacing:.05em;color:var(--ink,#2C3138)}',
      '.nbarea-side .lead{margin:0 0 20px;font-size:15px;line-height:1.8;color:var(--ink-soft,#4C525B)}',
      '.nbarea-g{margin:0 0 16px}',
      '.nbarea-g p{margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;color:var(--gold-deep,#E5A50C)}',
      '.nbarea-g ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}',
      '.nbarea-g a{display:inline-flex;align-items:center;min-height:40px;padding:0 15px;border-radius:999px;border:1.5px solid #EADFC4;background:#fff;font-size:15px;font-weight:700;color:var(--ink,#2C3138);text-decoration:none;transition:border-color .2s,background .2s}',
      '.nbarea-g a:hover,.nbarea-g a.on{border-color:var(--gold,#F2B417);background:var(--gold-wash,#FDF7E6)}',
      '.nbarea-foot{margin-top:auto;padding-top:14px;border-top:1px dashed #E6D9B8;font-size:14px;line-height:1.8;color:var(--ink-soft,#4C525B)}',
      '.nbarea-foot b{font-family:var(--font-serif);font-size:18px;color:var(--ink,#2C3138);letter-spacing:.03em}',
      '@media (max-width:900px){.nbarea{grid-template-columns:1fr}.nbarea-map{min-height:0;aspect-ratio:4/3.2}.nbarea-side{padding:26px 22px 22px}}'
    ].join('');
    document.head.appendChild(s);
  }
  function init() {
    var root = document.querySelector('[data-nb-area]');
    if (!root || !window.d3) return;
    css();
    root.classList.add('nbarea');
    root.innerHTML = '<div class="nbarea-map"><div class="nbarea-tabs" role="tablist"><button role="tab" data-r="osaka" aria-selected="true">大阪院</button><button role="tab" data-r="tama" aria-selected="false">玉川院</button></div><svg role="img" aria-label="対応エリアの地図"></svg><div class="nbarea-tip"></div></div><div class="nbarea-side"></div>';
    var map = root.querySelector('.nbarea-map'), svg = d3.select(root.querySelector('svg')), tip = root.querySelector('.nbarea-tip'), side = root.querySelector('.nbarea-side');
    var src = (root.getAttribute('data-src') || 'assets/area-map.json');
    fetch(src).then(function (r) { return r.json(); }).then(function (geo) {
      var cur = 'osaka';
      function draw() {
        var R = REGIONS[cur];
        var feats = geo.features.filter(function (f) { return R.pref.indexOf(f.properties.code.slice(0, 2)) > -1; });
        var served = feats.filter(function (f) { return f.properties.served; });
        var w = map.clientWidth, h = map.clientHeight;
        svg.attr('viewBox', '0 0 ' + w + ' ' + h);
        var proj = d3.geoMercator().fitExtent([[24, 70], [w - 24, h - 20]], { type: 'FeatureCollection', features: served });
        var path = d3.geoPath(proj);
        svg.selectAll('*').remove();
        var g = svg.append('g');
        g.selectAll('path.ctx').data(feats.filter(function (f) { return !f.properties.served; })).enter().append('path').attr('class', 'ctx').attr('d', path);
        g.selectAll('path.srv').data(served).enter().append('path').attr('class', 'srv').attr('d', path)
          .attr('data-code', function (f) { return f.properties.code; })
          .on('mousemove', function (e, f) { var b = map.getBoundingClientRect(); tip.textContent = f.properties.name + ' のページを見る'; tip.style.left = (e.clientX - b.left) + 'px'; tip.style.top = (e.clientY - b.top) + 'px'; tip.style.opacity = 1; hl(f.properties.code); })
          .on('mouseleave', function () { tip.style.opacity = 0; hl(null); })
          .on('click', function (e, f) { var u = LINKS[f.properties.code]; if (u) location.href = u; });
        var fs = Math.max(11, Math.min(14, w / 48));
        g.selectAll('text').data(served).enter().append('text')
          .attr('x', function (f) { return path.centroid(f)[0]; }).attr('y', function (f) { return path.centroid(f)[1]; })
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('font-size', fs)
          .text(function (f) { return LABEL[f.properties.code] || f.properties.name; });
        var html = '<h3>' + R.name + 'の対応エリア</h3><p class="lead">地図または地域名を押すと、その地域のご案内ページへ移動します。</p>';
        R.groups.forEach(function (gr) {
          html += '<div class="nbarea-g"><p>' + gr[0] + '</p><ul>' + gr[1].map(function (c) {
            var f = geo.features.filter(function (x) { return x.properties.code === c; })[0];
            return '<li><a href="' + LINKS[c] + '" data-code="' + c + '">' + (f ? f.properties.name : c) + '</a></li>';
          }).join('') + '</ul></div>';
        });
        html += '<p class="nbarea-foot">記載のない地域もご相談ください。<br>' + R.name + '　<b>' + R.tel + '</b></p>';
        side.innerHTML = html;
        side.querySelectorAll('a[data-code]').forEach(function (a) {
          a.addEventListener('mouseenter', function () { hl(a.getAttribute('data-code')); });
          a.addEventListener('mouseleave', function () { hl(null); });
        });
      }
      function hl(code) {
        svg.selectAll('path.srv').classed('on', function (f) { return f.properties.code === code; });
        side.querySelectorAll('a[data-code]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-code') === code); });
      }
      root.querySelectorAll('.nbarea-tabs button').forEach(function (b) {
        b.addEventListener('click', function () {
          cur = b.getAttribute('data-r');
          root.querySelectorAll('.nbarea-tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
          draw();
        });
      });
      draw();
      var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 150); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
