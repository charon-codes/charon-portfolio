/* logic.js — catalogue filtering, sorting, cart maths and checkout validation. Money is integer cents. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ShopLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function formatMoney(c) { return (c < 0 ? "-" : "") + "$" + (Math.abs(c) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function filterProducts(list, f) {
    var q = (f.q || "").trim().toLowerCase();
    return list.filter(function (p) {
      if (f.category && f.category !== "all" && p.cat !== f.category) return false;
      if (f.maxPrice != null && p.price > f.maxPrice) return false;
      if (f.inStockOnly && p.stock <= 0) return false;
      if (q && (p.name + " " + p.desc + " " + p.cat + " " + (p.specs || []).join(" ")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function sortProducts(list, key) {
    var a = list.slice(), by = {
      "price-asc": function (x, y) { return x.price - y.price; }, "price-desc": function (x, y) { return y.price - x.price; },
      name: function (x, y) { return x.name.localeCompare(y.name); }, rating: function (x, y) { return y.rating - x.rating; }
    }[key];
    return by ? a.sort(by) : a; // "featured" keeps catalogue order
  }

  /** Cart = { [productId]: qty }. All helpers return a NEW cart and never exceed stock. */
  function addToCart(cart, id, qty, stock) { return setQty(cart, id, (cart[id] || 0) + (qty || 1), stock); }
  function setQty(cart, id, qty, stock) {
    var n = Object.assign({}, cart), q = Math.floor(qty);
    if (!(q > 0)) { delete n[id]; return n; }
    n[id] = stock != null ? Math.min(q, stock) : q; if (n[id] <= 0) delete n[id];
    return n;
  }
  function totals(cart, products, opt) {
    opt = Object.assign({ taxRate: 0.08, freeFrom: 7500, shipping: 599 }, opt || {});
    var byId = {}; products.forEach(function (p) { byId[p.id] = p; });
    var lines = [], count = 0, subtotal = 0;
    Object.keys(cart).forEach(function (id) {
      var p = byId[id]; if (!p) return; var q = cart[id], t = p.price * q;
      lines.push({ id: id, name: p.name, qty: q, unit: p.price, total: t }); count += q; subtotal += t;
    });
    var shipping = count === 0 || subtotal >= opt.freeFrom ? 0 : opt.shipping, tax = Math.round(subtotal * opt.taxRate);
    return { lines: lines, count: count, subtotal: subtotal, shipping: shipping, tax: tax, total: subtotal + shipping + tax, toFree: count && subtotal < opt.freeFrom ? opt.freeFrom - subtotal : 0 };
  }
  /** Drop cart lines whose product vanished, clamp quantities to stock (e.g. data from an old session). */
  function sanitizeCart(cart, products) {
    var out = {}, byId = {}; products.forEach(function (p) { byId[p.id] = p; });
    Object.keys(cart || {}).forEach(function (id) { var p = byId[id], q = Math.floor(cart[id]); if (p && q > 0 && p.stock > 0) out[id] = Math.min(q, p.stock); });
    return out;
  }
  function validateCheckout(d) {
    var e = {};
    if (!d.name || d.name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((d.email || "").trim())) e.email = "Enter a valid email address.";
    if (!d.address || d.address.trim().length < 5) e.address = "Enter your street address.";
    if (!/^\d{4,6}(-\d{4})?$/.test((d.zip || "").trim())) e.zip = "Enter a valid postal code.";
    return { ok: Object.keys(e).length === 0, errors: e };
  }
  return { formatMoney: formatMoney, filterProducts: filterProducts, sortProducts: sortProducts, addToCart: addToCart, setQty: setQty, totals: totals, sanitizeCart: sanitizeCart, validateCheckout: validateCheckout };
});
