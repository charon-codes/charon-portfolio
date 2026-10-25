import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const N = createRequire(import.meta.url)("../projects/nira-cafe/logic.js");

// Tehran is UTC+3:30 year-round (no DST since 2022).
const at = (iso) => new Date(iso);
test("open on a Sunday afternoon (Tehran time)", () => {
  const s = N.openStatus(at("2026-10-25T10:00:00Z")); // 13:30 Tehran, Sunday
  assert.deepEqual(s, { open: true, closesAt: "22:00" });
});
test("closed early morning, opens at 08:00", () => {
  const s = N.openStatus(at("2026-10-25T02:00:00Z")); // 05:30 Tehran
  assert.equal(s.open, false); assert.equal(s.opensAt, "08:00");
});
test("closed late at night, opens tomorrow", () => {
  const s = N.openStatus(at("2026-10-25T19:30:00Z")); // 23:00 Tehran Sunday
  assert.equal(s.open, false); assert.equal(s.tomorrow, true); assert.equal(s.opensAt, "08:00");
});
test("Friday opens later and closes later", () => {
  assert.deepEqual(N.openStatus(at("2026-10-23T08:30:00Z")), { open: true, closesAt: "23:00" }); // Fri 12:00
  assert.equal(N.openStatus(at("2026-10-23T05:30:00Z")).opensAt, "10:00"); // Fri 09:00 Tehran
});
const ok = { name: "Sara", phone: "+98 912 000 0000", date: "2026-11-01", time: "19:30", guests: 4 };
test("reservation validation: accepts a good request", () => assert.equal(N.validateReservation(ok, "2026-10-25").ok, true));
test("reservation validation: flags each bad field", () => {
  const r = N.validateReservation({ name: "S", phone: "abc", date: "2026-10-01", time: "03:00", guests: 20 }, "2026-10-25");
  assert.deepEqual(r.errors, { name: "name", phone: "phone", date: "past", time: "time", guests: "guests" });
});
test("ics is well-formed and ends the event 90 minutes later", () => {
  const ics = N.buildIcs(ok, "20261025T000000Z");
  assert.ok(ics.startsWith("BEGIN:VCALENDAR") && ics.endsWith("END:VCALENDAR"));
  assert.ok(ics.includes("DTSTART:20261101T193000") && ics.includes("DTEND:20261101T210000"));
  assert.ok(ics.includes("\r\n"));
});
