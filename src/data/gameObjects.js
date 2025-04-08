export const gameObjects = [
  {
    id: 'obj:entrance',
    name: 'entrance',
    src: 'entrance.gif',
    position: { x: 0, y: 0 },
    movable: false,
    location: 'entrance'
  },
  {
    id: 'obj:key',
    name: 'key',
    src: 'key.gif',
    position: { x: -70, y: 30 },
    movable: true,
    location: 'entrance'
  },
  {
    id: 'obj:torch',
    name: 'torch',
    src: 'torch.gif',
    position: { x: -32, y: -48 },
    movable: true,
    location: 'inventory'
  }
];