/* app.js — Flow Board UI. The board model (logic.js) is immutable and unit-tested. */
(function () {
  "use strict";
  var B = window.BoardLogic, $ = function (id) { return document.getElementById(id); }, KEY = "flowboard.v1";
  var board = load() || seed(), undo = [], F = { q: "", priority: "all" }, editing = null, dragId = null;

  function seed() {
    var b = B.createBoard(), d = function (n) { var t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
    b = B.addCard(b, "todo", { title: "Drag me to another column", desc: "Or focus a card and use the arrow buttons — works with a keyboard and on touch screens.", priority: "medium", due: d(3) });
    b = B.addCard(b, "todo", { title: "Click ✎ to edit this card", desc: "Change the title, priority and due date.", priority: "low" });
    b = B.addCard(b, "doing", { title: "Overdue cards turn red", desc: "This one was due yesterday.", priority: "high", due: d(-1) });
    b = B.addCard(b, "done", { title: "Everything is saved in your browser", desc: "Use Export / Import to back up or move your board.", priority: "low" });
    return b;
  }
  function load() { try { return B.sanitize(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(board)); } catch (e) { /* in-memory only */ } }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function announce(m) { $("live").textContent = ""; setTimeout(function () { $("live").textContent = m; }, 30); }
  function toast(m) { var t = $("toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2600); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function commit(next, msg) { if (next === board) return; undo.push(board); if (undo.length > 30) undo.shift(); board = next; save(); render(); if (msg) announce(msg); }

  function render(focusId) {
    var root = $("board"); root.innerHTML = ""; $("undo").disabled = !undo.length;
    board.columns.forEach(function (col, ci) {
      var c = el("section", "col"); c.dataset.col = col.id; c.setAttribute("aria-labelledby", "h-" + col.id);
      var h = el("div", "col-h"), t = el("h2", null, col.title); t.id = "h-" + col.id; var n = el("span", "cnt", String(col.cardIds.length));
      var del = el("button", null, "🗑"); del.type = "button"; del.setAttribute("aria-label", "Delete column " + col.title); del.disabled = board.columns.length <= 1;
      del.onclick = function () { if (!col.cardIds.length || confirm("Delete “" + col.title + "” and its " + col.cardIds.length + " card(s)?")) commit(B.deleteColumn(board, col.id), "Column deleted"); };
      h.append(t, n, del);
      var ul = el("ul", "list"); ul.setAttribute("aria-label", col.title + " cards");
      col.cardIds.forEach(function (id, i) { ul.appendChild(cardEl(board.cards[id], ci, i, col.cardIds.length)); });
      // drag & drop target
      c.addEventListener("dragover", function (e) { if (!dragId) return; e.preventDefault(); c.classList.add("over"); showLine(ul, e.clientY); });
      c.addEventListener("dragleave", function (e) { if (!c.contains(e.relatedTarget)) { c.classList.remove("over"); clearLine(); } });
      c.addEventListener("drop", function (e) { e.preventDefault(); var idx = dropIndex(ul, e.clientY); c.classList.remove("over"); clearLine(); if (dragId) { var id = dragId, name = board.cards[id].title; dragId = null; commit(B.moveCard(board, id, col.id, idx), name + " moved to " + col.title); } });
      var f = el("form", "add"), inp = el("input"); inp.placeholder = "Add a card…"; inp.setAttribute("aria-label", "New card title in " + col.title); inp.maxLength = 120;
      var go = el("button", "btn", "Add"); go.type = "submit"; f.append(inp, go);
      f.onsubmit = function (e) { e.preventDefault(); var v = inp.value.trim(); if (!v) { inp.focus(); return; } var nb = B.addCard(board, col.id, { title: v }); commit(nb, "Card added to " + col.title); var again = document.querySelector('[data-col="' + col.id + '"] .add input'); if (again) again.focus(); };
      c.append(h, ul, f); root.appendChild(c);
    });
    applyFilter();
    if (focusId) { var b = document.querySelector('[data-card="' + focusId.id + '"] .mv button[data-k="' + focusId.k + '"]'); if (b && !b.disabled) b.focus(); else { var any = document.querySelector('[data-card="' + focusId.id + '"] .edit'); if (any) any.focus(); } }
  }
  function cardEl(card, ci, i, len) {
    var li = el("li", "card"); li.dataset.card = card.id; li.draggable = true;
    li.addEventListener("dragstart", function (e) { dragId = card.id; li.classList.add("drag"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", card.id); });
    li.addEventListener("dragend", function () { dragId = null; li.classList.remove("drag"); clearLine(); document.querySelectorAll(".col.over").forEach(function (c) { c.classList.remove("over"); }); });
    li.appendChild(el("h3", null, card.title)); if (card.desc) li.appendChild(el("p", null, card.desc));
    var m = el("div", "meta"), p = el("span", "pri " + card.priority, card.priority); m.appendChild(p);
    var late = B.overdue(card, today(), ci === board.columns.length - 1);
    if (card.due) m.appendChild(el("span", "due" + (late ? " late" : ""), (late ? "Overdue · " : "Due ") + card.due));
    li.appendChild(m);
    var ed = el("button", "edit", "✎"); ed.type = "button"; ed.setAttribute("aria-label", "Edit " + card.title); ed.onclick = function () { openEdit(card.id); }; li.appendChild(ed);
    var mv = el("div", "mv"); mv.setAttribute("role", "group"); mv.setAttribute("aria-label", "Move " + card.title);
    [["←", "left", -1, 0, ci === 0], ["↑", "up", 0, -1, i === 0], ["↓", "down", 0, 1, i === len - 1], ["→", "right", 1, 0, ci === board.columns.length - 1]].forEach(function (a) {
      var b = el("button", null, a[0]); b.type = "button"; b.dataset.k = a[1]; b.disabled = a[4]; b.setAttribute("aria-label", "Move " + card.title + " " + a[1]);
      b.onclick = function () { commit(B.moveBy(board, card.id, a[2], a[3]), card.title + " moved " + a[1]); render({ id: card.id, k: a[1] }); }; mv.appendChild(b);
    });
    li.appendChild(mv); return li;
  }
  function dropIndex(ul, y) { var items = [].slice.call(ul.querySelectorAll(".card:not(.drag)")); for (var i = 0; i < items.length; i++) { var r = items[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i; } return items.length; }
  var line = el("li", "drop-line"); line.setAttribute("aria-hidden", "true");
  function showLine(ul, y) { var items = [].slice.call(ul.querySelectorAll(".card:not(.drag)")), i = dropIndex(ul, y); ul.insertBefore(line, items[i] || null); }
  function clearLine() { if (line.parentNode) line.parentNode.removeChild(line); }

  function applyFilter() {
    document.querySelectorAll(".card").forEach(function (li) { var c = board.cards[li.dataset.card]; li.classList.toggle("hide", !B.matches(c, F)); });
    document.querySelectorAll(".col").forEach(function (col) { var total = board.columns.filter(function (c) { return c.id === col.dataset.col; })[0].cardIds.length, shown = col.querySelectorAll(".card:not(.hide)").length; col.querySelector(".cnt").textContent = (F.q || F.priority !== "all") ? shown + "/" + total : String(total); });
  }
  $("q").addEventListener("input", function (e) { F.q = e.target.value; applyFilter(); });
  $("fp").onchange = function (e) { F.priority = e.target.value; applyFilter(); };

  /* edit dialog */
  function openEdit(id) { var c = board.cards[id]; editing = id; $("f-title").value = c.title; $("f-desc").value = c.desc; $("f-pri").value = c.priority; $("f-due").value = c.due; $("f-err").textContent = ""; $("dlg").showModal(); $("f-title").select(); }
  $("form").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("f-title").value.trim(); if (!t) { $("f-err").textContent = "A card needs a title."; $("f-title").focus(); return; }
    var id = editing; $("dlg").close(); commit(B.updateCard(board, id, { title: t, desc: $("f-desc").value, priority: $("f-pri").value, due: $("f-due").value }), "Card saved");
    var b = document.querySelector('[data-card="' + id + '"] .edit'); if (b) b.focus();
  });
  $("f-cancel").onclick = function () { $("dlg").close(); };
  $("f-del").onclick = function () { var id = editing; $("dlg").close(); commit(B.deleteCard(board, id), "Card deleted"); toast("Card deleted — press Ctrl+Z to undo"); };
  $("dlg").addEventListener("click", function (e) { if (e.target === $("dlg")) $("dlg").close(); });

  /* toolbar */
  function doUndo() { if (!undo.length) return; board = undo.pop(); save(); render(); announce("Undone"); }
  $("undo").onclick = doUndo;
  document.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); doUndo(); } });
  $("addCol").onclick = function () { var t = prompt("Column name"); if (t && t.trim()) commit(B.addColumn(board, t), "Column added"); };
  $("reset").onclick = function () { if (confirm("Reset the board to the starter cards? You can still undo.")) commit(seed(), "Board reset"); };
  $("export").onclick = function () { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], { type: "application/json" })); a.download = "flow-board.json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); };
  $("import").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { var nb = B.sanitize(JSON.parse(r.result)); if (!nb) throw 0; commit(nb, "Board imported"); toast("Board imported"); } catch (x) { toast("That file is not a valid board export."); } };
    r.readAsText(f); e.target.value = "";
  };
  render();
})();
