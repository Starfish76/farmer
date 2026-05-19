const STORAGE_KEY = 'codeFarmLab.save.v1';

export class StorageManager {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to load save data.', error);
      return null;
    }
  }

  save(gameState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentLevel: gameState.currentLevel,
        coins: gameState.coins,
        cropInventory: gameState.cropInventory,
        cropPrices: gameState.cropPrices,
        nextMarketPriceUpdateAt: gameState.nextMarketPriceUpdateAt,
        purchasedBlocks: gameState.purchasedBlocks,
        highestUnlockedLevel: gameState.highestUnlockedLevel,
        completedLevels: gameState.completedLevels,
        mainGameStarted: gameState.mainGameStarted,
      }));
    } catch (error) {
      console.warn('Failed to save game data.', error);
    }
  }

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear save data.', error);
    }
  }
}
