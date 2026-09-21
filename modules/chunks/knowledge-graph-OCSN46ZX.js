import {
  NODE_LABELS
} from "./chunk-Y36WSFEI.js";

// demo/vendor/d3-force.js
function Z(t, n) {
  var e, r = 1;
  t == null && (t = 0), n == null && (n = 0);
  function i() {
    var o, l = e.length, f, p = 0, a = 0;
    for (o = 0; o < l; ++o) f = e[o], p += f.x, a += f.y;
    for (p = (p / l - t) * r, a = (a / l - n) * r, o = 0; o < l; ++o) f = e[o], f.x -= p, f.y -= a;
  }
  return i.initialize = function(o) {
    e = o;
  }, i.x = function(o) {
    return arguments.length ? (t = +o, i) : t;
  }, i.y = function(o) {
    return arguments.length ? (n = +o, i) : n;
  }, i.strength = function(o) {
    return arguments.length ? (r = +o, i) : r;
  }, i;
}
function $(t) {
  let n = +this._x.call(null, t), e = +this._y.call(null, t);
  return q(this.cover(n, e), n, e, t);
}
function q(t, n, e, r) {
  if (isNaN(n) || isNaN(e)) return t;
  var i, o = t._root, l = { data: r }, f = t._x0, p = t._y0, a = t._x1, x = t._y1, w, m, h, y, s, u, c, g;
  if (!o) return t._root = l, t;
  for (; o.length; ) if ((s = n >= (w = (f + a) / 2)) ? f = w : a = w, (u = e >= (m = (p + x) / 2)) ? p = m : x = m, i = o, !(o = o[c = u << 1 | s])) return i[c] = l, t;
  if (h = +t._x.call(null, o.data), y = +t._y.call(null, o.data), n === h && e === y) return l.next = o, i ? i[c] = l : t._root = l, t;
  do
    i = i ? i[c] = new Array(4) : t._root = new Array(4), (s = n >= (w = (f + a) / 2)) ? f = w : a = w, (u = e >= (m = (p + x) / 2)) ? p = m : x = m;
  while ((c = u << 1 | s) === (g = (y >= m) << 1 | h >= w));
  return i[g] = o, i[c] = l, t;
}
function tt(t) {
  var n, e, r = t.length, i, o, l = new Array(r), f = new Array(r), p = 1 / 0, a = 1 / 0, x = -1 / 0, w = -1 / 0;
  for (e = 0; e < r; ++e) isNaN(i = +this._x.call(null, n = t[e])) || isNaN(o = +this._y.call(null, n)) || (l[e] = i, f[e] = o, i < p && (p = i), i > x && (x = i), o < a && (a = o), o > w && (w = o));
  if (p > x || a > w) return this;
  for (this.cover(p, a).cover(x, w), e = 0; e < r; ++e) q(this, l[e], f[e], t[e]);
  return this;
}
function nt(t, n) {
  if (isNaN(t = +t) || isNaN(n = +n)) return this;
  var e = this._x0, r = this._y0, i = this._x1, o = this._y1;
  if (isNaN(e)) i = (e = Math.floor(t)) + 1, o = (r = Math.floor(n)) + 1;
  else {
    for (var l = i - e || 1, f = this._root, p, a; e > t || t >= i || r > n || n >= o; ) switch (a = (n < r) << 1 | t < e, p = new Array(4), p[a] = f, f = p, l *= 2, a) {
      case 0:
        i = e + l, o = r + l;
        break;
      case 1:
        e = i - l, o = r + l;
        break;
      case 2:
        i = e + l, r = o - l;
        break;
      case 3:
        e = i - l, r = o - l;
        break;
    }
    this._root && this._root.length && (this._root = f);
  }
  return this._x0 = e, this._y0 = r, this._x1 = i, this._y1 = o, this;
}
function et() {
  var t = [];
  return this.visit(function(n) {
    if (!n.length) do
      t.push(n.data);
    while (n = n.next);
  }), t;
}
function rt(t) {
  return arguments.length ? this.cover(+t[0][0], +t[0][1]).cover(+t[1][0], +t[1][1]) : isNaN(this._x0) ? void 0 : [[this._x0, this._y0], [this._x1, this._y1]];
}
function z(t, n, e, r, i) {
  this.node = t, this.x0 = n, this.y0 = e, this.x1 = r, this.y1 = i;
}
function it(t, n, e) {
  var r, i = this._x0, o = this._y0, l, f, p, a, x = this._x1, w = this._y1, m = [], h = this._root, y, s;
  for (h && m.push(new z(h, i, o, x, w)), e == null ? e = 1 / 0 : (i = t - e, o = n - e, x = t + e, w = n + e, e *= e); y = m.pop(); ) if (!(!(h = y.node) || (l = y.x0) > x || (f = y.y0) > w || (p = y.x1) < i || (a = y.y1) < o)) if (h.length) {
    var u = (l + p) / 2, c = (f + a) / 2;
    m.push(new z(h[3], u, c, p, a), new z(h[2], l, c, u, a), new z(h[1], u, f, p, c), new z(h[0], l, f, u, c)), (s = (n >= c) << 1 | t >= u) && (y = m[m.length - 1], m[m.length - 1] = m[m.length - 1 - s], m[m.length - 1 - s] = y);
  } else {
    var g = t - +this._x.call(null, h.data), _ = n - +this._y.call(null, h.data), v = g * g + _ * _;
    if (v < e) {
      var d = Math.sqrt(e = v);
      i = t - d, o = n - d, x = t + d, w = n + d, r = h.data;
    }
  }
  return r;
}
function ot(t) {
  if (isNaN(x = +this._x.call(null, t)) || isNaN(w = +this._y.call(null, t))) return this;
  var n, e = this._root, r, i, o, l = this._x0, f = this._y0, p = this._x1, a = this._y1, x, w, m, h, y, s, u, c;
  if (!e) return this;
  if (e.length) for (; ; ) {
    if ((y = x >= (m = (l + p) / 2)) ? l = m : p = m, (s = w >= (h = (f + a) / 2)) ? f = h : a = h, n = e, !(e = e[u = s << 1 | y])) return this;
    if (!e.length) break;
    (n[u + 1 & 3] || n[u + 2 & 3] || n[u + 3 & 3]) && (r = n, c = u);
  }
  for (; e.data !== t; ) if (i = e, !(e = e.next)) return this;
  return (o = e.next) && delete e.next, i ? (o ? i.next = o : delete i.next, this) : n ? (o ? n[u] = o : delete n[u], (e = n[0] || n[1] || n[2] || n[3]) && e === (n[3] || n[2] || n[1] || n[0]) && !e.length && (r ? r[c] = e : this._root = e), this) : (this._root = o, this);
}
function ft(t) {
  for (var n = 0, e = t.length; n < e; ++n) this.remove(t[n]);
  return this;
}
function at() {
  return this._root;
}
function ut() {
  var t = 0;
  return this.visit(function(n) {
    if (!n.length) do
      ++t;
    while (n = n.next);
  }), t;
}
function lt(t) {
  var n = [], e, r = this._root, i, o, l, f, p;
  for (r && n.push(new z(r, this._x0, this._y0, this._x1, this._y1)); e = n.pop(); ) if (!t(r = e.node, o = e.x0, l = e.y0, f = e.x1, p = e.y1) && r.length) {
    var a = (o + f) / 2, x = (l + p) / 2;
    (i = r[3]) && n.push(new z(i, a, x, f, p)), (i = r[2]) && n.push(new z(i, o, x, a, p)), (i = r[1]) && n.push(new z(i, a, l, f, x)), (i = r[0]) && n.push(new z(i, o, l, a, x));
  }
  return this;
}
function st(t) {
  var n = [], e = [], r;
  for (this._root && n.push(new z(this._root, this._x0, this._y0, this._x1, this._y1)); r = n.pop(); ) {
    var i = r.node;
    if (i.length) {
      var o, l = r.x0, f = r.y0, p = r.x1, a = r.y1, x = (l + p) / 2, w = (f + a) / 2;
      (o = i[0]) && n.push(new z(o, l, f, x, w)), (o = i[1]) && n.push(new z(o, x, f, p, w)), (o = i[2]) && n.push(new z(o, l, w, x, a)), (o = i[3]) && n.push(new z(o, x, w, p, a));
    }
    e.push(r);
  }
  for (; r = e.pop(); ) t(r.node, r.x0, r.y0, r.x1, r.y1);
  return this;
}
function ht(t) {
  return t[0];
}
function ct(t) {
  return arguments.length ? (this._x = t, this) : this._x;
}
function pt(t) {
  return t[1];
}
function xt(t) {
  return arguments.length ? (this._y = t, this) : this._y;
}
function P(t, n, e) {
  var r = new J(n ?? ht, e ?? pt, NaN, NaN, NaN, NaN);
  return t == null ? r : r.addAll(t);
}
function J(t, n, e, r, i, o) {
  this._x = t, this._y = n, this._x0 = e, this._y0 = r, this._x1 = i, this._y1 = o, this._root = void 0;
}
function gt(t) {
  for (var n = { data: t.data }, e = n; t = t.next; ) e = e.next = { data: t.data };
  return n;
}
var j = P.prototype = J.prototype;
j.copy = function() {
  var t = new J(this._x, this._y, this._x0, this._y0, this._x1, this._y1), n = this._root, e, r;
  if (!n) return t;
  if (!n.length) return t._root = gt(n), t;
  for (e = [{ source: n, target: t._root = new Array(4) }]; n = e.pop(); ) for (var i = 0; i < 4; ++i) (r = n.source[i]) && (r.length ? e.push({ source: r, target: n.target[i] = new Array(4) }) : n.target[i] = gt(r));
  return t;
};
j.add = $;
j.addAll = tt;
j.cover = nt;
j.data = et;
j.extent = rt;
j.find = it;
j.remove = ot;
j.removeAll = ft;
j.root = at;
j.size = ut;
j.visit = lt;
j.visitAfter = st;
j.x = ct;
j.y = xt;
function N(t) {
  return function() {
    return t;
  };
}
function D(t) {
  return (t() - 0.5) * 1e-6;
}
function Ft(t) {
  return t.x + t.vx;
}
function St(t) {
  return t.y + t.vy;
}
function vt(t) {
  var n, e, r, i = 1, o = 1;
  typeof t != "function" && (t = N(t == null ? 1 : +t));
  function l() {
    for (var a, x = n.length, w, m, h, y, s, u, c = 0; c < o; ++c) for (w = P(n, Ft, St).visitAfter(f), a = 0; a < x; ++a) m = n[a], s = e[m.index], u = s * s, h = m.x + m.vx, y = m.y + m.vy, w.visit(g);
    function g(_, v, d, I, E) {
      var A = _.data, T = _.r, M = s + T;
      if (A) {
        if (A.index > m.index) {
          var F = h - A.x - A.vx, S = y - A.y - A.vy, b = F * F + S * S;
          b < M * M && (F === 0 && (F = D(r), b += F * F), S === 0 && (S = D(r), b += S * S), b = (M - (b = Math.sqrt(b))) / b * i, m.vx += (F *= b) * (M = (T *= T) / (u + T)), m.vy += (S *= b) * M, A.vx -= F * (M = 1 - M), A.vy -= S * M);
        }
        return;
      }
      return v > h + M || I < h - M || d > y + M || E < y - M;
    }
  }
  function f(a) {
    if (a.data) return a.r = e[a.data.index];
    for (var x = a.r = 0; x < 4; ++x) a[x] && a[x].r > a.r && (a.r = a[x].r);
  }
  function p() {
    if (n) {
      var a, x = n.length, w;
      for (e = new Array(x), a = 0; a < x; ++a) w = n[a], e[w.index] = +t(w, a, n);
    }
  }
  return l.initialize = function(a, x) {
    n = a, r = x, p();
  }, l.iterations = function(a) {
    return arguments.length ? (o = +a, l) : o;
  }, l.strength = function(a) {
    return arguments.length ? (i = +a, l) : i;
  }, l.radius = function(a) {
    return arguments.length ? (t = typeof a == "function" ? a : N(+a), p(), l) : t;
  }, l;
}
function Pt(t) {
  return t.index;
}
function mt(t, n) {
  var e = t.get(n);
  if (!e) throw new Error("node not found: " + n);
  return e;
}
function yt(t) {
  var n = Pt, e = w, r, i = N(30), o, l, f, p, a, x = 1;
  t == null && (t = []);
  function w(u) {
    return 1 / Math.min(f[u.source.index], f[u.target.index]);
  }
  function m(u) {
    for (var c = 0, g = t.length; c < x; ++c) for (var _ = 0, v, d, I, E, A, T, M; _ < g; ++_) v = t[_], d = v.source, I = v.target, E = I.x + I.vx - d.x - d.vx || D(a), A = I.y + I.vy - d.y - d.vy || D(a), T = Math.sqrt(E * E + A * A), T = (T - o[_]) / T * u * r[_], E *= T, A *= T, I.vx -= E * (M = p[_]), I.vy -= A * M, d.vx += E * (M = 1 - M), d.vy += A * M;
  }
  function h() {
    if (l) {
      var u, c = l.length, g = t.length, _ = new Map(l.map((d, I) => [n(d, I, l), d])), v;
      for (u = 0, f = new Array(c); u < g; ++u) v = t[u], v.index = u, typeof v.source != "object" && (v.source = mt(_, v.source)), typeof v.target != "object" && (v.target = mt(_, v.target)), f[v.source.index] = (f[v.source.index] || 0) + 1, f[v.target.index] = (f[v.target.index] || 0) + 1;
      for (u = 0, p = new Array(g); u < g; ++u) v = t[u], p[u] = f[v.source.index] / (f[v.source.index] + f[v.target.index]);
      r = new Array(g), y(), o = new Array(g), s();
    }
  }
  function y() {
    if (l) for (var u = 0, c = t.length; u < c; ++u) r[u] = +e(t[u], u, t);
  }
  function s() {
    if (l) for (var u = 0, c = t.length; u < c; ++u) o[u] = +i(t[u], u, t);
  }
  return m.initialize = function(u, c) {
    l = u, a = c, h();
  }, m.links = function(u) {
    return arguments.length ? (t = u, h(), m) : t;
  }, m.id = function(u) {
    return arguments.length ? (n = u, m) : n;
  }, m.iterations = function(u) {
    return arguments.length ? (x = +u, m) : x;
  }, m.strength = function(u) {
    return arguments.length ? (e = typeof u == "function" ? u : N(+u), y(), m) : e;
  }, m.distance = function(u) {
    return arguments.length ? (i = typeof u == "function" ? u : N(+u), s(), m) : i;
  }, m;
}
var Ct = { value: () => {
} };
function _t() {
  for (var t = 0, n = arguments.length, e = {}, r; t < n; ++t) {
    if (!(r = arguments[t] + "") || r in e || /[\s.]/.test(r)) throw new Error("illegal type: " + r);
    e[r] = [];
  }
  return new B(e);
}
function B(t) {
  this._ = t;
}
function Ot(t, n) {
  return t.trim().split(/^|\s+/).map(function(e) {
    var r = "", i = e.indexOf(".");
    if (i >= 0 && (r = e.slice(i + 1), e = e.slice(0, i)), e && !n.hasOwnProperty(e)) throw new Error("unknown type: " + e);
    return { type: e, name: r };
  });
}
B.prototype = _t.prototype = { constructor: B, on: function(t, n) {
  var e = this._, r = Ot(t + "", e), i, o = -1, l = r.length;
  if (arguments.length < 2) {
    for (; ++o < l; ) if ((i = (t = r[o]).type) && (i = Qt(e[i], t.name))) return i;
    return;
  }
  if (n != null && typeof n != "function") throw new Error("invalid callback: " + n);
  for (; ++o < l; ) if (i = (t = r[o]).type) e[i] = wt(e[i], t.name, n);
  else if (n == null) for (i in e) e[i] = wt(e[i], t.name, null);
  return this;
}, copy: function() {
  var t = {}, n = this._;
  for (var e in n) t[e] = n[e].slice();
  return new B(t);
}, call: function(t, n) {
  if ((i = arguments.length - 2) > 0) for (var e = new Array(i), r = 0, i, o; r < i; ++r) e[r] = arguments[r + 2];
  if (!this._.hasOwnProperty(t)) throw new Error("unknown type: " + t);
  for (o = this._[t], r = 0, i = o.length; r < i; ++r) o[r].value.apply(n, e);
}, apply: function(t, n, e) {
  if (!this._.hasOwnProperty(t)) throw new Error("unknown type: " + t);
  for (var r = this._[t], i = 0, o = r.length; i < o; ++i) r[i].value.apply(n, e);
} };
function Qt(t, n) {
  for (var e = 0, r = t.length, i; e < r; ++e) if ((i = t[e]).name === n) return i.value;
}
function wt(t, n, e) {
  for (var r = 0, i = t.length; r < i; ++r) if (t[r].name === n) {
    t[r] = Ct, t = t.slice(0, r).concat(t.slice(r + 1));
    break;
  }
  return e != null && t.push({ name: n, value: e }), t;
}
var K = _t;
var O = 0;
var X = 0;
var Q = 0;
var Nt = 1e3;
var L;
var Y;
var R = 0;
var C = 0;
var H = 0;
var k = typeof performance == "object" && performance.now ? performance : Date;
var At = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(t) {
  setTimeout(t, 17);
};
function W() {
  return C || (At(Xt), C = k.now() + H);
}
function Xt() {
  C = 0;
}
function U() {
  this._call = this._time = this._next = null;
}
U.prototype = G.prototype = { constructor: U, restart: function(t, n, e) {
  if (typeof t != "function") throw new TypeError("callback is not a function");
  e = (e == null ? W() : +e) + (n == null ? 0 : +n), !this._next && Y !== this && (Y ? Y._next = this : L = this, Y = this), this._call = t, this._time = e, V();
}, stop: function() {
  this._call && (this._call = null, this._time = 1 / 0, V());
} };
function G(t, n, e) {
  var r = new U();
  return r.restart(t, n, e), r;
}
function Mt() {
  W(), ++O;
  for (var t = L, n; t; ) (n = C - t._time) >= 0 && t._call.call(void 0, n), t = t._next;
  --O;
}
function dt() {
  C = (R = k.now()) + H, O = X = 0;
  try {
    Mt();
  } finally {
    O = 0, kt(), C = 0;
  }
}
function Yt() {
  var t = k.now(), n = t - R;
  n > Nt && (H -= n, R = t);
}
function kt() {
  for (var t, n = L, e, r = 1 / 0; n; ) n._call ? (r > n._time && (r = n._time), t = n, n = n._next) : (e = n._next, n._next = null, n = t ? t._next = e : L = e);
  Y = t, V(r);
}
function V(t) {
  if (!O) {
    X && (X = clearTimeout(X));
    var n = t - C;
    n > 24 ? (t < 1 / 0 && (X = setTimeout(dt, t - k.now() - H)), Q && (Q = clearInterval(Q))) : (Q || (R = k.now(), Q = setInterval(Yt, Nt)), O = 1, At(dt));
  }
}
function zt() {
  let t = 1;
  return () => (t = (1664525 * t + 1013904223) % 4294967296) / 4294967296;
}
function It(t) {
  return t.x;
}
function jt(t) {
  return t.y;
}
var Bt = 10;
var Lt = Math.PI * (3 - Math.sqrt(5));
function Et(t) {
  var n, e = 1, r = 1e-3, i = 1 - Math.pow(r, 1 / 300), o = 0, l = 0.6, f = /* @__PURE__ */ new Map(), p = G(w), a = K("tick", "end"), x = zt();
  t == null && (t = []);
  function w() {
    m(), a.call("tick", n), e < r && (p.stop(), a.call("end", n));
  }
  function m(s) {
    var u, c = t.length, g;
    s === void 0 && (s = 1);
    for (var _ = 0; _ < s; ++_) for (e += (o - e) * i, f.forEach(function(v) {
      v(e);
    }), u = 0; u < c; ++u) g = t[u], g.fx == null ? g.x += g.vx *= l : (g.x = g.fx, g.vx = 0), g.fy == null ? g.y += g.vy *= l : (g.y = g.fy, g.vy = 0);
    return n;
  }
  function h() {
    for (var s = 0, u = t.length, c; s < u; ++s) {
      if (c = t[s], c.index = s, c.fx != null && (c.x = c.fx), c.fy != null && (c.y = c.fy), isNaN(c.x) || isNaN(c.y)) {
        var g = Bt * Math.sqrt(0.5 + s), _ = s * Lt;
        c.x = g * Math.cos(_), c.y = g * Math.sin(_);
      }
      (isNaN(c.vx) || isNaN(c.vy)) && (c.vx = c.vy = 0);
    }
  }
  function y(s) {
    return s.initialize && s.initialize(t, x), s;
  }
  return h(), n = { tick: m, restart: function() {
    return p.restart(w), n;
  }, stop: function() {
    return p.stop(), n;
  }, nodes: function(s) {
    return arguments.length ? (t = s, h(), f.forEach(y), n) : t;
  }, alpha: function(s) {
    return arguments.length ? (e = +s, n) : e;
  }, alphaMin: function(s) {
    return arguments.length ? (r = +s, n) : r;
  }, alphaDecay: function(s) {
    return arguments.length ? (i = +s, n) : +i;
  }, alphaTarget: function(s) {
    return arguments.length ? (o = +s, n) : o;
  }, velocityDecay: function(s) {
    return arguments.length ? (l = 1 - s, n) : 1 - l;
  }, randomSource: function(s) {
    return arguments.length ? (x = s, f.forEach(y), n) : x;
  }, force: function(s, u) {
    return arguments.length > 1 ? (u == null ? f.delete(s) : f.set(s, y(u)), n) : f.get(s);
  }, find: function(s, u, c) {
    var g = 0, _ = t.length, v, d, I, E, A;
    for (c == null ? c = 1 / 0 : c *= c, g = 0; g < _; ++g) E = t[g], v = s - E.x, d = u - E.y, I = v * v + d * d, I < c && (A = E, c = I);
    return A;
  }, on: function(s, u) {
    return arguments.length > 1 ? (a.on(s, u), n) : a.on(s);
  } };
}
function Tt() {
  var t, n, e, r, i = N(-30), o, l = 1, f = 1 / 0, p = 0.81;
  function a(h) {
    var y, s = t.length, u = P(t, It, jt).visitAfter(w);
    for (r = h, y = 0; y < s; ++y) n = t[y], u.visit(m);
  }
  function x() {
    if (t) {
      var h, y = t.length, s;
      for (o = new Array(y), h = 0; h < y; ++h) s = t[h], o[s.index] = +i(s, h, t);
    }
  }
  function w(h) {
    var y = 0, s, u, c = 0, g, _, v;
    if (h.length) {
      for (g = _ = v = 0; v < 4; ++v) (s = h[v]) && (u = Math.abs(s.value)) && (y += s.value, c += u, g += u * s.x, _ += u * s.y);
      h.x = g / c, h.y = _ / c;
    } else {
      s = h, s.x = s.data.x, s.y = s.data.y;
      do
        y += o[s.data.index];
      while (s = s.next);
    }
    h.value = y;
  }
  function m(h, y, s, u) {
    if (!h.value) return true;
    var c = h.x - n.x, g = h.y - n.y, _ = u - y, v = c * c + g * g;
    if (_ * _ / p < v) return v < f && (c === 0 && (c = D(e), v += c * c), g === 0 && (g = D(e), v += g * g), v < l && (v = Math.sqrt(l * v)), n.vx += c * h.value * r / v, n.vy += g * h.value * r / v), true;
    if (h.length || v >= f) return;
    (h.data !== n || h.next) && (c === 0 && (c = D(e), v += c * c), g === 0 && (g = D(e), v += g * g), v < l && (v = Math.sqrt(l * v)));
    do
      h.data !== n && (_ = o[h.data.index] * r / v, n.vx += c * _, n.vy += g * _);
    while (h = h.next);
  }
  return a.initialize = function(h, y) {
    t = h, e = y, x();
  }, a.strength = function(h) {
    return arguments.length ? (i = typeof h == "function" ? h : N(+h), x(), a) : i;
  }, a.distanceMin = function(h) {
    return arguments.length ? (l = h * h, a) : Math.sqrt(l);
  }, a.distanceMax = function(h) {
    return arguments.length ? (f = h * h, a) : Math.sqrt(f);
  }, a.theta = function(h) {
    return arguments.length ? (p = h * h, a) : Math.sqrt(p);
  }, a;
}
function Dt(t) {
  var n = N(0.1), e, r, i;
  typeof t != "function" && (t = N(t == null ? 0 : +t));
  function o(f) {
    for (var p = 0, a = e.length, x; p < a; ++p) x = e[p], x.vx += (i[p] - x.x) * r[p] * f;
  }
  function l() {
    if (e) {
      var f, p = e.length;
      for (r = new Array(p), i = new Array(p), f = 0; f < p; ++f) r[f] = isNaN(i[f] = +t(e[f], f, e)) ? 0 : +n(e[f], f, e);
    }
  }
  return o.initialize = function(f) {
    e = f, l();
  }, o.strength = function(f) {
    return arguments.length ? (n = typeof f == "function" ? f : N(+f), l(), o) : n;
  }, o.x = function(f) {
    return arguments.length ? (t = typeof f == "function" ? f : N(+f), l(), o) : t;
  }, o;
}
function bt(t) {
  var n = N(0.1), e, r, i;
  typeof t != "function" && (t = N(t == null ? 0 : +t));
  function o(f) {
    for (var p = 0, a = e.length, x; p < a; ++p) x = e[p], x.vy += (i[p] - x.y) * r[p] * f;
  }
  function l() {
    if (e) {
      var f, p = e.length;
      for (r = new Array(p), i = new Array(p), f = 0; f < p; ++f) r[f] = isNaN(i[f] = +t(e[f], f, e)) ? 0 : +n(e[f], f, e);
    }
  }
  return o.initialize = function(f) {
    e = f, l();
  }, o.strength = function(f) {
    return arguments.length ? (n = typeof f == "function" ? f : N(+f), l(), o) : n;
  }, o.y = function(f) {
    return arguments.length ? (t = typeof f == "function" ? f : N(+f), l(), o) : t;
  }, o;
}

