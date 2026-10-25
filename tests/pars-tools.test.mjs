import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const P = createRequire(import.meta.url)("../projects/pars-tools/logic.js");

test("known date pairs (Gregorian ↔ Jalali)", () => {
  const pairs = [[[2025, 3, 21], [1404, 1, 1]], [[2025, 3, 20], [1403, 12, 30]], [[2026, 3, 21], [1405, 1, 1]], [[2026, 10, 25], [1405, 8, 3]], [[2000, 1, 1], [1378, 10, 11]], [[1979, 2, 11], [1357, 11, 22]], [[2024, 3, 20], [1403, 1, 1]]];
  for (const [[gy, gm, gd], [jy, jm, jd]] of pairs) {
    assert.deepEqual(P.toJalali(gy, gm, gd), { jy, jm, jd }, `g→j ${gy}-${gm}-${gd}`);
    assert.deepEqual(P.toGregorian(jy, jm, jd), { gy, gm, gd }, `j→g ${jy}/${jm}/${jd}`);
  }
});
test("matches the platform's Persian calendar (ICU) for every day from 1300 to 1500", () => {
  const f = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
  let checked = 0, bad = [];
  for (let t = Date.UTC(1921, 2, 1); t < Date.UTC(2122, 2, 1); t += 86400000) {
    const d = new Date(t), parts = Object.fromEntries(f.formatToParts(d).map(p => [p.type, p.value]));
    const mine = P.toJalali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    if (mine.jy !== +parts.year || mine.jm !== +parts.month || mine.jd !== +parts.day) bad.push(d.toISOString().slice(0, 10)); checked++;
  }
  assert.ok(checked > 70000); assert.deepEqual(bad.slice(0, 5), [], `${bad.length} mismatches`);
});
test("round trip over 200 years", () => {
  for (let jy = 1300; jy < 1500; jy++) for (let jm = 1; jm <= 12; jm++) for (const jd of [1, P.monthLength(jy, jm)]) {
    const g = P.toGregorian(jy, jm, jd); assert.deepEqual(P.toJalali(g.gy, g.gm, g.gd), { jy, jm, jd });
  }
});
test("leap years and month lengths", () => {
  assert.equal(P.isLeapJalali(1403), true); assert.equal(P.isLeapJalali(1404), false); assert.equal(P.isLeapJalali(1399), true);
  assert.equal(P.monthLength(1403, 12), 30); assert.equal(P.monthLength(1404, 12), 29); assert.equal(P.monthLength(1404, 1), 31); assert.equal(P.monthLength(1404, 7), 30);
});
test("validation", () => {
  assert.equal(P.validJalali(1404, 12, 30), false); assert.equal(P.validJalali(1403, 12, 30), true); assert.equal(P.validJalali(1404, 13, 1), false); assert.equal(P.validJalali(1404, 6, 31), true);
  assert.equal(P.validGregorian(2026, 2, 29), false); assert.equal(P.validGregorian(2028, 2, 29), true); assert.equal(P.validGregorian(2026, 4, 31), false);
});
test("weekday: 2026-10-25 is a Sunday", () => { assert.equal(P.weekday(2026, 10, 25), 0); assert.equal(P.DAYS_FA[P.weekday(2026, 10, 23)], "جمعه"); });
test("age: years / months / days and next birthday", () => {
  const a = P.age({ jy: 1381, jm: 3, jd: 15 }, { jy: 1405, jm: 8, jd: 3 });
  assert.deepEqual([a.years, a.months, a.days], [24, 4, 18]);
  assert.equal(P.age({ jy: 1405, jm: 1, jd: 1 }, { jy: 1404, jm: 1, jd: 1 }), null);
  const b = P.age({ jy: 1400, jm: 8, jd: 3 }, { jy: 1405, jm: 8, jd: 3 }); assert.deepEqual([b.years, b.months, b.days, b.nextBirthdayIn], [5, 0, 0, 0]);
  assert.equal(P.age({ jy: 1400, jm: 8, jd: 4 }, { jy: 1405, jm: 8, jd: 3 }).nextBirthdayIn, 1);
});
test("digits", () => {
  assert.equal(P.toFaDigits("2026-10"), "۲۰۲۶-۱۰"); assert.equal(P.toEnDigits("۱۲۳٤٥"), "12345");
  assert.equal(P.parseDigits("۱٬۲۳۴٬۵۶۷"), "1234567"); assert.equal(P.parseDigits("1,234"), "1234"); assert.equal(P.parseDigits("12a"), null); assert.equal(P.parseDigits("-007"), "-7"); assert.equal(P.group("1234567", ","), "1,234,567");
});
test("numberToWords", () => {
  const w = (s) => P.numberToWords(s);
  assert.equal(w("0"), "صفر"); assert.equal(w("7"), "هفت"); assert.equal(w("11"), "یازده"); assert.equal(w("21"), "بیست و یک"); assert.equal(w("100"), "صد"); assert.equal(w("105"), "صد و پنج");
  assert.equal(w("1000"), "یک هزار"); assert.equal(w("1234"), "یک هزار و دویست و سی و چهار"); assert.equal(w("2000000"), "دو میلیون"); assert.equal(w("1000001"), "یک میلیون و یک");
  assert.equal(w("999"), "نهصد و نود و نه"); assert.equal(w("-15"), "منفی پانزده"); assert.equal(w("3500000000"), "سه میلیارد و پانصد میلیون");
  assert.equal(w("1000000000000"), "یک تریلیون"); assert.equal(w("12x"), null);
});
