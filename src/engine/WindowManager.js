import { Point, Path, Group, Raster, PointText } from 'paper';
import { COLORS, LOCATIONS } from './constants';

const styles = {
  windowTitleBar: {
    height: 18,
    fontSize: 16,
    padding: 5,
  },
  button: {
    width: 50,
    height: 20,
    spacing: 64,
    fontSize: 16,
  },
  shadow: {
    left: 2,
    top: 2,
  },
  correctionFactor: {
    x: 0.5,
    y: 0.5
  }
};

const correctForSubPixels = function(pos) {
  return pos.add([styles.correctionFactor.x, styles.correctionFactor.y]);
};

export class WindowManager {
  constructor() {
    this.windows = new Map(); // Use Map for named access
    this.activeDrag = null;
    this.dragOffset = null;
  }

  createTitleBar(label, pos, width) {
    const titleBar = new Path.Rectangle(correctForSubPixels(pos), [width - 1, styles.windowTitleBar.height]);
    titleBar.fillColor = COLORS.WHITE;
    titleBar.strokeColor = COLORS.BLACK;

    const labelText = new PointText({
      point: pos.add([styles.windowTitleBar.padding, 14]),
      content: label,
      fillColor: COLORS.BLACK,
      fontFamily: 'Chicago',
      fontSize: styles.windowTitleBar.fontSize,
    });

    return new Group([titleBar, labelText]);
  }

  createWindow(label, pos, size, { resizable = false, scrollable = false, showTitleBar = true } = {}) {
    const group = new Group();
    const titleBarHeight = showTitleBar ? styles.windowTitleBar.height : 0;
  
    const shadow = new Path.Rectangle(
      pos.add([styles.shadow.left, styles.shadow.top]),
      [size.width, size.height]
    );
    shadow.fillColor = COLORS.BLACK;
  
    const bodyPos = correctForSubPixels(pos.add([0, titleBarHeight]));
    const bodySize = [size.width - 1, size.height - titleBarHeight - 1];
  
    const body = new Path.Rectangle(bodyPos, bodySize);
    body.fillColor = COLORS.WHITE;
    body.strokeColor = COLORS.BLACK;
  
    const clipMask = new Path.Rectangle(body.bounds);
    clipMask.clipMask = true;
  
    const contentsGroup = new Group();
    contentsGroup.clipped = true;
    contentsGroup.addChild(clipMask);
  
    if (scrollable) {
      contentsGroup.onMouseDrag = (event) => {
        contentsGroup.children.forEach(child => {
          if (!child.clipMask) {
            child.position = child.position.add(event.delta);
          }
        });
      };
    }
  
    group.addChildren([shadow, body, contentsGroup]);
  
    let titleBarGroup = null;
    if (showTitleBar) {
      titleBarGroup = this.createTitleBar(label, pos, size.width);
      group.addChild(titleBarGroup); // Add *last* so it's on top
    }
  
    const windowData = {
      label,
      group,
      body,
      contentsGroup,
      resizable,
      scrollable,
      showTitleBar,
      pos,
      size
    };
  
    if (showTitleBar) {
      windowData.titleBar = titleBarGroup.children[0]; // the actual rectangle
    }
  
    this.windows.set(label, windowData);
    return contentsGroup;
  }

  createRoomWindow(location, gameObjectManager) {
    const contents = this.createWindow(location, new Point(128, 66), { width: 256, height: 188 });
    gameObjectManager.placeObjects(contents, location);
    return contents;
  }

  createInventoryWindow(gameObjectManager) {
    const contents = this.createWindow("Inventory", new Point(2, 24), { width: 120, height: 230 }, { resizable: true, scrollable: true });
    gameObjectManager.placeObjects(contents, LOCATIONS.INVENTORY);
    return contents;
  }

  createCommandBar() {
    const contents = this.createWindow("Commands", new Point(128, 24), { width: 256, height: 40 }, { showTitleBar: false });

    const buttons = ["Examine", "Open", "Close", "Speak", "Operate", "Go", "Hit", "Consume"];

    buttons.forEach((label, i) => {
      const btnX = 129 + i * styles.button.spacing;
      const btn = new Path.Rectangle(new Point(btnX, 42), [styles.button.width, styles.button.height]);
      btn.fillColor = COLORS.WHITE;

      const txt = new PointText({
        point: btn.position.add([-15, 5]),
        content: label,
        fillColor: COLORS.BLACK,
        fontFamily: 'Chicago',
        fontSize: styles.button.fontSize,
      });

      contents.addChildren([btn, txt]);
    });

    return contents;
  }

  createNarrationWindow() {
    return this.createWindow("Untitled", new Point(2, 256), { width: 507, height: 83 }, { resizable: true, scrollable: true });
  }

  createExitsWindow() {
    return this.createWindow("Exits", new Point(404, 90), { width: 80, height: 100 });
  }

  createSelfWindow() {
    return this.createWindow("Self", new Point(404, 24), { width: 80, height: 42 }, {showTitleBar: false});
  }

  // Input handling

  handleMouseDown(event) {
    for (let win of this.windows.values()) {
      if (win.showTitleBar && win.titleBar.contains(event.point)) {
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

  isPointInWindow(point, label) {
    const win = this.windows.get(label);
    return win ? win.body.contains(point) : false;
  }
}
