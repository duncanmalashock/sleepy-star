const colors = {
  white: '#FFF',
  black: '#000'
}

export class SelectionManager {
  constructor(imageManager, windowManager) {
    this.selectedObjects = new Set();
    this.dragging = false;
    this.selectionRect = null;
    this.selectionStart = null;
    this.dragOffsetMap = new Map();
    this.imageManager = imageManager;
    this.windowManager = windowManager;
  }

  isInsideSelectableWindow(point) {
    return (
      this.windowManager.isPointInWindow(point, "Inventory") ||
      this.windowManager.isPointInWindow(point, "Entrance") 
    );
  }

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

  dragSelectedObjects(event) {
    this.selectedObjects.forEach(obj => {
      const offset = this.dragOffsetMap.get(obj);
      obj.position = event.point.subtract(offset);
    });
  }

  startSelection(event) {
    this.clearSelection();
    this.selectionStart = event.point;
    if (this.selectionRect) {
      this.selectionRect.remove();
    }
    this.selectionRect = new Path.Rectangle({
      from: this.selectionStart,
      to: this.selectionStart,
      strokeColor: colors.black,
      dashArray: [1, 1]
    });
  }

  updateSelectionRect(event) {
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = new Path.Rectangle({
        from: this.selectionStart,
        to: event.point,
        strokeColor: colors.black,
        dashArray: [1, 1]
      });
    }
  }

  selectRaster(raster) {
    this.selectedObjects.add(raster);
  }

  clearSelection() {
    this.selectedObjects.clear();
  }

  hitTest(point) {
    for (let i = this.imageManager.rasterObjects.length - 1; i >= 0; i--) {
      const raster = this.imageManager.rasterObjects[i];
      if (raster.contains(point)) {
        return raster;
      }
    }
    return null;
  }

  stopDragging() {
    this.dragging = false;
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = null;
    }
  }

  isDragging() {
    return this.dragging;
  }
}

