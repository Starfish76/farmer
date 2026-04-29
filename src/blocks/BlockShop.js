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
      return { ok: false, message: `Unknown block: ${blockId}` };
    }

    if (this.isPurchased(blockId)) {
      return { ok: true, message: `${block.name} already owned.` };
    }

    if (this.gameState.coins < block.cost) {
      return { ok: false, message: `Not enough coins for ${block.name}.` };
    }

    this.gameState.coins -= block.cost;
    this.gameState.purchasedBlocks.push(blockId);
    return { ok: true, message: `Purchased ${block.name}.` };
  }

  isPurchased(blockId) {
    return this.gameState.purchasedBlocks.includes(blockId);
  }

  getShopBlocks() {
    return this.availableBlocks;
  }

  getOwnedBlocks() {
    return this.gameState.purchasedBlocks
      .map((blockId) => getBlockDefinition(blockId))
      .filter(Boolean);
  }

  purchaseFreeBlock(blockId) {
    if (!this.isPurchased(blockId)) {
      this.gameState.purchasedBlocks.push(blockId);
    }
  }
}

