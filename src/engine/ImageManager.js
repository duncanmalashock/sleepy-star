import { Raster } from 'paper';

export class ImageManager {
  constructor() {
    this.rasterObjects = [];
    this._originalImages = new WeakMap(); // Maps raster → original ImageData
  }

  loadImage(src, position) {
    const raster = new Raster({
      source: src,
      position
    });

    raster.onLoad = () => {
      this.rasterObjects.push(raster);
      this._originalImages.set(raster, raster.getImageData());
    };

    return raster;
  }

  invertRaster(raster) {
    if (!this._originalImages.has(raster)) {
      console.warn("No original image data found for inversion.");
      return;
    }

    const imageData = raster.getImageData();
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i];       // Red
      imageData.data[i + 1] = 255 - imageData.data[i + 1]; // Green
      imageData.data[i + 2] = 255 - imageData.data[i + 2]; // Blue
    }

    raster.setImageData(imageData);
  }

  resetRaster(raster) {
    const original = this._originalImages.get(raster);
    if (original) {
      raster.setImageData(original);
    }
  }

  dissolveInRaster(raster, duration = 1000, batchSize = 100) {
    const original = this._originalImages.get(raster) || raster.getImageData();
    const tempData = new ImageData(original.width, original.height);
    const totalPixels = original.width * original.height;

    // Cache original if not already saved
    if (!this._originalImages.has(raster)) {
      this._originalImages.set(raster, original);
    }

    // Shuffle pixel indices
    const indices = Array.from({ length: totalPixels }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Start fully transparent
    raster.setImageData(tempData);
    let revealed = 0;

    const revealBatch = () => {
      for (let i = 0; i < batchSize && revealed < totalPixels; i++, revealed++) {
        const index = indices[revealed];
        const px = index * 4;
        tempData.data[px] = original.data[px];
        tempData.data[px + 1] = original.data[px + 1];
        tempData.data[px + 2] = original.data[px + 2];
        tempData.data[px + 3] = original.data[px + 3];
      }

      raster.setImageData(tempData);

      if (revealed < totalPixels) {
        setTimeout(revealBatch, duration / (totalPixels / batchSize));
      }
    };

    revealBatch();
  }
}
