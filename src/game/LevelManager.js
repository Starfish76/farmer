import { LEVELS } from '../levels/levels.js';

export class LevelManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.levels = LEVELS;
  }

  get currentLevel() {
    return this.levels[this.gameState.currentLevelIndex] ?? this.levels[0];
  }

  goToLevel(index) {
    const nextIndex = Math.max(0, Math.min(this.levels.length - 1, index));
    this.gameState.currentLevelIndex = nextIndex;
    this.gameState.currentLevel = this.levels[nextIndex].id;
    this.gameState.levelComplete = false;
    return this.currentLevel;
  }

  nextLevel() {
    return this.goToLevel(this.gameState.currentLevelIndex + 1);
  }

  previousLevel() {
    return this.goToLevel(this.gameState.currentLevelIndex - 1);
  }

  canGoNext() {
    return this.gameState.currentLevelIndex < this.levels.length - 1;
  }

  canGoPrevious() {
    return this.gameState.currentLevelIndex > 0;
  }

  isComplete({ world, robot }) {
    const level = this.currentLevel;

    if (level.winConditionType === 'reach_target') {
      return robot.gridX === level.target.x && robot.gridY === level.target.y;
    }

    if (level.winConditionType === 'plant_wheat') {
      return world.countCropsByType('wheat') >= level.target.count;
    }

    if (level.winConditionType === 'plant_carrot') {
      return world.countCropsByType('carrot') >= level.target.count;
    }

    if (level.winConditionType === 'harvest_all_target_crops') {
      return level.target.cropPositions.every((position) => (
        world.getCropAt(position.x, position.y) === null
      ));
    }

    if (level.winConditionType === 'harvest_wheat') {
      return this.gameState.harvestedWheatCount >= level.target.count;
    }

    return false;
  }
}
