import { Point, Path, Group, Tool, Raster, PointText } from 'paper';

export class InteractionManager {
  constructor() {
    this.activeCommand = null;
  }

  setCommand(command) {
    this.activeCommand = command;
  }

  getCommand() {
    return this.activeCommand;
  }

  clearCommand() {
    this.activeCommand = null;
  }
}
