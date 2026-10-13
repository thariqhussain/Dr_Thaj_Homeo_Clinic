#!/usr/bin/env node
/**
 * Show / shrink the pixel size of .webp images. A 111 KB file can still be 4000px wide, and the
 * browser has to decode every pixel (and keep it in graphics memory) even if it is drawn tiny.
 *
 *   node shrink-images.mjs public/assets/journey 640          # dry run: lists sizes
 *   node shrink-images.mjs public/assets/journey 640 --apply  # shrinks images wider than 640px, in place
 *
 * Needs:  npm i -D sharp      Only ever makes images smaller, never larger.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [dir, maxArg] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const MAX = Number(maxArg);
if (!dir || !MAX) { console.error("Usage: node shrink-images.mjs <folder> <maxWidthPx> [--apply]"); process.exit(1); }

async function walk(d) {
  const out = [];
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) out.push(...(await walk(f))); else out.push(f);
  }
  return out;
}
const kb = (n) => (n / 1024).toFixed(0) + " KB";

let saved = 0, count = 0;
for (const f of (await walk(dir)).filter((f) => f.toLowerCase().endsWith(".webp"))) {
  const meta = await sharp(f).metadata();
  const size = (await fs.stat(f)).size;
  const tag = `${path.relative(process.cwd(), f)}  ${meta.width}x${meta.height}  ${kb(size)}`;
  if (meta.width <= MAX) { console.log(`ok       ${tag}`); continue; }
  count++;
  if (!APPLY) { console.log(`TOO BIG  ${tag}  -> would resize to ${MAX}px wide`); continue; }
  const buf = await sharp(f).resize({ width: MAX, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  await fs.writeFile(f, buf);
  saved += size - buf.length;
  console.log(`RESIZED  ${tag}  -> ${MAX}px, ${kb(buf.length)}`);
}
console.log(`\n${count} image(s) ${APPLY ? `resized, saved ${kb(saved)}` : "would be resized (add --apply)"}.`);
