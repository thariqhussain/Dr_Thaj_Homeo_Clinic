#!/usr/bin/env node
/**
 * Point your code at the .webp files that now exist in public/.
 * For every  name.webp  found in public/, any reference to  name.jpg / .jpeg / .png / .avif
 * (full path OR just the file name, e.g. in src/data/content.js) is changed to  name.webp.
 *
 *   node update-refs.mjs           # dry run: shows what would change
 *   node update-refs.mjs --apply   # writes the changes
 *
 * Run from the project root. Safe to run more than once.
 */
import fs from "node:fs/promises";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const TARGETS = [path.join(ROOT, "src"), path.join(ROOT, "index.html")];
const CODE_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".html", ".json", ".vue", ".svelte", ".md"]);
const OLD = ["jpg", "jpeg", "png", "avif"];

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}
const exists = (p) => fs.access(p).then(() => true, () => false);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// name (no ext) -> new file name, built from the .webp files on disk
const map = new Map(); // "treatment1.jpg" (lowercase) -> "treatment1.webp"
const webps = (await walk(PUBLIC_DIR)).filter((f) => f.toLowerCase().endsWith(".webp"));
for (const f of webps) {
  const base = path.basename(f, path.extname(f));
  for (const ext of OLD) map.set(`${base}.${ext}`.toLowerCase(), `${base}.webp`);
  // names made by the converter when two formats clashed: before-jpg.webp  <-  before.jpg
  const m = base.match(/^(.*)-(jpg|jpeg|png|avif)$/i);
  if (m) map.set(`${m[1]}.${m[2]}`.toLowerCase(), `${base}.webp`);
}
if (!map.size) { console.error("No .webp files found in public/. Run from the project root."); process.exit(1); }

const names = [...map.keys()].map(esc).sort((a, b) => b.length - a.length);
// not preceded by a letter/digit/underscore/dash/dot, so  "x_treatment1.jpg" is left alone
const re = new RegExp(`(?<![\\w.-])(${names.join("|")})(?![\\w])`, "gi");

const files = [];
for (const t of TARGETS) {
  if (!(await exists(t))) continue;
  if ((await fs.stat(t)).isDirectory()) files.push(...(await walk(t)));
  else files.push(t);
}

let changedFiles = 0, changes = 0;
const leftovers = [];
for (const file of files) {
  if (!CODE_EXTS.has(path.extname(file).toLowerCase())) continue;
  const text = await fs.readFile(file, "utf8");
  let n = 0;
  const next = text.replace(re, (m) => { n++; return map.get(m.toLowerCase()); });
  if (n) {
    changedFiles++; changes += n;
    console.log(`${APPLY ? "UPDATED" : "WOULD UPDATE"} ${path.relative(ROOT, file)}  (${n})`);
    if (APPLY) await fs.writeFile(file, next);
  }
  next.split("\n").forEach((line, i) => {
    if (/\.(jpe?g|png|avif)\b/i.test(line)) leftovers.push(`${path.relative(ROOT, file)}:${i + 1}  ${line.trim().slice(0, 110)}`);
  });
}

console.log(`\n${changes} reference(s) in ${changedFiles} file(s) ${APPLY ? "updated" : "would be updated (add --apply)"}.`);
if (leftovers.length) {
  console.log(`\nStill mentions an old image format (check these by hand):`);
  leftovers.forEach((l) => console.log("  " + l));
}