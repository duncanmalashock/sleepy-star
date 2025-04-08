import paper from 'paper';
import { WindowManager } from './WindowManager.js';
import { ImageManager } from './ImageManager.js';
import { SelectionManager } from './SelectionManager.js';
import { InteractionManager } from './InteractionManager.js';
import { GameObjectManager } from './GameObjectManager.js';

// Wait until Chicago font is loaded, to prevent unstyled
// flash of text in canvas.
window.addEventListener('DOMContentLoaded', () => {
  document.fonts.load('12px "Chicago"').then(() => {
    initializeGame();
  });
});

function initializeGame() {
  // Initialize Paperjs on HTML Canvas element
  const canvas = document.getElementById('myCanvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  paper.setup(canvas);

  // Set canvas context settings to turn off smoothing
  // for the retro look
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  // Instantiate Manager objects
  const windowManager = new WindowManager();
  const imageManager = new ImageManager();
  const selectionManager = new SelectionManager(imageManager, windowManager);
  const interactionManager = new InteractionManager();
  const gameObjectManager = new GameObjectManager(imageManager);

  // Create game engine windows
  windowManager.createRoomWindow('Entrance', gameObjectManager);
  windowManager.createInventoryWindow(gameObjectManager);
  windowManager.createCommandBar();
  windowManager.createNarrationWindow();
  windowManager.createExitsWindow();
  windowManager.createSelfWindow();

  // Instantiate PaperJS "Tool" for event handling
  const tool = new paper.Tool();

  // -- Define event handlers for game interactions

  // Handle mouseDown events
  tool.onMouseDown = function (event) {
    // Windows have first priority to handle clicks
    if (windowManager.handleMouseDown(event)) return;

    // Then direct selection of objects or dragging selections
    // !? Why doesn't selectionManager have a "handleMouseDown" function?
    if (selectionManager.isInsideSelectableWindow(event.point)) {
      const hit = selectionManager.hitTest(event.point);
      if (hit) selectionManager.startDragging(hit, event);
      else selectionManager.startSelection(event);
    }
  };

  // Handle dragging events
  tool.onMouseDrag = function (event) {
    // Windows have first priority to handle dragging
    if (windowManager.handleMouseDrag(event)) return;

    // Then dragging selected objects
    // !? Why doesn't selectionManager have a "handleMouseDrag" function?
    if (selectionManager.isDragging()) selectionManager.dragSelectedObjects(event);

    // Then dragging selections
    else if (selectionManager.isInsideSelectableWindow(event.point)) selectionManager.updateSelectionRect(event);
  };

  // Handle mouseUp events
  tool.onMouseUp = function (event) {
    // Only give windows the opportunity to handle mouseUp
    windowManager.handleMouseUp(event);

    // Always stop dragging when mouse is released
    // !? Why doesn't selectionManager have a "handleMouseUp" function?
    selectionManager.stopDragging();
  };
}
