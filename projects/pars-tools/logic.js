/* logic.js — Jalali (Persian) calendar conversion, number → Persian words, digit helpers, age calculator.
   The calendar maths follows the well-known 33-year-cycle algorithm (as in jalaali-js), valid for Jalali years -61 … 3177. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ParsLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }
  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

  function jalCal(jy) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, leapG, march, n, i;
    if (jy < jp || jy >= BREAKS[bl - 1]) throw new RangeError("Jalali year out of range: " + jy);
    for (i = 1; i < bl; i++) { jm = BREAKS[i]; jump = jm - jp; if (jy < jm) break; leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4); jp = jm; }
    n = jy - jp; leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150; march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4); if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }
  function g2d(gy, gm, gd) { var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408; return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752; }
  function d2g(jdn) { var j = 4 * jdn + 139361631; j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908; var i = div(mod(j, 1461), 4) * 5 + 308, gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1, gy = div(j, 1461) - 100100 + div(8 - gm, 6); return { gy: gy, gm: gm, gd: gd }; }
  function j2d(jy, jm, jd) { var r = jalCal(jy); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1; }
  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy), jdn1f = g2d(gy, 3, r.march), k = jdn - jdn1f, jm, jd;
    if (k >= 0) { if (k <= 185) return { jy: jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }; k -= 186; }
    else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    return { jy: jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
  }
  function isLeapJalali(jy) { return jalCal(jy).leap === 0; }
  function monthLength(jy, jm) { return jm <= 6 ? 31 : jm <= 11 ? 30 : (isLeapJalali(jy) ? 30 : 29); }
  function toJalali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }
  function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }
  function validJalali(jy, jm, jd) { return Number.isInteger(jy) && Number.isInteger(jm) && Number.isInteger(jd) && jy >= 1 && jy <= 3000 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= monthLength(jy, jm); }
  function validGregorian(gy, gm, gd) { if (!(Number.isInteger(gy) && Number.isInteger(gm) && Number.isInteger(gd))) return false; var d = new Date(Date.UTC(2000, gm - 1, gd)); d.setUTCFullYear(gy); return gy >= 622 && gy <= 3000 && d.getUTCFullYear() === gy && d.getUTCMonth() === gm - 1 && d.getUTCDate() === gd; }
  function weekday(gy, gm, gd) { var d = new Date(Date.UTC(2000, gm - 1, gd)); d.setUTCFullYear(gy); return d.getUTCDay(); } // 0 = Sunday

  var MONTHS_FA = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  var MONTHS_EN = ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];
  var DAYS_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
  var DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  /** Age in the Jalali calendar between two Jalali dates, plus days until the next birthday. */
  function age(birth, now) {
    if (j2d(now.jy, now.jm, now.jd) < j2d(birth.jy, birth.jm, birth.jd)) return null;
    var y = now.jy - birth.jy, m = now.jm - birth.jm, d = now.jd - birth.jd;
    if (d < 0) { m -= 1; var pm = now.jm === 1 ? 12 : now.jm - 1, py = now.jm === 1 ? now.jy - 1 : now.jy; d += monthLength(py, pm); }
    if (m < 0) { y -= 1; m += 12; }
    var total = j2d(now.jy, now.jm, now.jd) - j2d(birth.jy, birth.jm, birth.jd);
    var ny = now.jy, bd = Math.min(birth.jd, monthLength(ny, birth.jm)); if (j2d(ny, birth.jm, bd) < j2d(now.jy, now.jm, now.jd)) { ny += 1; bd = Math.min(birth.jd, monthLength(ny, birth.jm)); }
    return { years: y, months: m, days: d, totalDays: total, nextBirthdayIn: j2d(ny, birth.jm, bd) - j2d(now.jy, now.jm, now.jd) };
  }

  /* ---------- digits ---------- */
  function toFaDigits(s) { return String(s).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; }); }
  function toEnDigits(s) { return String(s).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; }).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }); }
  /** Parse "۱٬۲۳۴", "1,234", "1 234" … → integer string of digits (or null). */
  function parseDigits(s) { var t = toEnDigits(String(s)).replace(/[\s,٬،'_]/g, ""); var neg = /^[-−–]/.test(t); t = t.replace(/^[-−–]/, ""); return /^\d{1,15}$/.test(t) ? (neg ? "-" : "") + t.replace(/^0+(?=\d)/, "") : null; }
  function group(s, sep) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep); }

  /* ---------- number → Persian words ---------- */
  var ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  var TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  var HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  var SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];
  function below1000(n) { var p = [], h = div(n, 100), r = n % 100; if (h) p.push(HUNDREDS[h]); if (r) p.push(r < 20 ? ONES[r] : TENS[div(r, 10)] + (r % 10 ? " و " + ONES[r % 10] : "")); return p.join(" و "); }
  /** digits: integer string (up to 15 digits, optional leading "-"). */
  function numberToWords(digits) {
    var neg = digits[0] === "-"; if (neg) digits = digits.slice(1);
    if (!/^\d{1,15}$/.test(digits)) return null; if (/^0+$/.test(digits)) return "صفر";
    var groups = []; for (var s = digits; s.length; s = s.slice(0, -3)) groups.push(+s.slice(-3));
    var parts = []; for (var i = groups.length - 1; i >= 0; i--) if (groups[i]) parts.push(below1000(groups[i]) + (SCALES[i] ? " " + SCALES[i] : ""));
    return (neg ? "منفی " : "") + parts.join(" و ");
  }
  return { jalCal: jalCal, toJalali: toJalali, toGregorian: toGregorian, isLeapJalali: isLeapJalali, monthLength: monthLength, validJalali: validJalali, validGregorian: validGregorian, weekday: weekday, age: age,
    MONTHS_FA: MONTHS_FA, MONTHS_EN: MONTHS_EN, DAYS_FA: DAYS_FA, DAYS_EN: DAYS_EN, toFaDigits: toFaDigits, toEnDigits: toEnDigits, parseDigits: parseDigits, group: group, numberToWords: numberToWords };
});
