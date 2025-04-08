import { gameObjects } from '../data/gameObjects.js';
import { Point } from 'paper';

export class GameObjectManager {
  constructor(imageManager) {
    this.imageManager = imageManager;

    this.allObjects = this.allObjects = gameObjects.map(obj => ({
      ...obj,
      position: new Point(obj.position.x, obj.position.y)
    }));
  }

  placeObjectsIntoGroup(objects, parentGroup) {
    objects.forEach((obj) => {
      const raster = this.imageManager.loadImage(obj.src, parentGroup.position.add(obj.position));
      raster.data = obj; // Bind object data to the raster for interactions
      parentGroup.addChild(raster);
    });
  }

  placeObjects(parentGroup, location) {
    const allObjects = this.allObjects.filter(obj => obj.location === location);
    this.placeObjectsIntoGroup(allObjects, parentGroup);
  }

  getObjectById(id) {
    return (
      this.allObjects.find(obj => obj.id === id)
    );
  }

  moveObjectToInventory(id) {
    const index = this.allObjects.findIndex(obj => obj.id === id);
    if (index >= 0) {
      const [obj] = this.allObjects.splice(index, 1);
      this.allObjects.push(obj);
    }
  }

  moveObjectToRoom(id, roomId = 'main') {
    const index = this.allObjects.findIndex(obj => obj.id === id);
    if (index >= 0) {
      const [obj] = this.allObjects.splice(index, 1);
      obj.roomId = roomId;
      this.allObjects.push(obj);
    }
  }
}
