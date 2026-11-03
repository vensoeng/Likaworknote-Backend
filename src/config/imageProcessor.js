const sharp = require("sharp");

const TARGET_BYTES = 89 * 1024;

exports.compressToTargetSize = async (inputBuffer, mimeType) => {
  if (mimeType === "image/webp" && inputBuffer.length <= TARGET_BYTES) {
    return {
      buffer: inputBuffer,
      extension: ".webp",
      mimeType,
      compressed: false
    };
  }

  const pipeline = sharp(inputBuffer).rotate();
  const metadata = await pipeline.metadata();
  
  let width = metadata.width || 1920;
  let height = metadata.height || 1080;

  if (width > 1920 || height > 1080) {
    const ratio = Math.min(1920 / width, 1080 / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  let quality = 80;
  let output = null;
  
  for (let pass = 0; pass < 5; pass += 1) {
    output = await pipeline
      .clone() 
      .resize({ width, height, fit: "inside", withoutEnlargement: true }) 
      .webp({ quality, effort: 4 }) 
      .toBuffer();

    // Target size achieved!
    if (output.length <= TARGET_BYTES) {
      return {
        buffer: output,
        extension: ".webp",
        mimeType: "image/webp",
        compressed: true
      };
    }

    if (quality > 50) {
      quality -= 15; 
    } else {
      width = Math.max(400, Math.floor(width * 0.7));
      height = Math.max(400, Math.floor(height * 0.7));
    }
  }

  return {
    buffer: output,
    extension: ".webp",
    mimeType: "image/webp",
    compressed: true
  };
};