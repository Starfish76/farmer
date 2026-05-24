import { BlockExecutor } from '../blocks/BlockExecutor.js';
import { BlockProgram } from '../blocks/BlockProgram.js';
import { BlockShop } from '../blocks/BlockShop.js';
import { GAME_STATE } from '../constants.js';
import { Economy } from './Economy.js';
import { LevelManager } from './LevelManager.js';
import { MissionPanel } from '../ui/MissionPanel.js';
import { ProgramPanel } from '../ui/ProgramPanel.js';
import { SellPanel } from '../ui/SellPanel.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { UIManager } from '../ui/UIManager.js';
import { CommandQueue } from './CommandQueue.js';
import { CROPS } from './Crop.js';
import { Renderer } from './Renderer.js';
import { Robot } from './Robot.js';
import { StorageManager } from './StorageManager.js';
import { World } from './World.js';

const MARKET_PRICE_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
const MIN_CROP_PRICE = 1;
const MAX_CROP_PRICE = 8;
const MARKET_PRICE_MAX_STEP = 3;
const MAX_MAIN_WORLD_SIZE = 8;
const MAX_DRONE_COUNT = 8;
const MAIN_GAME_INITIAL_COINS = 0;
const MAIN_GAME_STARTER_BLOCK_IDS = ['plant_wheat', 'wait', 'harvest'];

