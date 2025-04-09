import paper from 'paper';
import { WindowManager } from './WindowManager.js';
import { ImageManager } from './ImageManager.js';
import { SelectionManager } from './SelectionManager.js';
import { InteractionManager } from './InteractionManager.js';
import { GameObjectManager } from './GameObjectManager.js';
import { isInteractionLocked } from './lockDuring.js';

window.addEventListener('DOMContentLoaded', () => {
  document.fonts.load('12px "Chicago"').then(() => {
    initializeGame();
  });
});

const LOCATIONS =
  {
    ENTRANCE: 'Temple ruins',
    INVENTORY: 'inventory', 
    HIDDEN: 'hidden',
  };


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

  // --- Initialize Managers
  const imageManager = new ImageManager();
  const windowManager = new WindowManager();
  const gameObjectManager = new GameObjectManager(imageManager);
  const selectionManager = new SelectionManager(imageManager, windowManager);
  const interactionManager = new InteractionManager();

  // --- Create Game UI Windows
  windowManager.createRoomWindow(LOCATIONS.ENTRANCE, gameObjectManager);
  windowManager.createInventoryWindow(gameObjectManager);
  windowManager.createCommandBar();
  windowManager.createNarrationWindow();
  windowManager.createExitsWindow();
  windowManager.createSelfWindow();

  // --- Register Paper.js Tool Event Handlers
  const tool = new paper.Tool();

  tool.onMouseDown = (event) => {
    if (isInteractionLocked()) return;
    if (windowManager.handleMouseDown(event)) return;
    selectionManager.handleMouseDown?.(event);
  };

  tool.onMouseDrag = (event) => {
    if (isInteractionLocked()) return;
    if (windowManager.handleMouseDrag(event)) return;
    selectionManager.handleMouseDrag?.(event);
  };

  tool.onMouseUp = (event) => {
    if (isInteractionLocked()) return;
    windowManager.handleMouseUp(event);
    selectionManager.handleMouseUp?.(event);
  };
}
