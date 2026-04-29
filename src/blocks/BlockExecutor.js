import { CROPS, getRemainingGrowthSeconds, updateGrowthStage } from '../game/Crop.js';

export class BlockExecutor {
  constructor({ world, robot, economy, gameState, ui }) {
    this.world = world;
    this.robot = robot;
    this.economy = economy;
    this.gameState = gameState;
    this.ui = ui;
  }

  execute(command, time) {
    switch (command.type) {
      case 'move':
        return this.move(time);
      case 'turn_left':
        this.robot.turnLeft();
        this.ui.addLog('Turned left');
        return { status: 'done' };
      case 'turn_right':
        this.robot.turnRight();
        this.ui.addLog('Turned right');
        return { status: 'done' };
      case 'wait':
        return { status: 'waiting', endsAt: time + 1000 };
      case 'plant_wheat':
        return this.plantCrop('wheat', time);
      case 'plant_carrot':
        return this.plantCrop('carrot', time);
      case 'harvest':
        return this.harvest(time);
      case 'water':
        this.ui.addLog('Watered tile');
        return { status: 'done' };
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
      this.ui.addLog('Blocked');
      return { status: 'done' };
    }

    this.robot.moveTo(next.x, next.y, time);
    this.ui.addLog(`Moved to (${next.x}, ${next.y})`);
    return { status: 'done' };
  }

  plantCrop(cropType, time) {
    const result = this.world.plantCropAt(this.robot.gridX, this.robot.gridY, cropType, time);

    if (result.ok) {
      this.ui.addLog(`Planted ${cropType}`);
    } else {
      this.ui.addLog(result.message);
    }

    return { status: 'done' };
  }

  harvest(time) {
    const crop = this.world.getCropAt(this.robot.gridX, this.robot.gridY);

    if (!crop) {
      this.ui.addLog('Nothing to harvest');
      return { status: 'done' };
    }

    updateGrowthStage(crop, time);

    if (crop.growthStage !== 'grown') {
      const remaining = getRemainingGrowthSeconds(crop, time).toFixed(1);
      this.ui.addLog(`Crop is not ready. ${remaining}s remaining`);
      return { status: 'done' };
    }

    const cropDefinition = CROPS[crop.type];
    this.world.harvestCropAt(this.robot.gridX, this.robot.gridY);
    this.economy.reward({
      coins: cropDefinition.rewardCoins,
      score: cropDefinition.rewardScore,
    });
    if (crop.type === 'wheat') {
      this.gameState.harvestedWheatCount += 1;
    }
    this.ui.updateStats(this.gameState);
    this.ui.addLog(`Harvested ${crop.type} +${cropDefinition.rewardCoins} coins`);

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
      this.ui.addLog(`Condition ${command.conditionType}: false`);
      return { status: 'done' };
    }

    this.ui.addLog(`Condition ${command.conditionType}: true`);
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
