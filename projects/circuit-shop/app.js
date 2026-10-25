/* app.js — Voltix demo store UI. Catalogue/cart maths live in logic.js (unit-tested). */
(function () {
  "use strict";
  var L = window.ShopLogic, $ = function (id) { return document.getElementById(id); }, KEY = "voltix.cart.v1";
  var P = [
    { id: "arm-m4", name: "ARM Cortex-M4 Dev Board", cat: "Boards", price: 2490, stock: 14, rating: 4.8, hue: 210, desc: "A 168 MHz Cortex-M4 board with FPU, 1 MB flash and a USB programmer on board. Great for learning bare-metal ARM.", specs: ["168 MHz, FPU", "1 MB flash / 192 KB RAM", "On-board USB programmer"] },
    { id: "wifi-mcu", name: "Wi-Fi + BLE MCU Board", cat: "Boards", price: 1190, stock: 40, rating: 4.6, hue: 190, desc: "Dual-core microcontroller with Wi-Fi and Bluetooth LE for connected projects.", specs: ["Dual-core 240 MHz", "Wi-Fi + BLE 5", "30 GPIO"] },
    { id: "m0-mini", name: "Cortex-M0 Mini Board", cat: "Boards", price: 690, stock: 0, rating: 4.3, hue: 230, desc: "Tiny low-power board for battery projects. Currently out of stock.", specs: ["48 MHz", "64 KB flash", "Breadboard friendly"] },
    { id: "sensor-kit", name: "Sensor Kit (37 modules)", cat: "Sensors", price: 2290, stock: 22, rating: 4.5, hue: 150, desc: "Temperature, light, motion, sound and more, with a printed pinout guide.", specs: ["37 modules", "3.3 V / 5 V", "Pinout guide"] },
    { id: "ultra", name: "Ultrasonic Distance Sensor", cat: "Sensors", price: 349, stock: 80, rating: 4.4, hue: 170, desc: "Measures 2 cm to 4 m using sound pulses.", specs: ["2 cm – 4 m", "5 V", "Trigger / echo pins"] },
    { id: "imu", name: "6-Axis Motion Sensor (IMU)", cat: "Sensors", price: 599, stock: 31, rating: 4.7, hue: 130, desc: "Accelerometer and gyroscope over I²C for balance and orientation projects.", specs: ["±16 g / ±2000 °/s", "I²C", "3.3 V"] },
    { id: "dmm", name: "Digital Multimeter", cat: "Tools", price: 3490, stock: 9, rating: 4.7, hue: 40, desc: "True-RMS multimeter with continuity buzzer, diode test and auto-range.", specs: ["True RMS", "Auto-range", "CAT III 600 V"] },
    { id: "iron", name: "Soldering Station 60 W", cat: "Tools", price: 5900, stock: 6, rating: 4.9, hue: 20, desc: "Temperature-controlled station with digital display, sleep mode and spare tips.", specs: ["200–450 °C", "60 W", "5 spare tips"] },
    { id: "logic", name: "8-Channel Logic Analyzer", cat: "Tools", price: 1490, stock: 17, rating: 4.5, hue: 280, desc: "24 MHz USB logic analyzer for debugging I²C, SPI and UART.", specs: ["8 channels", "24 MHz", "USB 2.0"] },
    { id: "bread", name: "Breadboard 830 points", cat: "Parts", price: 549, stock: 120, rating: 4.6, hue: 0, desc: "Full-size solderless breadboard with power rails and adhesive back.", specs: ["830 tie points", "Power rails", "Adhesive back"] },
    { id: "jumper", name: "Jumper Wire Set (120 pcs)", cat: "Parts", price: 499, stock: 200, rating: 4.4, hue: 320, desc: "Male–male, male–female and female–female wires in assorted lengths.", specs: ["120 pieces", "3 types", "10–30 cm"] },
    { id: "oled", name: "0.96\" OLED Display", cat: "Parts", price: 649, stock: 54, rating: 4.6, hue: 250, desc: "128×64 monochrome I²C display, crisp and low power.", specs: ["128×64", "I²C", "3.3–5 V"] }
  ];
  var CATS = ["all", "Boards", "Sensors", "Tools", "Parts"], F = { q: "", category: "all", maxPrice: 10000, inStockOnly: false, sort: "featured" };
  var cart = L.sanitizeCart(load(), P);

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* in-memory only */ } }
  function announce(m) { $("live").textContent = ""; setTimeout(function () { $("live").textContent = m; }, 30); }
  function byId(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* generated "PCB" artwork: deterministic per product, no image files */
  function art(p) {
    var h = p.hue, ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"); s.setAttribute("viewBox", "0 0 200 150"); s.setAttribute("aria-hidden", "true");
    var seed = 0; for (var i = 0; i < p.id.length; i++) seed = (seed * 31 + p.id.charCodeAt(i)) >>> 0; var r = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    var svg = '<rect width="200" height="150" fill="hsl(' + h + ',45%,16%)"/><rect x="26" y="22" width="148" height="106" rx="10" fill="hsl(' + h + ',55%,30%)" stroke="hsl(' + h + ',70%,55%)" stroke-width="2"/>';
    for (i = 0; i < 6; i++) { var y = 34 + i * 16; svg += '<path d="M34 ' + y + 'H' + (60 + r() * 30) + 'l8 ' + (r() > .5 ? 8 : -8) + 'h' + (20 + r() * 40) + '" fill="none" stroke="hsl(' + h + ',80%,65%)" stroke-opacity=".55" stroke-width="1.5"/>'; }
    svg += '<rect x="' + (70 + r() * 20) + '" y="52" width="46" height="46" rx="4" fill="#0b0f1a" stroke="hsl(' + h + ',80%,70%)"/><circle cx="82" cy="64" r="2.4" fill="#fff"/>';
    for (i = 0; i < 9; i++) svg += '<rect x="' + (32 + i * 15) + '" y="116" width="6" height="9" fill="#e9c35a"/>';
    s.innerHTML = svg; return s;
  }
  function stars(r) { var n = Math.round(r); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

  function view() { return L.sortProducts(L.filterProducts(P, F), F.sort); }
  function renderGrid() {
    var list = view(), g = $("grid"); g.innerHTML = "";
    list.forEach(function (p) {
      var li = el("li", "card"), a = el("button", "art"); a.type = "button"; a.setAttribute("aria-label", "View details for " + p.name); a.appendChild(art(p)); a.onclick = function () { openProduct(p); };
      var b = el("div", "card-b"), h = el("h3"), hb = el("button", null, p.name); hb.type = "button"; hb.onclick = function () { openProduct(p); }; h.appendChild(hb);
      var meta = el("div", "meta"); meta.innerHTML = '<span class="stars" aria-hidden="true">' + stars(p.rating) + "</span> " + p.rating.toFixed(1) + " · " + p.cat; meta.setAttribute("aria-label", "Rated " + p.rating + " out of 5, " + p.cat);
      var pr = el("div", "price", L.formatMoney(p.price)), st = el("div", "stock " + (p.stock > 0 ? "in" : "out"), p.stock > 0 ? (p.stock < 10 ? "Only " + p.stock + " left" : "In stock") : "Out of stock");
      var add = el("button", "add", p.stock > 0 ? "Add to cart" : "Unavailable"); add.type = "button"; add.disabled = p.stock <= 0; add.onclick = function () { addItem(p); };
      b.append(h, meta, st, pr, add); li.append(a, b); g.appendChild(li);
    });
    $("count").textContent = list.length + " of " + P.length + " products";
    $("none").hidden = list.length > 0;
  }
  function renderCats() {
    var box = $("cats"); box.innerHTML = "";
    CATS.forEach(function (c) { var l = el("label"), i = el("input"); i.type = "radio"; i.name = "cat"; i.value = c; i.checked = F.category === c; i.onchange = function () { F.category = c; renderGrid(); }; l.append(i, document.createTextNode(c === "all" ? "All products" : c)); box.appendChild(l); });
  }

  function openProduct(p) {
    var body = $("pd-body"); body.innerHTML = "";
    var a = el("div"); a.className = "art"; a.appendChild(art(p));
    var t = el("div", "pd-t"), h = el("h2", null, p.name); h.id = "pd-t";
    var ul = el("ul"); p.specs.forEach(function (s) { ul.appendChild(el("li", null, s)); });
    var add = el("button", "primary", p.stock > 0 ? "Add to cart · " + L.formatMoney(p.price) : "Out of stock"); add.type = "button"; add.disabled = p.stock <= 0; add.onclick = function () { addItem(p); $("pd").close(); };
    var close = el("button", "ghost", "Close"); close.type = "button"; close.onclick = function () { $("pd").close(); };
    t.append(h, el("div", "meta", stars(p.rating) + " " + p.rating.toFixed(1) + " · " + p.cat), el("p", null, p.desc), ul, add, close);
    body.append(a, t); $("pd").showModal();
  }

  function addItem(p) {
    var before = cart[p.id] || 0; cart = L.addToCart(cart, p.id, 1, p.stock); save(); renderCart();
    announce(cart[p.id] > before ? p.name + " added to cart" : "No more " + p.name + " in stock");
  }
  function renderCart() {
    var t = L.totals(cart, P); $("badge").textContent = t.count; $("cartBtn").setAttribute("aria-label", "Open cart, " + t.count + " item" + (t.count === 1 ? "" : "s"));
    var v = $("cart-view"); v.innerHTML = "";
    if (!t.count) { v.appendChild(el("p", "empty", "Your cart is empty.")); return; }
    t.lines.forEach(function (ln) {
      var p = byId(ln.id), d = el("div", "line"), n = el("div"), q = el("div", "q"); n.append(el("strong", null, ln.name), el("div", "meta", L.formatMoney(ln.unit) + " each"));
      var minus = el("button", null, "−"), plus = el("button", null, "+"), c = el("span", null, String(ln.qty)); minus.type = plus.type = "button";
      minus.setAttribute("aria-label", "Decrease quantity of " + ln.name); plus.setAttribute("aria-label", "Increase quantity of " + ln.name); plus.disabled = ln.qty >= p.stock;
      minus.onclick = function () { cart = L.setQty(cart, ln.id, ln.qty - 1, p.stock); save(); renderCart(); }; plus.onclick = function () { cart = L.setQty(cart, ln.id, ln.qty + 1, p.stock); save(); renderCart(); };
      q.append(minus, c, plus); var tot = el("strong", null, L.formatMoney(ln.total)), rm = el("button", "rm", "Remove"); rm.type = "button"; rm.setAttribute("aria-label", "Remove " + ln.name);
      rm.onclick = function () { cart = L.setQty(cart, ln.id, 0); save(); renderCart(); };
      d.append(n, tot, q, rm); v.appendChild(d);
    });
    var sum = el("div", "sum"), row = function (a, b, cls) { var r = el("div", cls); r.append(el("span", null, a), el("span", null, b)); return r; };
    sum.append(row("Subtotal", L.formatMoney(t.subtotal)), row("Shipping", t.shipping ? L.formatMoney(t.shipping) : "Free"), row("Tax (8%)", L.formatMoney(t.tax)), row("Total", L.formatMoney(t.total), "t"));
    v.appendChild(sum);
    var sh = el("div", "ship"); sh.innerHTML = t.toFree ? "Add <b>" + L.formatMoney(t.toFree) + "</b> more for free shipping." : "🎉 You get free shipping.";
    var bar = el("div", "bar-s"), fill = el("i"); fill.style.width = Math.min(100, t.subtotal / 75) + "%"; bar.appendChild(fill); sh.appendChild(bar); v.appendChild(sh);
    var go = el("button", "primary", "Checkout"); go.type = "button"; go.style.marginTop = "14px"; go.onclick = function () { $("cart-view").hidden = true; $("co").hidden = false; $("c-name").focus(); }; v.appendChild(go);
  }
  $("cartBtn").onclick = function () { $("cart-view").hidden = false; $("co").hidden = true; $("ok").hidden = true; renderCart(); $("cd").showModal(); };
  $("cdClose").onclick = function () { $("cd").close(); };
  $("back").onclick = function () { $("co").hidden = true; $("cart-view").hidden = false; };
  [$("pd"), $("cd")].forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });

  $("co").addEventListener("submit", function (e) {
    e.preventDefault(); ["name", "email", "address", "zip"].forEach(function (k) { $("e-" + k).textContent = ""; $("c-" + k).removeAttribute("aria-invalid"); });
    var v = L.validateCheckout({ name: $("c-name").value, email: $("c-email").value, address: $("c-address").value, zip: $("c-zip").value });
    if (!v.ok) { var first = null; Object.keys(v.errors).forEach(function (k) { $("e-" + k).textContent = v.errors[k]; $("c-" + k).setAttribute("aria-invalid", "true"); if (!first) first = $("c-" + k); }); first.focus(); return; }
    var t = L.totals(cart, P), ref = "VX-" + Math.abs(hash(JSON.stringify(cart) + $("c-email").value)).toString(36).toUpperCase().slice(0, 6);
    P.forEach(function (p) { if (cart[p.id]) p.stock -= cart[p.id]; }); // reflect the purchase in the demo catalogue
    cart = {}; save(); renderCart(); renderGrid();
    $("co").hidden = true; var ok = $("ok"); ok.hidden = false; ok.innerHTML = "";
    var h = el("h3", null, "Thank you, " + $("c-name").value.trim().split(" ")[0] + "!"); h.tabIndex = -1;
    var b = el("button", "primary", "Continue shopping"); b.type = "button"; b.onclick = function () { $("cd").close(); };
    ok.append(h, el("p", null, "Demo order " + ref + " for " + L.formatMoney(t.total) + " has been placed. No real payment or shipment happens."), b); h.focus();
  });
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  $("q").addEventListener("input", function (e) { F.q = e.target.value; renderGrid(); });
  $("max").addEventListener("input", function (e) { F.maxPrice = +e.target.value; $("maxOut").textContent = L.formatMoney(F.maxPrice).replace(".00", ""); renderGrid(); });
  $("stock").onchange = function (e) { F.inStockOnly = e.target.checked; renderGrid(); };
  $("sort").onchange = function (e) { F.sort = e.target.value; renderGrid(); };
  $("reset").onclick = function () { F = { q: "", category: "all", maxPrice: 10000, inStockOnly: false, sort: "featured" }; $("q").value = ""; $("max").value = 10000; $("maxOut").textContent = "$100"; $("stock").checked = false; $("sort").value = "featured"; renderCats(); renderGrid(); };
  renderCats(); renderGrid(); renderCart();
})();
