export const gameObjects = [
  {
    id: 'obj:entrance',
    name: 'Ruins',
    src: 'ruins.gif',
    position: { x: 0, y: 0 },
    movable: false,
    location: 'Temple ruins'
  },
  {
    id: 'obj:key',
    name: 'key',
    src: 'key.gif',
    position: { x: -70, y: 30 },
    movable: true,
    location: 'hidden'
  },
  {
    id: 'obj:candle',
    name: 'candle',
    src: 'candle.gif',
    position: { x: -40, y: -70 },
    movable: true,
    location: 'inventory'
  }
];