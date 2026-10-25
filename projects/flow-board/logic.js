/* logic.js — immutable board model for the Kanban app. Every function returns a NEW board. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BoardLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var PRIORITIES = ["low", "medium", "high"];
  function clone(b) { return JSON.parse(JSON.stringify(b)); }

  function createBoard() {
    return { v: 1, nextId: 1, columns: [{ id: "todo", title: "To do", cardIds: [] }, { id: "doing", title: "In progress", cardIds: [] }, { id: "done", title: "Done", cardIds: [] }], cards: {} };
  }
  function addCard(b, colId, data) {
    var n = clone(b), col = find(n, colId); if (!col) return b;
    var title = String(data.title || "").trim(); if (!title) return b;
    var id = "c" + n.nextId++;
    n.cards[id] = { id: id, title: title.slice(0, 120), desc: String(data.desc || "").slice(0, 500), priority: PRIORITIES.indexOf(data.priority) >= 0 ? data.priority : "medium", due: /^\d{4}-\d{2}-\d{2}$/.test(data.due || "") ? data.due : "" };
    col.cardIds.push(id); return n;
  }
  function updateCard(b, id, patch) {
    if (!b.cards[id]) return b; var n = clone(b), c = n.cards[id];
    if (patch.title != null) { var t = String(patch.title).trim(); if (!t) return b; c.title = t.slice(0, 120); }
    if (patch.desc != null) c.desc = String(patch.desc).slice(0, 500);
    if (patch.priority != null && PRIORITIES.indexOf(patch.priority) >= 0) c.priority = patch.priority;
    if (patch.due != null) c.due = /^\d{4}-\d{2}-\d{2}$/.test(patch.due) ? patch.due : "";
    return n;
  }
  function deleteCard(b, id) { if (!b.cards[id]) return b; var n = clone(b); delete n.cards[id]; n.columns.forEach(function (c) { c.cardIds = c.cardIds.filter(function (x) { return x !== id; }); }); return n; }
  function find(b, colId) { return b.columns.filter(function (c) { return c.id === colId; })[0]; }
  function locate(b, id) { for (var i = 0; i < b.columns.length; i++) { var j = b.columns[i].cardIds.indexOf(id); if (j >= 0) return { col: i, idx: j }; } return null; }

  /** Move a card to a column at an index (clamped). Used by drag & drop. */
  function moveCard(b, id, toColId, index) {
    var from = locate(b, id), dest = find(b, toColId); if (!from || !dest) return b;
    var n = clone(b), src = n.columns[from.col], dst = find(n, toColId);
    src.cardIds.splice(from.idx, 1);
    var i = Math.max(0, Math.min(index == null ? dst.cardIds.length : index, dst.cardIds.length)); dst.cardIds.splice(i, 0, id); return n;
  }
  /** Keyboard / touch moves: dx = columns left(-1)/right(+1), dy = position up(-1)/down(+1). */
  function moveBy(b, id, dx, dy) {
    var p = locate(b, id); if (!p) return b;
    if (dx) { var nc = p.col + dx; if (nc < 0 || nc >= b.columns.length) return b; var len = b.columns[nc].cardIds.length; return moveCard(b, id, b.columns[nc].id, Math.min(p.idx, len)); }
    if (dy) { var ni = p.idx + dy; if (ni < 0 || ni >= b.columns[p.col].cardIds.length) return b; return moveCard(b, id, b.columns[p.col].id, ni); }
    return b;
  }
  function addColumn(b, title) { var t = String(title || "").trim(); if (!t) return b; var n = clone(b); n.columns.push({ id: "col" + n.nextId++, title: t.slice(0, 40), cardIds: [] }); return n; }
  function deleteColumn(b, colId) { if (b.columns.length <= 1) return b; var n = clone(b), c = find(n, colId); if (!c) return b; c.cardIds.forEach(function (id) { delete n.cards[id]; }); n.columns = n.columns.filter(function (x) { return x.id !== colId; }); return n; }

  function matches(card, f) {
    if (f.priority && f.priority !== "all" && card.priority !== f.priority) return false;
    var q = (f.q || "").trim().toLowerCase(); return !q || (card.title + " " + card.desc).toLowerCase().indexOf(q) >= 0;
  }
  function overdue(card, todayISO, doneCol) { return !!card.due && !doneCol && card.due < todayISO; }
  function counts(b) { return b.columns.map(function (c) { return { id: c.id, title: c.title, n: c.cardIds.length }; }); }

  /** Validate untrusted JSON (imports, old localStorage). Returns a clean board or null. */
  function sanitize(o) {
    if (!o || typeof o !== "object" || !Array.isArray(o.columns) || typeof o.cards !== "object" || !o.cards) return null;
    var n = createBoard(); n.columns = []; n.cards = {}; var seen = {}, maxId = 0;
    o.columns.forEach(function (c, i) {
      if (!c || typeof c.title !== "string") return; var col = { id: String(c.id || "col" + i).replace(/[^\w-]/g, "").slice(0, 20) || "col" + i, title: c.title.slice(0, 40), cardIds: [] };
      (Array.isArray(c.cardIds) ? c.cardIds : []).forEach(function (id) {
        var k = o.cards[id]; if (!k || typeof k.title !== "string" || !k.title.trim() || seen[id]) return; seen[id] = 1;
        var cid = String(id).replace(/[^\w-]/g, "").slice(0, 20); if (!cid || n.cards[cid]) return;
        n.cards[cid] = { id: cid, title: k.title.trim().slice(0, 120), desc: String(k.desc || "").slice(0, 500), priority: PRIORITIES.indexOf(k.priority) >= 0 ? k.priority : "medium", due: /^\d{4}-\d{2}-\d{2}$/.test(k.due || "") ? k.due : "" };
        col.cardIds.push(cid); var m = /^c(\d+)$/.exec(cid); if (m) maxId = Math.max(maxId, +m[1]);
      }); n.columns.push(col);
    });
    if (!n.columns.length) return null; n.nextId = Math.max(maxId + 1, Number(o.nextId) || 1, n.columns.length + 1); return n;
  }
  return { PRIORITIES: PRIORITIES, createBoard: createBoard, addCard: addCard, updateCard: updateCard, deleteCard: deleteCard, moveCard: moveCard, moveBy: moveBy, addColumn: addColumn, deleteColumn: deleteColumn, matches: matches, overdue: overdue, counts: counts, sanitize: sanitize, locate: locate };
});
