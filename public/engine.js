paper.install(window);

window.onload = function () {
  paper.setup('myCanvas');

  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  // Disable smoothing for 1-bit style rendering
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  const tool = new paper.Tool();
  
  // Instantiate ImageManager and SelectionManager
  const imageManager = new ImageManager();
  const selectionManager = new SelectionManager(imageManager);
  
  // Load images into the canvas (Example: Torch)
  imageManager.loadImage('torch.gif', new Point(128, 128));
  imageManager.loadImage('torch.gif', new Point(48, 128));

  // Set up the tool for mouse events
  tool.onMouseDown = function (event) {
    const hit = selectionManager.hitTest(event.point);
    
    if (hit) {
      selectionManager.startDragging(hit, event);
    } else {
      selectionManager.startSelection(event);
    }
  };

  tool.onMouseDrag = function (event) {
    if (selectionManager.isDragging()) {
      selectionManager.dragSelectedObjects(event);
    } else {
      selectionManager.updateSelectionRect(event);
    }
  };

  tool.onMouseUp = function () {
    selectionManager.stopDragging();
  };
};

// Image Management Class
class ImageManager {
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
      console.log(`Loaded image at ${position}`);
    };

    return raster;
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

// Selection and Dragging Class
class SelectionManager {
  constructor(imageManager) {
    this.selectedObjects = new Set();
    this.dragging = false;
    this.selectionRect = null;
    this.selectionStart = null;
    this.dragOffsetMap = new Map();
    this.imageManager = imageManager;
  }

  // Start dragging selected objects
  startDragging(raster, event) {
    if (!this.selectedObjects.has(raster)) {
      this.clearSelection();
      this.selectRaster(raster);
    }

    this.dragging = true;
    this.dragOffsetMap.clear();

    this.selectedObjects.forEach(obj => {
      obj.bringToFront();
      const index = this.imageManager.rasterObjects.indexOf(obj);
      if (index !== -1) {
        this.imageManager.rasterObjects.splice(index, 1);
        this.imageManager.rasterObjects.push(obj);
      }
      this.dragOffsetMap.set(obj, event.point.subtract(obj.position));
    });
  }

  // Drag the selected objects
  dragSelectedObjects(event) {
    this.selectedObjects.forEach(obj => {
      const offset = this.dragOffsetMap.get(obj);
      obj.position = event.point.subtract(offset);
    });
  }

  // Start a selection rectangle
  startSelection(event) {
    this.clearSelection();
    this.selectionStart = event.point;
    if (this.selectionRect) {
      this.selectionRect.remove();
    }
    this.selectionRect = new Path.Rectangle({
      from: this.selectionStart,
      to: this.selectionStart,
      strokeColor: 'black',
      dashArray: [1, 1]
    });
  }

  // Update the selection rectangle while dragging
  updateSelectionRect(event) {
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = new Path.Rectangle({
        from: this.selectionStart,
        to: event.point,
        strokeColor: 'black',
        dashArray: [1, 1]
      });
      this.getBoundsSelection(this.selectionRect.bounds);
    }
  }

  // Get the bounds of the selection and select the objects within it
  getBoundsSelection(rect) {
    this.clearSelection();

    for (const raster of this.imageManager.rasterObjects) {
      const step = 4; // efficiency step: checking every 4 pixels
      const bounds = raster.bounds.intersect(rect);

      if (bounds.isEmpty()) continue;

      for (let x = bounds.left; x < bounds.right; x += step) {
        for (let y = bounds.top; y < bounds.bottom; y += step) {
          const point = new Point(x, y);
          if (this.isPointOnOpaquePixel(raster, point)) {
            this.selectRaster(raster);
            break;
          }
        }
        if (this.selectedObjects.has(raster)) break;
      }
    }
  }

  // Check if a point is on an opaque pixel of the raster
  isPointOnOpaquePixel(raster, point) {
    const local = point.subtract(raster.position).add(raster.size.multiply(0.5));
    const pixel = raster.getPixel(local);
    return pixel && pixel.alpha > 0.5;
  }

  // Select a raster object
  selectRaster(raster) {
    if (this.selectedObjects.has(raster)) return;

    this.imageManager.invertRasterColors(raster);
    this.selectedObjects.add(raster);
  }

  // Clear the current selection
  clearSelection() {
    this.selectedObjects.forEach(obj => {
      if (obj._originalImage) {
        obj.setImageData(obj._originalImage);
      }
    });
    this.selectedObjects.clear();
    console.log('Selection cleared');
  }

  // Hit test for selecting an object on mouse down
  hitTest(point) {
    for (let i = this.imageManager.rasterObjects.length - 1; i >= 0; i--) {
      const raster = this.imageManager.rasterObjects[i];
      if (this.isPointOnOpaquePixel(raster, point)) {
        return raster;
      }
    }
    return null;
  }

  // Stop dragging
  stopDragging() {
    this.dragging = false;
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = null;
    }
  }

  // Check if dragging is active
  isDragging() {
    return this.dragging;
  }
}