export class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.renderer = new Renderer(this.canvas);
    this.world = new World();
    this.robot = new Robot();
    this.queue = new CommandQueue();

    this.gameState = {
      coins: 20,
      currentLevel: 1,
      currentLevelIndex: 0,
      levelComplete: false,
      harvestedWheatCount: 0,
      cropInventory: createDefaultCropInventory(),
      cropPrices: createDefaultCropPrices(),
      nextMarketPriceUpdateAt: Date.now() + MARKET_PRICE_UPDATE_INTERVAL_MS,
      highestUnlockedLevel: 1,
      completedLevels: [],
      mainGameStarted: false,
      logs: [],
      purchasedBlocks: [],
      programBlocks: [],
      dronePrograms: [[]],
      selectedDroneIndex: 0,
      selectedContainerId: null,
      unlockedBlocks: [],
      upgradePurchases: {},
      droneCount: 1,
      extraDronePositions: [],
    };

    this.ui = new UIManager(this.gameState);
    this.economy = new Economy(this.gameState);
    this.levelManager = new LevelManager(this.gameState);
    this.storage = new StorageManager();
    const savedData = this.restoreSavedState();
    this.blockShop = new BlockShop(this.gameState, {
      add_land: () => this.addLand(),
      add_drone: () => this.addDrone(),
    });
    this.blockProgram = new BlockProgram(this.gameState);
    this.executor = new BlockExecutor({
      world: this.world,
      robot: this.robot,
      gameState: this.gameState,
      ui: this.ui,
    });
    this.executor.canMoveTo = (x, y, robot) => !this.isDroneOccupying(x, y, robot);

    this.activeCommand = null;
    this.state = GAME_STATE.STOPPED;
    this.droneRunStates = [];
    this.isDraggingDrone = false;
    this.draggingDroneIndex = null;
    this.extraRobots = [];
    this.lastTick = 0;
    this.lastSellPanelRenderAt = 0;
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
    this.sellPanel = new SellPanel({
      gameState: this.gameState,
      onSellCrop: (cropId) => this.sellCrop(cropId),
    });
    this.missionPanel = new MissionPanel({
      onPrevious: () => this.previousLevel(),
      onNext: () => this.nextLevel(),
      onReset: () => this.resetLevel(),
      onResetAll: () => this.resetAll(),
      onStartMainGame: () => this.startMainGame(),
    });

    this.initButtons();
    this.initDroneDrag();
    if (this.gameState.mainGameStarted) {
      this.startMainGame({
        save: false,
        coinsOverride: savedData?.coins,
        cropInventoryOverride: savedData?.cropInventory,
        purchasedBlocksOverride: savedData?.purchasedBlocks,
        droneProgramsOverride: savedData?.dronePrograms,
        selectedDroneIndexOverride: savedData?.selectedDroneIndex,
        upgradePurchasesOverride: savedData?.upgradePurchases,
        droneCountOverride: savedData?.droneCount,
        extraDronePositionsOverride: savedData?.extraDronePositions,
        robotPositionOverride: savedData?.robotPosition,
        worldGridOverride: savedData?.mainWorldGrid,
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
    document.getElementById('btn-step')?.addEventListener('click', () => this.step());
    document.getElementById('btn-stop').addEventListener('click', () => this.stop());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.resetRobotToStart());
  }

  initDroneDrag() {
    const container = this.canvas.parentElement;
    let dragState = null;

    container.addEventListener('pointerdown', (event) => {
      const drone = event.target.closest('[data-drone-index]');
      if (!drone) return;
      if (this.state === GAME_STATE.RUNNING || this.robot.isAnimating) return;

      const droneIndex = Number.parseInt(drone.dataset.droneIndex, 10);
      this.selectDrone(droneIndex);
      const containerRect = container.getBoundingClientRect();
      const currentX = parseFloat(drone.style.left) || 0;
      const currentY = parseFloat(drone.style.top) || 0;
      dragState = {
        drone,
        droneIndex,
        pointerId: event.pointerId,
        offsetX: currentX - (event.clientX - containerRect.left),
        offsetY: currentY - (event.clientY - containerRect.top),
        startX: currentX,
        startY: currentY,
      };

      drone.setPointerCapture(event.pointerId);
      drone.style.cursor = 'grabbing';
      drone.style.zIndex = '5';
      this.isDraggingDrone = true;
      this.draggingDroneIndex = dragState.droneIndex;
      event.preventDefault();
    });

    container.addEventListener('pointermove', (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const containerRect = container.getBoundingClientRect();
      dragState.drone.style.left = `${event.clientX - containerRect.left + dragState.offsetX}px`;
      dragState.drone.style.top = `${event.clientY - containerRect.top + dragState.offsetY}px`;
    });

    const finishDrag = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const pointer = this.getCanvasRelativePointer(event);
      const target = this.renderer.getGridPositionFromScreenPoint(pointer.x, pointer.y, this.world);
      const tile = target ? this.world.getTile(target.x, target.y) : null;

      dragState.drone.releasePointerCapture(event.pointerId);
      dragState.drone.style.cursor = 'grab';
      dragState.drone.style.zIndex = dragState.droneIndex === 0 ? '2' : '1';

      if (tile?.type === 'soil' && !this.isDroneOccupying(target.x, target.y, this.getRobotByDroneIndex(dragState.droneIndex))) {
        this.moveDroneToGrid(dragState.droneIndex, target.x, target.y);
        this.queue.clear();
        this.activeCommand = null;
        this.setState(GAME_STATE.STOPPED);
        this.saveProgress();
        this.snapDraggedDroneToGrid(dragState.drone, target.x, target.y);
      } else {
        this.snapDraggedDroneBack(dragState);
      }

      this.isDraggingDrone = false;
      this.draggingDroneIndex = null;
      dragState = null;
    };

    container.addEventListener('pointerup', finishDrag);
    container.addEventListener('pointercancel', finishDrag);
  }

  getCanvasRelativePointer(event) {
    const containerRect = this.canvas.parentElement.getBoundingClientRect();
    return {
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top,
    };
  }

  moveDroneToGrid(droneIndex, x, y) {
    this.selectDrone(droneIndex);

    if (droneIndex === 0) {
      this.robot.reset({ x, y, direction: this.robot.dir });
      return;
    }

    this.gameState.extraDronePositions = normalizeExtraDronePositions(
      this.gameState.extraDronePositions,
      this.gameState.droneCount,
      this.world,
      this.robot,
    );
    this.gameState.extraDronePositions[droneIndex - 1] = { x, y };
    this.syncExtraRobotsFromState();
  }

  snapDraggedDroneToGrid(drone, x, y) {
    const position = this.renderer.getDroneCenterFromGrid(x, y);
    drone.style.left = `${position.x}px`;
    drone.style.top = `${position.y}px`;
  }

  snapDraggedDroneBack(dragState) {
    dragState.drone.style.left = `${dragState.startX}px`;
    dragState.drone.style.top = `${dragState.startY}px`;
  }

  selectDrone(droneIndex) {
    const nextIndex = normalizeSelectedDroneIndex(droneIndex, this.gameState.droneCount);
    if (this.gameState.selectedDroneIndex === nextIndex) return;

    this.gameState.selectedDroneIndex = nextIndex;
    this.blockProgram.selectMainProgram();
    this.renderPanels();
    this.saveProgress();
  }

  ensureDronePrograms() {
    this.gameState.dronePrograms = normalizeDronePrograms(
      this.gameState.dronePrograms,
      this.gameState.programBlocks,
      this.gameState.droneCount,
    );
    this.gameState.programBlocks = this.gameState.dronePrograms[0];
  }

  syncExtraRobotsFromState() {
    const extraCount = Math.max(0, normalizeDroneCount(this.gameState.droneCount) - 1);

    while (this.extraRobots.length < extraCount) {
      this.extraRobots.push(new Robot());
    }

    while (this.extraRobots.length > extraCount) {
      this.extraRobots.pop();
    }

    this.gameState.extraDronePositions = normalizeExtraDronePositions(
      this.gameState.extraDronePositions,
      this.gameState.droneCount,
      this.world,
      this.robot,
    );

    for (let index = 0; index < this.extraRobots.length; index += 1) {
      const position = this.gameState.extraDronePositions[index] ?? { x: 0, y: 0 };
      const robot = this.extraRobots[index];
      if (robot.isAnimating) continue;
      robot.reset({ x: position.x, y: position.y, direction: robot.dir ?? 'east' });
    }
  }

  syncExtraDronePositionsFromRobots({ force = false } = {}) {
    if (this.state === GAME_STATE.RUNNING && !force) {
      return;
    }

    this.gameState.extraDronePositions = this.extraRobots.map((robot) => ({
      x: robot.gridX,
      y: robot.gridY,
    }));
  }

  getSelectedRobot() {
    const selectedIndex = normalizeSelectedDroneIndex(
      this.gameState.selectedDroneIndex,
      this.gameState.droneCount,
    );
    return selectedIndex === 0 ? this.robot : this.extraRobots[selectedIndex - 1];
  }

  getRobotByDroneIndex(droneIndex) {
    return droneIndex === 0 ? this.robot : this.extraRobots[droneIndex - 1];
  }

  isDroneOccupying(x, y, ignoredRobot = null) {
    const robots = [this.robot, ...this.extraRobots];
    return robots.some((robot) => (
      robot &&
      robot !== ignoredRobot &&
      robot.gridX === x &&
      robot.gridY === y
    ));
  }

  restoreSavedState() {
    const savedData = this.storage.load();
    if (!savedData) return null;

    const savedLevelIndex = this.levelManager.levels.findIndex((level) => level.id === savedData.currentLevel);
    this.gameState.currentLevelIndex = savedLevelIndex >= 0 ? savedLevelIndex : 0;
    this.gameState.currentLevel = this.levelManager.currentLevel.id;
    this.gameState.coins = Number.isFinite(savedData.coins) ? savedData.coins : this.levelManager.currentLevel.initialCoins;
    this.gameState.purchasedBlocks = Array.isArray(savedData.purchasedBlocks) ? [...savedData.purchasedBlocks] : [];
    this.gameState.dronePrograms = normalizeDronePrograms(savedData.dronePrograms, savedData.programBlocks);
    this.gameState.programBlocks = this.gameState.dronePrograms[0];
    this.gameState.highestUnlockedLevel = savedData.highestUnlockedLevel ?? this.gameState.currentLevel;
    this.gameState.completedLevels = Array.isArray(savedData.completedLevels) ? [...savedData.completedLevels] : [];
    this.gameState.mainGameStarted = savedData.mainGameStarted === true;
    this.gameState.cropInventory = normalizeCropInventory(savedData.cropInventory);
    this.gameState.cropPrices = normalizeCropPrices(savedData.cropPrices);
    this.gameState.nextMarketPriceUpdateAt = Number.isFinite(savedData.nextMarketPriceUpdateAt)
      ? savedData.nextMarketPriceUpdateAt
      : Date.now() + MARKET_PRICE_UPDATE_INTERVAL_MS;
    this.gameState.upgradePurchases = normalizeUpgradePurchases(savedData.upgradePurchases);
    this.gameState.droneCount = normalizeDroneCount(savedData.droneCount);
    this.gameState.selectedDroneIndex = normalizeSelectedDroneIndex(
      savedData.selectedDroneIndex,
      this.gameState.droneCount,
    );
    this.gameState.extraDronePositions = normalizeExtraDronePositions(
      savedData.extraDronePositions,
      this.gameState.droneCount,
      null,
      null,
    );
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
    this.droneRunStates = [];
    this.blockProgram.clear();
    this.gameState.currentLevel = level.id;
    this.gameState.levelComplete = false;
    this.gameState.harvestedWheatCount = 0;
    this.gameState.cropInventory = createDefaultCropInventory();
    this.gameState.unlockedBlocks = [...level.unlockedBlocks];
    this.gameState.dronePrograms = [this.gameState.programBlocks];
    this.gameState.selectedDroneIndex = 0;
    this.gameState.upgradePurchases = {};
    this.gameState.droneCount = 1;
    this.gameState.extraDronePositions = [];
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

  addLand() {
    if (!this.gameState.mainGameStarted) {
      return { ok: false, message: '땅 추가는 본 게임에서 사용할 수 있습니다.' };
    }

    {
      const result = this.world.addSoilInSequence(MAX_MAIN_WORLD_SIZE);

      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      return { ok: true, message: `땅을 (${result.x}, ${result.y})에 추가했습니다.` };
    }

  }

  addDrone() {
    if (!this.gameState.mainGameStarted) {
      return { ok: false, message: '드론 추가는 본 게임에서 사용할 수 있습니다.' };
    }

    if (normalizeDroneCount(this.gameState.droneCount) >= MAX_DRONE_COUNT) {
      return { ok: false, message: `드론은 최대 ${MAX_DRONE_COUNT}개까지 생성할 수 있습니다.` };
    }

    this.gameState.droneCount = normalizeDroneCount(this.gameState.droneCount) + 1;
    this.ensureDronePrograms();
    this.gameState.extraDronePositions = normalizeExtraDronePositions(
      this.gameState.extraDronePositions,
      this.gameState.droneCount,
      this.world,
      this.robot,
    );
    this.syncExtraRobotsFromState();
    return { ok: true, message: '드론을 추가로 생성했습니다.' };
  }

  sellCrop(cropId) {
    const crop = CROPS[cropId];
    const count = this.gameState.cropInventory[cropId] ?? 0;

    if (!crop || count <= 0) {
      this.ui.addLog('판매할 농작물이 없습니다.');
      return;
    }

    const price = this.gameState.cropPrices[cropId] ?? crop.baseSellPrice;
    this.gameState.cropInventory[cropId] = count - 1;
    this.gameState.coins += price;
    this.ui.updateStats(this.gameState);
    this.sellPanel.render();
    this.ui.addLog(`${crop.name} 1개를 ${price}코인에 판매했습니다.`);
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
    this.droneRunStates = [];
    this.renderPanels();
    this.ui.addLog('프로그램을 비웠습니다.');
  }

  renderPanels() {
    const canAdvance = this.canAdvanceFromCurrentLevel();
    this.shopPanel.render();
    this.programPanel.render();
    this.sellPanel.render();

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

    if (!this.loadAllDronePrograms()) {
      return;
    }

    this.setState(GAME_STATE.RUNNING);
    this.ui.addLog('프로그램 실행을 시작합니다.');
  }

  step() {
    this.executor.robot = this.getSelectedRobot();
    if (this.getSelectedRobot()?.isAnimating || this.activeCommand) return;

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
      this.droneRunStates = [];
      this.syncExtraDronePositionsFromRobots({ force: true });
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
    this.gameState.upgradePurchases = {};
    this.gameState.droneCount = 1;
    this.gameState.extraDronePositions = [];
    this.gameState.cropInventory = createDefaultCropInventory();
    this.gameState.cropPrices = createDefaultCropPrices();
    this.gameState.nextMarketPriceUpdateAt = Date.now() + MARKET_PRICE_UPDATE_INTERVAL_MS;
    this.gameState.logs = [];
    this.ui.logs = this.gameState.logs;
    this.applyLevel(this.levelManager.goToLevel(0), { save: false });
    this.ui.addLog('전체 진행 상황을 초기화했습니다.');
  }

  startMainGame(options = {}) {
    this.world.loadGrid(normalizeMainWorldGrid(options.worldGridOverride));
    const robotPosition = normalizeRobotPosition(options.robotPositionOverride, this.world);
    this.robot.reset(robotPosition);
    this.queue.clear();
    this.activeCommand = null;
    this.blockProgram.clear();
    this.gameState.mainGameStarted = true;
    this.gameState.currentLevel = 'main';
    this.gameState.levelComplete = false;
    this.gameState.harvestedWheatCount = 0;
    this.gameState.cropInventory = normalizeCropInventory(options.cropInventoryOverride);
    this.gameState.purchasedBlocks = normalizeMainGamePurchasedBlocks(options.purchasedBlocksOverride);
    this.gameState.dronePrograms = normalizeDronePrograms(options.droneProgramsOverride, this.gameState.programBlocks);
    this.gameState.programBlocks = this.gameState.dronePrograms[0];
    this.gameState.upgradePurchases = normalizeUpgradePurchases(options.upgradePurchasesOverride);
    this.gameState.droneCount = normalizeDroneCount(options.droneCountOverride);
    this.gameState.selectedDroneIndex = normalizeSelectedDroneIndex(
      options.selectedDroneIndexOverride,
      this.gameState.droneCount,
    );
    this.ensureDronePrograms();
    this.gameState.extraDronePositions = normalizeExtraDronePositions(
      options.extraDronePositionsOverride,
      this.gameState.droneCount,
      this.world,
      this.robot,
    );
    this.syncExtraRobotsFromState();
    this.gameState.unlockedBlocks = [
      'move',
      'turn_left',
      'turn_right',
      'plant_wheat',
      'wait',
      'harvest',
      'repeat_5',
      'if_crop_ready',
      'add_land',
      'add_drone',
    ];
    this.economy.setCoins(options.coinsOverride ?? MAIN_GAME_INITIAL_COINS);
    this.blockShop.ensureFreeBlocksOwned();
    this.setState(GAME_STATE.STOPPED);
    this.ui.updateStats(this.gameState);
    this.renderPanels();
    this.ui.addLog('본 게임을 시작했습니다. 10000코인을 모아보세요.');

    if (options.save !== false) {
      this.saveProgress();
    }
  }

  loadAllDronePrograms() {
    this.ensureDronePrograms();
    this.syncExtraRobotsFromState();
    this.droneRunStates = [];

    for (let droneIndex = 0; droneIndex < this.gameState.droneCount; droneIndex += 1) {
      const result = this.blockProgram.toCommandsForDrone(droneIndex);

      if (!result.ok) {
        this.ui.addLog(`드론 ${droneIndex + 1}: ${result.message}`);
        this.droneRunStates = [];
        return false;
      }

      if (result.commands.length === 0) {
        continue;
      }

      const queue = new CommandQueue();
      for (const command of result.commands) {
        queue.push({ ...command });
      }

      this.droneRunStates.push({
        droneIndex,
        robot: droneIndex === 0 ? this.robot : this.extraRobots[droneIndex - 1],
        queue,
        activeCommand: null,
        lastTick: 0,
        done: false,
      });
    }

    if (this.droneRunStates.length === 0) {
      this.ui.addLog('실행할 드론 프로그램이 없습니다.');
      return false;
    }

    return true;
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
    this.executor.robot = this.getSelectedRobot();
    if (this.getSelectedRobot()?.isAnimating || this.activeCommand) return;

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

  executeDroneRunState(runState, time) {
    if (runState.done || runState.robot?.isAnimating || runState.activeCommand) return;

    if (runState.queue.isEmpty()) {
      runState.done = true;
      return;
    }

    this.executor.robot = runState.robot;
    const command = runState.queue.pop();
    const result = this.executor.execute(command, time);

    if (result.status === 'waiting') {
      runState.activeCommand = {
        type: 'wait',
        endsAt: result.endsAt,
      };
    } else if (result.status === 'enqueue') {
      runState.queue.insertFront(result.commands);
    } else if (result.status === 'error') {
      runState.done = true;
      this.setState(GAME_STATE.ERROR);
    }

    if (!runState.activeCommand && runState.queue.isEmpty()) {
      runState.done = true;
    }
  }

  updateDroneRunStates(time) {
    if (this.state !== GAME_STATE.RUNNING) return;

    for (const runState of this.droneRunStates) {
      if (
        !runState.done &&
        !runState.robot?.isAnimating &&
        !runState.activeCommand &&
        time - runState.lastTick >= this.tickInterval
      ) {
        this.executeDroneRunState(runState, time);
        runState.lastTick = time;
      }
    }

    if (this.droneRunStates.length > 0 && this.droneRunStates.every((runState) => runState.done)) {
      this.finishProgram();
    }
  }

  update(time) {
    this.robot.update(time);
    for (const robot of this.extraRobots) {
      robot.update(time);
    }
    this.syncExtraDronePositionsFromRobots();
    this.world.updateAllCrops(time);
    this.updateActiveCommand(time);
    this.updateDroneActiveCommands(time);
    this.updateMarketPrices(Date.now());

    this.updateDroneRunStates(time);

    this.checkLevelComplete();
    this.render();
    requestAnimationFrame((nextTime) => this.update(nextTime));
  }

  updateMarketPrices(now) {
    if (now < this.gameState.nextMarketPriceUpdateAt) {
      if (now - this.lastSellPanelRenderAt >= 1000) {
        this.sellPanel.render(now);
        this.lastSellPanelRenderAt = now;
      }
      return;
    }

    const previousWheatPrice = this.gameState.cropPrices.wheat;
    this.randomizeCropPrices();
    this.gameState.nextMarketPriceUpdateAt = now + MARKET_PRICE_UPDATE_INTERVAL_MS;
    this.lastSellPanelRenderAt = now;
    this.sellPanel.render(now);
    this.saveProgress();

    if (this.gameState.cropPrices.wheat > previousWheatPrice) {
      this.ui.addLog(`밀 시세가 ${this.gameState.cropPrices.wheat}코인으로 올랐습니다.`);
    } else if (this.gameState.cropPrices.wheat < previousWheatPrice) {
      this.ui.addLog(`밀 시세가 ${this.gameState.cropPrices.wheat}코인으로 내려갔습니다.`);
    }
  }

  randomizeCropPrices() {
    for (const cropId of Object.keys(CROPS)) {
      const currentPrice = this.gameState.cropPrices[cropId] ?? CROPS[cropId].baseSellPrice;
      const riseChance = getCropPriceRiseChance(currentPrice);
      const direction = Math.random() < riseChance ? 1 : -1;
      const step = Math.floor(Math.random() * MARKET_PRICE_MAX_STEP) + 1;
      const nextPrice = currentPrice + direction * step;
      this.gameState.cropPrices[cropId] = Math.max(
        MIN_CROP_PRICE,
        Math.min(MAX_CROP_PRICE, nextPrice),
      );
    }
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

  updateDroneActiveCommands(time) {
    for (const runState of this.droneRunStates) {
      if (!runState.activeCommand) continue;

      if (time >= runState.activeCommand.endsAt) {
        runState.activeCommand = null;
        runState.lastTick = time;

        if (runState.queue.isEmpty()) {
          runState.done = true;
        }
      }
    }
  }

  finishProgram() {
    if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.PAUSED) {
      this.setState(GAME_STATE.STOPPED);
    }

    this.syncExtraDronePositionsFromRobots({ force: true });
    this.droneRunStates = [];
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
      this.droneRunStates = [];
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
    if (this.draggingDroneIndex !== 0) {
      this.renderer.renderRobot(this.robot, this.gameState.selectedDroneIndex === 0);
    }
    this.renderer.renderExtraDrones(
      this.world,
      this.robot,
      this.gameState.droneCount,
      this.gameState.extraDronePositions,
      this.draggingDroneIndex,
      this.extraRobots,
      this.gameState.selectedDroneIndex,
    );
  }

  saveProgress() {
    if (this.gameState.mainGameStarted) {
      this.ensureDronePrograms();
      this.syncExtraDronePositionsFromRobots({ force: true });
      this.gameState.mainWorldGrid = this.world.serializeGrid();
      this.gameState.robotPosition = {
        x: this.robot.gridX,
        y: this.robot.gridY,
        direction: this.robot.dir,
      };
      this.gameState.extraDronePositions = normalizeExtraDronePositions(
        this.gameState.extraDronePositions,
        this.gameState.droneCount,
        this.world,
        this.robot,
      );
    }

    this.storage.save(this.gameState);
  }
}

function createDefaultCropInventory() {
  return Object.fromEntries(Object.keys(CROPS).map((cropId) => [cropId, 0]));
}

function createDefaultCropPrices() {
  return Object.fromEntries(
    Object.entries(CROPS).map(([cropId, crop]) => [cropId, crop.baseSellPrice]),
  );
}

function normalizeCropInventory(savedInventory = {}) {
  const inventory = createDefaultCropInventory();

  for (const cropId of Object.keys(inventory)) {
    const savedCount = savedInventory?.[cropId];
    inventory[cropId] = Number.isFinite(savedCount) ? Math.max(0, savedCount) : 0;
  }

  return inventory;
}

function normalizeCropPrices(savedPrices = {}) {
  const prices = createDefaultCropPrices();

  for (const cropId of Object.keys(prices)) {
    const savedPrice = savedPrices?.[cropId];
    prices[cropId] = Number.isFinite(savedPrice)
      ? Math.max(MIN_CROP_PRICE, Math.min(MAX_CROP_PRICE, savedPrice))
      : prices[cropId];
  }

  return prices;
}

function getCropPriceRiseChance(currentPrice) {
  if (currentPrice >= MAX_CROP_PRICE - 1) return 0.12;
  if (currentPrice >= MAX_CROP_PRICE - 3) return 0.25;
  if (currentPrice >= MAX_CROP_PRICE - 5) return 0.38;
  return 0.5;
}

function normalizeUpgradePurchases(savedPurchases = {}) {
  return Object.fromEntries(
    Object.entries(savedPurchases ?? {})
      .filter(([, count]) => Number.isFinite(count) && count > 0)
      .map(([blockId, count]) => [blockId, Math.floor(count)]),
  );
}

function normalizeDroneCount(savedCount = 1) {
  return Number.isFinite(savedCount) ? Math.max(1, Math.floor(savedCount)) : 1;
}

function normalizeSelectedDroneIndex(savedIndex = 0, droneCount = 1) {
  const maxIndex = Math.max(0, normalizeDroneCount(droneCount) - 1);
  return Number.isFinite(savedIndex)
    ? Math.max(0, Math.min(maxIndex, Math.floor(savedIndex)))
    : 0;
}

function normalizeDronePrograms(savedPrograms = null, fallbackProgramBlocks = [], droneCount = 1) {
  const count = normalizeDroneCount(droneCount);
  const programs = Array.from({ length: count }, () => []);

  if (Array.isArray(savedPrograms)) {
    for (let index = 0; index < Math.min(savedPrograms.length, count); index += 1) {
      programs[index] = Array.isArray(savedPrograms[index])
        ? savedPrograms[index]
        : [];
    }
  } else if (Array.isArray(fallbackProgramBlocks)) {
    programs[0] = fallbackProgramBlocks;
  }

  return programs;
}

function normalizeExtraDronePositions(savedPositions = [], droneCount = 1, world = null, robot = null) {
  const extraCount = Math.max(0, normalizeDroneCount(droneCount) - 1);
  const positions = [];
  const saved = Array.isArray(savedPositions) ? savedPositions : [];
  const occupiedPositions = robot ? [{ x: robot.gridX, y: robot.gridY }] : [];

  for (let index = 0; index < extraCount; index += 1) {
    const savedPosition = saved[index];
    const normalizedSavedPosition = normalizeGridPosition(savedPosition, world);
    const isOverlappingMainDrone = occupiedPositions.some((position) => (
      normalizedSavedPosition &&
      position.x === normalizedSavedPosition.x &&
      position.y === normalizedSavedPosition.y
    ));
    const isOverlappingExtraDrone = positions.some((position) => (
      normalizedSavedPosition &&
      position.x === normalizedSavedPosition.x &&
      position.y === normalizedSavedPosition.y
    ));

    const nextPosition = normalizedSavedPosition && !isOverlappingMainDrone && !isOverlappingExtraDrone
      ? normalizedSavedPosition
      : findDefaultExtraDronePosition(world, [...occupiedPositions, ...positions]);
    positions.push(nextPosition);
  }

  return positions;
}

function normalizeGridPosition(position, world = null) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return null;
  }

  const x = Math.floor(position.x);
  const y = Math.floor(position.y);
  if (world && world.getTile(x, y)?.type !== 'soil') {
    return null;
  }

  return { x, y };
}

