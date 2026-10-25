import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const B = createRequire(import.meta.url)("../projects/flow-board/logic.js");
const ids = (b, c) => b.columns.find(x => x.id === c).cardIds;
function seeded() { let b = B.createBoard(); b = B.addCard(b, "todo", { title: "A" }); b = B.addCard(b, "todo", { title: "B" }); b = B.addCard(b, "todo", { title: "C" }); b = B.addCard(b, "doing", { title: "D" }); return b; }

test("addCard trims, validates and never mutates the input", () => {
  const b0 = B.createBoard(), b1 = B.addCard(b0, "todo", { title: "  Write tests  ", priority: "high", due: "2026-12-01" });
  assert.equal(Object.keys(b0.cards).length, 0);
  assert.equal(b1.cards.c1.title, "Write tests"); assert.equal(b1.cards.c1.priority, "high");
  assert.equal(B.addCard(b0, "todo", { title: "   " }), b0);
  assert.equal(B.addCard(b0, "nope", { title: "x" }), b0);
  assert.equal(B.addCard(b0, "todo", { title: "x", priority: "urgent", due: "tomorrow" }).cards.c1.priority, "medium");
});
test("moveCard reorders within a column", () => {
  const b = seeded(), m = B.moveCard(b, "c1", "todo", 2);
  assert.deepEqual(ids(m, "todo"), ["c2", "c3", "c1"]); assert.deepEqual(ids(b, "todo"), ["c1", "c2", "c3"]);
});
test("moveCard across columns at an index, clamped", () => {
  const b = seeded();
  assert.deepEqual(ids(B.moveCard(b, "c2", "doing", 0), "doing"), ["c2", "c4"]);
  assert.deepEqual(ids(B.moveCard(b, "c2", "doing", 99), "doing"), ["c4", "c2"]);
  assert.deepEqual(ids(B.moveCard(b, "c2", "done"), "done"), ["c2"]);
  assert.equal(B.moveCard(b, "zzz", "done", 0), b);
});
test("every card lives in exactly one column after many random moves", () => {
  let b = seeded(); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 500; i++) { const id = "c" + (1 + Math.floor(r() * 4)); b = r() < .5 ? B.moveCard(b, id, b.columns[Math.floor(r() * 3)].id, Math.floor(r() * 5)) : B.moveBy(b, id, Math.floor(r() * 3) - 1, Math.floor(r() * 3) - 1); }
  const all = b.columns.flatMap(c => c.cardIds).sort();
  assert.deepEqual(all, ["c1", "c2", "c3", "c4"]);
});
test("moveBy: left/right between columns and up/down within one, stopping at edges", () => {
  const b = seeded();
  assert.deepEqual(ids(B.moveBy(b, "c1", 1, 0), "doing"), ["c1", "c4"].sort((a, c) => a === "c1" ? -1 : 1));
  assert.equal(B.moveBy(b, "c1", -1, 0), b);
  assert.deepEqual(ids(B.moveBy(b, "c1", 0, 1), "todo"), ["c2", "c1", "c3"]);
  assert.equal(B.moveBy(b, "c1", 0, -1), b);
  assert.equal(B.moveBy(b, "c3", 0, 1), b);
});
test("updateCard and deleteCard", () => {
  const b = seeded();
  assert.equal(B.updateCard(b, "c1", { title: "  New  " }).cards.c1.title, "New");
  assert.equal(B.updateCard(b, "c1", { title: "  " }), b);
  const d = B.deleteCard(b, "c2"); assert.deepEqual(ids(d, "todo"), ["c1", "c3"]); assert.equal(d.cards.c2, undefined);
});
test("columns: add, delete (cards go with it), keep at least one", () => {
  let b = B.addColumn(seeded(), "Review"); assert.equal(b.columns.length, 4);
  b = B.deleteColumn(b, "todo"); assert.equal(b.cards.c1, undefined); assert.equal(b.columns.length, 3);
  let one = B.createBoard(); one = B.deleteColumn(B.deleteColumn(one, "todo"), "doing"); assert.equal(B.deleteColumn(one, "done"), one);
});
test("filters and overdue", () => {
  const b = B.addCard(B.addCard(B.createBoard(), "todo", { title: "Fix login bug", priority: "high", due: "2026-01-01" }), "todo", { title: "Docs", desc: "login page" });
  assert.equal(B.matches(b.cards.c1, { q: "LOGIN" }), true); assert.equal(B.matches(b.cards.c2, { q: "login" }), true); assert.equal(B.matches(b.cards.c2, { priority: "high" }), false);
  assert.equal(B.overdue(b.cards.c1, "2026-06-01", false), true); assert.equal(B.overdue(b.cards.c1, "2026-06-01", true), false); assert.equal(B.overdue(b.cards.c2, "2026-06-01", false), false);
});
test("sanitize rejects junk and cleans imports", () => {
  assert.equal(B.sanitize(null), null); assert.equal(B.sanitize({ columns: "x", cards: {} }), null); assert.equal(B.sanitize({ columns: [], cards: {} }), null);
  const dirty = { nextId: 2, columns: [{ id: "a b!", title: "Todo", cardIds: ["x", "x", "ghost", "y"] }], cards: { x: { title: " Task ", priority: "boom", due: "soon" }, y: { title: "" } } };
  const s = B.sanitize(dirty);
  assert.deepEqual(s.columns[0].cardIds, ["x"]); assert.equal(s.cards.x.title, "Task"); assert.equal(s.cards.x.priority, "medium"); assert.equal(s.cards.x.due, ""); assert.equal(s.columns[0].id, "ab");
  const rt = B.sanitize(JSON.parse(JSON.stringify(seeded()))); assert.deepEqual(ids(rt, "todo"), ["c1", "c2", "c3"]); assert.ok(rt.nextId >= 5);
});
