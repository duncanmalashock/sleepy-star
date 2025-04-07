import { Point, Path, Group, Tool, Raster, PointText } from 'paper';
import { globals } from './globals';

export class ImageManager {
  constructor() {
    this.rasterObjects = [];
  }

  loadImage(src, position) {
    const raster = new Raster({
      source: src,
      position: position
    });

    raster.onLoad = () => {
      this.rasterObjects.push(raster);
      // this.dissolveInRaster(raster); // <- Trigger dissolve effect here
      // console.log(`Loaded image at ${position}`);
    };

    return raster;
  }

  dissolveInRaster(raster, duration = 0, batchSize = 100) {
    const originalData = raster.getImageData();
    const tempData = new ImageData(originalData.width, originalData.height);
    const totalPixels = originalData.width * originalData.height;
  
    // Build list of pixel indices
    const indices = Array.from({ length: totalPixels }, (_, i) => i);
    
    // Shuffle the indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    raster.setImageData(tempData); // Start fully transparent
    let revealed = 0;
    function revealBatch() {
      for (let i = 0; i < batchSize && revealed < totalPixels; i++, revealed++) {
        const index = indices[revealed];
        const px = index * 4;
  
        tempData.data[px] = originalData.data[px];
        tempData.data[px + 1] = originalData.data[px + 1];
        tempData.data[px + 2] = originalData.data[px + 2];
        tempData.data[px + 3] = originalData.data[px + 3];
      }
      raster.setImageData(tempData);
      if (revealed < totalPixels) {
        setTimeout(revealBatch, duration / (totalPixels / batchSize));
      }
    }
    revealBatch();
  }

  // Invert the colors of the raster
  invertRasterColors(raster) {
    if (!raster._originalImage) {
      raster._originalImage = raster.getImageData();
    } else {
      raster.setImageData(raster._originalImage);
    }

    const imageData = raster.getImageData();
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i];       // Red
      imageData.data[i + 1] = 255 - imageData.data[i + 1]; // Green
      imageData.data[i + 2] = 255 - imageData.data[i + 2]; // Blue
    }

    raster.setImageData(imageData);
    console.log(`Inverted colors for raster at ${raster.position}`);
  }
}
