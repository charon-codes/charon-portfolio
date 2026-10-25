#!/usr/bin/env node
/* check.mjs — validates the built site. Errors fail the run (exit 1); TODOs are reminders for content you still need to fill. */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [], todos = [];
const shared = JSON.parse(readFileSync(join(ROOT, "src/content/shared.json"), "utf8"));
const IDS = ["bar", "glow", "theme", "menu", "links", "type", "chart", "parts", "copy", "tout", "tin", "contact", "top"];

for (const [file, lang] of [["index.html", "en"], ["fa/index.html", "fa"]]) {
  if (!existsSync(join(ROOT, file))) { errors.push(`${file}: missing (run: npm run build)`); continue; }
  const html = readFileSync(join(ROOT, file), "utf8"), dir = dirname(file);
  if (!html.includes(`<html lang="${lang}"`)) errors.push(`${file}: wrong <html lang>`);
  if (lang === "fa" && !html.includes('dir="rtl"')) errors.push(`${file}: missing dir="rtl"`);
  for (const id of IDS) if (!html.includes(`id="${id}"`)) errors.push(`${file}: missing #${id}`);
  for (const m of html.matchAll(/(?:href|src)="((?:\.\.\/)?assets\/[^"#?]+)"/g)) if (!existsSync(join(ROOT, normalize(join(dir, m[1]))))) errors.push(`${file}: broken asset ${m[1]}`);
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  for (const d of ids.filter((x, i) => ids.indexOf(x) !== i)) errors.push(`${file}: duplicate id ${d}`);
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (m[1] && !ids.includes(m[1])) errors.push(`${file}: anchor #${m[1]} has no target`);
  for (const h of ["canonical", 'hreflang="en"', 'hreflang="fa"', 'hreflang="x-default"', "og:image", "application/ld+json"]) if (!html.includes(h)) errors.push(`${file}: missing ${h}`);
  if (/\{\{|undefined|\[object/.test(html)) errors.push(`${file}: unresolved template output`);
  if (/<img(?![^>]*\balt=)/.test(html)) errors.push(`${file}: <img> without alt`);
}
if (!existsSync(join(ROOT, "assets/img/og-cover.png"))) errors.push("assets/img/og-cover.png missing");

if (shared.email === "example@email.com") todos.push("src/content/shared.json: replace placeholder email");
for (const l of shared.links) if (/^https?:\/\/t\.me\/?$/.test(l.url) || /github\.com\/?$/.test(l.url)) todos.push(`shared.json: link "${l.id}" has no username`);
for (const p of shared.projects) {
  if (!p.live && !p.repo) todos.push(`shared.json: project "${p.id}" has no live/repo link`);
  if (!p.image) todos.push(`shared.json: project "${p.id}" has no screenshot (optional but recommended)`);
  if (p.live && p.live.startsWith(shared.baseUrl + "projects/") && !existsSync(join(ROOT, "projects", p.id, "index.html"))) errors.push(`project "${p.id}": projects/${p.id}/index.html not found`);
  if (p.image && !existsSync(join(ROOT, p.image))) errors.push(`project "${p.id}": image not found (${p.image})`);
}
for (const l of ["en", "fa"]) if (shared.cv[l] && !existsSync(join(ROOT, shared.cv[l]))) errors.push(`cv.${l}: file not found (${shared.cv[l]})`);
if (shared.projects.length < 3) todos.push(`shared.json: only ${shared.projects.length} project(s) — recommended: 3+ real projects`);
if (!shared.cv.en && !shared.cv.fa) todos.push("shared.json: no CV file set (optional)");
if (!existsSync(join(ROOT, "assets/fonts/fonts.css"))) todos.push("fonts are loaded from Google Fonts — run: npm run fonts (self-host)");

todos.forEach((t) => console.log("TODO  " + t));
errors.forEach((e) => console.error("ERROR " + e));
console.log(errors.length ? `\n${errors.length} error(s)` : `\nOK — ${todos.length} content TODO(s) left`);
process.exit(errors.length ? 1 : 0);
