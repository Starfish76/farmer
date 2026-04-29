import { BlockProgram } from '../blocks/BlockProgram.js';
import { BlockShop } from '../blocks/BlockShop.js';
import { CodeGenerator } from '../blocks/CodeGenerator.js';
import { GAME_STATE } from '../constants.js';
import { CodePreviewPanel } from '../ui/CodePreviewPanel.js';
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
      purchasedBlocks: [],
      programBlocks: [],
      logs: [],
    };

    this.ui = new UIManager(this.gameState);
    this.blockShop = new BlockShop(this.gameState);
    this.blockProgram = new BlockProgram(this.gameState);
    this.codeGenerator = new CodeGenerator();

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
    });
    this.codePreviewPanel = new CodePreviewPanel({
      codeGenerator: this.codeGenerator,
      gameState: this.gameState,
    });

    this.state = GAME_STATE.STOPPED;
    this.lastTick = 0;
    this.tickInterval = 250;

    this.initButtons();
    this.renderPanels();
    this.ui.updateStatus(this.state);
    this.ui.updateStats(this.gameState);
    window.addEventListener('resize', () => this.renderer.resize());
  }

  initButtons() {
    document.getElementById('btn-run').addEventListener('click', () => this.startRun());
    document.getElementById('btn-step').addEventListener('click', () => this.step());
    document.getElementById('btn-stop').addEventListener('click', () => this.stop());
    document.getElementById('btn-reset').addEventListener('click', () => this.reset());
  }

  purchaseBlock(blockId) {
    const result = this.blockShop.purchase(blockId);
    this.ui.addLog(result.message);
    this.ui.updateStats(this.gameState);
    this.renderPanels();
  }

  addProgramBlock(blockId) {
    const added = this.blockProgram.addBlock(blockId);
    if (added) {
      this.ui.addLog('Added block to program.');
      this.renderPanels();
    }
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
    this.renderPanels();
    this.ui.addLog('Program cleared.');
  }

  renderPanels() {
    this.shopPanel.render();
    this.programPanel.render();
    this.codePreviewPanel.render();
  }

  startRun() {
    if (this.state === GAME_STATE.RUNNING) return;

    if (!this.loadProgramCommands()) {
      return;
    }

    this.state = GAME_STATE.RUNNING;
    this.lastTick = 0;
    this.ui.updateStatus(this.state);
    this.ui.addLog('Starting program...');
  }

  step() {
    if (this.robot.isAnimating) return;

    if (this.queue.isEmpty()) {
      if (!this.loadProgramCommands()) {
        return;
      }

      this.state = GAME_STATE.PAUSED;
      this.ui.updateStatus(this.state);
    }

    this.executeNext(performance.now());
  }

  stop() {
    if (this.state !== GAME_STATE.STOPPED) {
      this.state = GAME_STATE.PAUSED;
      this.ui.updateStatus(this.state);
      this.ui.addLog('Program paused.');
    }
  }

  reset() {
    this.state = GAME_STATE.STOPPED;
    this.robot.reset();
    this.queue.clear();
    this.ui.updateStatus(this.state);
    this.ui.addLog('System reset.');
  }

  loadProgramCommands() {
    const commands = this.blockProgram.toCommands();

    if (commands.length === 0) {
      this.ui.addLog('Program is empty.');
      return false;
    }

    this.queue.clear();
    for (const command of commands) {
      this.queue.push({ ...command });
    }

    return true;
  }

  executeNext(time) {
    if (this.robot.isAnimating) return;

    if (this.queue.isEmpty()) {
      this.state = GAME_STATE.STOPPED;
      this.ui.updateStatus(this.state);
      this.ui.addLog('Program finished.');
      return;
    }

    const command = this.queue.pop();

    switch (command.type) {
      case 'move':
        this.executeMove(time);
        break;
      case 'turn_left':
        this.robot.turnLeft();
        this.ui.addLog('Turned left');
        break;
      case 'turn_right':
        this.robot.turnRight();
        this.ui.addLog('Turned right');
        break;
      case 'wait':
        this.ui.addLog('Waiting...');
        break;
      default:
        this.state = GAME_STATE.ERROR;
        this.ui.updateStatus(this.state);
        this.ui.addLog(`Unknown command: ${command.type}`);
        break;
    }
  }

  executeMove(time) {
    const next = this.robot.getFrontPos();

    if (!this.world.isWalkable(next.x, next.y)) {
      this.ui.addLog('Blocked');
      return;
    }

    this.robot.moveTo(next.x, next.y, time);
    this.ui.addLog(`Moved to (${next.x}, ${next.y})`);
  }

  update(time) {
    this.robot.update(time);

    if (
      this.state === GAME_STATE.RUNNING &&
      !this.robot.isAnimating &&
      time - this.lastTick >= this.tickInterval
    ) {
      this.executeNext(time);
      this.lastTick = time;
    }

    this.render();
    requestAnimationFrame((nextTime) => this.update(nextTime));
  }

  render() {
    this.renderer.clear();
    this.renderer.renderWorld(this.world);
    this.renderer.renderRobot(this.robot);
  }
}
