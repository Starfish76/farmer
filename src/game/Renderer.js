import { DIRECTIONS, TILE_COLORS, TILE_H, TILE_W } from '../constants.js';
import { CROPS } from './Crop.js';
import { drawPolygon } from '../utils/helpers.js';
import { gridToScreen } from '../utils/isometric.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offsetX = 0;
    this.offsetY = 0;
    this.droneElement = this.createDroneElement();
    this.extraDroneElements = [];
    this.resize();
  }

  createDroneElement() {
    const drone = document.createElement('img');
    drone.src = 'assets/dron.gif';
    drone.alt = '';
    drone.setAttribute('aria-hidden', 'true');
    Object.assign(drone.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${TILE_W * 1.25}px`,
      height: `${TILE_W * 1.25}px`,
      '--drone-facing': '1',
      objectFit: 'contain',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%) scaleX(var(--drone-facing))',
      transformOrigin: 'center center',
      animation: 'drone-hover 2.4s ease-in-out infinite',
      zIndex: '2',
    });
    this.canvas.parentElement.appendChild(drone);
    return drone;
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 2 - TILE_H + 40;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderWorld(world, level) {
    this.setWorldOffsets(world);

    for (let y = 0; y < world.height; y += 1) {
      for (let x = 0; x < world.width; x += 1) {
        const tile = world.grid[y][x];
        if (tile.type === 'empty') continue;
        this.drawTile(tile);
      }
    }

    if (level?.winConditionType === 'reach_target') {
      this.drawTarget(level.target);
    }

    for (let y = 0; y < world.height; y += 1) {
      for (let x = 0; x < world.width; x += 1) {
        const tile = world.grid[y][x];
        if (tile.type !== 'empty' && tile.crop) {
          const { x: sx, y: sy } = gridToScreen(tile.x, tile.y, this.offsetX, this.offsetY);
          this.drawCrop(tile.crop, sx, sy);
        }
      }
    }
  }

  setWorldOffsets(world) {
    const boardWidth = (world.width + world.height) * TILE_W / 2;
    const boardHeight = (world.width + world.height) * TILE_H / 2;
    this.offsetX = this.canvas.width / 2 - ((world.width - world.height) * TILE_W / 4);
    this.offsetY = Math.max(70, this.canvas.height / 2 - boardHeight / 2 + 20);

    if (boardWidth < 360) {
      this.offsetY += 34;
    }
  }

  drawTile(tile) {
    const { x: sx, y: sy } = gridToScreen(tile.x, tile.y, this.offsetX, this.offsetY);
    const points = [
      { x: sx, y: sy },
      { x: sx + TILE_W / 2, y: sy + TILE_H / 2 },
      { x: sx, y: sy + TILE_H },
      { x: sx - TILE_W / 2, y: sy + TILE_H / 2 },
    ];

    drawPolygon(this.ctx, points, TILE_COLORS[tile.type], '#2a2d3e', 1);

    if (tile.type === 'water') {
      drawPolygon(this.ctx, points, 'rgba(255,255,255,0.1)', null);
    }
  }

  drawTarget(target) {
    const { x: sx, y: sy } = gridToScreen(target.x, target.y, this.offsetX, this.offsetY);
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 2);
    ctx.lineTo(sx + TILE_W / 2 - 4, sy + TILE_H / 2);
    ctx.lineTo(sx, sy + TILE_H + 2);
    ctx.lineTo(sx - TILE_W / 2 + 4, sy + TILE_H / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.fillRect(sx - 1, sy - 28, 3, 28);
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy - 27);
    ctx.lineTo(sx + 20, sy - 21);
    ctx.lineTo(sx + 2, sy - 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawCrop(crop, screenX, screenY) {
    const cropDefinition = CROPS[crop.type];
    if (!cropDefinition) return;

    const baseX = screenX;
    const baseY = screenY + TILE_H / 2 - 4;

    if (crop.growthStage === 'seed') {
      this.drawSeed(baseX, baseY, cropDefinition.color);
    } else if (crop.growthStage === 'sprout') {
      this.drawSprout(baseX, baseY);
    } else {
      this.drawGrownWheat(baseX, baseY, cropDefinition.color);
    }

    if (crop.growthStage !== 'grown') {
      this.drawGrowthBar(baseX, baseY - 28, crop.growthProgress);
    }
  }

  drawSeed(x, y, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#7c5c12';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawSprout(x, y) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#86efac';
    ctx.fillStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x, y - 14);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x - 6, y - 8, 7, 3.5, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 6, y - 11, 7, 3.5, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGrownWheat(x, y, color) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#d89b1f';
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    for (let i = -1; i <= 1; i += 1) {
      const stemX = x + i * 7;
      ctx.beginPath();
      ctx.moveTo(stemX, y + 5);
      ctx.lineTo(stemX, y - 24);
      ctx.stroke();

      for (let grain = 0; grain < 3; grain += 1) {
        const grainY = y - 20 + grain * 6;
        ctx.beginPath();
        ctx.ellipse(stemX - 4, grainY, 4, 2.5, -0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(stemX + 4, grainY, 4, 2.5, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawGrowthBar(x, y, progress) {
    const ctx = this.ctx;
    const width = 28;
    const height = 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(x - width / 2, y, width, height);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x - width / 2, y, width * Math.max(0, Math.min(1, progress)), height);
  }

  renderRobot(robot) {
    const { x: sx, y: sy } = gridToScreen(robot.animX, robot.animY, this.offsetX, this.offsetY);
    this.positionDroneElement(robot, sx, sy);
  }

  renderExtraDrones(world, robot, droneCount = 1) {
    const extraCount = Math.max(0, droneCount - 1);

    while (this.extraDroneElements.length < extraCount) {
      this.extraDroneElements.push(this.createDroneElement());
    }

    while (this.extraDroneElements.length > extraCount) {
      this.extraDroneElements.pop().remove();
    }

    const tiles = [];
    for (let y = 0; y < world.height; y += 1) {
      for (let x = 0; x < world.width; x += 1) {
        if (x !== robot.gridX || y !== robot.gridY) {
          const tile = world.getTile(x, y);
          if (tile?.type === 'soil') {
            tiles.push({ x, y });
          }
        }
      }
    }

    for (let index = 0; index < this.extraDroneElements.length; index += 1) {
      const element = this.extraDroneElements[index];
      const tile = tiles[index % Math.max(1, tiles.length)] ?? { x: robot.gridX, y: robot.gridY };
      const { x: sx, y: sy } = gridToScreen(tile.x, tile.y, this.offsetX, this.offsetY);
      const offset = tiles.length > 0 ? 0 : (index + 1) * 12;
      element.style.left = `${sx + offset}px`;
      element.style.top = `${sy + TILE_H / 2 - 28 - offset}px`;
      element.style.width = `${TILE_W * 1.1}px`;
      element.style.height = `${TILE_W * 1.1}px`;
      element.style.opacity = '0.82';
      element.style.zIndex = '1';
    }
  }

  positionDroneElement(robot, screenX, screenY) {
    const imageSize = TILE_W * 1.25;
    const centerX = screenX;
    const centerY = screenY + TILE_H / 2 - 28;
    const shouldFaceRight = robot.dir === DIRECTIONS.EAST || robot.dir === DIRECTIONS.NORTH;

    this.droneElement.style.width = `${imageSize}px`;
    this.droneElement.style.height = `${imageSize}px`;
    this.droneElement.style.left = `${centerX}px`;
    this.droneElement.style.top = `${centerY}px`;
    this.droneElement.style.setProperty('--drone-facing', shouldFaceRight ? '-1' : '1');
  }

  triggerFireworks() {
    const centerX = parseFloat(this.droneElement.style.left) || 0;
    const centerY = parseFloat(this.droneElement.style.top) || 0;
    const colors = ['#facc15', '#fb7185', '#38bdf8', '#86efac', '#f97316'];
    const particleCount = 28;

    for (let index = 0; index < particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / particleCount;
      const distance = 42 + Math.random() * 48;
      const particle = document.createElement('span');
      particle.className = 'drone-firework-particle';
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY - 18}px`;
      particle.style.setProperty('--firework-x', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--firework-y', `${Math.sin(angle) * distance}px`);
      particle.style.setProperty('--firework-color', colors[index % colors.length]);
      particle.style.animationDelay = `${Math.random() * 0.08}s`;
      this.canvas.parentElement.appendChild(particle);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
    }
  }

  drawFallbackRobot(robot, sx, sy) {
    const rw = TILE_W * 0.6;
    const rh = TILE_H * 0.6;
    const height = 30;
    const centerX = sx;
    const centerY = sy + TILE_H / 2 - 10;

    const topPoints = [
      { x: centerX, y: centerY - height - rh / 2 },
      { x: centerX + rw / 2, y: centerY - height },
      { x: centerX, y: centerY - height + rh / 2 },
      { x: centerX - rw / 2, y: centerY - height },
    ];
    const leftPoints = [
      { x: centerX - rw / 2, y: centerY - height },
      { x: centerX, y: centerY - height + rh / 2 },
      { x: centerX, y: centerY + rh / 2 },
      { x: centerX - rw / 2, y: centerY },
    ];
    const rightPoints = [
      { x: centerX, y: centerY - height + rh / 2 },
      { x: centerX + rw / 2, y: centerY - height },
      { x: centerX + rw / 2, y: centerY },
      { x: centerX, y: centerY + rh / 2 },
    ];

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
    let arrowEnd = { x: cx, y: cy };

    if (direction === DIRECTIONS.EAST) arrowEnd = { x: cx + 15, y: cy + 7.5 };
    else if (direction === DIRECTIONS.SOUTH) arrowEnd = { x: cx - 15, y: cy + 7.5 };
    else if (direction === DIRECTIONS.WEST) arrowEnd = { x: cx - 15, y: cy - 7.5 };
    else if (direction === DIRECTIONS.NORTH) arrowEnd = { x: cx + 15, y: cy - 7.5 };

    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(arrowEnd.x, arrowEnd.y);
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(arrowEnd.x, arrowEnd.y, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
