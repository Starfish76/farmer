import { BlockExecutor } from '../blocks/BlockExecutor.js';
import { BlockProgram } from '../blocks/BlockProgram.js';
import { BlockShop } from '../blocks/BlockShop.js';
import { CodeGenerator } from '../blocks/CodeGenerator.js';
import { GAME_STATE } from '../constants.js';
import { Economy } from './Economy.js';
import { LevelManager } from './LevelManager.js';
import { CodePreviewPanel } from '../ui/CodePreviewPanel.js';
import { MissionPanel } from '../ui/MissionPanel.js';
import { ProgramPanel } from '../ui/ProgramPanel.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { UIManager } from '../ui/UIManager.js';
import { CommandQueue } from './CommandQueue.js';
import { CROPS } from './Crop.js';
import { Renderer } from './Renderer.js';
import { Robot } from './Robot.js';
import { StorageManager } from './StorageManager.js';
import { World } from './World.js';

export class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.renderer = new Renderer(this.canvas);
    this.world = new World();
    this.robot = new Robot();
    this.queue = new CommandQueue();

    this.gameState = {
      coins: 20,
      score: 0,
      currentLevel: 1,
      currentLevelIndex: 0,
      levelComplete: false,
      harvestedWheatCount: 0,
      highestUnlockedLevel: 1,
      completedLevels: [],
      mainGameStarted: false,
      logs: [],
      purchasedBlocks: [],
      programBlocks: [],
      selectedContainerId: null,
      unlockedBlocks: [],
    };

    this.ui = new UIManager(this.gameState);
    this.economy = new Economy(this.gameState);
    this.levelManager = new LevelManager(this.gameState);
    this.storage = new StorageManager();
    const savedData = this.restoreSavedState();
    this.blockShop = new BlockShop(this.gameState);
    this.blockProgram = new BlockProgram(this.gameState);
    this.codeGenerator = new CodeGenerator();
    this.executor = new BlockExecutor({
      world: this.world,
      robot: this.robot,
      economy: this.economy,
      gameState: this.gameState,
      ui: this.ui,
    });

    this.activeCommand = null;
    this.state = GAME_STATE.STOPPED;
    this.lastTick = 0;
    this.tickInterval = 250;

    this.shopPanel = new ShopPanel({
      shop: this.blockShop,
      onPurchase: (blockId) => this.purchaseBlock(blockId),
      onAddBlock: (blockId) => this.addProgramBlock(blockId),
    });
    this.programPanel = new ProgramPanel({
      program: this.blockProgram,
      onMove: (programBlockId, targetBlockId, position) => (
        this.moveProgramBlock(programBlockId, targetBlockId, position)
      ),
      onRemove: (programBlockId) => this.removeProgramBlock(programBlockId),
      onClear: () => this.clearProgram(),
      onSelectContainer: (programBlockId) => this.selectProgramContainer(programBlockId),
    });
    this.codePreviewPanel = new CodePreviewPanel({
      codeGenerator: this.codeGenerator,
      gameState: this.gameState,
    });
    this.missionPanel = new MissionPanel({
      onPrevious: () => this.previousLevel(),
      onNext: () => this.nextLevel(),
      onReset: () => this.resetLevel(),
      onResetAll: () => this.resetAll(),
      onStartMainGame: () => this.startMainGame(),
    });

    this.initButtons();
    if (this.gameState.mainGameStarted) {
      this.startMainGame({
        save: false,
        coinsOverride: savedData?.coins,
        purchasedBlocksOverride: savedData?.purchasedBlocks,
      });
    } else {
      this.applyLevel(this.levelManager.currentLevel, {
        coinsOverride: savedData?.coins,
        save: false,
      });
    }
    this.saveProgress();
    window.addEventListener('resize', () => this.renderer.resize());
  }

  initButtons() {
    document.getElementById('btn-run').addEventListener('click', () => this.startRun());
    document.getElementById('btn-step').addEventListener('click', () => this.step());
    document.getElementById('btn-stop').addEventListener('click', () => this.stop());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetRobotToStart());
  }

  restoreSavedState() {
    const savedData = this.storage.load();
    if (!savedData) return null;

    const savedLevelIndex = this.levelManager.levels.findIndex((level) => level.id === savedData.currentLevel);
    this.gameState.currentLevelIndex = savedLevelIndex >= 0 ? savedLevelIndex : 0;
    this.gameState.currentLevel = this.levelManager.currentLevel.id;
    this.gameState.coins = Number.isFinite(savedData.coins) ? savedData.coins : this.levelManager.currentLevel.initialCoins;
    this.gameState.purchasedBlocks = Array.isArray(savedData.purchasedBlocks) ? [...savedData.purchasedBlocks] : [];
    this.gameState.highestUnlockedLevel = savedData.highestUnlockedLevel ?? this.gameState.currentLevel;
    this.gameState.completedLevels = Array.isArray(savedData.completedLevels) ? [...savedData.completedLevels] : [];
    this.gameState.mainGameStarted = savedData.mainGameStarted === true;
    return savedData;
  }

  applyLevel(level, options = {}) {
    const now = performance.now();
    this.world.loadGrid(level.grid);
    this.applyInitialCrops(level, now);
    this.robot.reset({
      x: level.robotStart.x,
      y: level.robotStart.y,
      direction: level.robotDirection,
    });
    this.queue.clear();
    this.activeCommand = null;
    this.blockProgram.clear();
    this.gameState.currentLevel = level.id;
    this.gameState.levelComplete = false;
    this.gameState.harvestedWheatCount = 0;
    this.gameState.unlockedBlocks = [...level.unlockedBlocks];
    this.gameState.score = 0;
    this.economy.setCoins(options.coinsOverride ?? level.initialCoins);
    this.blockShop.ensureFreeBlocksOwned();
    this.setState(GAME_STATE.STOPPED);
    this.ui.updateStats(this.gameState);
    this.renderPanels();
    this.ui.addLog(`${level.title}을 불러왔습니다.`);
    if (options.save !== false) {
      this.saveProgress();
    }
  }

  applyInitialCrops(level, now) {
    for (const crop of level.initialCrops ?? []) {
      const duration = CROPS[crop.type]?.growthDurationSeconds ?? 0;
      const plantedAt = crop.stage === 'grown' ? now - duration * 1000 : now;
      this.world.plantCropAt(crop.x, crop.y, crop.type, plantedAt);
    }

    this.world.updateAllCrops(now);
  }

  purchaseBlock(blockId) {
    const result = this.blockShop.purchase(blockId);
    this.ui.addLog(result.message);
    this.ui.updateStats(this.gameState);
    this.renderPanels();
    this.saveProgress();
  }

  addProgramBlock(blockId) {
    if (!this.blockShop.isUnlocked(blockId) || !this.blockShop.isPurchased(blockId)) {
      this.ui.addLog('이 레벨에서 사용할 수 없는 블록입니다.');
      return;
    }

    const added = this.blockProgram.addBlock(blockId);
    if (added) {
      this.ui.addLog('프로그램에 블록을 추가했습니다.');
      this.renderPanels();
      this.programPanel.scrollToEnd();
    }
  }

  selectProgramContainer(programBlockId) {
    if (this.blockProgram.selectContainer(programBlockId)) {
      this.renderPanels();
    }
  }

  backToMainProgram() {
    this.blockProgram.selectMainProgram();
    this.renderPanels();
  }

  moveProgramBlock(programBlockId, targetBlockId, position) {
    if (this.blockProgram.moveTo(programBlockId, targetBlockId, position)) {
      this.renderPanels();
    }
  }

  removeProgramBlock(programBlockId) {
    this.blockProgram.remove(programBlockId);
    this.renderPanels();
  }

  clearProgram() {
    this.blockProgram.clear();
    this.queue.clear();
    this.activeCommand = null;
    this.renderPanels();
    this.ui.addLog('프로그램을 비웠습니다.');
  }

  renderPanels() {
    const canAdvance = this.canAdvanceFromCurrentLevel();
    this.shopPanel.render();
    this.programPanel.render();
    this.codePreviewPanel.render();

    if (this.gameState.mainGameStarted) {
      this.missionPanel.hideForMainGame();
      return;
    }

    if (this.isTutorialCompleteReady()) {
      this.missionPanel.renderTutorialComplete();
      return;
    }

    this.missionPanel.render(this.levelManager.currentLevel, {
      canGoPrevious: this.levelManager.canGoPrevious(),
      canGoNext: this.levelManager.canGoNext(),
      levelComplete: canAdvance,
    });
  }

  startRun() {
    if (this.state === GAME_STATE.RUNNING) return;

    if (!this.loadProgramCommands()) {
      return;
    }

    this.setState(GAME_STATE.RUNNING);
    this.lastTick = 0;
    this.ui.addLog('프로그램 실행을 시작합니다.');
  }

  step() {
    if (this.robot.isAnimating || this.activeCommand) return;

    if (this.queue.isEmpty()) {
      if (!this.loadProgramCommands()) {
        return;
      }

      this.setState(GAME_STATE.PAUSED);
    }

    this.executeNext(performance.now());
  }

  stop() {
    if (this.state !== GAME_STATE.STOPPED) {
      this.activeCommand = null;
      this.setState(GAME_STATE.PAUSED);
      this.ui.addLog('프로그램을 일시정지했습니다.');
    }
  }

  resetLevel() {
    if (this.gameState.mainGameStarted) {
      this.startMainGame({ save: true });
      return;
    }

    this.applyLevel(this.levelManager.currentLevel);
  }

  resetRobotToStart() {
    if (this.gameState.mainGameStarted) {
      this.robot.reset({ x: 0, y: 0, direction: 'east' });
      return;
    }

    const level = this.levelManager.currentLevel;
    this.robot.reset({
      x: level.robotStart.x,
      y: level.robotStart.y,
      direction: level.robotDirection,
    });
  }

  nextLevel() {
    if (!this.canAdvanceFromCurrentLevel() || !this.levelManager.canGoNext()) return;
    const level = this.levelManager.nextLevel();
    this.applyLevel(level);
  }

  previousLevel() {
    if (!this.levelManager.canGoPrevious()) return;
    const level = this.levelManager.previousLevel();
    this.applyLevel(level);
  }

  resetAll() {
    this.storage.clear();
    this.gameState.currentLevelIndex = 0;
    this.gameState.currentLevel = 1;
    this.gameState.levelComplete = false;
    this.gameState.mainGameStarted = false;
    this.gameState.highestUnlockedLevel = 1;
    this.gameState.completedLevels = [];
    this.gameState.purchasedBlocks = [];
    this.gameState.logs = [];
    this.ui.logs = this.gameState.logs;
    this.applyLevel(this.levelManager.goToLevel(0), { save: false });
    this.ui.addLog('전체 진행 상황을 초기화했습니다.');
  }

  startMainGame(options = {}) {
    this.world.loadGrid([['soil']]);
    this.robot.reset({ x: 0, y: 0, direction: 'east' });
    this.queue.clear();
    this.activeCommand = null;
    this.blockProgram.clear();
    this.gameState.mainGameStarted = true;
    this.gameState.currentLevel = 'main';
    this.gameState.levelComplete = false;
    this.gameState.harvestedWheatCount = 0;
    this.gameState.score = 0;
    this.gameState.purchasedBlocks = [];
    this.gameState.unlockedBlocks = [
      'move',
      'turn_left',
      'turn_right',
      'plant_wheat',
      'wait',
      'harvest',
      'water',
      'repeat_5',
      'if_crop_ready',
    ];
    this.economy.setCoins(options.coinsOverride ?? 30);
    this.blockShop.ensureFreeBlocksOwned();
    this.setState(GAME_STATE.STOPPED);
    this.ui.updateStats(this.gameState);
    this.renderPanels();
    this.ui.addLog('본 게임을 시작했습니다. 10000코인을 모아보세요.');

    if (options.save !== false) {
      this.saveProgress();
    }
  }

  loadProgramCommands() {
    const result = this.blockProgram.toCommands();

    if (!result.ok) {
      this.ui.addLog(result.message);
      return false;
    }

    if (result.commands.length === 0) {
      this.ui.addLog('프로그램이 비어 있습니다.');
      return false;
    }

    this.queue.clear();
    for (const command of result.commands) {
      this.queue.push({ ...command });
    }

    return true;
  }

  executeNext(time) {
    if (this.robot.isAnimating || this.activeCommand) return;

    if (this.queue.isEmpty()) {
      this.finishProgram();
      return;
    }

    const command = this.queue.pop();
    const result = this.executor.execute(command, time);

    if (result.status === 'waiting') {
      this.activeCommand = {
        type: 'wait',
        endsAt: result.endsAt,
      };
    } else if (result.status === 'enqueue') {
      this.queue.insertFront(result.commands);
    } else if (result.status === 'error') {
      this.setState(GAME_STATE.ERROR);
    }

    this.checkLevelComplete();
    this.saveProgress();

    if (
      !this.gameState.levelComplete &&
      !this.activeCommand &&
      this.queue.isEmpty() &&
      this.state !== GAME_STATE.ERROR
    ) {
      this.finishProgram();
    }
  }

  update(time) {
    this.robot.update(time);
    this.world.updateAllCrops(time);
    this.updateActiveCommand(time);

    if (
      this.state === GAME_STATE.RUNNING &&
      !this.robot.isAnimating &&
      !this.activeCommand &&
      time - this.lastTick >= this.tickInterval
    ) {
      this.executeNext(time);
      this.lastTick = time;
    }

    this.checkLevelComplete();
    this.render();
    requestAnimationFrame((nextTime) => this.update(nextTime));
  }

  updateActiveCommand(time) {
    if (!this.activeCommand) return;

    if (time >= this.activeCommand.endsAt) {
      this.ui.addLog('1초 기다렸습니다.');
      this.activeCommand = null;
      this.lastTick = time;
      this.saveProgress();

      if (!this.gameState.levelComplete && this.queue.isEmpty()) {
        this.finishProgram();
      }
    }
  }

  finishProgram() {
    if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.PAUSED) {
      this.setState(GAME_STATE.STOPPED);
    }

    this.ui.addLog('프로그램 실행이 끝났습니다.');
  }

  checkLevelComplete() {
    if (this.gameState.levelComplete) return;

    if (this.levelManager.isComplete({ world: this.world, robot: this.robot })) {
      this.gameState.levelComplete = true;
      if (!this.gameState.completedLevels.includes(this.gameState.currentLevel)) {
        this.gameState.completedLevels.push(this.gameState.currentLevel);
      }
      this.gameState.highestUnlockedLevel = Math.max(
        this.gameState.highestUnlockedLevel,
        this.gameState.currentLevel + 1,
      );
      this.queue.clear();
      this.activeCommand = null;
      this.setState(GAME_STATE.SUCCESS);
      if (!this.gameState.mainGameStarted) {
        this.renderer.triggerFireworks();
      }
      this.ui.addLog('레벨 완료!');
      this.renderPanels();
      this.saveProgress();
    }
  }

  setState(state) {
    this.state = state;
    this.ui.updateStatus(state);
  }

  canAdvanceFromCurrentLevel() {
    return (
      this.gameState.levelComplete ||
      this.gameState.completedLevels.includes(this.gameState.currentLevel)
    );
  }

  isTutorialCompleteReady() {
    const lastLevel = this.levelManager.levels[this.levelManager.levels.length - 1];
    return (
      this.gameState.currentLevel === lastLevel.id &&
      this.gameState.completedLevels.includes(lastLevel.id)
    );
  }

  render() {
    this.renderer.clear();
    this.renderer.renderWorld(
      this.world,
      this.gameState.mainGameStarted ? null : this.levelManager.currentLevel,
    );
    this.renderer.renderRobot(this.robot);
  }

  saveProgress() {
    this.storage.save(this.gameState);
  }
}
