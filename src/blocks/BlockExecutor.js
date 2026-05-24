import { CROPS, getRemainingGrowthSeconds, updateGrowthStage } from '../game/Crop.js';

export class BlockExecutor {
  constructor({ world, robot, gameState, ui }) {
    this.world = world;
    this.robot = robot;
    this.gameState = gameState;
    this.ui = ui;
    this.canMoveTo = null;
  }

  execute(command, time) {
    switch (command.type) {
      case 'move':
        return this.move(time);
      case 'turn_left':
        this.robot.turnLeft();
        this.ui.addLog('Turned left.');
        return { status: 'done' };
      case 'turn_right':
        this.robot.turnRight();
        this.ui.addLog('Turned right.');
        return { status: 'done' };
      case 'wait':
        return { status: 'waiting', endsAt: time + 1000 };
      case 'plant_wheat':
        return this.plantCrop('wheat', time);
      case 'harvest':
        return this.harvest(time);
      case 'repeat':
        return this.repeat(command);
      case 'if':
        return this.condition(command, time);
      default:
        this.ui.addLog(`Unknown command: ${command.type}`);
        return { status: 'error' };
    }
  }

  move(time) {
    const next = this.robot.getFrontPos();

    if (!this.world.isWalkable(next.x, next.y)) {
      this.ui.addLog('Cannot move there.');
      return { status: 'done' };
    }

    if (this.canMoveTo && !this.canMoveTo(next.x, next.y, this.robot)) {
      this.ui.addLog('Another drone is already there.');
      return { status: 'done' };
    }

    this.robot.moveTo(next.x, next.y, time);
    this.ui.addLog(`Moved to (${next.x}, ${next.y}).`);
    return { status: 'done' };
  }

  plantCrop(cropType, time) {
    const result = this.world.plantCropAt(this.robot.gridX, this.robot.gridY, cropType, time);

    if (result.ok) {
      this.ui.addLog(`Planted ${getCropName(cropType)}.`);
    } else {
      this.ui.addLog(result.message);
    }

    return { status: 'done' };
  }

  harvest(time) {
    const crop = this.world.getCropAt(this.robot.gridX, this.robot.gridY);

    if (!crop) {
      this.ui.addLog('There is no crop to harvest.');
      return { status: 'done' };
    }

    updateGrowthStage(crop, time);

    if (crop.growthStage !== 'grown') {
      const remaining = getRemainingGrowthSeconds(crop, time).toFixed(1);
      this.ui.addLog(`The crop is not ready yet. ${remaining}s remaining.`);
      return { status: 'done' };
    }

    this.world.harvestCropAt(this.robot.gridX, this.robot.gridY);
    if (crop.type === 'wheat') {
      this.gameState.harvestedWheatCount += 1;
    }
    this.gameState.cropInventory[crop.type] = (this.gameState.cropInventory[crop.type] ?? 0) + 1;
    this.ui.updateStats(this.gameState);
    this.ui.addLog(`Harvested ${getCropName(crop.type)}.`);

    return { status: 'done' };
  }

  repeat(command) {
    const expanded = [];

    for (let index = 0; index < command.count; index += 1) {
      expanded.push(...cloneCommands(command.children ?? []));
    }

    return { status: 'enqueue', commands: expanded };
  }

  condition(command, time) {
    const passed = this.evaluateCondition(command.conditionType, time);

    if (!passed) {
      this.ui.addLog(`Condition ${getConditionName(command.conditionType)}: false`);
      return { status: 'done' };
    }

    this.ui.addLog(`Condition ${getConditionName(command.conditionType)}: true`);
    return {
      status: 'enqueue',
      commands: cloneCommands(command.children ?? []),
    };
  }

  evaluateCondition(conditionType, time) {
    if (conditionType === 'crop_ready') {
      const crop = this.world.getCropAt(this.robot.gridX, this.robot.gridY);
      if (!crop) return false;
      updateGrowthStage(crop, time);
      return crop.growthStage === 'grown';
    }

    return false;
  }
}

function cloneCommands(commands) {
  return commands.map((command) => ({
    ...command,
    children: command.children ? cloneCommands(command.children) : undefined,
  }));
}

function getCropName(cropType) {
  if (cropType === 'wheat') return 'wheat';
  return cropType;
}

function getConditionName(conditionType) {
  if (conditionType === 'crop_ready') return 'crop ready';
  return conditionType;
}
