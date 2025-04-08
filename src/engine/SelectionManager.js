import { Path } from 'paper';

// Consider moving this to a shared constants or style module
const styles = {
  selectionRect: {
    strokeColor: '#FFF',
    dashArray: [1, 1],
    blendMode: 'difference',
  }
};

// Handles selection, dragging, and marquee selection of raster objects
export class SelectionManager {
  constructor(imageManager, windowManager) {
    this.imageManager = imageManager;
    this.windowManager = windowManager;

    this.selectedObjects = new Set();
    this.dragging = false;
    this.isSelectionMode = false;

    this.selectionRect = null;
    this.selectionStart = null;

    this.dragOffsetMap = new Map();
  }

  // Called from main.js to handle mouseDown logic
  handleMouseDown(event) {
    if (!this._isPointInInteractiveArea(event.point)) return false;

    const hit = this._hitTest(event.point);

    if (hit) {
      this._startDragging(hit, event);
    } else {
      this._startSelection(event);
    }

    return true;
  }

  // Called from main.js to handle dragging logic
  handleMouseDrag(event) {
    if (this.dragging) {
      this._dragSelectedObjects(event);
      return true;
    }

    if (this.isSelectionMode) {
      this._updateSelectionRect(event);
      return true;
    }

    return false;
  }

  // Called from main.js to handle mouseUp logic
  handleMouseUp(event) {
    if (this.isSelectionMode && this.selectionRect) {
      this._finalizeSelection();
    }

    this.dragging = false;
    this.isSelectionMode = false;

    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = null;
    }

    return false;
  }

  // ---- Internal helpers ----

  _isPointInInteractiveArea(point) {
    // Clarified terminology: interactive areas are areas where objects can be selected or dragged
    return (
      this.windowManager.isPointInWindow(point, "Inventory") ||
      this.windowManager.isPointInWindow(point, "Entrance")
    );
  }

  _startDragging(raster, event) {
    if (!this.selectedObjects.has(raster)) {
      this.clearSelection();
      this.selectedObjects.add(raster);
    }

    this.dragging = true;
    this.dragOffsetMap.clear();

    this.selectedObjects.forEach(obj => {
      if (typeof obj.bringToFront === 'function') {
        obj.bringToFront();
      }

      // Reorder to maintain z-index consistency in imageManager
      const index = this.imageManager.rasterObjects.indexOf(obj);
      if (index !== -1) {
        this.imageManager.rasterObjects.splice(index, 1);
        this.imageManager.rasterObjects.push(obj);
      }

      this.dragOffsetMap.set(obj, event.point.subtract(obj.position));
    });
  }

  _dragSelectedObjects(event) {
    this.selectedObjects.forEach(obj => {
      const offset = this.dragOffsetMap.get(obj);
      if (offset) {
        obj.position = event.point.subtract(offset);
      }
    });
  }

  _startSelection(event) {
    this.clearSelection();
    this.isSelectionMode = true;
    this.selectionStart = event.point;

    if (this.selectionRect) this.selectionRect.remove();

    this.selectionRect = new Path.Rectangle({
      from: this.selectionStart,
      to: this.selectionStart,
      ...styles.selectionRect
    });
  }

  _updateSelectionRect(event) {
    if (!this.selectionStart) return;

    if (this.selectionRect) this.selectionRect.remove();

    this.selectionRect = new Path.Rectangle({
      from: this.selectionStart,
      to: event.point,
      ...styles.selectionRect
    });
  }

  _finalizeSelection() {
    const bounds = this.selectionRect.bounds;

    this.imageManager.rasterObjects.forEach(raster => {
      if (bounds.intersects(raster.bounds)) {
        this.selectedObjects.add(raster);
        this.imageManager.invertRaster(raster);
      }
    });
  }

  _hitTest(point) {
    // Could be enhanced later to test opacity in GIFs
    for (let i = this.imageManager.rasterObjects.length - 1; i >= 0; i--) {
      const raster = this.imageManager.rasterObjects[i];
      if (raster.contains(point)) {
        return raster;
      }
    }
    return null;
  }

  // Public utility
  clearSelection() {
    this.selectedObjects.clear();
  }
}
