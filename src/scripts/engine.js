import paper from 'paper';
import { Point, Path, Group, Tool, Raster, PointText } from 'paper';

const white = "#FFF";
const black = "#000";

window.onload = function () {
  paper.setup('myCanvas');

  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  const tool = new Tool();

  const windowManager = new WindowManager();
  const imageManager = new ImageManager();
  const selectionManager = new SelectionManager(imageManager, windowManager);
  const interactionManager = new InteractionManager();
  const gameObjectManager = new GameObjectManager(imageManager);

  // Create windows
  windowManager.createRoomWindow('Entrance', gameObjectManager);
  windowManager.createInventoryWindow(gameObjectManager);
  windowManager.createCommandBar();
  windowManager.createNarrationWindow();
  windowManager.createExitsWindow();
  windowManager.createSelfWindow(gameObjectManager);

  tool.onMouseDown = function (event) {
    if (windowManager.handleMouseDown(event)) return;
    if (selectionManager.isInsideSelectableWindow(event.point)) {
      const hit = selectionManager.hitTest(event.point);
      if (hit) selectionManager.startDragging(hit, event);
      else selectionManager.startSelection(event);
    }
  };

  tool.onMouseDrag = function (event) {
    if (windowManager.handleMouseDrag(event)) return;
    if (selectionManager.isDragging()) selectionManager.dragSelectedObjects(event);
    else if (selectionManager.isInsideSelectableWindow(event.point)) selectionManager.updateSelectionRect(event);
  };

  tool.onMouseUp = function (event) {
    windowManager.handleMouseUp(event);
    selectionManager.stopDragging();
  };
}


class WindowManager {
  constructor() {
    this.windows = [];
    this.activeDrag = null;
    this.dragOffset = null;
  }

  createWindow(label, pos, size, resizable = false, scrollable = false) {
    const group = new Group();
    const titleBar = new Path.Rectangle(pos.add([0.5, 0.5]), [size.width, 18]);
    titleBar.fillColor = white;
    titleBar.strokeColor = black;
    const labelText = new PointText({ point: pos.add([5, 14]), content: label, fillColor: black, fontFamily: 'Chicago', fontSize: 16 });
    
    const shadow = new Path.Rectangle(pos.add([2, 2]), [size.width, size.height]);
    shadow.fillColor = black;
    
    const body = new Path.Rectangle(pos.add([0.5, 18.5]), [size.width, size.height - 18]);
    body.fillColor = white;
    body.strokeColor = black;
    
    const clipMask = new Path.Rectangle(body.bounds);
    clipMask.clipMask = true;

    const contentsGroup = new Group();
    contentsGroup.clipped = true;
    contentsGroup.addChild(clipMask);

    const scroll = new Point(0, 0);
    if (scrollable) {
      contentsGroup.onMouseDrag = function (event) {
        contentsGroup.children.forEach(child => {
          if (!child.clipMask) child.position = child.position.add(event.delta);
        });
      };
    }

    group.addChildren([shadow, body, contentsGroup, titleBar, labelText]);

    this.windows.push({ group, titleBar, body, contentsGroup, pos, size, resizable, scrollable, label });
    return contentsGroup;
  }

  createRoomWindow(roomName, gameObjectManager) {
    const contents = this.createWindow(roomName, new Point(128, 66), { width: 256, height: 188 });
    gameObjectManager.renderRoomObjects(contents);
    return contents;
  }

  createInventoryWindow(gameObjectManager) {
    const contents = this.createWindow("inventory", new Point(2, 24), { width: 120, height: 230 }, true, true);
    gameObjectManager.renderInventoryObjects(contents);
    return contents;
  }

  createCommandBar() {
    const contents = this.createWindow("", new Point(128, 24), { width: 256, height: 40 });
    const buttons = ["Examine", "Open", "Close", "Speak", "Operate", "Go", "Hit", "Consume"];
    buttons.forEach((label, i) => {
      const btn = new Path.Rectangle(new Point(60 + i * 45, 245), [40, 30]);
      btn.fillColor = white;
      const txt = new PointText({ point: btn.position.add([-15, 5]), content: label, fillColor: black, fontFamily: 'Chicago', fontSize: 16 });
      contents.addChildren([btn, txt]);
    });
    return contents;
  }

  createNarrationWindow() {
    return this.createWindow("Untitled", new Point(2, 256), { width: 507, height: 83 }, true, true);
  }

  createExitsWindow() {
    return this.createWindow("Exits", new Point(404, 90), { width: 80, height: 100 });
  }

  createSelfWindow(gameObjectManager) {
    const contents = this.createWindow("Self", new Point(404, 24), { width: 80, height: 42 });
    gameObjectManager.renderSelf(contents);
    return contents;
  }

  handleMouseDown(event) {
    for (let win of this.windows) {
      if (win.titleBar.contains(event.point)) {
        this.activeDrag = win;
        this.dragOffset = event.point.subtract(win.group.position);
        return true;
      }
    }
    return false;
  }

  handleMouseDrag(event) {
    if (this.activeDrag) {
      this.activeDrag.group.position = event.point.subtract(this.dragOffset);
      return true;
    }
    return false;
  }

  handleMouseUp() {
    this.activeDrag = null;
    this.dragOffset = null;
  }

  isPointInWindow(eventPoint, label) {
    for (let win of this.windows) {
      if (win.label === label && win.body.contains(eventPoint)) {
        return true;
      }
    }
    return false;
  }
}

class GameObjectManager {
  constructor(imageManager) {
    this.imageManager = imageManager;
    this.roomObjects = [
      { name: 'Key', src: 'key.gif', position: new Point(10, 10), movable: true }
    ];
    this.inventoryObjects = [
      { name: 'Torch', src: 'torch.gif', position: new Point(-32, -48), movable: true },
    ];
    this.self = { name: 'Self', src: 'self.png', position: new Point(50, 50), movable: false };
  }

  renderRoomObjects(parentGroup) {
    this.roomObjects.forEach(obj => {
      const raster = this.imageManager.loadImage(obj.src, parentGroup.position.add(obj.position));
      raster.data = obj;
      parentGroup.addChild(raster);
    });
  }

  renderInventoryObjects(parentGroup) {
    this.inventoryObjects.forEach(obj => {
      const raster = this.imageManager.loadImage(obj.src, parentGroup.position.add(obj.position));
      raster.data = obj;
      parentGroup.addChild(raster);
    });
  }

  renderSelf(parentGroup) {
    const obj = this.self;
    const raster = this.imageManager.loadImage(obj.src, parentGroup.position.add(obj.position));
    raster.data = obj;
    parentGroup.addChild(raster);
  }
}

class InteractionManager {
  constructor() {
    this.activeCommand = null;
  }

  setCommand(command) {
    this.activeCommand = command;
  }

  getCommand() {
    return this.activeCommand;
  }

  clearCommand() {
    this.activeCommand = null;
  }
}

class SelectionManager {
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
      this.windowManager.isPointInWindow(point, "inventory") ||
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
      strokeColor: black,
      dashArray: [1, 1]
    });
  }

  updateSelectionRect(event) {
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = new Path.Rectangle({
        from: this.selectionStart,
        to: event.point,
        strokeColor: black,
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
      // this.dissolveInRaster(raster); // <- Trigger dissolve effect here
      console.log(`Loaded image at ${position}`);
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