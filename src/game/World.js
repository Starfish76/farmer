import { Tile } from './Tiles.js';
import { GRID_SIZE } from '../constants.js';

export class World {
  constructor() {
    this.grid = [];
    this.initGrid();
  }

  initGrid() {
    const mapLayout = [
      ['grass', 'grass', 'grass', 'rock',  'water', 'water', 'grass', 'grass'],
      ['grass', 'soil',  'soil',  'grass', 'rock',  'water', 'grass', 'grass'],
      ['grass', 'soil',  'soil',  'grass', 'grass', 'grass', 'grass', 'rock'],
      ['grass', 'grass', 'grass', 'grass', 'soil',  'soil',  'grass', 'grass'],
      ['water', 'water', 'rock',  'grass', 'soil',  'soil',  'grass', 'grass'],
      ['water', 'rock',  'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
      ['grass', 'grass', 'grass', 'soil',  'soil',  'rock',  'water', 'water'],
      ['grass', 'grass', 'grass', 'soil',  'soil',  'grass', 'water', 'rock']
    ];

    for (let y = 0; y < GRID_SIZE; y++) {
      let row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push(new Tile(x, y, mapLayout[y][x]));
      }
      this.grid.push(row);
    }
  }

  isWalkable(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    const tileType = this.grid[y][x].type;
    return tileType !== 'water' && tileType !== 'rock';
  }
}
