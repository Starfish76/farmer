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
import { Renderer } from './Renderer.js';
import { Robot } from './Robot.js';
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
      logs: [],
      purchasedBlocks: [],
      programBlocks: [],
      selectedContainerId: null,
      unlockedBlocks: [],
    };

    this.ui = new UIManager(this.gameState);
    this.economy = new Economy(this.gameState);
    this.levelManager = new LevelManager(this.gameState);
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
      onMoveUp: (programBlockId) => this.moveProgramBlockUp(programBlockId),
      onMoveDown: (programBlockId) => this.moveProgramBlockDown(programBlockId),
      onRemove: (programBlockId) => this.removeProgramBlock(programBlockId),
      onClear: () => this.clearProgram(),
      onSelectContainer: (programBlockId) => this.selectProgramContainer(programBlockId),
      onBackToMain: () => this.backToMainProgram(),
    });
    this.codePreviewPanel = new CodePreviewPanel({
      codeGenerator: this.codeGenerator,
      gameState: this.gameState,
    });
    this.missionPanel = new MissionPanel({
      onPrevious: () => this.previousLevel(),
      onNext: () => this.nextLevel(),
      onReset: () => this.resetLevel(),
    });

    this.initButtons();
    this.applyLevel(this.levelManager.currentLevel);
    window.addEventListener('resize', () => this.renderer.resize());
  }

  initButtons() {
    document.getElementById('btn-run').addEventListener('click', () => this.startRun());
    document.getElementById('btn-step').addEventListener('click', () => this.step());
    document.getElementById('btn-stop').addEventListener('click', () => this.stop());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetLevel());
  }

  applyLevel(level) {
    this.world.loadGrid(level.grid);
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
    this.economy.setCoins(level.initialCoins);
    this.blockShop.ensureFreeBlocksOwned();
    this.setState(GAME_STATE.STOPPED);
    this.ui.updateStats(this.gameState);
    this.renderPanels();
    this.ui.addLog(`Loaded ${level.title}`);
  }

  purchaseBlock(blockId) {
    const result = this.blockShop.purchase(blockId);
    this.ui.addLog(result.message);
    this.ui.updateStats(this.gameState);
    this.renderPanels();
  }

  addProgramBlock(blockId) {
    if (!this.blockShop.isUnlocked(blockId) || !this.blockShop.isPurchased(blockId)) {
      this.ui.addLog('Block is not available in this level.');
      return;
    }

    const added = this.blockProgram.addBlock(blockId);
    if (added) {
      this.ui.addLog('Added block to program.');
      this.renderPanels();
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

  moveProgramBlockUp(programBlockId) {
    this.blockProgram.moveUp(programBlockId);
    this.renderPanels();
  }

  moveProgramBlockDown(programBlockId) {
    this.blockProgram.moveDown(programBlockId);
    this.renderPanels();
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
    this.ui.addLog('Program cleared.');
  }

  renderPanels() {
    this.shopPanel.render();
    this.programPanel.render();
    this.codePreviewPanel.render();
    this.missionPanel.render(this.levelManager.currentLevel, {
      canGoPrevious: this.levelManager.canGoPrevious(),
      canGoNext: this.levelManager.canGoNext(),
      levelComplete: this.gameState.levelComplete,
    });
  }

  startRun() {
    if (this.state === GAME_STATE.RUNNING) return;

    if (!this.loadProgramCommands()) {
      return;
    }

    this.setState(GAME_STATE.RUNNING);
    this.lastTick = 0;
    this.ui.addLog('Starting program...');
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
      this.ui.addLog('Program paused.');
    }
  }

  resetLevel() {
    this.applyLevel(this.levelManager.currentLevel);
  }

  nextLevel() {
    if (!this.gameState.levelComplete || !this.levelManager.canGoNext()) return;
    const level = this.levelManager.nextLevel();
    this.applyLevel(level);
  }

  previousLevel() {
    if (!this.levelManager.canGoPrevious()) return;
    const level = this.levelManager.previousLevel();
    this.applyLevel(level);
  }

  loadProgramCommands() {
    const result = this.blockProgram.toCommands();

    if (!result.ok) {
      this.ui.addLog(result.message);
      return false;
    }

    if (result.commands.length === 0) {
      this.ui.addLog('Program is empty.');
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
    } else if (result.status === 'error') {
      this.setState(GAME_STATE.ERROR);
    }

    this.checkLevelComplete();

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
      this.ui.addLog('Waited 1 second');
      this.activeCommand = null;
      this.lastTick = time;

      if (!this.gameState.levelComplete && this.queue.isEmpty()) {
        this.finishProgram();
      }
    }
  }

  finishProgram() {
    if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.PAUSED) {
      this.setState(GAME_STATE.STOPPED);
    }

    this.ui.addLog('Program finished.');
  }

  checkLevelComplete() {
    if (this.gameState.levelComplete) return;

    if (this.levelManager.isComplete({ world: this.world, robot: this.robot })) {
      this.gameState.levelComplete = true;
      this.queue.clear();
      this.activeCommand = null;
      this.setState(GAME_STATE.SUCCESS);
      this.ui.addLog('Level Complete!');
      this.renderPanels();
    }
  }

  setState(state) {
    this.state = state;
    this.ui.updateStatus(state);
  }

  render() {
    this.renderer.clear();
    this.renderer.renderWorld(this.world, this.levelManager.currentLevel);
    this.renderer.renderRobot(this.robot);
  }
}
