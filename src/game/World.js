import { GRID_SIZE } from '../constants.js';
import { createCrop, updateGrowthStage } from './Crop.js';
import { Tile } from './Tiles.js';

const DEFAULT_GRID = [
  ['grass', 'grass', 'grass', 'rock', 'water', 'water', 'grass', 'grass'],
  ['grass', 'soil', 'soil', 'grass', 'rock', 'water', 'grass', 'grass'],
  ['grass', 'soil', 'soil', 'grass', 'grass', 'grass', 'grass', 'rock'],
  ['grass', 'grass', 'grass', 'grass', 'soil', 'soil', 'grass', 'grass'],
  ['water', 'water', 'rock', 'grass', 'soil', 'soil', 'grass', 'grass'],
  ['water', 'rock', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
  ['grass', 'grass', 'grass', 'soil', 'soil', 'rock', 'water', 'water'],
  ['grass', 'grass', 'grass', 'soil', 'soil', 'grass', 'water', 'rock'],
];

export class World {
  constructor(grid = DEFAULT_GRID) {
    this.grid = [];
    this.loadGrid(grid);
  }

  loadGrid(grid) {
    this.grid = [];

    for (let y = 0; y < GRID_SIZE; y += 1) {
      const row = [];

      for (let x = 0; x < GRID_SIZE; x += 1) {
        row.push(new Tile(x, y, grid[y][x]));
      }

      this.grid.push(row);
    }
  }

  getTile(x, y) {
    if (!this.isInside(x, y)) return null;
    return this.grid[y][x];
  }

  getCropAt(x, y) {
    return this.getTile(x, y)?.crop ?? null;
  }

  plantCropAt(x, y, cropType, now) {
    const tile = this.getTile(x, y);

    if (!tile || tile.type !== 'soil') {
      return { ok: false, message: 'Cannot plant here' };
    }

    if (tile.crop) {
      return { ok: false, message: 'Tile already has a crop' };
    }

    tile.crop = createCrop(cropType, now);
    return { ok: true, crop: tile.crop };
  }

  harvestCropAt(x, y) {
    const tile = this.getTile(x, y);
    if (!tile?.crop) return null;

    const crop = tile.crop;
    tile.crop = null;
    return crop;
  }

  updateAllCrops(now) {
    for (const row of this.grid) {
      for (const tile of row) {
        if (tile.crop) {
          updateGrowthStage(tile.crop, now);
        }
      }
    }
  }

  countCropsByType(cropType) {
    let count = 0;

    for (const row of this.grid) {
      for (const tile of row) {
        if (tile.crop?.type === cropType) {
          count += 1;
        }
      }
    }

    return count;
  }

  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return tile.type !== 'water' && tile.type !== 'rock';
  }

  isInside(x, y) {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
  }
}