// demo/modules/graph-motion.js
function createGraphPhysics(graph, { reducedMotion = false } = {}) {
  const nodes = graph.nodes.map((n) => ({ ...n })), links = graph.links.map((l) => ({ ...l }));
  const simulation = Et(nodes).stop().force("link", yt(links).id((n) => n.id).distance((l) => l.kind === "category" ? 65 : 85).strength(0.32)).force("charge", Tt().strength((n) => n.kind === "category" ? -175 : -55).distanceMax(400)).force("collision", vt((n) => n.radius + 7).iterations(2)).force("center", Z(0, 0).strength(0.08)).force("x", Dt(0).strength(0.025)).force("y", bt(0).strength(0.025)).alphaDecay(0.023).velocityDecay(0.34);
  simulation.tick(reducedMotion ? 240 : 24);
  return { nodes, links, simulation };
}
function createGraphAnimator(simulation, { draw, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame, paused = false, visible = true } = {}) {
  let frame = null, last = null, disposed = false;
  simulation.stop();
  const active = () => !disposed && !paused && visible && (simulation.alpha() >= simulation.alphaMin() || simulation.alphaTarget() > simulation.alphaMin());
  function schedule() {
    if (frame === null && active()) frame = requestFrame(step);
  }
  function step(time) {
    frame = null;
    if (!active()) return;
    if (last === null || time - last >= 1e3 / 30 - 1) {
      simulation.tick();
      last = time;
      draw();
    }
    schedule();
  }
  function cancel() {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    last = null;
  }
  return {
    wake(alpha = 0.3) {
      if (disposed) return;
      simulation.alpha(Math.max(simulation.alpha(), alpha));
      schedule();
    },
    setPaused(value) {
      paused = value;
      cancel();
      schedule();
    },
    setVisible(value) {
      visible = value;
      cancel();
      schedule();
    },
    destroy() {
      disposed = true;
      cancel();
      simulation.stop();
    }
  };
}

