/* logic.js — pure helpers for the Nira café concept (opening hours, reservation validation, .ics export). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NiraLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Opening hours in Tehran time. 0 = Sunday … 6 = Saturday. Closed days are absent.
  var HOURS = { 6: [8, 22], 0: [8, 22], 1: [8, 22], 2: [8, 22], 3: [8, 22], 4: [8, 22], 5: [10, 23] };
  var TZ = "Asia/Tehran";

  function tehranParts(date) {
    var f = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", minute: "numeric", hour12: false });
    var p = {}; f.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: map[p.weekday], minutes: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
  }
  /** → { open:boolean, closesAt|opensAt:"HH:MM" } */
  function openStatus(date) {
    var t = tehranParts(date), h = HOURS[t.day];
    var hh = function (x) { return ("0" + x).slice(-2) + ":00"; };
    if (h && t.minutes >= h[0] * 60 && t.minutes < h[1] * 60) return { open: true, closesAt: hh(h[1]) };
    if (h && t.minutes < h[0] * 60) return { open: false, opensAt: hh(h[0]) };
    var next = HOURS[(t.day + 1) % 7];
    return { open: false, opensAt: hh(next[0]), tomorrow: true };
  }

  var TIMES = []; for (var m = 8 * 60; m <= 21 * 60 + 30; m += 30) TIMES.push(("0" + Math.floor(m / 60)).slice(-2) + ":" + (m % 60 ? "30" : "00"));

  /** data: {name, phone, date:"YYYY-MM-DD", time:"HH:MM", guests} → {ok, errors:{field:code}} */
  function validateReservation(d, todayISO) {
    var e = {};
    if (!d.name || d.name.trim().length < 2) e.name = "name";
    if (!/^[+\d][\d\s\-()]{6,17}$/.test((d.phone || "").trim())) e.phone = "phone";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || "") || isNaN(Date.parse(d.date))) e.date = "date";
    else if (d.date < todayISO) e.date = "past";
    if (TIMES.indexOf(d.time) < 0) e.time = "time";
    var g = Number(d.guests); if (!(Number.isInteger(g) && g >= 1 && g <= 10)) e.guests = "guests";
    return { ok: Object.keys(e).length === 0, errors: e };
  }

  function icsEscape(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  /** Floating local time (no TZ) so the event lands at the right wall-clock time for the guest. */
  function buildIcs(r, stamp) {
    var d = r.date.replace(/-/g, ""), t = r.time.replace(":", "") + "00";
    var endMin = parseInt(r.time.slice(0, 2), 10) * 60 + parseInt(r.time.slice(3), 10) + 90, end = ("0" + Math.floor(endMin / 60) % 24).slice(-2) + ("0" + (endMin % 60)).slice(-2) + "00";
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nira Cafe Concept//EN", "BEGIN:VEVENT", "UID:" + d + t + "-" + Math.abs(hash(r.name + r.phone)) + "@nira.example",
      "DTSTAMP:" + (stamp || "20260101T000000Z"), "DTSTART:" + d + "T" + t, "DTEND:" + d + "T" + end,
      "SUMMARY:" + icsEscape("Table at Nira Cafe (" + r.guests + ")"), "DESCRIPTION:" + icsEscape("Reservation for " + r.name + ". Concept project, not a real booking."), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  return { HOURS: HOURS, TIMES: TIMES, openStatus: openStatus, validateReservation: validateReservation, buildIcs: buildIcs };
});
