import { BLOCK_DEFINITIONS, FREE_BLOCK_IDS, getBlockDefinition } from './BlockDefinitions.js';

export class BlockShop {
  constructor(gameState, effects = {}) {
    this.gameState = gameState;
    this.effects = effects;
    this.availableBlocks = BLOCK_DEFINITIONS;

    for (const blockId of FREE_BLOCK_IDS) {
      this.purchaseFreeBlock(blockId);
    }
  }

  purchase(blockId) {
    const block = getBlockDefinition(blockId);

    if (!block) {
      return { ok: false, message: `존재하지 않는 블록입니다: ${blockId}` };
    }

    if (!this.isUnlocked(blockId)) {
      return { ok: false, message: `${block.name} 블록은 아직 사용할 수 없습니다.` };
    }

    const cost = this.getCost(blockId);

    if (block.repeatable) {
      return this.purchaseRepeatable(block, cost);
    }

    if (this.isPurchased(blockId)) {
      return { ok: true, message: `${block.name} 블록은 이미 보유 중입니다.` };
    }

    if (this.gameState.coins < cost) {
      return { ok: false, message: `${block.name} 블록을 구매하기에는 코인이 부족합니다.` };
    }

    this.gameState.coins -= cost;
    this.gameState.purchasedBlocks.push(blockId);
    return { ok: true, message: `${block.name} 블록을 구매했습니다.` };
  }

  purchaseRepeatable(block, cost) {
    if (this.gameState.coins < cost) {
      return { ok: false, message: `${block.name} 구매에 필요한 코인이 부족합니다.` };
    }

    const applyEffect = this.effects[block.shopEffect];
    const effectResult = applyEffect ? applyEffect(block) : { ok: true };

    if (!effectResult.ok) {
      return { ok: false, message: effectResult.message ?? `${block.name}을(를) 구매할 수 없습니다.` };
    }

    this.gameState.coins -= cost;
    this.gameState.upgradePurchases[block.id] = this.getPurchaseCount(block.id) + 1;
    return { ok: true, message: effectResult.message ?? `${block.name}을(를) 구매했습니다.` };
  }

  isPurchased(blockId) {
    const block = getBlockDefinition(blockId);
    if (block?.repeatable) return false;
    return this.gameState.purchasedBlocks.includes(blockId);
  }

  getCost(blockId) {
    const block = getBlockDefinition(blockId);
    if (!block) return 0;
    if (!block.repeatable) return block.cost;

    const count = this.getPurchaseCount(blockId);
    return Math.round(block.cost * (block.costGrowth ** count));
  }

  getPurchaseCount(blockId) {
    return this.gameState.upgradePurchases?.[blockId] ?? 0;
  }

  getShopBlocks() {
    return this.availableBlocks.filter((block) => this.isUnlocked(block.id));
  }

  getOwnedBlocks() {
    return this.gameState.purchasedBlocks
      .map((blockId) => getBlockDefinition(blockId))
      .filter(Boolean)
      .filter((block) => !block.repeatable && block.commandType)
      .filter((block) => this.isUnlocked(block.id));
  }

  purchaseFreeBlock(blockId) {
    if (!this.isPurchased(blockId)) {
      this.gameState.purchasedBlocks.push(blockId);
    }
  }

  ensureFreeBlocksOwned() {
    for (const blockId of FREE_BLOCK_IDS) {
      this.purchaseFreeBlock(blockId);
    }
  }

  isUnlocked(blockId) {
    const unlockedBlocks = this.gameState.unlockedBlocks ?? [];
    return FREE_BLOCK_IDS.includes(blockId) || unlockedBlocks.includes(blockId);
  }
}
