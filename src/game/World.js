import { createCrop, updateGrowthStage } from './Crop.js';
import { Tile } from './Tiles.js';

const DEFAULT_GRID = [
  ['soil', 'soil', 'soil'],
  ['soil', 'soil', 'soil'],
];

export class World {
  constructor(grid = DEFAULT_GRID) {
    this.grid = [];
    this.loadGrid(grid);
  }

  loadGrid(grid) {
    this.grid = [];
    this.height = grid.length;
    this.width = grid[0]?.length ?? 0;

    for (let y = 0; y < this.height; y += 1) {
      const row = [];

      for (let x = 0; x < this.width; x += 1) {
        row.push(new Tile(x, y, grid[y]?.[x] ?? 'soil'));
      }

      this.grid.push(row);
    }
  }

  serializeGrid() {
    return this.grid.map((row) => row.map((tile) => tile.type));
  }

  addSoilAtEdge(x, y) {
    if (this.isInside(x, y)) {
      return { ok: false, message: '이미 땅이 있는 칸입니다.' };
    }

    if (x === this.width && y >= 0 && y < this.height) {
      this.appendColumn();
      return { ok: true, shiftX: 0, shiftY: 0 };
    }

    if (x === -1 && y >= 0 && y < this.height) {
      this.prependColumn();
      return { ok: true, shiftX: 1, shiftY: 0 };
    }

    if (y === this.height && x >= 0 && x < this.width) {
      this.appendRow();
      return { ok: true, shiftX: 0, shiftY: 0 };
    }

    if (y === -1 && x >= 0 && x < this.width) {
      this.prependRow();
      return { ok: true, shiftX: 0, shiftY: 1 };
    }

    return { ok: false, message: '현재 땅과 붙어 있는 바깥 칸에만 땅을 추가할 수 있습니다.' };
  }

  appendColumn() {
    for (let y = 0; y < this.height; y += 1) {
      this.grid[y].push(new Tile(this.width, y, 'soil'));
    }

    this.width += 1;
  }

  prependColumn() {
    this.width += 1;

    for (let y = 0; y < this.height; y += 1) {
      this.grid[y].unshift(new Tile(0, y, 'soil'));
    }

    this.reindexTiles();
  }

  appendRow() {
    const row = [];

    for (let x = 0; x < this.width; x += 1) {
      row.push(new Tile(x, this.height, 'soil'));
    }

    this.grid.push(row);
    this.height += 1;
  }

  prependRow() {
    const row = [];
    this.height += 1;

    for (let x = 0; x < this.width; x += 1) {
      row.push(new Tile(x, 0, 'soil'));
    }

    this.grid.unshift(row);
    this.reindexTiles();
  }

  reindexTiles() {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.grid[y][x].x = x;
        this.grid[y][x].y = y;
      }
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
      return { ok: false, message: '여기에는 심을 수 없습니다.' };
    }

    if (tile.crop) {
      return { ok: false, message: '이미 작물이 있는 칸입니다.' };
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
    return tile.type === 'soil';
  }

  isInside(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
