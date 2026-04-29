import { TILE_W, TILE_H, TILE_COLORS, GRID_SIZE, DIRECTIONS } from '../constants.js';
import { gridToScreen } from '../utils/isometric.js';
import { drawPolygon } from '../utils/helpers.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offsetX = 0;
    this.offsetY = 0;
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    
    // 농장이 화면 중앙에 오도록 오프셋 계산 (8x8 기준 중앙 정렬)
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 2 - (GRID_SIZE * TILE_H) / 2 + 50; 
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderWorld(world) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = world.grid[y][x];
        this.drawTile(tile);
      }
    }
  }

  drawTile(tile) {
    const { x: sx, y: sy } = gridToScreen(tile.x, tile.y, this.offsetX, this.offsetY);
    
    const points = [
      { x: sx, y: sy },                         // Top
      { x: sx + TILE_W / 2, y: sy + TILE_H / 2 }, // Right
      { x: sx, y: sy + TILE_H },                // Bottom
      { x: sx - TILE_W / 2, y: sy + TILE_H / 2 }  // Left
    ];

    drawPolygon(this.ctx, points, TILE_COLORS[tile.type], '#2a2d3e', 1);

    // 물 타일은 살짝 반투명한 레이어를 올려 깊이감 표현
    if (tile.type === 'water') {
       drawPolygon(this.ctx, points, 'rgba(255,255,255,0.1)', null);
    }
  }

  renderRobot(robot) {
    const { x: sx, y: sy } = gridToScreen(robot.animX, robot.animY, this.offsetX, this.offsetY);
    
    const rw = TILE_W * 0.6;
    const rh = TILE_H * 0.6;
    const height = 30; // 로봇의 Z축 높이

    const centerX = sx;
    const centerY = sy + TILE_H / 2 - 10; // 타일 중앙에서 살짝 위로

    // 로봇 윗면
    const topPoints = [
      { x: centerX, y: centerY - height - rh/2 },
      { x: centerX + rw/2, y: centerY - height },
      { x: centerX, y: centerY - height + rh/2 },
      { x: centerX - rw/2, y: centerY - height }
    ];
    
    // 왼쪽 면
    const leftPoints = [
      { x: centerX - rw/2, y: centerY - height },
      { x: centerX, y: centerY - height + rh/2 },
      { x: centerX, y: centerY + rh/2 },
      { x: centerX - rw/2, y: centerY }
    ];

    // 오른쪽 면
    const rightPoints = [
      { x: centerX, y: centerY - height + rh/2 },
      { x: centerX + rw/2, y: centerY - height },
      { x: centerX + rw/2, y: centerY },
      { x: centerX, y: centerY + rh/2 }
    ];

    // 로봇 몸체 그리기 (주황색/사이버틱)
    drawPolygon(this.ctx, leftPoints, '#c2410c', '#7c2d12', 1);
    drawPolygon(this.ctx, rightPoints, '#ea580c', '#7c2d12', 1);
    drawPolygon(this.ctx, topPoints, '#f97316', '#7c2d12', 1);

    this.drawRobotArrow(topPoints, robot.dir);
  }

  drawRobotArrow(topFacePoints, direction) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.lineJoin = 'round';

    const [top, right, bottom, left] = topFacePoints;
    const cx = (top.x + bottom.x) / 2;
    const cy = (left.y + right.y) / 2;

    this.ctx.moveTo(cx, cy);

    // 아이소메트릭 기준 화살표 방향 설정
    let arrowEnd = {x: cx, y: cy};
    if (direction === DIRECTIONS.EAST) {
      arrowEnd = { x: cx + 15, y: cy + 7.5 }; // 화면 우하단
    } else if (direction === DIRECTIONS.SOUTH) {
      arrowEnd = { x: cx - 15, y: cy + 7.5 }; // 화면 좌하단
    } else if (direction === DIRECTIONS.WEST) {
      arrowEnd = { x: cx - 15, y: cy - 7.5 }; // 화면 좌상단
    } else if (direction === DIRECTIONS.NORTH) {
      arrowEnd = { x: cx + 15, y: cy - 7.5 }; // 화면 우상단
    }

    this.ctx.lineTo(arrowEnd.x, arrowEnd.y);
    
    // 화살표 머리
    this.ctx.fillStyle = '#ffffff';
    this.ctx.arc(arrowEnd.x, arrowEnd.y, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }
}