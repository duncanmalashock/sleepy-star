// src/engine/paper-env.js
import * as paper from 'paper';

// Manually create a PaperScope
const paperScope = new paper.default.PaperScope();

// Re-export classes from this scope
export const Point = paperScope.Point;
export const PointText = paperScope.PointText;
export const Size = paperScope.Size;
export const Rectangle = paperScope.Rectangle;
export const Path = paperScope.Path;
export const Group = paperScope.Group;
export const Color = paperScope.Color;
export const Raster = paperScope.Raster;
export const Layer = paperScope.Layer;
export const Project = paperScope.Project;
export const Tool = paperScope.Tool;
export const View = paperScope.View;

// Export the setup method and the scope itself
export const setup = (...args) => paperScope.setup(...args);
export default paperScope;
