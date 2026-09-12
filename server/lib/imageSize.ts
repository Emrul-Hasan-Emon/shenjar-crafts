export type ImageDimensions = { width: number; height: number };

/**
 * Hand-rolled PNG/JPEG dimension reader — deliberately not using the
 * `image-size` npm package, which has an open, unpatched DoS advisory in its
 * ICNS/JXL/HEIF parsers. We only ever need JPEG/PNG here, so a small,
 * bounded, single-pass reader avoids the dependency entirely.
 */
export function getImageDimensions(buffer: Buffer): ImageDimensions | null {
  if (isPng(buffer)) return pngSize(buffer);
  if (isJpeg(buffer)) return jpegSize(buffer);
  return null;
}

function isPng(buf: Buffer): boolean {
  return (
    buf.length > 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  );
}

function pngSize(buf: Buffer): ImageDimensions {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function isJpeg(buf: Buffer): boolean {
  return buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8;
}

function jpegSize(buf: Buffer): ImageDimensions | null {
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}
