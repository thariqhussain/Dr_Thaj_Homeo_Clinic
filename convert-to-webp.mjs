#!/usr/bin/env node
/**
 * Convert every jpg / jpeg / png / avif inside the WHOLE public/ folder to WebP.
 *
 *   node convert-to-webp.mjs                        # dry run (nothing changes)
 *   node convert-to-webp.mjs --apply                # convert, keep originals
 *   node convert-to-webp.mjs --apply --delete       # convert, delete originals
 *   node convert-to-webp.mjs --apply --update-refs  # also rewrite paths in src/ + index.html
 *   Options: --quality=85  --lossless
 *
 * Setup: npm i -D sharp
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const APPLY = has("--apply");
const DELETE = has("--delete");
const UPDATE_REFS = has("--update-refs");
const LOSSLESS = has("--lossless");
const quality = Number((args.find((a) => a.startsWith("--quality=")) || "").split("=")[1]) || 80;

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const CODE_TARGETS = [path.join(ROOT, "src"), path.join(ROOT, "index.html")];
const CODE_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".html", ".json", ".md", ".vue", ".svelte"]);
const SOURCE_EXTS = new Set([".jpg", ".jpeg", ".png", ".avif"]);
const PRIORITY = [".png", ".jpg", ".jpeg", ".avif"]; // which source wins if names collide

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      out.push(...(await walk(full)));
    } else out.push(full);
  }
  return out;
}

const exists = (p) => fs.access(p).then(() => true, () => false);
const kb = (n) => (n / 1024).toFixed(1) + " KB";
const folderOf = (f) => path.relative(PUBLIC_DIR, path.dirname(f)).split(path.sep).join("/") || "(public root)";

async function main() {
  if (!(await exists(PUBLIC_DIR))) {
    console.error(`Folder not found: ${PUBLIC_DIR}\nRun this from your project root.`);
    process.exit(1);
  }
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY RUN (add --apply to make changes)");
  console.log(`Quality: ${LOSSLESS ? "lossless" : quality}\n`);

  const all = await walk(PUBLIC_DIR);
  const sources = all.filter((f) => SOURCE_EXTS.has(path.extname(f).toLowerCase()));
  console.log(`Found ${sources.length} convertible image(s) in ${PUBLIC_DIR}\n`);

  // Group by plain destination (same folder + same base name)
  const groups = new Map();
  for (const f of sources) {
    const plain = f.replace(/\.[^.]+$/, ".webp");
    groups.set(plain, [...(groups.get(plain) || []), f]);
  }

  const stats = {}; // per folder
  const bump = (file, key) => {
    const k = folderOf(file);
    stats[k] ??= { converted: 0, existed: 0, renamed: 0, failed: 0 };
    stats[k][key]++;
  };

  const handled = []; // { src, dest } for every source whose webp exists (or would exist)
  let savedBytes = 0;

  for (const [plain, srcs] of groups) {
    const clash = srcs.length > 1;
    if (clash) {
      console.warn(`NOTE ${path.relative(ROOT, plain)} would be shared by: ${srcs.map((s) => path.basename(s)).join(", ")} -> converting each to its own file`);
    }

    for (const src of srcs) {
      // Clash: keep the original extension in the new name (before.jpg -> before-jpg.webp)
      const ext = path.extname(src).slice(1).toLowerCase();
      const dest = clash ? src.replace(/\.[^.]+$/, `-${ext}.webp`) : plain;
      if (clash) bump(src, "renamed");

      if (await exists(dest)) {
        console.log(`EXISTS ${path.relative(ROOT, dest)} (not overwritten)`);
        bump(src, "existed");
        handled.push({ src, dest });
        continue;
      }
      if (!APPLY) {
        console.log(`WOULD CONVERT ${path.relative(ROOT, src)} -> ${path.basename(dest)}`);
        bump(src, "converted");
        handled.push({ src, dest });
        continue;
      }
      try {
        await sharp(src, { animated: true })
          .rotate()
          .webp(LOSSLESS ? { lossless: true } : { quality })
          .toFile(dest);
        const [a, b] = await Promise.all([fs.stat(src), fs.stat(dest)]);
        savedBytes += a.size - b.size;
        console.log(`OK  ${path.relative(ROOT, src)} -> ${path.basename(dest)}  ${kb(a.size)} -> ${kb(b.size)}`);
        bump(src, "converted");
        handled.push({ src, dest });
      } catch (err) {
        console.error(`FAIL ${path.relative(ROOT, src)}: ${err.message}`);
        bump(src, "failed");
      }
    }
  }

  if (DELETE) {
    for (const { src } of handled) {
      if (APPLY) await fs.unlink(src);
      else console.log(`WOULD DELETE ${path.relative(ROOT, src)}`);
    }
  }

  if (UPDATE_REFS) {
    const codeFiles = [];
    for (const t of CODE_TARGETS) {
      if (!(await exists(t))) continue;
      const st = await fs.stat(t);
      if (st.isDirectory()) codeFiles.push(...(await walk(t)));
      else codeFiles.push(t);
    }
    const reps = handled
      .map(({ src, dest }) => [
        path.relative(PUBLIC_DIR, src).split(path.sep).join("/"),
        path.relative(PUBLIC_DIR, dest).split(path.sep).join("/"),
      ])
      .sort((a, b) => b[0].length - a[0].length);

    for (const file of codeFiles) {
      if (!CODE_EXTS.has(path.extname(file).toLowerCase())) continue;
      const text = await fs.readFile(file, "utf8");
      let next = text;
      for (const [from, to] of reps) next = next.split(from).join(to);
      if (next !== text) {
        console.log(`${APPLY ? "UPDATED" : "WOULD UPDATE"} refs in ${path.relative(ROOT, file)}`);
        if (APPLY) await fs.writeFile(file, next);
      }
    }
  }

  console.log("\n=== Per-folder summary ===");
  console.table(stats);
  if (APPLY) console.log(`Saved ${kb(savedBytes)} in total.`);
}

main().catch((e) => { console.error(e); process.exit(1); });