import { Point, Path, Group, Tool, Raster, PointText } from 'paper';

// Responsible for keeping track of which objects are where
export class GameObjectManager {
  constructor(imageManager) {
    // !? Arguably not a necessary dependency
    this.imageManager = imageManager;
    // !? No unique identifiers apart from name, no reference to what room
    // they're in, movable is never used
    // !? Should be loaded from an external data source
    this.roomObjects = [
      { name: 'Entrance', src: 'entrance.gif', position: new Point(0, 1.5), movable: false },
      { name: 'Key', src: 'key.gif', position: new Point(-60, 30), movable: true },
    ];
    this.inventoryObjects = [
      { name: 'Torch', src: 'torch.gif', position: new Point(-32, -48), movable: true },
    ];
  }

  // !? Not "rendering" them so much as putting them in the room window
  renderRoomObjects(parentGroup) {
    this.roomObjects.forEach(obj => {
      const raster = this.imageManager.loadImage(obj.src, parentGroup.position.add(obj.position));
      raster.data = obj;
      parentGroup.addChild(raster);
    });
  }

  // !? Not "rendering" them so much as putting them in the inventory window
  renderInventoryObjects(parentGroup) {
    this.inventoryObjects.forEach(obj => {
      const raster = this.imageManager.loadImage(obj.src, parentGroup.position.add(obj.position));
      raster.data = obj;
      parentGroup.addChild(raster);
    });
  }
}