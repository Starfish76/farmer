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
        this.ui.addLog('왼쪽으로 회전했습니다.');
        return { status: 'done' };
      case 'turn_right':
        this.robot.turnRight();
        this.ui.addLog('오른쪽으로 회전했습니다.');
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
        this.ui.addLog('현재 칸에 물을 줬습니다.');
        return { status: 'done' };
      case 'repeat':
        return this.repeat(command);
      case 'if':
        return this.condition(command, time);
      default:
        this.ui.addLog(`알 수 없는 명령입니다: ${command.type}`);
        return { status: 'error' };
    }
  }

  move(time) {
    const next = this.robot.getFrontPos();

    if (!this.world.isWalkable(next.x, next.y)) {
      this.ui.addLog('이동할 수 없습니다.');
      return { status: 'done' };
    }

    this.robot.moveTo(next.x, next.y, time);
    this.ui.addLog(`(${next.x}, ${next.y}) 위치로 이동했습니다.`);
    return { status: 'done' };
  }

  plantCrop(cropType, time) {
    const result = this.world.plantCropAt(this.robot.gridX, this.robot.gridY, cropType, time);

    if (result.ok) {
      this.ui.addLog(`${getCropName(cropType)}을 심었습니다.`);
    } else {
      this.ui.addLog(result.message);
    }

    return { status: 'done' };
  }

  harvest(time) {
    const crop = this.world.getCropAt(this.robot.gridX, this.robot.gridY);

    if (!crop) {
      this.ui.addLog('수확할 작물이 없습니다.');
      return { status: 'done' };
    }

    updateGrowthStage(crop, time);

    if (crop.growthStage !== 'grown') {
      const remaining = getRemainingGrowthSeconds(crop, time).toFixed(1);
      this.ui.addLog(`아직 다 자라지 않았습니다. ${remaining}초 남았습니다.`);
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
    this.ui.addLog(`${getCropName(crop.type)} 수확 완료. +${cropDefinition.rewardCoins}코인`);

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
      this.ui.addLog(`조건 ${getConditionName(command.conditionType)}: 거짓`);
      return { status: 'done' };
    }

    this.ui.addLog(`조건 ${getConditionName(command.conditionType)}: 참`);
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
  if (cropType === 'wheat') return '밀';
  if (cropType === 'carrot') return '당근';
  return cropType;
}

function getConditionName(conditionType) {
  if (conditionType === 'crop_ready') return '작물 준비됨';
  return conditionType;
}
