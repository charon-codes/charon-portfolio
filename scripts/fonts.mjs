#!/usr/bin/env node
/* fonts.mjs — downloads the Google Fonts used by the site into assets/fonts/ and writes assets/fonts/fonts.css.
   Run once with internet access:  npm run fonts   then   npm run build   (the build switches to local fonts automatically). */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets/fonts");
const CSS_URL = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@400;500;700&family=Vazirmatn:wght@400;500;700&display=swap";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"; // asks for woff2

mkdirSync(OUT, { recursive: true });
let css = await (await fetch(CSS_URL, { headers: { "User-Agent": UA } })).text();
const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
if (!urls.length) throw new Error("No font files found in the Google Fonts response.");
let i = 0;
for (const u of urls) {
  const name = `font-${String(++i).padStart(2, "0")}.woff2`;
  writeFileSync(join(OUT, name), Buffer.from(await (await fetch(u)).arrayBuffer()));
  css = css.split(u).join(name);
  process.stdout.write(`\r${i}/${urls.length}`);
}
writeFileSync(join(OUT, "fonts.css"), css);
console.log(`\nDone: ${urls.length} files + assets/fonts/fonts.css. Now run: npm run build`);
