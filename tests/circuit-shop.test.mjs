import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const S = createRequire(import.meta.url)("../projects/circuit-shop/logic.js");
const P = [
  { id: "a", name: "ARM Cortex-M4 Board", cat: "Boards", price: 2400, stock: 5, rating: 4.7, desc: "Dev board", specs: ["168 MHz"] },
  { id: "b", name: "Ultrasonic Sensor", cat: "Sensors", price: 350, stock: 0, rating: 4.2, desc: "Distance", specs: [] },
  { id: "c", name: "Soldering Station", cat: "Tools", price: 5900, stock: 3, rating: 4.9, desc: "60W", specs: ["Digital"] },
];
test("formatMoney", () => { assert.equal(S.formatMoney(1234567), "$12,345.67"); assert.equal(S.formatMoney(5), "$0.05"); });
test("filter by text, category, price and stock", () => {
  assert.deepEqual(S.filterProducts(P, { q: "arm" }).map(p => p.id), ["a"]);
  assert.deepEqual(S.filterProducts(P, { q: "168 mhz" }).map(p => p.id), ["a"]);
  assert.deepEqual(S.filterProducts(P, { category: "Tools" }).map(p => p.id), ["c"]);
  assert.deepEqual(S.filterProducts(P, { maxPrice: 3000 }).map(p => p.id), ["a", "b"]);
  assert.deepEqual(S.filterProducts(P, { inStockOnly: true }).map(p => p.id), ["a", "c"]);
  assert.equal(S.filterProducts(P, { category: "all", q: "  " }).length, 3);
});
test("sort does not mutate the input", () => {
  const before = P.map(p => p.id).join();
  assert.deepEqual(S.sortProducts(P, "price-desc").map(p => p.id), ["c", "a", "b"]);
  assert.deepEqual(S.sortProducts(P, "rating").map(p => p.id), ["c", "a", "b"]);
  assert.equal(P.map(p => p.id).join(), before);
});
test("cart add / set / remove respects stock and immutability", () => {
  const c0 = {}; const c1 = S.addToCart(c0, "a", 2, 5);
  assert.deepEqual(c0, {}); assert.deepEqual(c1, { a: 2 });
  assert.deepEqual(S.addToCart(c1, "a", 10, 5), { a: 5 });
  assert.deepEqual(S.setQty(c1, "a", 0, 5), {});
  assert.deepEqual(S.setQty(c1, "a", 2.9, 5), { a: 2 });
  assert.deepEqual(S.addToCart({}, "b", 1, 0), {});
});
test("totals: shipping, free-shipping threshold and tax rounding", () => {
  let t = S.totals({ a: 1 }, P);
  assert.equal(t.subtotal, 2400); assert.equal(t.shipping, 599); assert.equal(t.tax, 192); assert.equal(t.total, 2400 + 599 + 192); assert.equal(t.toFree, 5100);
  t = S.totals({ a: 2, c: 1 }, P); // 4800 + 5900 = 10700 >= 7500
  assert.equal(t.shipping, 0); assert.equal(t.toFree, 0); assert.equal(t.count, 3);
  assert.equal(S.totals({}, P).total, 0);
});
test("sanitizeCart removes unknown/out-of-stock lines and clamps quantity", () => {
  assert.deepEqual(S.sanitizeCart({ a: 99, b: 1, zzz: 2, c: -1 }, P), { a: 5 });
});
test("checkout validation", () => {
  assert.equal(S.validateCheckout({ name: "Sara K", email: "s@x.io", address: "1 Main St", zip: "12345" }).ok, true);
  assert.deepEqual(Object.keys(S.validateCheckout({ name: "", email: "no", address: "x", zip: "abc" }).errors), ["name", "email", "address", "zip"]);
});
