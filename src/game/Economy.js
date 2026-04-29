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

  reward({ coins = 0, score = 0 }) {
    this.gameState.coins += coins;
    this.gameState.score += score;
  }
}

