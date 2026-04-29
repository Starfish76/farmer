import { GAME_STATE } from '../constants.js';
import { UIManager } from '../ui/UIManager.js';
import { CommandQueue } from './CommandQueue.js';
import { Renderer } from './Renderer.js';
import { Robot } from './Robot.js';
import { World } from './World.js';

const TEST_COMMANDS = [
  { type: 'move' },
  { type: 'move' },
  { type: 'turn_right' },
  { type: 'move' },
  { type: 'turn_left' },
  { type: 'move' },
];

export class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.renderer = new Renderer(this.canvas);
    this.world = new World();
    this.robot = new Robot();
    this.queue = new CommandQueue();
    this.ui = new UIManager();

    this.state = GAME_STATE.STOPPED;
    this.lastTick = 0;
    this.tickInterval = 250;

    this.initButtons();
    this.ui.updateStatus(this.state);
    window.addEventListener('resize', () => this.renderer.resize());
  }

  initButtons() {
    document.getElementById('btn-run').addEventListener('click', () => this.startRun());
    document.getElementById('btn-step').addEventListener('click', () => this.step());
    document.getElementById('btn-stop').addEventListener('click', () => this.stop());
    document.getElementById('btn-reset').addEventListener('click', () => this.reset());
  }

  startRun() {
    if (this.state === GAME_STATE.RUNNING) return;

    this.queue.clear();
    this.loadTestCommands();
    this.state = GAME_STATE.RUNNING;
    this.lastTick = 0;
    this.ui.updateStatus(this.state);
    this.ui.addLog('Starting program...');
  }

  step() {
    if (this.robot.isAnimating) return;

    if (this.queue.isEmpty()) {
      this.loadTestCommands();
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

  loadTestCommands() {
    for (const command of TEST_COMMANDS) {
      this.queue.push({ ...command });
    }
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
