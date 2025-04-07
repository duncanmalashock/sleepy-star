import { Point, Path, Group, Tool, Raster, PointText } from 'paper';
import { globals } from './globals';

export class WindowManager {
  constructor() {
    this.windows = [];
    this.activeDrag = null;
    this.dragOffset = null;
  }

  createWindow(label, pos, size, resizable = false, scrollable = false) {
    const group = new Group();
    const titleBar = new Path.Rectangle(pos.add([0.5, 0.5]), [size.width, 18]);
    titleBar.fillColor = globals.white;
    titleBar.strokeColor = globals.black;
    const labelText = new PointText({ point: pos.add([5, 14]), content: label, fillColor: globals.black, fontFamily: 'Chicago', fontSize: 16 });
    
    const shadow = new Path.Rectangle(pos.add([2, 2]), [size.width, size.height]);
    shadow.fillColor = globals.black;
    
    const body = new Path.Rectangle(pos.add([0.5, 18.5]), [size.width, size.height - 18]);
    body.fillColor = globals.white;
    body.strokeColor = globals.black;
    
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
      btn.fillColor = globals.white;
      const txt = new PointText({ point: btn.position.add([-15, 5]), content: label, fillColor: globals.black, fontFamily: 'Chicago', fontSize: 16 });
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

