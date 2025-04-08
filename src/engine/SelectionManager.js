import { Point, Path, Group, Tool, Raster, PointText } from 'paper';

// !? could be imported from a globals module
const colors = {
  white: '#FFF',
  black: '#000'
}

// Responsible for selecting and dragging game objects represented by rasters
export class SelectionManager {
  constructor(imageManager, windowManager) {
    // !? A Set, not an array
    this.selectedObjects = new Set();
    // Is the user dragging their mouse
    // !? doesn't differentiate between dragging to select and dragging a selected object
    this.dragging = false;
    // Selection rectangle that may or not be active
    this.selectionRect = null;
    // Drag origin
    this.selectionStart = null;
    // Key-value mapping objects to points
    this.dragOffsetMap = new Map();

    // Dependencies
    this.imageManager = imageManager;
    this.windowManager = windowManager;
  }

  isInsideSelectableWindow(point) {
    // !? "selectable window" is an ambiguous term.
    // a window in which a selection rectangle can be drawn?
    // a window in which game objects can be selected?
    return (
      this.windowManager.isPointInWindow(point, "Inventory") ||
      this.windowManager.isPointInWindow(point, "Entrance") 
    );
  }

  // Start dragging a raster object
  startDragging(raster, event) {
    // Drag if the object is already selected
    if (!this.selectedObjects.has(raster)) {
      this.clearSelection();
      this.selectRaster(raster);
    }
    // !? Assumes all objects are draggable
    // Maybe this is okay when the try/result approach is in place
    this.dragging = true;
    this.dragOffsetMap.clear();

    // Group dragging behavior in the case of multiple selected objects
    this.selectedObjects.forEach(obj => {
      // !? what API does bringToFront belong to?
      obj.bringToFront();
      const index = this.imageManager.rasterObjects.indexOf(obj);
      // If this object isn't the last in the array of rasterObjects
      if (index !== -1) {
        // !? What's going on here?
        this.imageManager.rasterObjects.splice(index, 1);
        this.imageManager.rasterObjects.push(obj);
      }
      // Update the map of drag offsets
      this.dragOffsetMap.set(obj, event.point.subtract(obj.position));
    });
  }

  dragSelectedObjects(event) {
    // !? Called by main instead of inside a handleMouseDrag
    this.selectedObjects.forEach(obj => {
      const offset = this.dragOffsetMap.get(obj);
      obj.position = event.point.subtract(offset);
    });
  }

  // More accurately startSelectionRect
  startSelection(event) {
    // !? Clearing may not be necessary for multiple selection with shift-drag
    this.clearSelection();
    this.selectionStart = event.point;
    if (this.selectionRect) {
      this.selectionRect.remove();
    }
    this.selectionRect = new Path.Rectangle({
      from: this.selectionStart,
      to: this.selectionStart,
      strokeColor: colors.white,
      dashArray: [1, 1],
      blendMode: 'difference'
    });
  }

  updateSelectionRect(event) {
    if (this.selectionRect) {
      this.selectionRect.remove();
      // !? Styles are duplicated
      this.selectionRect = new Path.Rectangle({
        from: this.selectionStart,
        to: event.point,
        strokeColor: colors.white,
        dashArray: [1, 1],
        blendMode: 'difference'
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
    // !? called by main instead of a handleMouseDown or handleMouseDrag function
    for (let i = this.imageManager.rasterObjects.length - 1; i >= 0; i--) {
      const raster = this.imageManager.rasterObjects[i];
      // !? doesn't test for opacity of gif images
      if (raster.contains(point)) {
        return raster;
      }
    }
    return null;
  }

  stopDragging() {
    // !? called by main instead of a handleMouseUp function
    this.dragging = false;
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = null;
    }
  }

  isDragging() {
    // !? called by main instead of a handleMouseDown or handleMouseDrag function
    return this.dragging;
  }
}

