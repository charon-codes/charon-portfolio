/* app.js — Pars Tools UI (Persian first, English toggle). Calendar and number maths live in logic.js. */
(function () {
  "use strict";
  var P = window.ParsLogic, $ = function (id) { return document.getElementById(id); }, lang = "fa";
  var GR_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var T = {
    fa: { skip: "پرش به ابزارها", title: "ابزارهای پارسی", tabs: ["تبدیل تاریخ", "عدد به حروف", "محاسبه سن", "تبدیل ارقام"], j2g: "شمسی به میلادی", g2j: "میلادی به شمسی", year: "سال", month: "ماه", day: "روز", useToday: "امروز را بگذار",
      w_h: "عدد به حروف", w_in: "یک عدد وارد کنید (فارسی یا انگلیسی)", w_unit: "واحد", u_none: "بدون واحد", u_toman: "تومان", u_rial: "ریال", copy: "کپی", copied: "کپی شد ✓",
      a_h: "محاسبهٔ سن", a_hint: "تاریخ تولد شمسی را وارد کنید.", d_h: "تبدیل ارقام", d_in: "متن خود را وارد کنید", d_fa: "ارقام فارسی", d_en: "ارقام انگلیسی",
      foot: "پروژه‌ای از Charon. همه‌چیز در مرورگر شما انجام می‌شود.", back: "← بازگشت به پورتفولیو",
      today: "امروز: {d}", bad_date: "تاریخ معتبر نیست.", bad_num: "یک عدد صحیح تا ۱۵ رقم وارد کنید.", leap: "سال کبیسه", notleap: "سال عادی", mlen: "{n} روز",
      age: "{y} سال و {m} ماه و {d} روز", age_days: "جمعاً {n} روز", bday: "تا تولد بعدی: {n} روز", bday0: "🎂 امروز تولد شماست!", future: "تاریخ تولد نباید در آینده باشد.", ph: "" },
    en: { skip: "Skip to tools", title: "Pars Tools", tabs: ["Date converter", "Number to words", "Age calculator", "Digit converter"], j2g: "Jalali → Gregorian", g2j: "Gregorian → Jalali", year: "Year", month: "Month", day: "Day", useToday: "Use today's date",
      w_h: "Number to Persian words", w_in: "Enter a number (Persian or English digits)", w_unit: "Unit", u_none: "No unit", u_toman: "Toman", u_rial: "Rial", copy: "Copy", copied: "Copied ✓",
      a_h: "Age calculator", a_hint: "Enter the birth date in the Jalali calendar.", d_h: "Digit converter", d_in: "Enter your text", d_fa: "Persian digits", d_en: "English digits",
      foot: "A project by Charon. Everything runs in your browser.", back: "← Back to portfolio",
      today: "Today: {d}", bad_date: "That is not a valid date.", bad_num: "Enter a whole number of up to 15 digits.", leap: "leap year", notleap: "common year", mlen: "{n} days",
      age: "{y} years, {m} months, {d} days", age_days: "{n} days in total", bday: "Next birthday in {n} days", bday0: "🎂 Happy birthday!", future: "The birth date cannot be in the future.", ph: "" }
  };
  var fill = function (s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); };
  var fd = function (v) { return lang === "fa" ? P.toFaDigits(v) : String(v); };
  var intOf = function (v) { var s = P.toEnDigits(String(v)).trim(); return /^\d{1,5}$/.test(s) ? +s : NaN; };
  function toast(m) { var t = $("toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 1800); }

  /* ---------- tabs ---------- */
  var IDS = ["date", "words", "age", "digits"], cur = 0;
  function renderTabs() {
    var box = $("tabs"); box.innerHTML = "";
    T[lang].tabs.forEach(function (name, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "tab"; b.id = "t-" + IDS[i]; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(i === cur)); b.setAttribute("aria-controls", "p-" + IDS[i]); b.tabIndex = i === cur ? 0 : -1; b.textContent = name;
      b.onclick = function () { select(i); };
      b.onkeydown = function (e) { var k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!k) return; if (document.documentElement.dir === "rtl") k = -k; e.preventDefault(); select((cur + k + IDS.length) % IDS.length, true); };
      box.appendChild(b);
    });
    IDS.forEach(function (id, i) { $("p-" + id).hidden = i !== cur; });
  }
  function select(i, focus) { cur = i; renderTabs(); if (focus) $("t-" + IDS[i]).focus(); }

  /* ---------- date converter ---------- */
  function fillMonths() {
    document.querySelectorAll("select[data-months]").forEach(function (s) {
      var v = s.value || s.dataset.v || "1", names = s.dataset.months === "fa" ? (lang === "fa" ? P.MONTHS_FA : P.MONTHS_EN) : (lang === "fa" ? GR_MONTHS.map(function (m, i) { return ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"][i]; }) : GR_MONTHS);
      s.innerHTML = ""; names.forEach(function (n, i) { var o = document.createElement("option"); o.value = String(i + 1); o.textContent = fd(i + 1) + " — " + n; s.appendChild(o); }); s.value = v;
    });
  }
  function dateStr(j, g) {
    var wd = P.weekday(g.gy, g.gm, g.gd), fa = lang === "fa";
    return (fa ? P.DAYS_FA[wd] : P.DAYS_EN[wd]) + (fa ? "، " : ", ");
  }
  function convert(form) {
    var y = intOf(form.y.value), m = +form.m.value, d = intOf(form.d.value), out = form.querySelector("[data-out]"), t = T[lang];
    out.classList.remove("bad"); [form.y, form.d].forEach(function (x) { x.removeAttribute("aria-invalid"); });
    try {
      if (form.dataset.conv === "j2g") {
        if (!P.validJalali(y, m, d)) throw 0; var g = P.toGregorian(y, m, d);
        out.textContent = dateStr({}, g) + (lang === "fa" ? fd(g.gd) + " " + ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"][g.gm - 1] + " " + fd(g.gy) : g.gd + " " + GR_MONTHS[g.gm - 1] + " " + g.gy) + "  (" + g.gy + "-" + ("0" + g.gm).slice(-2) + "-" + ("0" + g.gd).slice(-2) + ")";
        out.dir = "auto";
      } else {
        if (!P.validGregorian(y, m, d)) throw 0; var j = P.toJalali(y, m, d), wd = P.weekday(y, m, d);
        out.textContent = (lang === "fa" ? P.DAYS_FA[wd] + "، " + fd(j.jd) + " " + P.MONTHS_FA[j.jm - 1] + " " + fd(j.jy) : P.DAYS_EN[wd] + ", " + j.jd + " " + P.MONTHS_EN[j.jm - 1] + " " + j.jy) + " — " + (P.isLeapJalali(j.jy) ? t.leap : t.notleap) + " — " + fill(t.mlen, { n: fd(P.monthLength(j.jy, j.jm)) });
        out.dir = "auto";
      }
    } catch (e) { out.textContent = t.bad_date; out.classList.add("bad"); form.y.setAttribute("aria-invalid", "true"); form.d.setAttribute("aria-invalid", "true"); }
  }
  document.querySelectorAll("form[data-conv]").forEach(function (f) { f.addEventListener("input", function () { convert(f); }); f.addEventListener("submit", function (e) { e.preventDefault(); }); });
  function nowParts() { var n = new Date(); return { gy: n.getFullYear(), gm: n.getMonth() + 1, gd: n.getDate() }; }
  $("useToday").onclick = function () {
    var g = nowParts(), j = P.toJalali(g.gy, g.gm, g.gd), fj = document.querySelector('[data-conv="j2g"]'), fg = document.querySelector('[data-conv="g2j"]');
    fj.y.value = j.jy; fj.m.value = j.jm; fj.d.value = j.jd; fg.y.value = g.gy; fg.m.value = g.gm; fg.d.value = g.gd; convert(fj); convert(fg);
  };

  /* ---------- number to words ---------- */
  function words() {
    var digits = P.parseDigits($("num").value), out = $("words"), t = T[lang]; out.classList.remove("bad"); $("num").removeAttribute("aria-invalid");
    if (digits === null) { $("fmt").textContent = ""; out.textContent = $("num").value.trim() ? t.bad_num : ""; if ($("num").value.trim()) { out.classList.add("bad"); $("num").setAttribute("aria-invalid", "true"); } return; }
    var neg = digits[0] === "-", abs = neg ? digits.slice(1) : digits, unit = $("unit").value;
    $("fmt").textContent = (neg ? "−" : "") + P.toFaDigits(P.group(abs, "٬")) + (unit ? " " + unit : "");
    out.dir = "rtl"; out.textContent = P.numberToWords(digits) + (unit ? " " + unit : "");
  }
  $("num").addEventListener("input", words); $("unit").addEventListener("change", words);
  function copy(text) { try { navigator.clipboard.writeText(text).then(function () { toast(T[lang].copied); }, function () { toast("—"); }); } catch (e) { toast("—"); } }
  $("copyWords").onclick = function () { copy($("words").textContent); };
  document.querySelectorAll("[data-copy]").forEach(function (b) { b.onclick = function () { copy($(b.dataset.copy).textContent); }; });

  /* ---------- age ---------- */
  function ageCalc() {
    var f = $("ageForm"), y = intOf(f.y.value), m = +f.m.value, d = intOf(f.d.value), out = $("ageOut"), t = T[lang]; out.classList.remove("bad");
    if (!P.validJalali(y, m, d)) { out.textContent = t.bad_date; out.classList.add("bad"); return; }
    var g = nowParts(), a = P.age({ jy: y, jm: m, jd: d }, P.toJalali(g.gy, g.gm, g.gd));
    if (!a) { out.textContent = t.future; out.classList.add("bad"); return; }
    out.textContent = fill(t.age, { y: fd(a.years), m: fd(a.months), d: fd(a.days) }) + " — " + fill(t.age_days, { n: fd(P.group(String(a.totalDays), lang === "fa" ? "٬" : ","))}) + " — " + (a.nextBirthdayIn === 0 ? t.bday0 : fill(t.bday, { n: fd(a.nextBirthdayIn) }));
  }
  $("ageForm").addEventListener("input", ageCalc); $("ageForm").addEventListener("submit", function (e) { e.preventDefault(); });

  /* ---------- digits ---------- */
  function digits() { var v = $("dIn").value; $("dFa").textContent = P.toFaDigits(P.toEnDigits(v)); $("dEn").textContent = P.toEnDigits(v); }
  $("dIn").addEventListener("input", digits);

  /* ---------- language ---------- */
  function setLang(l) {
    lang = l; var root = document.documentElement, t = T[l]; root.lang = l; root.dir = l === "fa" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) { if (t[el.dataset.i18n] != null) el.textContent = t[el.dataset.i18n]; });
    document.title = l === "fa" ? "ابزارهای پارسی — تبدیل تاریخ شمسی، عدد به حروف، محاسبه سن" : "Pars Tools — Jalali date converter, number to words, age calculator";
    var b = $("lang"); b.textContent = l === "fa" ? "EN" : "FA"; b.lang = l === "fa" ? "en" : "fa"; b.setAttribute("aria-label", l === "fa" ? "English" : "فارسی");
    var g = nowParts(), j = P.toJalali(g.gy, g.gm, g.gd), wd = P.weekday(g.gy, g.gm, g.gd);
    $("today").textContent = fill(t.today, { d: l === "fa" ? P.DAYS_FA[wd] + " " + P.toFaDigits(j.jd) + " " + P.MONTHS_FA[j.jm - 1] + " " + P.toFaDigits(j.jy) : P.DAYS_EN[wd] + ", " + j.jd + " " + P.MONTHS_EN[j.jm - 1] + " " + j.jy });
    $("num").dir = "ltr"; fillMonths(); renderTabs();
    document.querySelectorAll("form[data-conv]").forEach(convert); words(); ageCalc(); digits();
    try { localStorage.setItem("pars.lang", l); } catch (e) { /* ignore */ }
  }
  $("lang").onclick = function () { setLang(lang === "fa" ? "en" : "fa"); };
  document.querySelector('[data-conv="j2g"] select').dataset.v = "1"; document.querySelector('[data-conv="g2j"] select').dataset.v = "1"; document.querySelector("#ageForm select").dataset.v = "3";
  var saved = null; try { saved = localStorage.getItem("pars.lang"); } catch (e) { /* ignore */ }
  var q = new URLSearchParams(location.search).get("lang"); setLang(q === "en" || q === "fa" ? q : saved === "en" ? "en" : "fa");
})();
