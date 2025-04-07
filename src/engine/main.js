import paper from 'paper';
import { WindowManager } from './WindowManager.js';
import { ImageManager } from './ImageManager.js';
import { SelectionManager } from './SelectionManager.js';
import { InteractionManager } from './InteractionManager.js';
import { GameObjectManager } from './GameObjectManager.js';

window.addEventListener('DOMContentLoaded', () => {
  document.fonts.load('12px "Chicago"').then(() => {
    initializeGame();
  });
});

function initializeGame() {
  const canvas = document.getElementById('myCanvas');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  paper.setup(canvas);

  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  const tool = new paper.Tool();

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
