/**
 * Client-side image compression via canvas re-encoding — no dependency, runs
 * entirely in the browser before upload. Leaves the file untouched if it's
 * already small enough or isn't an image (e.g. video).
 */
export async function compressImageIfNeeded(
  file: File,
  maxBytes = 1_500_000,
  maxDimension = 2000
): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = 0.9;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size <= maxBytes || quality <= 0.35) break;
    quality -= 0.15;
  }
  if (!blob) return file;

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
