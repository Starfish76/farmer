import { getBlockDefinition } from './BlockDefinitions.js';

export class BlockProgram {
  constructor(gameState) {
    this.gameState = gameState;
  }

  addBlock(blockId) {
    const block = getBlockDefinition(blockId);
    if (!block) return false;

    this.gameState.programBlocks.push({
      id: createProgramBlockId(),
      blockId,
    });

    return true;
  }

  moveUp(programBlockId) {
    const index = this.findIndex(programBlockId);
    if (index <= 0) return;

    const [block] = this.gameState.programBlocks.splice(index, 1);
    this.gameState.programBlocks.splice(index - 1, 0, block);
  }

  moveDown(programBlockId) {
    const index = this.findIndex(programBlockId);
    if (index < 0 || index >= this.gameState.programBlocks.length - 1) return;

    const [block] = this.gameState.programBlocks.splice(index, 1);
    this.gameState.programBlocks.splice(index + 1, 0, block);
  }

  remove(programBlockId) {
    const index = this.findIndex(programBlockId);
    if (index < 0) return;

    this.gameState.programBlocks.splice(index, 1);
  }

  clear() {
    this.gameState.programBlocks.length = 0;
  }

  toCommands() {
    return this.gameState.programBlocks
      .map((programBlock) => getBlockDefinition(programBlock.blockId))
      .filter(Boolean)
      .map((block) => ({ type: block.commandType }));
  }

  getBlocks() {
    return this.gameState.programBlocks
      .map((programBlock) => ({
        ...programBlock,
        definition: getBlockDefinition(programBlock.blockId),
      }))
      .filter((programBlock) => programBlock.definition);
  }

  findIndex(programBlockId) {
    return this.gameState.programBlocks.findIndex((block) => block.id === programBlockId);
  }
}

function createProgramBlockId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `program-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

