import { DIRECTIONS } from '../constants.js';

const MOVE_DURATION = 240;

const DIRECTION_BY_NAME = {
  north: DIRECTIONS.NORTH,
  east: DIRECTIONS.EAST,
  south: DIRECTIONS.SOUTH,
  west: DIRECTIONS.WEST,
};

export class Robot {
  constructor() {
    this.reset();
  }

  reset({ x = 0, y = 0, direction = 'east' } = {}) {
    this.gridX = x;
    this.gridY = y;
    this.dir = typeof direction === 'string' ? DIRECTION_BY_NAME[direction] : direction;
    this.animX = x;
    this.animY = y;
    this.moveAnimation = null;
  }

  turnLeft() {
    this.dir = (this.dir + 3) % 4;
  }

  turnRight() {
    this.dir = (this.dir + 1) % 4;
  }

  moveTo(x, y, startTime) {
    this.moveAnimation = {
      startTime,
      fromX: this.animX,
      fromY: this.animY,
      toX: x,
      toY: y,
    };
    this.gridX = x;
    this.gridY = y;
  }

  update(time = 0) {
    if (!this.moveAnimation) return;

    const elapsed = time - this.moveAnimation.startTime;
    const progress = Math.min(1, elapsed / MOVE_DURATION);
    const eased = 1 - Math.pow(1 - progress, 3);

    this.animX = lerp(this.moveAnimation.fromX, this.moveAnimation.toX, eased);
    this.animY = lerp(this.moveAnimation.fromY, this.moveAnimation.toY, eased);

    if (progress >= 1) {
      this.animX = this.gridX;
      this.animY = this.gridY;
      this.moveAnimation = null;
    }
  }

  get isAnimating() {
    return this.moveAnimation !== null;
  }

  getFrontPos() {
    let fx = this.gridX;
    let fy = this.gridY;

    if (this.dir === DIRECTIONS.NORTH) fy -= 1;
    else if (this.dir === DIRECTIONS.EAST) fx += 1;
    else if (this.dir === DIRECTIONS.SOUTH) fy += 1;
    else if (this.dir === DIRECTIONS.WEST) fx -= 1;

    return { x: fx, y: fy };
  }
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}
