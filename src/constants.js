export const GRID_SIZE = 8;
export const TILE_W = 72;
export const TILE_H = 36;

export const TILE_COLORS = {
  grass: '#4a7c59',
  soil: '#8b5a2b',
  water: '#3b82f6',
  rock: '#6b7280'
};

export const DIRECTIONS = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3
};

export const GAME_STATE = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error'
};