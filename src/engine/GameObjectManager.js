import { Point, Path, Group, Tool, Raster, PointText } from 'paper';
import { globals } from './globals';

export class GameObjectManager {
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