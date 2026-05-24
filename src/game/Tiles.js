export class Tile {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'empty', 'grass', 'soil', 'water', 'rock'
    this.crop = null;
  }
}
