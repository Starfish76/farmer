export class Economy {
  constructor(gameState) {
    this.gameState = gameState;
  }

  setCoins(coins) {
    this.gameState.coins = coins;
  }

  canAfford(cost) {
    return this.gameState.coins >= cost;
  }

  spend(cost) {
    if (!this.canAfford(cost)) return false;
    this.gameState.coins -= cost;
    return true;
  }
}
