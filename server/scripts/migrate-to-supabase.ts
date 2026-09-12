/**
 * One-time import of src/data/real-images/** into Supabase.
 *
 * Run locally (never in CI/Vercel): npm run migrate
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Safe to re-run: categories are matched by name, and storage uploads use
 * upsert, so running it twice won't duplicate rows for the same file.
 * See README.md for the folder convention this script expects.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { findOrCreateCategoryByName } from "../db/categories";
import { createPhotocard } from "../db/photocards";
import { createRawMedia } from "../db/rawMedia";
import { uploadFile, safeFileName } from "../supabase/storage";
import { getImageDimensions } from "../lib/imageSize";
import type { MediaKind } from "../db/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const REAL_IMAGES_DIR = path.join(REPO_ROOT, "src", "data", "real-images");
const PHOTO_CARD_DIR_NAME = "Photo Card";

loadEnvLocal(path.join(REPO_ROOT, ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add them to .env.local (see README.md) before running this script."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);

function kindForExt(ext: string): MediaKind | null {
  const lower = ext.toLowerCase();
  if (IMAGE_EXT.has(lower)) return "image";
  if (VIDEO_EXT.has(lower)) return "video";
  return null;
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

function contentTypeForExt(ext: string): string {
  return CONTENT_TYPES[ext.toLowerCase()] ?? "application/octet-stream";
}

/** category name -> keywords checked (in order) against the cleaned title. */
const CLASSIFIER: Array<{ category: string; keywords: string[] }> = [
  { category: "Vanity", keywords: ["vanity", "dressing"] },
  { category: "Study & Office", keywords: ["study", "office"] },
  { category: "Interior Design", keywords: ["kitchen", "interior"] },
  { category: "Rack", keywords: ["rack"] },
  { category: "Storage", keywords: ["storage", "cabinet", "shelf"] },
  { category: "Furniture", keywords: ["furniture"] },
];

function classify(title: string): string {
  const lower = title.toLowerCase();
  for (const { category, keywords } of CLASSIFIER) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "Highlights";
}

function cleanTitle(baseName: string): string {
  let name = baseName.replace(/^\d+[_-]/, "");
  name = name.replace(/_/g, " ").trim().replace(/\s+/g, " ");
  name = name.replace(/\bCaCabinet\b/gi, "Cabinet"); // known source-filename typo
  return name.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

function listDirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

let uploaded = 0;
let skipped = 0;
const flagged: string[] = [];

async function importFile(params: {
  absPath: string;
  destFolder: "photocards" | "raw-media";
  categoryName: string;
  target: "photocard" | "raw_media";
}) {
  const { absPath, destFolder, categoryName, target } = params;
  const ext = path.extname(absPath);
  const kind = kindForExt(ext);
  if (!kind) {
    skipped += 1;
    console.warn(`  skip (unrecognized file type): ${absPath}`);
    return;
  }

  const title = cleanTitle(path.basename(absPath, ext));
  const buffer = fs.readFileSync(absPath);
  const category = await findOrCreateCategoryByName(supabase, categoryName);
  const storagePath = `${destFolder}/${safeFileName(path.basename(absPath))}`;
  await uploadFile(supabase, storagePath, buffer, contentTypeForExt(ext));

  let width: number | null = null;
  let height: number | null = null;
  if (kind === "image") {
    const dims = getImageDimensions(buffer);
    if (dims) ({ width, height } = dims);
  }

  if (target === "photocard") {
    await createPhotocard(supabase, {
      category_id: category.id,
      image_path: storagePath,
      width,
      height,
      name_en: title,
    });
  } else {
    await createRawMedia(supabase, {
      category_id: category.id,
      kind,
      media_path: storagePath,
      width,
      height,
      name_en: title,
    });
  }
  uploaded += 1;
  console.log(`  + [${target}] "${categoryName}" <- ${title}`);
}

async function importPhotoCardFolder(dirPath: string) {
  const FIXED_SUBFOLDER_CATEGORY: Record<string, string> = {
    Rack: "Rack",
    "Reading Table": "Table",
  };

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const subName = entry.name;
      const subPath = path.join(dirPath, subName);

      if (subName in FIXED_SUBFOLDER_CATEGORY) {
        const categoryName = FIXED_SUBFOLDER_CATEGORY[subName];
        for (const file of listFiles(subPath)) {
          await importFile({
            absPath: path.join(subPath, file),
            destFolder: "photocards",
            categoryName,
            target: "photocard",
          });
        }
      } else if (subName === "Video") {
        for (const file of listFiles(subPath)) {
          const title = cleanTitle(path.basename(file, path.extname(file)));
          const categoryName = classify(title);
          flagged.push(`${subName}/${file} -> raw_media / "${categoryName}" (auto-classified)`);
          await importFile({
            absPath: path.join(subPath, file),
            destFolder: "raw-media",
            categoryName,
            target: "raw_media",
          });
        }
      } else {
        console.warn(
          `  Unrecognized "Photo Card/${subName}" subfolder — skipping. Add a rule in this script if it should be imported.`
        );
      }
    } else if (entry.isFile() && !entry.name.startsWith(".")) {
      // Loose photocard file directly under "Photo Card"
      const file = entry.name;
      const ext = path.extname(file);
      const kind = kindForExt(ext);
      const title = cleanTitle(path.basename(file, ext));
      const categoryName = classify(title);
      flagged.push(
        `${file} -> ${kind === "video" ? "raw_media" : "photocards"} / "${categoryName}" (auto-classified)`
      );
      if (kind === "video") {
        await importFile({
          absPath: path.join(dirPath, file),
          destFolder: "raw-media",
          categoryName,
          target: "raw_media",
        });
      } else {
        await importFile({
          absPath: path.join(dirPath, file),
          destFolder: "photocards",
          categoryName,
          target: "photocard",
        });
      }
    }
  }
}

async function main() {
  if (!fs.existsSync(REAL_IMAGES_DIR)) {
    console.error(`Not found: ${REAL_IMAGES_DIR}`);
    process.exit(1);
  }

  console.log(`Scanning ${REAL_IMAGES_DIR}\n`);

  for (const dirName of listDirs(REAL_IMAGES_DIR)) {
    const dirPath = path.join(REAL_IMAGES_DIR, dirName);
    console.log(`${dirName}/`);

    if (dirName === PHOTO_CARD_DIR_NAME) {
      await importPhotoCardFolder(dirPath);
      continue;
    }

    // Raw work folders (Cabinet, Interior Design, Table, Rack, Shop, ...) ->
    // one category per folder name, one raw_media row per file.
    const categoryName = dirName === "Shop" ? "Behind the Scenes" : dirName;
    for (const file of listFiles(dirPath)) {
      await importFile({
        absPath: path.join(dirPath, file),
        destFolder: "raw-media",
        categoryName,
        target: "raw_media",
      });
    }
  }

  console.log(`\nDone. Uploaded ${uploaded} item(s), skipped ${skipped}.`);
  if (flagged.length) {
    console.log(
      `\n${flagged.length} item(s) were auto-classified by filename keyword — worth a quick check in /admin:`
    );
    flagged.forEach((line) => console.log(`  - ${line}`));
  }
}

function loadEnvLocal(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
