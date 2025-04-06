// Assuming you have Paper.js included and initialized in an HTML canvas
// This is a basic 1-bit style 2D graphics engine using Paper.js

paper.install(window);
window.onload = function () {
  paper.setup('myCanvas');

  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  const tool = new paper.Tool();

  const rasterObjects = [];
  let selectedObjects = new Set();
  let selectionRect = null;
  let selectionStart = null;
  let dragging = false;
  let dragOffsetMap = new Map();

  function loadRaster(src, position) {
    const raster = new Raster({
      source: src,
      position: position,
    });

    raster.onLoad = function () {
      rasterObjects.push(raster);
    };

    return raster;
  }

  function isPointOnOpaquePixel(raster, point) {
    const local = point.subtract(raster.position).add(raster.size.multiply(0.5));
    const pixel = raster.getPixel(local);
    return pixel && pixel.alpha > 0.5;
  }

  function clearSelection() {
    selectedObjects.forEach(obj => {
      if (obj._originalImage) {
        obj.setImageData(obj._originalImage);
      }
    });
    selectedObjects.clear();
  }

  function selectRaster(raster) {
    // Don't re-invert if already selected
    if (selectedObjects.has(raster)) return;
  
    if (!raster._originalImage) {
      raster._originalImage = raster.getImageData();
    } else {
      raster.setImageData(raster._originalImage);
    }
  
    const imageData = raster.getImageData();
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i];     // R
      imageData.data[i + 1] = 255 - imageData.data[i + 1]; // G
      imageData.data[i + 2] = 255 - imageData.data[i + 2]; // B
    }
  
    raster.setImageData(imageData);
    selectedObjects.add(raster);
  }

  function hitTest(point) {
    for (let i = rasterObjects.length - 1; i >= 0; i--) {
      const raster = rasterObjects[i];
      if (isPointOnOpaquePixel(raster, point)) {
        return raster;
      }
    }
    return null;
  }

  function getBoundsSelection(rect) {
    clearSelection();
  
    for (const raster of rasterObjects) {
      const step = 4; // check every 4 pixels for efficiency
      const bounds = raster.bounds.intersect(rect);
  
      if (bounds.isEmpty()) continue;
  
      for (let x = bounds.left; x < bounds.right; x += step) {
        for (let y = bounds.top; y < bounds.bottom; y += step) {
          const point = new Point(x, y);
          if (isPointOnOpaquePixel(raster, point)) {
            selectRaster(raster);
            break;
          }
        }
        if (selectedObjects.has(raster)) break;
      }
    }
  }

  tool.onMouseDown = function (event) {
    const hit = hitTest(event.point);
    if (hit) {
      if (!selectedObjects.has(hit)) {
        clearSelection();
        selectRaster(hit);
      }
  
      dragging = true;
      dragOffsetMap.clear();
  
      // Bring selected objects to front
      selectedObjects.forEach(obj => {
        obj.bringToFront();
  
        // Remove and push to the end of rasterObjects to reflect topmost layer
        const index = rasterObjects.indexOf(obj);
        if (index !== -1) {
          rasterObjects.splice(index, 1);
          rasterObjects.push(obj);
        }
  
        dragOffsetMap.set(obj, event.point.subtract(obj.position));
      });
    } else {
      clearSelection();
  
      selectionStart = event.point;
      if (selectionRect) selectionRect.remove();
      selectionRect = new Path.Rectangle({
        from: selectionStart,
        to: selectionStart,
        strokeColor: 'black',
        dashArray: [1, 1]
      });
    }
  };
  

  tool.onMouseDrag = function (event) {
    if (dragging) {
      selectedObjects.forEach(obj => {
        const offset = dragOffsetMap.get(obj);
        obj.position = event.point.subtract(offset);
      });
    } else if (selectionRect) {
      selectionRect.remove();
      selectionRect = new Path.Rectangle({
        from: selectionStart,
        to: event.point,
        strokeColor: 'black',
        dashArray: [1, 1]
      });
      getBoundsSelection(selectionRect.bounds);
    }
  };

  tool.onMouseUp = function () {
    dragging = false;
    if (selectionRect) {
      selectionRect.remove();
      selectionRect = null;
    }
  };

  // Example: load a 1-bit style GIF object
  loadRaster('torch.gif', new Point(128, 128));
  loadRaster('torch.gif', new Point(48, 128));
};
