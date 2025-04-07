export class GameObjectManager {
  constructor(imageManager) {
    this.imageManager = imageManager;
    this.roomObjects = [
      { name: 'Key', src: 'key.gif', position: new paper.Point(10, 10), movable: true }
    ];
    this.inventoryObjects = [
      { name: 'Torch', src: 'torch.gif', position: new paper.Point(-32, -48), movable: true },
    ];
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
}