// demo/modules/knowledge-graph.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var NS = "http://www.w3.org/2000/svg";
var svgElement = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
};
function mountKnowledgeGraph(host, graph, { onRead, onFacet }) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const { nodes, links, simulation } = createGraphPhysics(graph, { reducedMotion: reduced.matches });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  host.innerHTML = `<div class="knowledge-card">
    <div class="graph-toolbar"><div class="graph-legend">${Object.entries(NODE_LABELS).map(([kind, label]) => `<span><i class="node-dot node-${kind}"></i>${label}</span>`).join("")}</div>
    <button class="text-button" data-graph-fullscreen>\u5168\u5C4F \u2197</button></div>
    <div class="graph-stage"><svg class="knowledge-svg" role="img" aria-label="\u52A8\u6001\u60C5\u62A5\u77E5\u8BC6\u56FE\u8C31\uFF1A\u62D6\u52A8\u6C14\u6CE1\u53EF\u7275\u52A8\u5173\u8054\uFF0C\u70B9\u9009\u67E5\u770B\u60C5\u62A5\uFF1B\u4E5F\u53EF\u4F7F\u7528\u4E0B\u65B9\u8282\u70B9\u9009\u62E9\u5668\u3002"></svg>
      <div class="graph-tools" role="group" aria-label="\u56FE\u8C31\u64CD\u4F5C"><button aria-label="\u653E\u5927\u56FE\u8C31" data-graph-zoom="1.3">\uFF0B</button><button aria-label="\u7F29\u5C0F\u56FE\u8C31" data-graph-zoom="0.77">\u2212</button><button data-graph-fit>\u590D\u4F4D</button><button data-graph-labels aria-pressed="false">\u6807\u7B7E</button><button data-graph-motion aria-pressed="false">\u6682\u505C</button></div>
    </div><p class="graph-gesture">\u62D6\u52A8\u6C14\u6CE1\u7275\u52A8\u5173\u8054 \xB7 \u7A7A\u767D\u5904\u5E73\u79FB \xB7 \u53CC\u6307\u7F29\u653E</p>
    <label class="graph-picker-label">\u67E5\u627E\u56FE\u8C31\u8282\u70B9<select class="graph-picker"><option value="">\u9009\u4E00\u4E2A\u4E3B\u9898\u3001\u9886\u57DF\u3001\u4FE1\u6E90\u6216\u60C5\u62A5</option>${Object.entries(NODE_LABELS).map(([kind, label]) => `<optgroup label="${label}">${nodes.filter((n) => n.kind === kind).map((n) => `<option value="${esc(n.id)}">${esc(n.label)}${kind !== "intelligence" ? " \xB7 " + n.count + " \u6761" : ""}</option>`).join("")}</optgroup>`).join("")}</select></label>
    <div class="graph-selection" aria-live="polite"><span class="eyebrow">\u987A\u7740\u7EBF\u7D22\uFF0C\u7EE7\u7EED\u63A2\u7D22</span><p>\u70B9\u9009\u8282\u70B9\uFF0C\u67E5\u770B\u76F8\u5173\u60C5\u62A5\u4E0E\u5B8C\u6574\u6765\u6E90\u3002</p></div>
  </div>`;
  const root = host.firstElementChild, svg = root.querySelector("svg"), stage = root.querySelector(".graph-stage"), picker = root.querySelector("select"), panel = root.querySelector(".graph-selection");
  const layer = svgElement("g"), lineLayer = svgElement("g"), nodeLayer = svgElement("g");
  layer.append(lineLayer, nodeLayer);
  svg.append(layer);
  let hovered = null, paused = reduced.matches, inView = false;
  let selected = null, labels = false, camera = { x: 0, y: 0, k: 1 }, width = 600, height = 430, disposed = false, fullscreen = null;
  const lineEls = links.map((l) => {
    const el = svgElement("line", { x1: l.source.x, y1: l.source.y, x2: l.target.x, y2: l.target.y, class: "graph-edge" });
    lineLayer.append(el);
    return el;
  });
  const nodeEls = nodes.map((n) => {
    const group = svgElement("g", { transform: `translate(${n.x},${n.y})`, class: `graph-node node-${n.kind}`, "data-node-id": n.id });
    const hit = svgElement("circle", { r: Math.max(15, n.radius + 4), class: "graph-hit" });
    const shape = svgElement("circle", { r: n.radius, class: "graph-shape" });
    const label = svgElement("text", { y: -n.radius - 8, "text-anchor": "middle", class: "graph-node-label" });
    label.textContent = n.label.length > 16 ? n.label.slice(0, 15) + "\u2026" : n.label;
    const title = svgElement("title");
    title.textContent = NODE_LABELS[n.kind] + "\uFF1A" + n.label;
    group.append(hit, shape, label, title);
    nodeLayer.append(group);
    return group;
  });
  function paint() {
    lineEls.forEach((el, i) => {
      const l = links[i];
      el.setAttribute("x1", l.source.x);
      el.setAttribute("y1", l.source.y);
      el.setAttribute("x2", l.target.x);
      el.setAttribute("y2", l.target.y);
    });
    transform();
  }
  const animator = createGraphAnimator(simulation, { draw: paint, paused, visible: false });
  const motionButton = root.querySelector("[data-graph-motion]");
  function syncMotion() {
    motionButton.textContent = paused ? "\u7EE7\u7EED" : "\u6682\u505C";
    motionButton.setAttribute("aria-label", paused ? "\u7EE7\u7EED\u52A8\u6001\u5E03\u5C40" : "\u6682\u505C\u52A8\u6001\u5E03\u5C40");
    motionButton.setAttribute("aria-pressed", String(paused));
    animator.setPaused(paused);
    animator.setVisible(inView && !document.hidden);
  }
  function transform() {
    layer.setAttribute("transform", `translate(${camera.x},${camera.y}) scale(${camera.k})`);
    const scale = Math.max(1, 0.68 / camera.k);
    nodeEls.forEach((el, i) => el.setAttribute("transform", `translate(${nodes[i].x},${nodes[i].y}) scale(${scale})`));
  }
  function fit() {
    if (disposed) return;
    width = stage.clientWidth || 600;
    height = stage.clientHeight || 430;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y), minX = Math.min(...xs) - 40, maxX = Math.max(...xs) + 40, minY = Math.min(...ys) - 55, maxY = Math.max(...ys) + 35;
    const k2 = Math.min((width - 28) / (maxX - minX + 70), (height - 68) / (maxY - minY + 70), 1.4);
    camera = { k: k2, x: width / 2 - (minX + maxX) / 2 * k2, y: (height - 40) / 2 - (minY + maxY) / 2 * k2 };
    transform();
  }
  function highlight() {
    const focus = hovered || selected;
    const neighborIds = new Set(focus ? [focus.id] : []);
    for (const l of links) if (focus && (l.source.id === focus.id || l.target.id === focus.id)) {
      neighborIds.add(l.source.id);
      neighborIds.add(l.target.id);
    }
    nodeEls.forEach((el, i) => {
      const n = nodes[i];
      el.classList.toggle("is-muted", !!focus && !neighborIds.has(n.id));
      el.classList.toggle("is-selected", focus?.id === n.id);
      el.querySelector("text").style.display = n.kind === "category" || labels && n.kind !== "intelligence" || focus?.id === n.id ? "" : "none";
    });
    lineEls.forEach((el, i) => {
      const l = links[i];
      el.classList.toggle("is-active", !!focus && (l.source.id === focus.id || l.target.id === focus.id));
      el.classList.toggle("is-muted", !!focus && l.source.id !== focus.id && l.target.id !== focus.id);
    });
  }
  function selectNode(id) {
    hovered = null;
    selected = byId.get(id) || null;
    picker.value = selected?.id || "";
    highlight();
    if (!selected) {
      panel.innerHTML = '<span class="eyebrow">\u987A\u7740\u7EBF\u7D22\uFF0C\u7EE7\u7EED\u63A2\u7D22</span><p>\u70B9\u9009\u8282\u70B9\uFF0C\u67E5\u770B\u76F8\u5173\u60C5\u62A5\u4E0E\u5B8C\u6574\u6765\u6E90\u3002</p>';
      return;
    }
    const n = selected;
    if (n.kind === "intelligence") {
      panel.innerHTML = `<span class="eyebrow">\u60C5\u62A5 \xB7 ${esc(n.record.reportDate)} \u6536\u5F55</span><h3>${esc(n.label)}</h3><p>${esc(n.record.summary?.slice(0, 140) || "\u5C55\u5F00\u67E5\u770B\u6B63\u6587\u4E0E\u6765\u6E90\u3002")}</p><button class="secondary-button" data-graph-read="${esc(n.key)}">\u9605\u8BFB\u5168\u6587 \u2192</button>`;
    } else {
      const related = links.filter((l) => l.target.id === n.id).map((l) => l.source);
      panel.innerHTML = `<span class="eyebrow">${NODE_LABELS[n.kind]} \xB7 \u56FE\u4E2D\u5173\u8054 ${n.count} \u6761</span><h3>${esc(n.label)}</h3><button class="secondary-button" data-graph-facet>\u67E5\u770B\u5168\u90E8\u76F8\u5173\u60C5\u62A5 \u2192</button><div class="graph-related">${related.slice(0, 3).map((r) => `<button data-graph-read="${esc(r.key)}">${esc(r.label)} <span aria-hidden="true">\u2197</span></button>`).join("")}</div>`;
    }
  }
  function zoom(factor, x = width / 2, y = height / 2) {
    const next = Math.max(0.12, Math.min(4, camera.k * factor)), f = next / camera.k;
    camera = { k: next, x: x - (x - camera.x) * f, y: y - (y - camera.y) * f };
    transform();
  }
  function point(e) {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) * width / r.width, y: (e.clientY - r.top) * height / r.height };
  }
  const pointers = /* @__PURE__ */ new Map();
  let gesture = null;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const midpoint = () => {
    const [a, b] = [...pointers.values()];
    return b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
  };
  const world = (p) => ({ x: (p.x - camera.x) / camera.k, y: (p.y - camera.y) / camera.k });
  function releaseNode() {
    if (gesture?.node) {
      gesture.node.fx = null;
      gesture.node.fy = null;
      gesture.node = null;
    }
    simulation.alphaTarget(0);
    root.classList.remove("is-dragging");
  }
  function cancelGesture() {
    releaseNode();
    gesture = null;
    for (const id of [...pointers.keys()]) {
      pointers.delete(id);
      if (svg.hasPointerCapture(id)) svg.releasePointerCapture(id);
    }
    hovered = null;
    highlight();
  }
  function down(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (pointers.size >= 2) return;
    const p = point(e);
    pointers.set(e.pointerId, p);
    svg.setPointerCapture(e.pointerId);
    if (pointers.size > 1) {
      releaseNode();
      gesture = { mode: "pinch", moved: true, distance: distance(), mid: midpoint() };
      return;
    }
    const node = byId.get(e.target.closest("[data-node-id]")?.dataset.nodeId), pos = world(p);
    hovered = null;
    gesture = { mode: node ? "node" : "pan", start: p, node, moved: false, offset: node ? { x: node.x - pos.x, y: node.y - pos.y } : null };
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
      simulation.alphaTarget(0.12);
      animator.wake(0.22);
    }
  }
  function move(e) {
    if (!pointers.has(e.pointerId) || !gesture) {
      if (e.pointerType === "mouse" && !pointers.size) {
        const node = byId.get(e.target.closest("[data-node-id]")?.dataset.nodeId) || null;
        if (node !== hovered) {
          hovered = node;
          highlight();
        }
      }
      return;
    }
    const p = point(e), previous = pointers.get(e.pointerId);
    pointers.set(e.pointerId, p);
    if (pointers.size > 1) {
      const d = distance(), mid = midpoint();
      zoom(gesture.distance ? d / gesture.distance : 1, gesture.mid.x, gesture.mid.y);
      camera.x += mid.x - gesture.mid.x;
      camera.y += mid.y - gesture.mid.y;
      transform();
      gesture.distance = d;
      gesture.mid = mid;
      return;
    }
    if (Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) > 5) gesture.moved = true;
    if (!gesture.moved) return;
    if (gesture.node) {
      const pos = world(p), n = gesture.node;
      n.x = n.fx = pos.x + gesture.offset.x;
      n.y = n.fy = pos.y + gesture.offset.y;
      n.vx = n.vy = 0;
      root.classList.add("is-dragging");
      paint();
    } else {
      camera.x += p.x - previous.x;
      camera.y += p.y - previous.y;
      transform();
    }
  }
  function up(e) {
    if (!pointers.has(e.pointerId)) return;
    const tap = gesture && !gesture.moved && pointers.size === 1 && e.type === "pointerup", node = gesture?.node;
    releaseNode();
    pointers.delete(e.pointerId);
    if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    if (tap) selectNode(node?.id);
    if (!pointers.size) {
      gesture = null;
      animator.wake(0.2);
    } else gesture = { mode: "pan", start: [...pointers.values()][0], moved: true, node: null };
  }
  function leave() {
    if (!pointers.size) {
      hovered = null;
      highlight();
    }
  }
  function wheel(e) {
    e.preventDefault();
    const p = point(e);
    zoom(Math.exp(-e.deltaY * 2e-3), p.x, p.y);
  }
  function closeFullscreen() {
    if (!fullscreen) return;
    const dialog = fullscreen;
    fullscreen = null;
    host.append(root);
    dialog.close();
    dialog.remove();
    root.querySelector("[data-graph-fullscreen]").textContent = "\u5168\u5C4F \u2197";
    fit();
  }
  function toggleFullscreen() {
    if (fullscreen) {
      closeFullscreen();
      return;
    }
    fullscreen = document.createElement("dialog");
    fullscreen.className = "graph-fullscreen";
    fullscreen.setAttribute("aria-label", "\u77E5\u8BC6\u56FE\u8C31\u5168\u5C4F");
    fullscreen.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeFullscreen();
    });
    fullscreen.append(root);
    document.body.append(fullscreen);
    root.querySelector("[data-graph-fullscreen]").textContent = "\u9000\u51FA\u5168\u5C4F";
    fullscreen.showModal();
    fit();
  }
  function click(e) {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.graphZoom) zoom(Number(b.dataset.graphZoom));
    else if (b.hasAttribute("data-graph-fit")) {
      cancelGesture();
      selectNode(null);
      fit();
      animator.wake(0.4);
    } else if (b.hasAttribute("data-graph-labels")) {
      labels = !labels;
      b.setAttribute("aria-pressed", labels);
      highlight();
    } else if (b.hasAttribute("data-graph-motion")) {
      paused = !paused;
      syncMotion();
      if (!paused) animator.wake(0.35);
    } else if (b.hasAttribute("data-graph-fullscreen")) toggleFullscreen();
    else if (b.dataset.graphRead) onRead(b.dataset.graphRead);
    else if (b.hasAttribute("data-graph-facet") && selected) onFacet({ kind: selected.kind, value: selected.label });
  }
  const change = () => selectNode(picker.value);
  root.addEventListener("click", click);
  picker.addEventListener("change", change);
  svg.addEventListener("pointerdown", down);
  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);
  svg.addEventListener("lostpointercapture", up);
  svg.addEventListener("pointerleave", leave);
  svg.addEventListener("wheel", wheel, { passive: false });
  const observer = new ResizeObserver(fit);
  observer.observe(stage);
  fit();
  highlight();
  const viewport = new IntersectionObserver((entries) => {
    inView = entries.some((e) => e.isIntersecting);
    animator.setVisible(inView && !document.hidden);
  });
  viewport.observe(stage);
  function visibility() {
    if (document.hidden) cancelGesture();
    animator.setVisible(inView && !document.hidden);
  }
  function preference() {
    paused = reduced.matches;
    syncMotion();
    if (!paused) animator.wake(0.3);
  }
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", preference);
  syncMotion();
  animator.wake(simulation.alpha());
  return () => {
    disposed = true;
    animator.destroy();
    cancelGesture();
    observer.disconnect();
    viewport.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    reduced.removeEventListener("change", preference);
    closeFullscreen();
    root.removeEventListener("click", click);
    picker.removeEventListener("change", change);
    svg.removeEventListener("pointerdown", down);
    svg.removeEventListener("pointermove", move);
    svg.removeEventListener("pointerup", up);
    svg.removeEventListener("pointercancel", up);
    svg.removeEventListener("lostpointercapture", up);
    svg.removeEventListener("pointerleave", leave);
    svg.removeEventListener("wheel", wheel);
  };
}
export {
  mountKnowledgeGraph
};
