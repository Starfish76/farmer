import { TILE_W, TILE_H } from '../constants.js';

// 그리드 좌표(2D)를 아이소메트릭 화면 좌표(2.5D)로 변환
export function gridToScreen(gridX, gridY, offsetX, offsetY) {
  const screenX = (gridX - gridY) * (TILE_W / 2) + offsetX;
  const screenY = (gridX + gridY) * (TILE_H / 2) + offsetY;
  return { x: screenX, y: screenY };
}

export function screenToGrid(screenX, screenY, offsetX, offsetY) {
  const isoX = (screenX - offsetX) / (TILE_W / 2);
  const isoY = (screenY - offsetY) / (TILE_H / 2);

  return {
    x: Math.round((isoX + isoY) / 2),
    y: Math.round((isoY - isoX) / 2),
  };
}
