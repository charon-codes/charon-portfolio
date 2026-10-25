#!/usr/bin/env node
/* build.mjs — renders index.html and fa/index.html from src/template.html + src/content/*.json.
   Zero dependencies (Node 18+). Run:  node scripts/build.mjs   */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const write = (p, s) => { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), s); };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);

const shared = JSON.parse(read("src/content/shared.json"));
const langs = { en: JSON.parse(read("src/content/en.json")), fa: JSON.parse(read("src/content/fa.json")) };
const template = read("src/template.html");
const localFonts = existsSync(join(ROOT, "assets/fonts/fonts.css"));
const year = new Date().getFullYear();
const digits = (s, lang) => (lang === "fa" ? String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]) : String(s));

function fontsTag(lang, p) {
  if (localFonts) return `<link rel="preload" href="${p}assets/fonts/fonts.css" as="style">\n<link rel="stylesheet" href="${p}assets/fonts/fonts.css">`;
  const fam = "family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@400;500;700" + (lang === "fa" ? "&family=Vazirmatn:wght@400;500;700" : "");
  return `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?${fam}&display=swap" rel="stylesheet">`;
}

function render(lang) {
  const c = langs[lang], ui = c.ui, p = lang === "fa" ? "../" : "", other = lang === "fa" ? "en" : "fa";
  const url = shared.baseUrl + (lang === "fa" ? "fa/" : "");
  const asset = (path) => (path ? (/^https?:/.test(path) ? path : p + path) : "");

  const tape = [["HTML5", 1], ["CSS3", 1], ["JAVASCRIPT", 1], ["GIT", 1], ["RESPONSIVE", 1], ["TEMPLATES", 0], ["BLOAT", 0]]
    .concat([["HTML5", 1], ["CSS3", 1], ["JAVASCRIPT", 1], ["GIT", 1], ["RESPONSIVE", 1], ["TEMPLATES", 0], ["BLOAT", 0]])
    .map(([w, up]) => `<span>${w} <b class="${up ? "u" : "d"}">${up ? "▲" : "▼"}</b></span>`).join("");

  const rows = shared.projects.map((s) => {
    const t = c.projects[s.id] || { title: s.id, desc: "", imageAlt: "" };
    const main = s.live || s.repo;
    const title = main ? `<a href="${esc(main)}" rel="noopener">${esc(t.title)}</a>` : esc(t.title);
    const acts = [s.live && `<a href="${esc(s.live)}" rel="noopener">${esc(ui.live)}</a>`, s.repo && `<a href="${esc(s.repo)}" rel="noopener" lang="en">${esc(ui.code)}</a>`].filter(Boolean).join("");
    const img = s.image ? `<figure class="thumb"><img src="${esc(asset(s.image))}" alt="${esc(t.imageAlt)}" width="640" height="400" loading="lazy" decoding="async"></figure>` : "";
    return `<article class="row${s.image ? " has-img" : ""}${main ? " linked" : ""}">${img}<div class="rh"><h3>${title}</h3>${s.year ? `<span class="yr">${esc(digits(s.year, lang))}</span>` : ""}</div><div class="rb"><p>${esc(t.desc)}</p>${acts ? `<div class="acts">${acts}</div>` : ""}</div><div class="tags" lang="en" dir="ltr">${s.tags.map((g) => `<i>${esc(g)}</i>`).join("")}</div></article>`;
  }).join("");

  const cv = shared.cv[lang] || shared.cv.en;
  const contactBtns = [
    `<button type="button" class="btn gold" id="copy" dir="ltr" data-email="${esc(shared.email)}">${esc(shared.email)}</button>`,
    `<a class="btn" href="mailto:${esc(shared.email)}">${esc(ui.email)}</a>`,
    ...shared.links.map((l) => `<a class="btn" href="${esc(l.url)}" rel="noopener">${esc(c.contact.linkLabels[l.id] || l.id)}</a>`),
    cv ? `<a class="btn" href="${esc(asset(cv))}" download>${esc(c.contact.cvLabel)}</a>` : "",
  ].join("");

  const gh = shared.links.find((l) => l.id === "github");
  const jsonld = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: shared.author, jobTitle: c.meta.jobTitle, description: c.meta.description, url, inLanguage: lang, address: { "@type": "PostalAddress", addressLocality: "Tehran", addressCountry: "IR" }, sameAs: shared.links.map((l) => l.url).filter((u) => u.length > 20 || u === gh?.url), knowsAbout: ["HTML5", "CSS3", "JavaScript", "Git", "Responsive web design"] }).replace(/</g, "\\u003c");

  const flat = {
    lang, dir: c.dir, locale: c.locale, altLocale: langs[other].locale, p, url, baseUrl: shared.baseUrl, author: shared.author,
    title: esc(c.meta.title), description: esc(c.meta.description), jsonld, fonts: fontsTag(lang, p),
    rtl: lang === "fa" ? `<link rel="stylesheet" href="${p}assets/css/rtl.css">\n` : "",
    skip: esc(ui.skip), theme: esc(ui.theme), menu: esc(ui.menu), tgl: esc(ui.tgl), noscript: esc(ui.noscript),
    altHref: lang === "fa" ? "../" : "fa/", altLang: other, langName: ui.langName, langTitle: ui.langTitle,
    heroLoc: esc(c.hero.loc), heroTag: esc(c.hero.tag), heroHint: esc(c.hero.hint), cta0: esc(c.hero.cta[0]), cta1: esc(c.hero.cta[1]),
    p1: esc(c.about.p1), p2: esc(c.about.p2),
    facts: c.about.facts.map(([k, v]) => `<div><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join(""),
    tiles: c.tiles.map(([n, d]) => `<div class="tile"><b lang="en" dir="ltr">${esc(n)}</b><span>${esc(d)}</span></div>`).join(""),
    qc: ["about", "skills", "projects", "trade", "sudo hire-me"].map((x) => `<button type="button" data-c="${x}">${x}</button>`).join(""),
    rows, tape, contactBtns, foot: esc(digits(ui.foot.replace("{year}", year), lang)),
    timeline: c.path.map((x) => `<li class="${esc(x.status || "done")}"><time>${esc(x.time)}</time>${x.status === "next" ? `<span class="ahead">${esc(ui.ahead)}</span>` : ""}<h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></li>`).join(""),
  };
  c.nav.forEach((n, i) => (flat["nav" + i] = esc(n)));
  const ctx = { ...flat, ...Object.fromEntries(Object.entries(c.sections).flatMap(([k, v]) => Object.entries(v).map(([kk, vv]) => [`${k}.${kk}`, esc(vv)]))) };
  const html = template.replace(/\{\{([\w.]+)\}\}/g, (_, k) => { if (!(k in ctx)) throw new Error(`Template placeholder not defined: ${k}`); return ctx[k]; });
  write(lang === "fa" ? "fa/index.html" : "index.html", html);
}

/* assets/js/locales.js — strings rendered by JavaScript, generated from the same JSON */
function locales() {
  const out = {};
  for (const [lang, c] of Object.entries(langs)) {
    const u = c.ui;
    out[lang] = { roles: u.roles, copied: u.copied, hint: u.hint, welcome: u.welcome, notfound: u.notfound, granted: u.granted, cmd: { ...u.cmd, contact: shared.email } };
  }
  write("assets/js/locales.js", `/* GENERATED by scripts/build.mjs from src/content/*.json — do not edit by hand. */\nwindow.LOCALES=${JSON.stringify(out, null, 1)};\nwindow.APP={lang:document.documentElement.lang==="fa"?"fa":"en",reduce:matchMedia("(prefers-reduced-motion: reduce)").matches};\nwindow.APP.t=window.LOCALES[window.APP.lang];\n`);
}

/* sitemap.xml — lastmod = build date */
function sitemap() {
  const d = new Date().toISOString().slice(0, 10), b = shared.baseUrl;
  const alt = `<xhtml:link rel="alternate" hreflang="en" href="${b}"/><xhtml:link rel="alternate" hreflang="fa" href="${b}fa/"/>`;
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n <url><loc>${b}</loc><lastmod>${d}</lastmod>${alt}</url>\n <url><loc>${b}fa/</loc><lastmod>${d}</lastmod>${alt}</url>\n${shared.projects.filter((p) => p.live.startsWith(b + "projects/")).map((p) => ` <url><loc>${p.live}</loc><lastmod>${d}</lastmod></url>\n`).join("")}</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${b}sitemap.xml\n`);
}

render("en"); render("fa"); locales(); sitemap();
console.log("built: index.html, fa/index.html, assets/js/locales.js, sitemap.xml" + (localFonts ? " (local fonts)" : " (Google Fonts)"));
