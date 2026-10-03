/**
 * Generates the Admin Panel PWA icons from public/images/logo.png: the brand logo with an "ADMIN" pill,
 * so the admin app is visually distinct from the Partner Portal app on a phone's home screen.
 *
 * The artwork is full-bleed with all content inside the maskable safe zone (central circle, 40% radius),
 * so one image serves the "any" and "maskable" icon purposes alike.
 *
 * Run: npx tsx server/scripts/generate-admin-icons.ts
 * Writes public/images/admin_app_{180,192,512}.png
 */
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "../..");
const SOURCE = path.join(ROOT, "public/images/logo.png");
const OUT_DIR = path.join(ROOT, "public/images");
const SIZES = [180, 192, 512];

async function render(size: number): Promise<Buffer> {
  // Sample the logo's flat background colour so the strip uncovered by the upward shift matches it.
  const [r, g, b] = [...(await sharp(SOURCE).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer())];

  const logo = await sharp(SOURCE).resize(size, size).toBuffer();
  const shiftUp = Math.round(size * 0.07);

  const pillW = size * 0.42;
  const pillH = size * 0.115;
  const pillX = (size - pillW) / 2;
  const pillY = size * 0.675;
  const pill = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#ffffff"/>
      <text x="${size / 2}" y="${pillY + pillH * 0.7}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${pillH * 0.58}"
        letter-spacing="${size * 0.012}" fill="rgb(${r},${g},${b})">ADMIN</text>
    </svg>`,
  );

  return sharp({ create: { width: size, height: size, channels: 3, background: { r, g, b } } })
    .composite([
      { input: logo, left: 0, top: -shiftUp },
      { input: pill, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

async function main() {
  for (const size of SIZES) {
    const file = path.join(OUT_DIR, `admin_app_${size}.png`);
    await sharp(await render(size)).toFile(file);
    console.log(`wrote ${path.relative(ROOT, file)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
