const sharp = require("sharp");

const TARGET_BYTES = 86 * 1024;

exports.compressToTargetSize = async (inputBuffer, mimeType) => {
  const metadata = await sharp(inputBuffer).metadata();
  const startWidth = metadata.width || 1920;
  const startHeight = metadata.height || 1080;

  if (mimeType === "image/webp" && inputBuffer.length <= TARGET_BYTES) {
    return {
      buffer: inputBuffer,
      extension: ".webp",
      mimeType,
      compressed: false
    };
  }

  let width = startWidth;
  let height = startHeight;
  let quality = 82;
  let output = null;

  for (let pass = 0; pass < 10; pass += 1) {
    output = await sharp(inputBuffer)
      .rotate()
      .resize({ width, height, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();

    if (output.length <= TARGET_BYTES) {
      return {
        buffer: output,
        extension: ".webp",
        mimeType: "image/webp",
        compressed: true
      };
    }

    if (quality > 45) {
      quality -= 8;
    } else {
      width = Math.max(640, Math.floor(width * 0.8));
      height = Math.max(640, Math.floor(height * 0.8));
    }
  }

  return {
    buffer: output,
    extension: ".webp",
    mimeType: "image/webp",
    compressed: true
  };
};