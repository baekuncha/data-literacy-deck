/* ============================================================
   charts.js — seaborn-style SVG chart builders
   Dark adaptation: white gridlines at 7% alpha, thin spines,
   seaborn muted categorical palette, rounded bar caps.
   Animation contract: elements carry classes that the deck
   controller animates via anime.js
     .mbar-svg  -> scaleX grow
     .mcount    -> number count-up (data-count, data-dec)
     .mhist     -> scaleY grow (origin bottom)
     .mdot      -> pop-in dots
     .mmean     -> mean marker reveal
     .mline     -> axis/threshold line reveal (scaleX)
   ============================================================ */

(function (global) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  var SEABORN = {
    blue: "#4c72b0",
    orange: "#dd8452",
    green: "#55a868",
    red: "#c44e52",
    purple: "#8172b3",
    brown: "#937860",
    pink: "#da8bc3",
    gray: "#8c8c8c",
    yellow: "#ccb974",
    cyan: "#64b5cd"
  };

  var GRID = "rgba(255,255,255,0.07)";
  var SPINE = "rgba(255,255,255,0.22)";
  var TICK = "#9aa0a6";

  function el(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) {
      if (k === "style") { node.style.cssText = attrs[k]; continue; }
      node.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function boxFill() {
    return "transform-box: fill-box;";
  }

  function wrapSvg(containerSel, w, h, pad) {
    var host = document.querySelector(containerSel);
    if (!host) return null;
    host.innerHTML = "";
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, role: "img" }, host);
    var g = el("g", {
      transform: "translate(" + (pad.l || 0) + "," + (pad.t || 0) + ")",
      style: "font-family: 'SF Pro Text', 'Pretendard Variable', Pretendard, 'Segoe UI', sans-serif;"
    }, svg);
    return { host: host, svg: svg, g: g, w: w - (pad.l || 0) - (pad.r || 0), h: h - (pad.t || 0) - (pad.b || 0) };
  }

  /* ---------- normal-ish bin counts (schematic only) ---------- */

  function gaussBins(mean, sd, n, bins, lo, hi) {
    var counts = new Array(bins).fill(0);
    var step = (hi - lo) / bins;
    for (var i = 0; i < n; i++) {
      var u = Math.random(), v = Math.random();
      if (u < 1e-9) u = 1e-9;
      var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      var x = mean + sd * z;
      var idx = Math.floor((x - lo) / step);
      if (idx >= 0 && idx < bins) counts[idx]++;
    }
    return counts;
  }

  /* ---------- bar chart (composite score, slide 4) ---------- */

  function bar(containerSel, opts) {
    var W = 660, H = 230;
    var ctx = wrapSvg(containerSel, W, H, { l: 0, r: 10, t: 6, b: 26 });
    if (!ctx) return;
    var g = ctx.g, iw = ctx.w, ih = ctx.h;

    var labelW = 216, valueW = 78;
    var trackX = labelW + 8, trackW = iw - labelW - valueW - 20;
    var xmax = opts.xmax || 1.4;

    el("line", { x1: trackX, y1: ih, x2: trackX + trackW, y2: ih, stroke: SPINE, "stroke-width": 1, class: "mline" }, g);

    for (var t = 0; t <= 4; t++) {
      var v = (opts.ref * t) / 4;
      if (v > xmax) continue;
      var gx = trackX + (v / xmax) * trackW;
      el("line", { x1: gx, y1: 0, x2: gx, y2: ih, stroke: GRID, "stroke-width": 1, class: "mv" }, g);
      var tick = el("text", { x: gx, y: ih + 18, "text-anchor": "middle", "font-size": 11, fill: TICK, class: "mcount mticks", "data-count": v, "data-dec": 2 }, g);
      tick.textContent = "0.00";
    }

    var refX = trackX + (opts.ref / xmax) * trackW;
    el("line", {
      x1: refX, y1: -6, x2: refX, y2: ih,
      stroke: "rgba(255,255,255,0.45)", "stroke-width": 1.5,
      "stroke-dasharray": "4 5", class: "mv"
    }, g);
    if (opts.refLabel) {
      el("text", { x: refX, y: -12, "text-anchor": "middle", "font-size": 11, fill: "#8b929c", "font-weight": 600, class: "mv" }, g).textContent = opts.refLabel;
    }

    var barH = 42, gap = 34;
    opts.series.forEach(function (s, i) {
      var y = i * (barH + gap) + 4;
      var lab = el("text", { x: 0, y: y + barH / 2 + 5, "font-size": 16, "font-weight": 600, fill: "#f2f3f5", class: "mylab" }, g);
      lab.textContent = s.label;
      var sub = el("text", { x: 0, y: y + barH / 2 + 23, "font-size": 11.5, fill: TICK, class: "mylab" }, g);
      sub.textContent = s.sub || "";

      el("rect", {
        x: trackX, y: y, width: trackW, height: barH, rx: 10,
        fill: "rgba(255,255,255,0.045)", stroke: "rgba(255,255,255,0.08)"
      }, g);

      var bw = (s.value / xmax) * trackW;
      var fill = el("rect", {
        x: trackX, y: y, width: Math.max(bw, 14), height: barH, rx: 10,
        fill: s.color, opacity: 0.92,
        style: boxFill() + "transform-origin: 0% 50%;",
        class: "mbar-svg"
      }, g);
      fill.dataset.color = s.color;

      el("rect", {
        x: trackX, y: y, width: Math.max(bw, 14), height: barH / 2, rx: 10,
        fill: "rgba(255,255,255,0.16)"
      }, g);

      var val = el("text", {
        x: trackX + trackW + 8, y: y + barH / 2 + 7,
        "font-size": 30, "font-weight": 600, fill: "#f2f3f5",
        "font-variant-numeric": "tabular-nums", class: "mcount"
      }, g);
      val.setAttribute("data-count", s.value);
      val.setAttribute("data-dec", 2);
      val.textContent = (0).toFixed(2);
    });

    el("text", {
      x: trackX + trackW, y: ih + 18, "text-anchor": "end",
      "font-size": 11, fill: "#6b7280", class: "mylab"
    }, g).textContent = opts.axisLabel || "";
  }

  /* ---------- effect-size forest plot ---------- */

  function forest(containerSel, opts) {
    var W = 660, rowH = 60, topPad = 30;
    var H = topPad + opts.items.length * rowH + 8;
    var ctx = wrapSvg(containerSel, W, H, { l: 10, r: 10, t: 8, b: 22 });
    if (!ctx) return;
    var g = ctx.g, iw = ctx.w, ih = ctx.h;

    var xmin = opts.xmin != null ? opts.xmin : -0.6;
    var xmax = opts.xmax != null ? opts.xmax : 2.8;
    var x = function (v) { return ((v - xmin) / (xmax - xmin)) * iw; };

    var bands = [
      { lo: 0.2, hi: 0.5, fill: "rgba(254,231,92,0.05)", label: "small" },
      { lo: 0.5, hi: 0.8, fill: "rgba(232,163,61,0.06)", label: "medium" },
      { lo: 0.8, hi: xmax, fill: "rgba(237,66,69,0.07)", label: "large" }
    ];
    bands.forEach(function (b) {
      el("rect", {
        x: x(b.lo), y: 0, width: Math.max(x(b.hi) - x(b.lo), 0.5), height: ih,
        fill: b.fill, class: "mband"
      }, g);
    });

    el("line", { x1: x(0), y1: 0, x2: x(0), y2: ih, stroke: SPINE, "stroke-width": 1.5, class: "mv" }, g);
    el("text", { x: x(0) + 4, y: ih + 16, "font-size": 10.5, fill: "#6b7280", class: "mv" }, g).textContent = "0";

    [0.2, 0.5, 0.8].forEach(function (v) {
      el("line", {
        x1: x(v), y1: 0, x2: x(v), y2: ih,
        stroke: "rgba(255,255,255,0.14)", "stroke-width": 1, "stroke-dasharray": "3 5", class: "mv"
      }, g);
      el("text", { x: x(v), y: ih + 16, "text-anchor": "middle", "font-size": 10.5, fill: "#6b7280", class: "mv" }, g).textContent = v.toFixed(1);
    });

    var bandLabY = 16;
    el("text", { x: x(0.35), y: bandLabY, "text-anchor": "middle", "font-size": 10.5, fill: "rgba(254,231,92,0.55)", class: "mband-lab" }, g).textContent = "small (0.2\u20130.5)";
    el("text", { x: x(0.65), y: bandLabY, "text-anchor": "middle", "font-size": 10.5, fill: "rgba(232,163,61,0.6)", class: "mband-lab" }, g).textContent = "medium (0.5\u20130.8)";
    el("text", { x: x((0.8 + xmax) / 2), y: bandLabY, "text-anchor": "middle", "font-size": 10.5, fill: "rgba(237,66,69,0.6)", class: "mband-lab" }, g).textContent = "large (>0.8)";

    el("line", { x1: 0, y1: topPad - 6, x2: iw, y2: topPad - 6, stroke: GRID, "stroke-width": 1 }, g);

    opts.items.forEach(function (item, i) {
      var y = topPad + i * rowH + rowH / 2;
      el("line", { x1: 0, y1: y, x2: iw, y2: y, stroke: GRID, "stroke-width": 1 }, g);

      var lab = el("text", { x: 2, y: y - 8, "font-size": 14.5, "font-weight": 600, fill: "#f2f3f5", class: "mylab" }, g);
      lab.textContent = item.label;
      if (item.sub) {
        var sub = el("text", { x: 2, y: y + 12, "font-size": 11, fill: TICK, class: "mylab" }, g);
        sub.textContent = item.sub;
      }

      var halo = el("circle", { cx: x(item.g), cy: y, r: 15, fill: item.color, opacity: 0.18, class: "mdot" }, g);
      el("circle", {
        cx: x(item.g), cy: y, r: 8, fill: item.color, stroke: "rgba(0,0,0,0.35)", "stroke-width": 1.5,
        style: boxFill(), class: "mdot"
      }, g);
      var core = el("circle", { cx: x(item.g), cy: y, r: 3, fill: "rgba(255,255,255,0.85)", class: "mdot" }, g);

      var vtext = el("text", {
        x: x(item.g) + 18, y: y + 6, "font-size": 20, "font-weight": 600,
        fill: item.color, "font-variant-numeric": "tabular-nums", class: "mcount"
      }, g);
      vtext.setAttribute("data-count", item.g);
      vtext.setAttribute("data-dec", 2);
      vtext.textContent = (0).toFixed(2);

      if (item.tag) {
        var tag = el("text", {
          x: x(item.g) + 18, y: y + 24, "font-size": 11, "font-weight": 600, fill: TICK, class: "mtag"
        }, g);
        tag.textContent = item.tag;
      }
    });

    el("text", { x: iw, y: ih + 16, "text-anchor": "end", "font-size": 11, fill: "#6b7280", class: "mylab" }, g).textContent = opts.axisLabel || "Hedges' g";
  }

  /* ---------- overlapping histogram pair ---------- */

  function histPair(containerSel, opts) {
    var W = opts.width || 480, H = opts.height || 210;
    var ctx = wrapSvg(containerSel, W, H, { l: 8, r: 8, t: 8, b: 24 });
    if (!ctx) return;
    var g = ctx.g, iw = ctx.w, ih = ctx.h;

    var bins = opts.bins || 12;
    var maxCount = 0;
    opts.series.forEach(function (s) { s.counts.forEach(function (c) { if (c > maxCount) maxCount = c; }); });
    maxCount *= 1.12;

    var bw = iw / bins;
    var y = function (c) { return ih - (c / maxCount) * ih; };

    el("line", { x1: 0, y1: ih, x2: iw, y2: ih, stroke: SPINE, "stroke-width": 1, class: "mline" }, g);
    for (var t = 0; t <= 4; t++) {
      var gy = ih - (t / 4) * ih;
      el("line", { x1: 0, y1: gy, x2: iw, y2: gy, stroke: GRID, "stroke-width": 1 }, g);
    }

    opts.series.forEach(function (s, si) {
      s.counts.forEach(function (c, bi) {
        var x0 = si === 0 ? bi * bw + 2 : bi * bw + bw / 2 - 2;
        var w = bw / 2 - 4;
        var h = (c / maxCount) * ih;
        el("rect", {
          x: x0, y: ih - h, width: w, height: Math.max(h, 1.5),
          rx: 3, fill: s.color, opacity: 0.62,
          style: boxFill() + "transform-origin: 50% 100%;",
          class: "mhist"
        }, g);
      });

      var mx = (0.5 + (s.mean || 0) / (opts.xspan || 2.4)) * iw;
      var lab = el("g", { class: "mmean", style: boxFill() }, g);
      el("line", {
        x1: mx, y1: 2, x2: mx, y2: ih,
        stroke: s.color, "stroke-width": 1.6, "stroke-dasharray": "5 4", opacity: 0.9
      }, lab);
      var tri = "M" + mx + " 2 l 7 11 h -14 z";
      el("path", { d: tri, fill: s.color }, lab);
      el("text", {
        x: mx + 9, y: 18, "font-size": 11.5, "font-weight": 700, fill: s.color,
        class: "mmean-lab"
      }, g).textContent = s.meanLabel || "";
    });

    el("text", { x: iw / 2, y: ih + 18, "text-anchor": "middle", "font-size": 11, fill: "#6b7280" }, g).textContent = opts.xLabel || "";
    return ctx;
  }

  /* ---------- stacked split histogram (bimodal demo) ---------- */

  function splitHist(containerSel, opts) {
    var W = opts.width || 420, H = opts.height || 230;
    var ctx = wrapSvg(containerSel, W, H, { l: 8, r: 8, t: 10, b: 24 });
    if (!ctx) return;
    var g = ctx.g, iw = ctx.w, ih = ctx.h;

    var bins = opts.bins || 13;
    var total = new Array(bins).fill(0);
    opts.stack.forEach(function (s) { s.counts.forEach(function (c, i) { total[i] += c; }); });
    var maxCount = Math.max.apply(null, total) * 1.12;
    var bw = iw / bins;

    el("line", { x1: 0, y1: ih, x2: iw, y2: ih, stroke: SPINE, "stroke-width": 1, class: "mline" }, g);
    for (var t = 0; t <= 4; t++) {
      el("line", { x1: 0, y1: ih - (t / 4) * ih, x2: iw, y2: ih - (t / 4) * ih, stroke: GRID, "stroke-width": 1 }, g);
    }

    var cum = new Array(bins).fill(0);
    opts.stack.forEach(function (s) {
      s.counts.forEach(function (c, bi) {
        var h = (c / maxCount) * ih;
        var x0 = bi * bw + 2;
        el("rect", {
          x: x0, y: ih - cum[bi] - h, width: bw - 4, height: Math.max(h, 1.2),
          rx: 2.5, fill: s.color, opacity: 0.8,
          style: boxFill() + "transform-origin: 50% 100%;",
          class: "mhist"
        }, g);
        cum[bi] += h;
      });
    });

    if (opts.meanLine != null) {
      var mx = (0.5 + opts.meanLine) * iw;
      el("line", {
        x1: mx, y1: 0, x2: mx, y2: ih,
        stroke: "rgba(255,255,255,0.5)", "stroke-width": 1.4, "stroke-dasharray": "5 4", class: "mmean"
      }, g);
      el("text", { x: mx + 7, y: 16, "font-size": 11.5, "font-weight": 700, fill: "#b5bac1", class: "mmean" }, g).textContent = opts.meanLabel || "";
    }

    el("text", { x: iw / 2, y: ih + 18, "text-anchor": "middle", "font-size": 11, fill: "#6b7280" }, g).textContent = opts.xLabel || "";
    return ctx;
  }

  /* ---------- export ---------- */

  global.SC = {
    bar: bar,
    forest: forest,
    histPair: histPair,
    splitHist: splitHist,
    gaussBins: gaussBins,
    SEABORN: SEABORN,
    version: "1.0.0"
  };
})(window);
