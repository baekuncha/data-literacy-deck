/* ============================================================
   charts.js — seaborn 스타일 SVG 차트 + anime.js 모션 그래픽
   ------------------------------------------------------------
   * seaborn "deep" 팔레트 기반, 다크 무대용 whitegrid-dark 아날로그
   * 모든 수치는 원고(학술제_최종원고_v8) 보고값만 사용.
     예시(개념도)인 차트는 반드시 주석 라벨로 명시한다.
   * 각 빌더는 play() 호출 시 anime.js로 부드럽게 그려진다.
   ============================================================ */

(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* seaborn deep palette */
  var P = {
    blue: '#4C72B0', orange: '#DD8452', green: '#55A868', red: '#C44E52',
    purple: '#8172B3', cyan: '#64B5CD', gray: '#8C8C8C', pink: '#DA8BC3',
    bio: '#DD8452', econ: '#4C72B0', soc1: '#7EA7E8'
  };
  var C = {
    grid: 'rgba(255,255,255,0.07)',
    axis: 'rgba(255,255,255,0.28)',
    label: '#86868b',
    value: '#ffffff',
    zero: 'rgba(255,255,255,0.5)',
    muted: '#6e6e73'
  };

  var FONT = (typeof getComputedStyle === 'function')
    ? getComputedStyle(document.body).fontFamily
    : 'Pretendard, -apple-system, sans-serif';

  /* ---------- SVG 헬퍼 ---------- */
  function svgEl(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function txt(x, y, str, size, fill, anchor, weight) {
    var t = svgEl('text', {
      x: x, y: y,
      'font-family': FONT,
      'font-size': size,
      fill: fill || C.label,
      'text-anchor': anchor || 'middle'
    });
    if (weight) t.setAttribute('font-weight', weight);
    t.textContent = str;
    return t;
  }
  function txtMulti(x, y, lines, size, fill, anchor, weight, lh) {
    var t = svgEl('text', { x: x, y: y, 'font-family': FONT, 'font-size': size, fill: fill || C.label, 'text-anchor': anchor || 'middle' });
    if (weight) t.setAttribute('font-weight', weight);
    lh = lh || (size * 1.4);
    lines.forEach(function (s, i) {
      var sp = svgEl('tspan', { x: x, dy: i === 0 ? 0 : lh }, t);
      sp.textContent = s;
    });
    return t;
  }
  function line(x1, y1, x2, y2, stroke, width, dash) {
    return svgEl('line', {
      x1: x1, y1: y1, x2: x2, y2: y2,
      stroke: stroke || C.axis,
      'stroke-width': width || 1,
      'stroke-dasharray': dash || null
    });
  }
  function pathD(points) {
    var d = '';
    for (var i = 0; i < points.length; i++) {
      d += (i === 0 ? 'M' : 'L') + points[i][0].toFixed(2) + ' ' + points[i][1].toFixed(2) + ' ';
    }
    return d.trim();
  }
  function pathLen(pathNode) {
    return pathNode.getTotalLength ? pathNode.getTotalLength() : 1000;
  }
  function drawLine(node, dur, delay) {
    var L = pathLen(node);
    node.style.strokeDasharray = L;
    node.style.strokeDashoffset = L;
    anime({
      targets: node,
      strokeDashoffset: [L, 0],
      duration: dur || 1400,
      delay: delay || 0,
      easing: 'easeInOutSine'
    });
  }

  /* ---------- 공통 그리드 ---------- */
  function gridX(g, x1, x2, ticks, H, padT, padB) {
    ticks.forEach(function (t) {
      var x = x1 + (t.v - t.min) / (t.max - t.min) * (x2 - x1);
      g.appendChild(line(x, padT, x, H - padB, C.grid, 1));
      g.appendChild(txt(x, H - padB + 16, t.t, 11, C.label));
    });
  }

  /* ============================================================
     1) barDomain — 영역별 실측 상대 점수 (원고 Table 2 / Figure 2)
     ============================================================ */
  function barDomain(container) {
    var W = 800, H = 460, padL = 190, padR = 60, padT = 40, padB = 46;
    var data = [
      { label: '건물 기반·접근', bio: 0.74, econ: 1.26 },
      { label: '학습·휴게 공간', bio: 0.66, econ: 1.34 },
      { label: '위생·편의',      bio: 1.01, econ: 0.99 },
      { label: '종합',           bio: 0.80, econ: 1.20 }
    ];
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var maxV = 1.5, x0 = padL, x1 = W - padR;
    var band = (H - padT - padB) / data.length;
    var scale = function (v) { return x0 + v / maxV * (x1 - x0); };

    g.appendChild(line(x0, padT, x0, H - padB, C.axis, 1));
    gridX(g, x0, x1, [
      { v: 0, min: 0, max: maxV, t: '0' },
      { v: 0.5, min: 0, max: maxV, t: '0.5' },
      { v: 1.0, min: 0, max: maxV, t: '1.00' },
      { v: 1.5, min: 0, max: maxV, t: '1.5' }
    ], H, padT, padB);
    var refX = scale(1.0);
    g.appendChild(line(refX, padT, refX, H - padB, C.zero, 1.2, '4 4'));
    txt(refX, padT - 12, '두 건물 평균 = 1.00', 11, C.label);

    var bars = [], labels = [];
    data.forEach(function (d, i) {
      var cy = padT + band * i + band / 2;
      var hh = band * 0.30;
      txt(x0 - 12, cy + 4, d.label, 14, C.value, 'end', 600);
      [[d.bio, P.bio], [d.econ, P.econ]].forEach(function (pair, j) {
        var bw = band * 0.30, off = (j - 0.5) * (band * 0.62);
        var bx = x0 + off - bw / 2;
        var top = cy - hh / 2;
        var rect = svgEl('rect', {
          x: bx, y: cy, width: bw, height: 0,
          fill: pair[1], rx: 3
        }, g);
        bars.push({ el: rect, top: top, h: hh });
        var vlab = txt(bx + bw / 2, top - 9, pair[0].toFixed(2), 13, C.value, 'middle', 600);
        vlab.style.opacity = 0;
        labels.push(vlab);
      });
    });

    /* 범례 */
    var ly = H - 8;
    svgEl('rect', { x: padL, y: ly - 12, width: 10, height: 10, fill: P.bio, rx: 2 }, g);
    txt(padL + 16, ly - 3, '생물관 (1980, 46년)', 12, C.label, 'start');
    svgEl('rect', { x: padL + 190, y: ly - 12, width: 10, height: 10, fill: P.econ, rx: 2 }, g);
    txt(padL + 206, ly - 3, '경제통상관 (2013, 13년)', 12, C.label, 'start');

    return {
      play: function () {
        bars.forEach(function (b) {
          b.el.setAttribute('y', b.top + b.h);
          b.el.setAttribute('height', 0);
        });
        labels.forEach(function (l) { l.style.opacity = 0; });
        anime({
          targets: bars.map(function (b) { return b.el; }),
          y: function (el2, i) { return bars[i].top; },
          height: function (el2, i) { return bars[i].h; },
          duration: 950,
          delay: anime.stagger(95),
          easing: 'easeOutQuart'
        });
        anime({
          targets: labels,
          opacity: [0, 1],
          duration: 420,
          delay: anime.stagger(95, { start: 520 }),
          easing: 'linear'
        });
      }
    };
  }

  /* ============================================================
     2) forest — 효과크기 숲 그림 (Hedges' g + 부트스트랩 95% CI)
     ============================================================ */
  function forest(container, opts) {
    opts = opts || {};
    var W = 760, H = 340, padL = 170, padR = 70, padT = 34, padB = 44;
    var rows = opts.data || [
      { label: '시설 만족', g: 1.41, lo: 0.95, hi: 2.01, sig: '***', p: 'p < .001', on: true },
      { label: '삶의 만족 (SWLS)', g: 0.36, lo: -0.05, hi: 0.78, sig: '', p: 'p = .171', on: false },
      { label: '대학생활 만족', g: 0.15, lo: -0.26, hi: 0.55, sig: '', p: 'p = .482', on: false }
    ];
    var minV = opts.min !== undefined ? opts.min : -0.6;
    var maxV = opts.max !== undefined ? opts.max : 2.4;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var x0 = padL, x1 = W - padR;
    var scale = function (v) { return x0 + (v - minV) / (maxV - minV) * (x1 - x0); };
    var band = (H - padT - padB) / rows.length;

    g.appendChild(line(x0, padT, x0, H - padB, C.axis, 1));
    gridX(g, x0, x1, [
      { v: 0, min: minV, max: maxV, t: '0' },
      { v: 0.5, min: minV, max: maxV, t: '0.5' },
      { v: 1.0, min: minV, max: maxV, t: '1.0' },
      { v: 1.5, min: minV, max: maxV, t: '1.5' },
      { v: 2.0, min: minV, max: maxV, t: '2.0' }
    ], H, padT, padB);
    g.appendChild(line(scale(0), padT, scale(0), H - padB, C.zero, 1.6));
    txt(scale(0) - 4, padT - 10, '차이 없음', 11, C.muted, 'end');

    var cis = [], dots = [], rowsFx = [];
    rows.forEach(function (r, i) {
      var cy = padT + band * i + band / 2;
      txt(x0 - 12, cy + 4, r.label, 14, C.value, 'end', 600);
      var ci = line(scale(r.lo), cy, scale(r.hi), cy, r.on ? 'rgba(255,255,255,0.65)' : C.muted, 2.5);
      g.appendChild(ci);
      cis.push(ci);
      var dot = svgEl('circle', {
        cx: scale(r.g), cy: cy, r: 0, opacity: 0,
        fill: r.on ? '#ffffff' : '#3a3a3c'
      }, g);
      dots.push(dot);
      var gl = txt(scale(r.g), cy - 14, 'g = ' + r.g.toFixed(2) + (r.sig ? ' ' + r.sig : ''), 13,
        r.on ? C.value : C.muted, 'middle', 600);
      var pl = txt(scale(r.g), cy + 20, r.p, 11, C.muted);
      gl.style.opacity = 0; pl.style.opacity = 0;
      rowsFx.push(gl, pl);
    });
    txt((x0 + x1) / 2, H - 10, '양수 = 경통관 집단이 높음 · 막대 = 부트스트랩 95% CI · n = 88 (경통 40 / 사회 48)', 11, C.label);

    return {
      play: function () {
        cis.forEach(function (ci, i) {
          drawLine(ci, 1100, i * 220);
          anime({
            targets: dots[i], r: [0, 5.5], opacity: [0, 1],
            duration: 500, delay: 300 + i * 220, easing: 'easeOutBack'
          });
          anime({
            targets: [rowsFx[i * 2], rowsFx[i * 2 + 1]], opacity: [0, 1],
            duration: 420, delay: 420 + i * 220, easing: 'linear'
          });
        });
      }
    };
  }

  /* ============================================================
     3) gapCompare — 실측 격차 vs 체감 격차 (원고 Figure 4)
     ------------------------------------------------------------
     좌: 상대점수 차이(경통−생물). 우: 영역별 체감 g.
     원고 보고값: 위생·편의 체감 g = 1.25(Table 10), 나머지 영역 1.22~1.28(Figure 4)
     ============================================================ */
  function gapCompare(container) {
    var W = 860, H = 390, padL = 150, padR = 30, padT = 44, padB = 50;
    var domains = ['건물 기반·접근', '학습·휴게 공간', '위생·편의'];
    var left = [0.52, 0.68, -0.02];
    var right = [1.22, 1.28, 1.25];
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var band = (H - padT - padB) / domains.length;
    var midX = padL + (W - padR - padL) * 0.5;

    g.appendChild(line(padL, padT, padL, H - padB, C.axis, 1));
    g.appendChild(line(midX, padT, midX, H - padB, C.zero, 1.2));
    txt(padL + (midX - padL) / 2, padT - 18, '실측 격차 — 상대점수 차이', 13, C.label, 'middle', 600);
    txt(midX + (W - padR - midX) / 2, padT - 18, '체감 격차 — Hedges\u2019 g', 13, C.label, 'middle', 600);

    function subPanel(xa, xb, minV, maxV, fmt) {
      var sc = function (v) { return xa + (v - minV) / (maxV - minV) * (xb - xa); };
      [0, 0.5, 1.0, 1.5, 2.0].forEach(function (t) {
        if (t >= minV && t <= maxV) {
          g.appendChild(line(sc(t), padT, sc(t), H - padB, C.grid, 1));
          txt(sc(t), H - padB + 14, fmt(t), 10.5, C.muted);
        }
      });
      return sc;
    }
    var scL = subPanel(padL, midX - 14, -0.2, 1.4, function (t) { return t.toFixed(1); });
    var scR = subPanel(midX + 14, W - padR, 0, 2.4, function (t) { return t.toFixed(1); });

    var bars = [], labels = [];
    domains.forEach(function (d, i) {
      var cy = padT + band * i + band / 2;
      txt(padL - 12, cy + 4, d, 13.5, C.value, 'end', 600);
      var hh = band * 0.30, top = cy - hh / 2;

      var lv = left[i];
      var lx = lv >= 0 ? scL(0) : scL(lv);
      var lw = scL(lv) - scL(0);
      var lr = svgEl('rect', { x: lx, y: cy, width: lw, height: 0,
        fill: lv >= 0 ? P.econ : P.bio, rx: 2 }, g);
      bars.push({ el: lr, top: top, h: hh });
      var ll = txt(scL(lv) + (lv >= 0 ? 0 : 0), top - 9, (lv >= 0 ? '+' : '') + lv.toFixed(2), 13, C.value, 'middle', 600);
      ll.style.opacity = 0; labels.push(ll);

      var rv = right[i];
      var rr = svgEl('rect', { x: scR(0), y: cy, width: scR(rv) - scR(0), height: 0,
        fill: '#ffffff', rx: 2 }, g);
      bars.push({ el: rr, top: top, h: hh });
      var rl = txt(scR(rv), top - 9, 'g = ' + rv.toFixed(2), 13, C.value, 'middle', 600);
      rl.style.opacity = 0; labels.push(rl);
    });

    txt(padL + (midX - 14 - padL) / 2, H - padB + 32, '위생·편의는 측정상 거의 같음 (차이 \u22120.02)', 11.5, C.muted);
    txt(midX + 14 + (W - padR - midX - 14) / 2, H - padB + 32, '체감은 세 영역 모두 크게 벌어짐 (g = 1.22~1.28)', 11.5, C.muted);
    txt((padL + W - padR) / 2, H - 6, '단위가 다름 — 크기가 아니라 패턴을 비교하라', 11, C.muted);

    return {
      play: function () {
        bars.forEach(function (b) {
          b.el.setAttribute('y', b.top + b.h);
          b.el.setAttribute('height', 0);
        });
        labels.forEach(function (l) { l.style.opacity = 0; });
        anime({
          targets: bars.map(function (b) { return b.el; }),
          y: function (el2, i) { return bars[i].top; },
          height: function (el2, i) { return bars[i].h; },
          duration: 950,
          delay: anime.stagger(110),
          easing: 'easeOutQuart'
        });
        anime({
          targets: labels, opacity: [0, 1],
          duration: 420, delay: anime.stagger(110, { start: 560 }), easing: 'linear'
        });
      }
    };
  }

  /* ============================================================
     4) anscombe — 앤스컴 4중주 (같은 요약통계, 완전히 다른 분포)
     ============================================================ */
  function anscombe(container) {
    var W = 880, H = 430, padL = 46, padR = 20, padT = 34, padB = 44;
    var sets = [
      { xs: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], ys: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68], name: 'I' },
      { xs: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], ys: [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74], name: 'II' },
      { xs: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], ys: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73], name: 'III' },
      { xs: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8], ys: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89], name: 'IV' }
    ];
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var cellW = (W - padL - padR) / 2, cellH = (H - padT - padB) / 2;
    var dots = [], linesArr = [];

    sets.forEach(function (s, i) {
      var cx = padL + (i % 2) * cellW, cy0 = padT + Math.floor(i / 2) * cellH;
      var x0 = cx + 34, y0 = cy0 + 10, w = cellW - 52, h = cellH - 34;
      var sx = function (x) { return x0 + x / 20 * w; };
      var sy = function (y) { return y0 + h - y / 14 * h; };
      g.appendChild(line(x0, y0 + h, x0 + w, y0 + h, C.axis, 0.8));
      g.appendChild(line(x0, y0, x0, y0 + h, C.axis, 0.8));
      txt(cx + cellW / 2, cy0 + 16, s.name, 15, C.value, 'middle', 600);

      var lpath = svgEl('path', {
        d: pathD([[sx(4), sy(3 + 0.5 * 4)], [sx(14), sy(3 + 0.5 * 14)]]),
        fill: 'none', stroke: 'rgba(255,255,255,0.85)', 'stroke-width': 1.6
      }, g);
      linesArr.push(lpath);
      s.xs.forEach(function (x, j) {
        dots.push(svgEl('circle', { cx: sx(x), cy: sy(s.ys[j]), r: 0, opacity: 0, fill: P.blue }, g));
      });
    });

    txt((padL + W - padR) / 2, H - 16,
      '네 데이터셋 모두 동일: 평균 x = 9.00 · 분산 x = 11.00 · 평균 y = 7.50 · 분산 y = 4.12 · 상관 r = 0.82 · 회귀선 y = 3 + 0.5x',
      12, C.label);

    return {
      play: function () {
        linesArr.forEach(function (p, i) { drawLine(p, 1300, i * 320); });
        anime({
          targets: dots,
          r: [0, 3.4], opacity: [0, 0.95],
          duration: 480, delay: anime.stagger(40, { start: 300 }), easing: 'easeOutBack'
        });
      }
    };
  }

  /* ============================================================
     5) bimodal — 이봉 분포 개념도 (평균 아래의 진실)
     ------------------------------------------------------------
     * 봉우리 위치(집단 평균)는 원고 보고값. 폭은 혼합 후 표준편차가
       보고된 전체 SD(사회대 1.20, 경통관 0.89)와 일치하도록 조정한
       "개념 예시도". 개인 응답 원자료가 아님 — 라벨로 명시.
     ============================================================ */
  function bimodal(container) {
    var W = 900, H = 400, padL = 52, padR = 26, padT = 40, padB = 48;
    var XMIN = 1.0, XMAX = 7.4, YMAX = 0.62;
    var gauss = function (x, mu, sd) {
      return Math.exp(-0.5 * Math.pow((x - mu) / sd, 2)) / (sd * Math.sqrt(2 * Math.PI));
    };
    var groups = {
      econ: { mu: 4.89, sd: 0.89, color: P.econ, w: 1 },
      soc1: { mu: 4.93, sd: 1.12, color: P.soc1, w: 17 / 48 },
      soc24: { mu: 4.26, sd: 1.17, color: P.bio, w: 31 / 48 }
    };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var x0 = padL, y0 = H - padB, w = W - padL - padR, h = H - padT - padB;
    var sx = function (x) { return x0 + (x - XMIN) / (XMAX - XMIN) * w; };

    g.appendChild(line(x0, y0, x0 + w, y0, C.axis, 1));
    for (var t = 1; t <= 7; t++) {
      g.appendChild(line(sx(t), y0, sx(t), y0 + 4, C.axis, 1));
      txt(sx(t), y0 + 16, String(t), 11, C.label);
    }
    txt((x0 + w / 2), y0 + 32, '삶의 만족 (SWLS, 1~7점)', 11.5, C.muted);

    function densPts(key) {
      var pts = [];
      for (var x = XMIN; x <= XMAX; x += 0.03) {
        pts.push([sx(x), y0 - (gauss(x, groups[key].mu, groups[key].sd) * groups[key].w / YMAX) * h]);
      }
      return pts;
    }
    function densPath(key) { return pathD(densPts(key)); }
    function densFill(key) {
      return densPath(key) + ' L ' + sx(XMAX) + ' ' + y0 + ' L ' + sx(XMIN) + ' ' + y0 + ' Z';
    }
    function peakFrac(key) {
      var m = 0;
      for (var x = XMIN; x <= XMAX; x += 0.01) {
        m = Math.max(m, gauss(x, groups[key].mu, groups[key].sd) * groups[key].w);
      }
      return m / YMAX;
    }

    var econFill = svgEl('path', { d: densFill('econ'), fill: P.econ, opacity: 0 }, g);
    econFill.setAttribute('fill-opacity', 0.16);
    var econLine = svgEl('path', { d: densPath('econ'), fill: 'none', stroke: P.econ, 'stroke-width': 2.4 }, g);
    var s1Fill = svgEl('path', { d: densFill('soc1'), fill: P.soc1, opacity: 0 }, g);
    s1Fill.setAttribute('fill-opacity', 0.18);
    var s1Line = svgEl('path', { d: densPath('soc1'), fill: 'none', stroke: P.soc1, 'stroke-width': 2.4 }, g);
    var s24Fill = svgEl('path', { d: densFill('soc24'), fill: P.bio, opacity: 0 }, g);
    s24Fill.setAttribute('fill-opacity', 0.18);
    var s24Line = svgEl('path', { d: densPath('soc24'), fill: 'none', stroke: P.bio, 'stroke-width': 2.4 }, g);

    var mixPts = [];
    for (var x2 = XMIN; x2 <= XMAX; x2 += 0.03) {
      var dm = gauss(x2, 4.93, 1.12) * (17 / 48) + gauss(x2, 4.26, 1.17) * (31 / 48);
      mixPts.push([sx(x2), y0 - (dm / YMAX) * h]);
    }
    var mixLine = svgEl('path', {
      d: pathD(mixPts), fill: 'none', stroke: '#ffffff', 'stroke-width': 1.6,
      'stroke-dasharray': '5 5', opacity: 0
    }, g);

    var ml = [];
    ml.push(txt(sx(4.89), y0 - h * peakFrac('econ') - 10, 'M 4.89', 12.5, P.econ, 'middle', 600));
    ml.push(txt(sx(4.93), y0 - h * peakFrac('soc1') - 8, 'M 4.93', 12.5, P.soc1, 'middle', 600));
    ml.push(txt(sx(4.26), y0 - h * peakFrac('soc24') - 8, 'M 4.26', 12.5, P.bio, 'middle', 600));
    ml.push(txt(sx(4.50), y0 - h * 0.30 - 2, '전체 평균 4.50', 11.5, C.muted, 'middle'));
    ml.forEach(function (t) { t.style.opacity = 0; });

    /* 범례 */
    var lx = x0, ly = H - 9;
    svgEl('rect', { x: lx, y: ly - 11, width: 12, height: 3, fill: P.econ }, g);
    txt(lx + 18, ly - 4, '경통관 — 봉우리 하나', 12, C.label, 'start');
    svgEl('rect', { x: lx + 205, y: ly - 11, width: 12, height: 3, fill: P.bio }, g);
    txt(lx + 223, ly - 4, '사회대 2~4학년', 12, C.label, 'start');
    svgEl('rect', { x: lx + 368, y: ly - 11, width: 12, height: 3, fill: P.soc1 }, g);
    txt(lx + 386, ly - 4, '사회대 1학년', 12, C.label, 'start');
    txt(lx + 532, ly - 4, '- - - 사회대 전체(혼합)', 12, C.muted, 'start');
    svgEl('line', { x1: lx + 532, y1: ly - 9.5, x2: lx + 680, y2: ly - 9.5, stroke: '#fff', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, g);

    txt((x0 + w) / 2, H - 2,
      '개념 예시도 — 봉우리 위치 = 보고된 집단 평균, 폭 = 보고된 전체 SD(1.20)를 재현하도록 조정. 개인 응답 원자료 아님.',
      10.5, C.muted);

    return {
      play: function () {
        drawLine(econLine, 1700, 0);
        drawLine(s1Line, 1700, 320);
        drawLine(s24Line, 1700, 640);
        anime({ targets: [econFill, s1Fill, s24Fill], opacity: [0, 1], duration: 900, delay: anime.stagger(320, { start: 950 }), easing: 'linear' });
        anime({ targets: mixLine, opacity: [0, 0.9], duration: 800, delay: 2100, easing: 'linear' });
        anime({ targets: ml, opacity: [0, 1], duration: 400, delay: anime.stagger(160, { start: 1900 }), easing: 'linear' });
      }
    };
  }

  /* ============================================================
     6) yearDots — 학년별 대학생활·삶의 만족 (원고 Figure 5)
     ============================================================ */
  function yearDots(container) {
    var W = 900, H = 400, padL = 60, padR = 40, padT = 50, padB = 88;
    var outcomes = [
      { name: '대학생활 만족', min: 3.8, max: 5.8, g: '2~4학년: g = 0.57 · p = .027', gx: 4.46 },
      { name: '삶의 만족 (SWLS)', min: 3.9, max: 5.4, g: '2~4학년: g = 0.72 · p = .006', gx: 4.645 }
    ];
    var groups = [
      { label: ['경통관', '1학년'], v: [4.78, 4.38], n: 9, color: P.econ, dash: false },
      { label: ['경통관', '2~4학년'], v: [4.76, 5.03], n: 31, color: P.econ, dash: false },
      { label: ['사회대', '1학년'], v: [5.39, 4.93], n: 17, color: P.soc1, dash: true },
      { label: ['사회대', '2~4학년'], v: [4.16, 4.26], n: 31, color: P.bio, dash: true }
    ];
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var cellW = (W - padL - padR) / 2;
    var dots = [], conns = [], vlabels = [];

    outcomes.forEach(function (o, oi) {
      var x0 = padL + oi * cellW, w = cellW - 26;
      var y0 = padT, h = H - padT - padB;
      var sy = function (v) { return y0 + (o.max - v) / (o.max - o.min) * h; };
      txt(x0 + w / 2, y0 - 20, o.name, 14, C.value, 'middle', 600);
      g.appendChild(line(x0 + 44, y0 + h, x0 + w, y0 + h, C.axis, 1));
      [4.0, 4.5, 5.0, 5.5].forEach(function (t) {
        if (t >= o.min && t <= o.max) {
          g.appendChild(line(x0 + 44, sy(t), x0 + w, sy(t), C.grid, 1));
          txt(x0 + 34, sy(t) + 4, t.toFixed(1), 10.5, C.label, 'end');
        }
      });
      var slots = [0.12, 0.40, 0.68, 0.95];
      var prev = null;
      groups.forEach(function (gr, gi) {
        var cx = x0 + 44 + slots[gi] * (w - 44);
        var cy = sy(gr.v[oi]);
        var c = svgEl('circle', { cx: cx, cy: cy, r: 0, opacity: 0, fill: gr.color }, g);
        dots.push({ el: c, targetR: Math.max(4.5, Math.min(9, 3 + gr.n * 0.16)) });
        var vl = txt(cx, cy - 13, gr.v[oi].toFixed(2), 12.5, C.value, 'middle', 600);
        vl.style.opacity = 0; vlabels.push(vl);
        txtMulti(cx, y0 + h + 20, gr.label, 11, C.muted, 'middle', 600, 14);
        txt(cx, y0 + h + 52, 'n = ' + gr.n, 10.5, C.muted, 'middle');
        if (prev && gr.dash === prev.dash) {
          var l = line(prev.cx, prev.cy, cx, cy, '#ffffff', 1.3, gr.dash ? '3 3' : null);
          l.style.opacity = 0;
          g.appendChild(l);
          conns.push(l);
        }
        prev = { cx: cx, cy: cy, dash: gr.dash };
      });
      var sx24 = x0 + 44 + 0.95 * (w - 44), sxE = x0 + 44 + 0.40 * (w - 44);
      txt((sx24 + sxE) / 2, sy(o.gx) + 10, o.g, 12, P.red, 'middle', 600);
      txt(x0 + w / 2, y0 + h + 70, '1학년: 유의한 차이 없음', 11.5, C.muted, 'middle');
    });

    txt((padL + W - padR) / 2, H - 6,
      '사회대 1학년(n=17)은 모두 옛 사회관 수업 경험 없음 · 2~4학년(n=31) 중 29명은 경험 있음 · 탐색 분석',
      11, C.muted);

    return {
      play: function () {
        conns.forEach(function (l, i) {
          anime({ targets: l, opacity: [0, 0.9], duration: 500, delay: 400 + i * 300, easing: 'linear' });
        });
        anime({
          targets: dots.map(function (d) { return d.el; }),
          r: function (el2, i) { return dots[i].targetR; },
          opacity: [0, 1],
          duration: 520, delay: anime.stagger(120, { start: 600 }), easing: 'easeOutBack'
        });
        anime({
          targets: vlabels, opacity: [0, 1],
          duration: 420, delay: anime.stagger(120, { start: 900 }), easing: 'linear'
        });
      }
    };
  }

  /* ============================================================
     7) gLadder — 격차의 계단 (탐색·가설 검정 g 정렬)
     ============================================================ */
  function gLadder(container) {
    var W = 800, H = 440, padL = 215, padR = 85, padT = 26, padB = 40;
    var rows = [
      { label: '우리 건물이라는 느낌', g: 2.55, sig: '***', hot: true, src: '소속감' },
      { label: '건물 안전감', g: 1.60, sig: '***', hot: false, src: '' },
      { label: '시설 만족', g: 1.41, sig: '***', hot: false, src: 'H1-1' },
      { label: '공간 배정 공정성', g: 1.21, sig: '***', hot: false, src: '' },
      { label: '수업 외 체류 시간', g: 0.51, sig: '*', hot: false, src: '' },
      { label: '삶의 만족 (SWLS)', g: 0.36, sig: '', hot: false, src: 'H1-3' },
      { label: '대학생활 만족', g: 0.15, sig: '', hot: false, src: 'H1-2' },
      { label: '학과 친구·선후배 관계', g: 0.00, sig: '', hot: false, src: '' }
    ];
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var x0 = padL, x1 = W - padR;
    var maxV = 2.8;
    var sc = function (v) { return x0 + v / maxV * (x1 - x0); };
    var band = (H - padT - padB) / rows.length;

    g.appendChild(line(x0, padT, x0, H - padB, C.axis, 1));
    gridX(g, x0, x1, [
      { v: 0, min: 0, max: maxV, t: '0' },
      { v: 1, min: 0, max: maxV, t: '1.0' },
      { v: 2, min: 0, max: maxV, t: '2.0' }
    ], H, padT, padB);
    g.appendChild(line(sc(0), padT, sc(0), H - padB, C.zero, 1.4));

    var bars = [], labels = [];
    rows.forEach(function (r, i) {
      var cy = padT + band * i + band / 2;
      txt(x0 - 12, cy + 4, r.label, 13, r.hot ? '#ffffff' : C.label, 'end', r.hot ? 700 : 400);
      var hh = band * 0.44, top = cy - hh / 2;
      var bar = svgEl('rect', {
        x: sc(0), y: top, width: 0, height: hh,
        fill: r.hot ? '#ffffff' : (r.sig ? '#9fb6d9' : '#3a3a3c'),
        rx: 2, opacity: r.sig ? 1 : 0.55
      }, g);
      bars.push({ el: bar, w: sc(r.g) - sc(0) });
      var lb = txt(sc(r.g) + 10, cy + 4, 'g = ' + r.g.toFixed(2) + (r.sig ? ' ' + r.sig : ''),
        13, r.hot ? '#ffffff' : (r.sig ? C.value : C.muted), 'start', r.hot ? 700 : 600);
      lb.style.opacity = 0; labels.push(lb);
      if (r.src) {
        var src = txt(sc(r.g) + 10, cy + 20, r.src, 10.5, C.muted, 'start');
        src.style.opacity = 0; labels.push(src);
      } else {
        labels.push(null);
      }
    });
    txt((x0 + x1) / 2, H - 8, '모든 격차를 한 줄로 세우면 — 시설이 아니라 "소속감"이 가장 크다 · n = 88 · 탐색 분석은 다중비교 보정 없음', 11, C.muted);

    return {
      play: function () {
        bars.forEach(function (b) { b.el.setAttribute('width', 0); });
        labels.forEach(function (l) { if (l) l.style.opacity = 0; });
        anime({
          targets: bars.map(function (b) { return b.el; }),
          width: function (el2, i) { return bars[i].w; },
          duration: 1000, delay: anime.stagger(95), easing: 'easeOutQuart'
        });
        anime({
          targets: labels.filter(function (l) { return l; }),
          opacity: [0, 1],
          duration: 420, delay: anime.stagger(95, { start: 620 }), easing: 'linear'
        });
      }
    };
  }

  /* ============================================================
     8) needs — 새 사회관 희망 시설 (원고 Table 7, n = 48)
     ============================================================ */
  function needs(container) {
    var W = 800, H = 380, padL = 250, padR = 100, padT = 26, padB = 40;
    var rows = [
      { label: '조용한 개인 자습실', pct: 50, n: 24, key: true },
      { label: '누워서 쉴 수 있는 휴게실', pct: 46, n: 22, key: true },
      { label: '혼자 있고 싶을 때 쓸 라운지', pct: 42, n: 20, key: false },
      { label: '깨끗한 화장실·비데', pct: 42, n: 20, key: false },
      { label: '좌석 가까이 콘센트', pct: 35, n: 17, key: false }
    ];
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);
    var g = svgEl('g', null, svg);
    var x0 = padL, x1 = W - padR;
    var maxV = 60;
    var sc = function (v) { return x0 + v / maxV * (x1 - x0); };
    var band = (H - padT - padB) / rows.length;

    g.appendChild(line(x0, padT, x0, H - padB, C.axis, 1));
    [0, 20, 40, 60].forEach(function (t) {
      g.appendChild(line(sc(t), padT, sc(t), H - padB, C.grid, 1));
      txt(sc(t), H - padB + 14, t + '%', 10.5, C.muted);
    });
    txt(x0 - 12, padT - 14, '새 사회관에 있다면 좋을 시설 (사회대 48명, 최대 3개 선택)', 12, C.muted, 'end');

    var bars = [], labels = [];
    rows.forEach(function (r, i) {
      var cy = padT + band * i + band / 2;
      txt(x0 - 12, cy + 4, r.label, 13.5, r.key ? '#ffffff' : C.label, 'end', r.key ? 700 : 400);
      var hh = band * 0.46, top = cy - hh / 2;
      var bar = svgEl('rect', { x: sc(0), y: top, width: 0, height: hh, fill: r.key ? '#ffffff' : '#4a4a4e', rx: 2 }, g);
      bars.push({ el: bar, w: sc(r.pct) - sc(0) });
      var lb = txt(sc(r.pct) + 10, cy + 4, r.pct + '% (n=' + r.n + ')', 12.5, r.key ? C.value : C.muted, 'start', 600);
      lb.style.opacity = 0; labels.push(lb);
    });
    txt((x0 + x1) / 2, H - 4, '하얀 막대 = 실측·인터뷰와 교차 확인된 최우선 제안 공간', 11, C.muted);

    return {
      play: function () {
        bars.forEach(function (b) { b.el.setAttribute('width', 0); });
        labels.forEach(function (l) { l.style.opacity = 0; });
        anime({
          targets: bars.map(function (b) { return b.el; }),
          width: function (el2, i) { return bars[i].w; },
          duration: 950, delay: anime.stagger(110), easing: 'easeOutQuart'
        });
        anime({
          targets: labels, opacity: [0, 1],
          duration: 420, delay: anime.stagger(110, { start: 560 }), easing: 'linear'
        });
      }
    };
  }

  /* ---------- 등록 ---------- */
  global.Charts = {
    barDomain: barDomain,
    forest: forest,
    gapCompare: gapCompare,
    anscombe: anscombe,
    bimodal: bimodal,
    yearDots: yearDots,
    gLadder: gLadder,
    needs: needs
  };
})(window);
