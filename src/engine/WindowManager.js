import { Point, Path, Group, Raster, PointText } from 'paper';
import { COLORS, LOCATIONS, COMMANDS } from './constants';

const styles = {
  windowTitleBar: {
    height: 18,
    fontSize: 16,
    padding: 5,
  },
  button: {
    height: 16,
    fontSize: 16,
    topRowY: 5,
    bottomRowY: 22,
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

  createWindow(label, pos, size, { resizable = false, scrollable = false, showTitleBar = true, blackBg = false, shadowDepth = 1 } = {}) {
    const group = new Group();
    const titleBarHeight = showTitleBar ? styles.windowTitleBar.height : 0;
  
    const shadow = new Path.Rectangle(
      pos.add([shadowDepth, shadowDepth]),
      [size.width, size.height]
    );
    shadow.fillColor = COLORS.BLACK;
  
    const bodyPos = correctForSubPixels(pos.add([0, titleBarHeight]));
    const bodySize = [size.width - 1, size.height - titleBarHeight - 1];
  
    const body = new Path.Rectangle(bodyPos, bodySize);
    body.fillColor = blackBg ? COLORS.BLACK : COLORS.WHITE;
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
    const pos = new Point(128, 22);
    const contents = this.createWindow("Commands", pos, { width: 257, height: 44 }, { showTitleBar: false, blackBg: true, shadowDepth: 0 });

    const buttons = [
      {
        command: COMMANDS.EXAMINE,
        label: "Examine",
        position: { x: 5, y: styles.button.topRowY },
        width: 68
      },
      {
        command: COMMANDS.OPEN,
        label: "Open",
        position: { x: 74, y: styles.button.topRowY },
        width: 50
      },
      {
        command: COMMANDS.CLOSE,
        label: "Close",
        position: { x: 125, y: styles.button.topRowY },
        width: 50
      },
      {
        command: COMMANDS.SPEAK,
        label: "Speak",
        position: { x: 176, y: styles.button.topRowY },
        width: 75
      },
      {
        command: COMMANDS.OPERATE,
        label: "Operate",
        position: { x: 5, y: styles.button.bottomRowY },
        width: 68
      },
      {
        command: COMMANDS.GO,
        label: "Go",
        position: { x: 74, y: styles.button.bottomRowY },
        width: 50
      },
      {
        command: COMMANDS.HIT,
        label: "Hit",
        position: { x: 125, y: styles.button.bottomRowY },
        width: 50
      },
      {
        command: COMMANDS.CONSUME,
        label: "Consume",
        position: { x: 176, y: styles.button.bottomRowY },
        width: 75
      },
    ];

    buttons.forEach((buttonConfig) => {
      const btnPos = correctForSubPixels(new Point(buttonConfig.position.x, buttonConfig.position.y).add(pos))
      const btn = new Path.Rectangle(
        btnPos, 
        [buttonConfig.width, styles.button.height]);
      btn.fillColor = COLORS.WHITE;
      btn.strokeColor = COLORS.BLACK;
      const txt = new PointText({
        point: btnPos.add([5, 12]),
        content: buttonConfig.label,
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
    return this.createWindow("Exits", new Point(404, 88), { width: 80, height: 96 }, { shadowDepth: 0 });
  }

  createSelfWindow() {
    return this.createWindow("Self", new Point(404, 22), { width: 79, height: 44 }, {showTitleBar: false, shadowDepth: 2});
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
