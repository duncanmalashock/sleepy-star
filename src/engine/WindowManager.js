import { Point, Path, Group, Tool, Raster, PointText } from 'paper';

// !? could be imported from a globals module
const colors = {
  white: '#FFF',
  black: '#000'
}

export class WindowManager {
  constructor() {
    // Windows existing in the game
    // !? why not use a Set, as in SelectionManager?
    this.windows = [];
    // One window (or none) that's currently being dragged
    this.activeDrag = null;
    // How far the currently dragged window has been moved
    this.dragOffset = null;
  }

  // Create a new window and add it to the windows array
  createWindow(label, pos, size, resizable = false, scrollable = false) {
    // A group item that holds all parts of the window and its contents
    const group = new Group();

    // Title bar rectangle
    const titleBar = new Path.Rectangle(pos.add([0.5, 0.5]), [size.width, 18]);
    titleBar.fillColor = colors.white;
    titleBar.strokeColor = colors.black;

    // Title bar label text
    const labelText = new PointText({ point: pos.add([5, 14]), content: label, fillColor: colors.black, fontFamily: 'Chicago', fontSize: 16 });
    
    // Shadow cast on the bottom and right of the window
    const shadow = new Path.Rectangle(pos.add([2, 2]), [size.width, size.height]);
    shadow.fillColor = colors.black;
    
    // Body of the window
    const body = new Path.Rectangle(pos.add([0.5, 18.5]), [size.width, size.height - 18]);
    body.fillColor = colors.white;
    body.strokeColor = colors.black;
    
    // Clip the contents of the window to within its body
    const clipMask = new Path.Rectangle(body.bounds);
    clipMask.clipMask = true;
    const contentsGroup = new Group();
    contentsGroup.clipped = true;
    contentsGroup.addChild(clipMask);

    // Scroll position of the window body
    const scroll = new Point(0, 0);

    // If the window is scrollable, move all children when the user drags the contentsGroup
    // !? Shouldn't there be a different way of scrolling?
    if (scrollable) {
      contentsGroup.onMouseDrag = function (event) {
        contentsGroup.children.forEach(child => {
          if (!child.clipMask) child.position = child.position.add(event.delta);
        });
      };
    }

    // Add all parts of the window and contents to the group
    group.addChildren([shadow, body, contentsGroup, titleBar, labelText]);

    // Add the window "object" to the windows array
    // !? this is fragile with no type definition
    this.windows.push({ group, titleBar, body, contentsGroup, pos, size, resizable, scrollable, label });

    // !? How is this return value used? This seems arbitrary
    return contentsGroup;
  }

  // -- Create specific windows

  createRoomWindow(roomName, gameObjectManager) {
    // !? Window title should reflect current room name. This way it will not be a stable unique id
    const contents = this.createWindow(roomName, new Point(128, 66), { width: 256, height: 188 });
    gameObjectManager.renderRoomObjects(contents);
    return contents;
  }

  createInventoryWindow(gameObjectManager) {
    const contents = this.createWindow("Inventory", new Point(2, 24), { width: 120, height: 230 }, true, true);
    gameObjectManager.renderInventoryObjects(contents);
    return contents;
  }

  createCommandBar() {
    const contents = this.createWindow("Commands", new Point(128, 24), { width: 256, height: 40 });
    // !? May not be enough to uniquely identify
    // Button widths and rows should be specified for accurate layout
    const buttons = ["Examine", "Open", "Close", "Speak", "Operate", "Go", "Hit", "Consume"];
    // !? Buttons do nothing
    buttons.forEach((label, i) => {
      const btn = new Path.Rectangle(new Point(129 + i * 64, 42), [50, 20]);
      btn.fillColor = colors.white;
      const txt = new PointText({ point: btn.position.add([-15, 5]), content: label, fillColor: colors.black, fontFamily: 'Chicago', fontSize: 16 });
      contents.addChildren([btn, txt]);
    });
    return contents;
  }

  createNarrationWindow() {
    // !? Window title should reflect saved game name
    return this.createWindow("Untitled", new Point(2, 256), { width: 507, height: 83 }, true, true);
  }

  createExitsWindow() {
    return this.createWindow("Exits", new Point(404, 90), { width: 80, height: 100 });
  }

  createSelfWindow() {
    const contents = this.createWindow("Self", new Point(404, 24), { width: 80, height: 42 });
    return contents;
  }

  handleMouseDown(event) {
    // If the user clicked on a window's title bar, start dragging it
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
    // Drag window group by dragOffset if dragging
    if (this.activeDrag) {
      this.activeDrag.group.position = event.point.subtract(this.dragOffset);
      return true;
    }
    return false;
  }

  handleMouseUp() {
    // Stop dragging window on mouseUp
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

