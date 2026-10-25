/* app.js — bilingual UI (EN / FA with RTL), menu tabs, live opening status, reservation form. */
(function () {
  "use strict";
  var N = window.NiraLogic, $ = function (id) { return document.getElementById(id); };

  var T = {
    en: { skip: "Skip to menu", concept: "Concept project · fictional café", nav_menu: "Menu", nav_story: "Story", nav_visit: "Visit", nav_reserve: "Reserve",
      h1: "Slow coffee for fast cities.", lead: "Single-origin beans, roasted weekly in small batches and brewed with patience.", cta1: "Reserve a table", cta2: "See the menu", cup_alt: "A steaming cup of coffee",
      menu_h: "Menu", menu_note: "Prices are fictional. In the Persian version they are shown in Toman.", story_h: "Our story",
      story_p: "Nira started as a one-table roastery. We still roast every Thursday, still know our farmers by name, and still believe a good cup needs no rush.",
      f1_t: "Roasted", f1_d: "Every Thursday", f2_t: "Beans", f2_d: "Single origin", f3_t: "Brewing", f3_d: "Slow, on purpose",
      visit_h: "Visit us", addr: "12 Example Street, Tehran<br>(concept address)", hours_c: "Opening hours", d_satthu: "Saturday – Thursday", d_fri: "Friday",
      res_h: "Reserve a table", l_name: "Name", l_phone: "Phone", l_date: "Date", l_time: "Time", l_guests: "Guests", send: "Request reservation",
      done_h: "Table requested", ics: "Add to calendar (.ics)", foot: "Concept project by Charon. Nothing here is a real business or booking.", back: "← Back to portfolio",
      open: "Open now · until {t}", closed: "Closed · opens {t}", closed_t: "Closed · opens tomorrow at {t}",
      e_name: "Please enter your name.", e_phone: "Enter a valid phone number.", e_date: "Choose a date.", e_past: "That date has already passed.", e_time: "Choose a time.", e_guests: "Guests must be between 1 and 10.",
      done_p: "{n}, we saved a table for {g} on {d} at {t}. (This is a concept: no booking was actually made.)", cat: ["Coffee", "Tea & cold", "Bakery"] },
    fa: { skip: "پرش به منو", concept: "پروژهٔ مفهومی · کافهٔ فرضی", nav_menu: "منو", nav_story: "داستان ما", nav_visit: "آدرس", nav_reserve: "رزرو",
      h1: "قهوهٔ آرام برای شهرهای پرشتاب.", lead: "دانه‌های تک‌خاستگاه، برشته‌شده هر هفته در حجم کم و دم‌شده با حوصله.", cta1: "رزرو میز", cta2: "دیدن منو", cup_alt: "یک فنجان قهوهٔ داغ",
      menu_h: "منو", menu_note: "قیمت‌ها فرضی هستند. در نسخهٔ فارسی به تومان نمایش داده می‌شوند.", story_h: "داستان ما",
      story_p: "نیرا با یک میز و یک دستگاه رُست شروع شد. هنوز هر پنج‌شنبه قهوه رُست می‌کنیم، کشاورزهایمان را به اسم می‌شناسیم و باور داریم یک فنجان خوب عجله نمی‌خواهد.",
      f1_t: "رُست", f1_d: "هر پنج‌شنبه", f2_t: "دانه", f2_d: "تک‌خاستگاه", f3_t: "دم‌آوری", f3_d: "آرام و عمدی",
      visit_h: "به ما سر بزنید", addr: "تهران، خیابان نمونه، پلاک ۱۲<br>(آدرس مفهومی)", hours_c: "ساعت کار", d_satthu: "شنبه تا پنج‌شنبه", d_fri: "جمعه",
      res_h: "رزرو میز", l_name: "نام", l_phone: "تلفن", l_date: "تاریخ", l_time: "ساعت", l_guests: "تعداد نفرات", send: "ثبت درخواست رزرو",
      done_h: "درخواست میز ثبت شد", ics: "افزودن به تقویم (.ics)", foot: "پروژهٔ مفهومی از Charon. هیچ‌چیز اینجا کسب‌وکار یا رزرو واقعی نیست.", back: "← بازگشت به پورتفولیو",
      open: "اکنون باز است · تا ساعت {t}", closed: "بسته است · ساعت {t} باز می‌شود", closed_t: "بسته است · فردا ساعت {t} باز می‌شود",
      e_name: "نام خود را وارد کنید.", e_phone: "شمارهٔ تلفن معتبر وارد کنید.", e_date: "یک تاریخ انتخاب کنید.", e_past: "این تاریخ گذشته است.", e_time: "یک ساعت انتخاب کنید.", e_guests: "تعداد نفرات باید بین ۱ تا ۱۰ باشد.",
      done_p: "{n}، میزی برای {g} نفر در تاریخ {d} ساعت {t} نگه داشتیم. (این یک پروژهٔ مفهومی است؛ رزرو واقعی انجام نشد.)", cat: ["قهوه", "چای و سرد", "نان و شیرینی"] }
  };
  var MENU = [
    [["Espresso", "اسپرسو", "Double shot, syrupy and sweet", "دو شات غلیظ و شیرین", 2.5], ["Americano", "آمریکانو", "Espresso lengthened with hot water", "اسپرسو با آب داغ", 3], ["Flat white", "فلت‌وایت", "Velvety milk, double ristretto", "شیر مخملی و ریسترتو دوبل", 3.8], ["Cappuccino", "کاپوچینو", "Equal parts espresso, milk and foam", "اسپرسو، شیر و فوم به‌اندازهٔ مساوی", 3.8], ["V60 pour-over", "دمی V60", "The weekly single origin, brewed by hand", "قهوهٔ تک‌خاستگاه هفته، دم‌شده با دست", 4.5]],
    [["Jasmine tea", "چای یاسمن", "Green tea scented with jasmine", "چای سبز معطر به یاسمن", 3], ["Cold brew", "کلدبرو", "Steeped for 18 hours", "۱۸ ساعت دم‌کشیده", 4.2], ["Iced latte", "آیس‌لاته", "Espresso, cold milk, ice", "اسپرسو، شیر سرد و یخ", 4.4], ["Fresh lemonade", "لیموناد تازه", "Lemon, mint, a little sugar", "لیمو، نعنا و کمی شکر", 3.2]],
    [["Butter croissant", "کروسان کره‌ای", "Baked every morning", "هر صبح پخته می‌شود", 3], ["Cardamom roll", "رول هل", "Soft, spiced, not too sweet", "نرم، خوش‌عطر و کم‌شیرین", 3.4], ["Saffron cake", "کیک زعفران", "Light crumb, saffron syrup", "بافت سبک با شربت زعفران", 3.6], ["Brownie", "براونی", "Dark chocolate, sea salt", "شکلات تلخ و نمک دریا", 3.2]]
  ];
  var lang = "en", cat = 0;
  var USD_TO_TOMAN = 30000; // fictional rate, for display only

  function price(usd) { return lang === "fa" ? new Intl.NumberFormat("fa-IR").format(Math.round(usd * USD_TO_TOMAN)) + " تومان" : "$" + usd.toFixed(2); }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function digits(s) { return lang === "fa" ? String(s).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; }) : String(s); }

  function renderTabs() {
    var tabs = $("tabs"); tabs.innerHTML = "";
    T[lang].cat.forEach(function (name, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "tab"; b.id = "tab" + i; b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(i === cat)); b.setAttribute("aria-controls", "items"); b.tabIndex = i === cat ? 0 : -1; b.textContent = name;
      b.onclick = function () { cat = i; renderTabs(); renderItems(); $("tab" + cat).focus(); };
      b.onkeydown = function (e) { var n = T[lang].cat.length, k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!k) return; if (document.documentElement.dir === "rtl") k = -k; e.preventDefault(); cat = (cat + k + n) % n; renderTabs(); renderItems(); $("tab" + cat).focus(); };
      tabs.appendChild(b);
    });
    $("items").setAttribute("aria-labelledby", "tab" + cat);
  }
  function renderItems() {
    var ul = $("items"); ul.innerHTML = "";
    MENU[cat].forEach(function (m) {
      var li = document.createElement("li"), i = lang === "fa" ? 1 : 0;
      var b = document.createElement("b"); b.textContent = m[i]; var p = document.createElement("span"); p.className = "p"; p.textContent = price(m[4]);
      var s = document.createElement("small"); s.textContent = m[2 + i]; li.appendChild(b); li.appendChild(p); li.appendChild(s); ul.appendChild(li);
    });
  }
  function renderStatus() {
    var s = N.openStatus(new Date()), el = $("status"), t = T[lang];
    el.classList.toggle("open", s.open);
    el.textContent = s.open ? fill(t.open, { t: digits(s.closesAt) }) : fill(s.tomorrow ? t.closed_t : t.closed, { t: digits(s.opensAt) });
  }
  function renderTimes() {
    var sel = $("time"), cur = sel.value; sel.innerHTML = '<option value=""></option>';
    N.TIMES.forEach(function (x) { var o = document.createElement("option"); o.value = x; o.textContent = digits(x); sel.appendChild(o); }); sel.value = cur;
  }

  function setLang(l, silent) {
    lang = l; var t = T[l], root = document.documentElement;
    root.lang = l; root.dir = l === "fa" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) { if (t[el.dataset.i18n] != null) el.innerHTML = t[el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) { el.dataset.i18nAttr.split(",").forEach(function (pair) { var kv = pair.split(":"); el.setAttribute(kv[0], t[kv[1]]); }); });
    document.title = l === "fa" ? "کافه نیرا — قهوهٔ آرام برای شهرهای پرشتاب (پروژهٔ مفهومی)" : "Nira Café — slow coffee for fast cities (concept)";
    var btn = $("lang"); btn.textContent = l === "fa" ? "EN" : "FA"; btn.lang = l === "fa" ? "en" : "fa"; btn.setAttribute("aria-label", l === "fa" ? "English" : "فارسی");
    renderTabs(); renderItems(); renderStatus(); renderTimes(); clearErrors();
    if (!silent) { try { localStorage.setItem("nira.lang", l); } catch (e) { /* ignore */ } }
    if (last) showDone(last);
  }

  /* ---------- reservation ---------- */
  var last = null;
  function clearErrors() { document.querySelectorAll(".err").forEach(function (e) { e.textContent = ""; }); document.querySelectorAll("[aria-invalid]").forEach(function (e) { e.removeAttribute("aria-invalid"); }); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function showDone(r) {
    var df = lang === "fa" ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long", timeZone: "UTC" }) : new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
    var ds = df.format(new Date(r.date + "T00:00:00Z"));
    $("done-p").textContent = fill(T[lang].done_p, { n: r.name, g: digits(r.guests), d: ds, t: digits(r.time) }); $("done").hidden = false;
  }
  $("rf").addEventListener("submit", function (e) {
    e.preventDefault(); clearErrors();
    var r = { name: $("name").value, phone: $("phone").value, date: $("date").value, time: $("time").value, guests: $("guests").value };
    var v = N.validateReservation(r, today());
    if (!v.ok) {
      var first = null;
      Object.keys(v.errors).forEach(function (f) { $("e-" + f).textContent = T[lang]["e_" + v.errors[f]]; $(f).setAttribute("aria-invalid", "true"); if (!first) first = $(f); });
      first.focus(); $("done").hidden = true; last = null; return;
    }
    last = { name: r.name.trim(), phone: r.phone.trim(), date: r.date, time: r.time, guests: +r.guests };
    try { localStorage.setItem("nira.last", JSON.stringify(last)); } catch (x) { /* ignore */ }
    showDone(last); $("done").focus();
  });
  $("ics").onclick = function () {
    if (!last) return; var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([N.buildIcs(last, new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z")], { type: "text/calendar" }));
    a.download = "nira-reservation.ics"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  };
  $("lang").onclick = function () { setLang(lang === "en" ? "fa" : "en"); };

  /* ---------- init ---------- */
  $("date").min = today(); $("date").value = "";
  var q = new URLSearchParams(location.search).get("lang"), saved = null;
  try { saved = localStorage.getItem("nira.lang"); } catch (e) { /* ignore */ }
  setLang(q === "fa" || q === "en" ? q : saved || ((navigator.language || "").slice(0, 2) === "fa" ? "fa" : "en"), true);
  setInterval(renderStatus, 60000);
})();
