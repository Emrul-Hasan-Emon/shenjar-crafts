/**
 * Re-import the raw work folders (Cabinet, Interior Design, Table, Rack, Shop)
 * into raw_media with name/description left blank so they can be filled in
 * later via /admin. Images are compressed (resized + re-encoded to JPEG,
 * capped at ~1.5MB) with sharp; videos are uploaded as-is (size-capped at
 * 100MB, same limit the admin upload form enforces).
 *
 * Run with: npx tsx server/scripts/import-raw-media.ts
 * Not wired into any npm script — this is a manual, deliberate one-off.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { findOrCreateCategoryByName } from "../db/categories";
import { createRawMedia } from "../db/rawMedia";
import { uploadFile, safeFileName } from "../supabase/storage";
import type { MediaKind } from "../db/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const REAL_IMAGES_DIR = path.join(REPO_ROOT, "src", "data", "real-images");

const RAW_FOLDERS: Record<string, string> = {
  Cabinet: "Cabinet",
  "Interior Design": "Interior Design",
  Table: "Table",
  Rack: "Rack",
  Shop: "Behind the Scenes",
};

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2000;
const MAX_VIDEO_BYTES = 15 * 1024 * 1024;

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);
const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

loadEnvLocal(path.join(REPO_ROOT, ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function kindForExt(ext: string): MediaKind | null {
  const lower = ext.toLowerCase();
  if (IMAGE_EXT.has(lower)) return "image";
  if (VIDEO_EXT.has(lower)) return "video";
  return null;
}

/** Resize to at most MAX_IMAGE_DIMENSION on the long edge, then step quality down until under MAX_IMAGE_BYTES. */
async function compressImage(buffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  const resized = sharp(buffer).rotate().resize({
    width: MAX_IMAGE_DIMENSION,
    height: MAX_IMAGE_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  let quality = 90;
  let output = await resized.clone().jpeg({ quality }).toBuffer();
  while (output.length > MAX_IMAGE_BYTES && quality > 35) {
    quality -= 15;
    output = await resized.clone().jpeg({ quality }).toBuffer();
  }
  const meta = await sharp(output).metadata();
  return { buffer: output, width: meta.width ?? 0, height: meta.height ?? 0 };
}

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

let imported = 0;
let skipped = 0;

async function importFolder(folderName: string, categoryName: string) {
  const dirPath = path.join(REAL_IMAGES_DIR, folderName);
  if (!fs.existsSync(dirPath)) {
    console.warn(`Skipping "${folderName}" — folder not found.`);
    return;
  }

  const category = await findOrCreateCategoryByName(supabase, categoryName);
  console.log(`${folderName}/ -> category "${categoryName}"`);

  for (const file of listFiles(dirPath)) {
    const absPath = path.join(dirPath, file);
    const ext = path.extname(file);
    const kind = kindForExt(ext);
    if (!kind) {
      skipped += 1;
      console.warn(`  skip (unrecognized file type): ${file}`);
      continue;
    }

    if (kind === "image") {
      const original = fs.readFileSync(absPath);
      const { buffer, width, height } = await compressImage(original);
      const storagePath = `raw-media/${safeFileName(file.replace(/\.\w+$/, ".jpg"))}`;
      await uploadFile(supabase, storagePath, buffer, "image/jpeg");
      await createRawMedia(supabase, {
        category_id: category.id,
        kind: "image",
        media_path: storagePath,
        width,
        height,
        name_en: null,
        name_bn: null,
        description_en: null,
        description_bn: null,
      });
      console.log(
        `  + [image] ${file} (${(original.length / 1024 / 1024).toFixed(2)}MB -> ${(buffer.length / 1024 / 1024).toFixed(2)}MB)`
      );
    } else {
      const stat = fs.statSync(absPath);
      if (stat.size > MAX_VIDEO_BYTES) {
        skipped += 1;
        console.warn(`  skip (video over 15MB): ${file}`);
        continue;
      }
      const buffer = fs.readFileSync(absPath);
      const storagePath = `raw-media/${safeFileName(file)}`;
      await uploadFile(supabase, storagePath, buffer, CONTENT_TYPES[ext.toLowerCase()] ?? "video/mp4");
      await createRawMedia(supabase, {
        category_id: category.id,
        kind: "video",
        media_path: storagePath,
        width: null,
        height: null,
        name_en: null,
        name_bn: null,
        description_en: null,
        description_bn: null,
      });
      console.log(`  + [video] ${file} (${(stat.size / 1024 / 1024).toFixed(2)}MB, uncompressed)`);
    }
    imported += 1;
  }
}

async function main() {
  for (const [folderName, categoryName] of Object.entries(RAW_FOLDERS)) {
    await importFolder(folderName, categoryName);
  }
  console.log(`\nDone. Imported ${imported} item(s), skipped ${skipped}.`);
  console.log("All names/descriptions were left blank — fill them in via /admin/raw-media.");
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