function findDefaultExtraDronePosition(world, occupiedPositions = []) {
  if (!world) return { x: 0, y: 0 };

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      const tile = world.getTile(x, y);
      const isOccupied = occupiedPositions.some((position) => position.x === x && position.y === y);
      if (tile?.type === 'soil' && !isOccupied) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: 0 };
}

function normalizeMainGamePurchasedBlocks(savedBlocks = []) {
  const purchasedBlocks = Array.isArray(savedBlocks) ? [...savedBlocks] : [];

  for (const blockId of MAIN_GAME_STARTER_BLOCK_IDS) {
    if (!purchasedBlocks.includes(blockId)) {
      purchasedBlocks.push(blockId);
    }
  }

  return purchasedBlocks;
}

function normalizeRobotPosition(savedPosition, world) {
  const fallback = { x: 0, y: 0, direction: 'east' };
  if (!savedPosition) return fallback;

  const x = Number.isFinite(savedPosition.x) ? savedPosition.x : fallback.x;
  const y = Number.isFinite(savedPosition.y) ? savedPosition.y : fallback.y;
  const tile = world.getTile(x, y);

  if (tile?.type !== 'soil') {
    return fallback;
  }

  return {
    x,
    y,
    direction: Number.isFinite(savedPosition.direction) ? savedPosition.direction : fallback.direction,
  };
}

function normalizeMainWorldGrid(savedGrid) {
  const grid = Array.from({ length: MAX_MAIN_WORLD_SIZE }, () => (
    Array.from({ length: MAX_MAIN_WORLD_SIZE }, () => 'empty')
  ));
  grid[0][0] = 'soil';

  if (!Array.isArray(savedGrid)) {
    return grid;
  }

  for (let y = 0; y < Math.min(savedGrid.length, MAX_MAIN_WORLD_SIZE); y += 1) {
    const row = savedGrid[y];
    if (!Array.isArray(row)) continue;

    for (let x = 0; x < Math.min(row.length, MAX_MAIN_WORLD_SIZE); x += 1) {
      grid[y][x] = row[x] === 'soil' ? 'soil' : 'empty';
    }
  }

  grid[0][0] = 'soil';
  return grid;
}
