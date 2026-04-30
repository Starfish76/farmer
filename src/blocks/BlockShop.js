import { BLOCK_DEFINITIONS, FREE_BLOCK_IDS, getBlockDefinition } from './BlockDefinitions.js';

export class BlockShop {
  constructor(gameState) {
    this.gameState = gameState;
    this.availableBlocks = BLOCK_DEFINITIONS;

    for (const blockId of FREE_BLOCK_IDS) {
      this.purchaseFreeBlock(blockId);
    }
  }

  purchase(blockId) {
    const block = getBlockDefinition(blockId);

    if (!block) {
      return { ok: false, message: `알 수 없는 블록입니다: ${blockId}` };
    }

    if (this.isPurchased(blockId)) {
      return { ok: true, message: `${block.name} 블록은 이미 보유 중입니다.` };
    }

    if (!this.isUnlocked(blockId)) {
      return { ok: false, message: `${block.name} 블록은 이 레벨에서 아직 사용할 수 없습니다.` };
    }

    if (this.gameState.coins < block.cost) {
      return { ok: false, message: `${block.name} 블록을 구매하기에 코인이 부족합니다.` };
    }

    this.gameState.coins -= block.cost;
    this.gameState.purchasedBlocks.push(blockId);
    return { ok: true, message: `${block.name} 블록을 구매했습니다.` };
  }

  isPurchased(blockId) {
    return this.gameState.purchasedBlocks.includes(blockId);
  }

  getShopBlocks() {
    return this.availableBlocks.filter((block) => this.isUnlocked(block.id));
  }

  getOwnedBlocks() {
    return this.gameState.purchasedBlocks
      .map((blockId) => getBlockDefinition(blockId))
      .filter(Boolean)
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
