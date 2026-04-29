import { getBlockDefinition } from './BlockDefinitions.js';

const MAX_COMMANDS = 200;

export class BlockProgram {
  constructor(gameState) {
    this.gameState = gameState;
  }

  addBlock(blockId) {
    const block = getBlockDefinition(blockId);
    if (!block) return false;

    const container = this.getSelectedContainer();
    container.push(createProgramBlock(blockId));
    return true;
  }

  selectContainer(programBlockId) {
    const programBlock = this.findBlock(programBlockId);
    if (!programBlock) return false;

    const definition = getBlockDefinition(programBlock.blockId);
    if (!definition?.hasChildren) return false;

    this.gameState.selectedContainerId = programBlockId;
    return true;
  }

  selectMainProgram() {
    this.gameState.selectedContainerId = null;
  }

  getSelectedContainerLabel() {
    const selected = this.findBlock(this.gameState.selectedContainerId);
    if (!selected) return 'Main Program';

    const definition = getBlockDefinition(selected.blockId);
    return definition?.name ?? 'Main Program';
  }

  moveUp(programBlockId) {
    const location = this.findLocation(programBlockId);
    if (!location || location.index <= 0) return;

    const [block] = location.container.splice(location.index, 1);
    location.container.splice(location.index - 1, 0, block);
  }

  moveDown(programBlockId) {
    const location = this.findLocation(programBlockId);
    if (!location || location.index >= location.container.length - 1) return;

    const [block] = location.container.splice(location.index, 1);
    location.container.splice(location.index + 1, 0, block);
  }

  remove(programBlockId) {
    const location = this.findLocation(programBlockId);
    if (!location) return;

    location.container.splice(location.index, 1);
    if (this.gameState.selectedContainerId === programBlockId) {
      this.selectMainProgram();
    }
  }

  clear() {
    this.gameState.programBlocks.length = 0;
    this.selectMainProgram();
  }

  toCommands(maxCommands = MAX_COMMANDS) {
    const commands = [];
    const result = this.flattenBlocks(this.gameState.programBlocks, commands, maxCommands);

    if (!result.ok) {
      return result;
    }

    return { ok: true, commands };
  }

  flattenBlocks(programBlocks, commands, maxCommands) {
    for (const programBlock of programBlocks) {
      const definition = getBlockDefinition(programBlock.blockId);
      if (!definition) continue;

      if (definition.hasChildren) {
        for (let repeatIndex = 0; repeatIndex < definition.repeatCount; repeatIndex += 1) {
          const result = this.flattenBlocks(programBlock.children, commands, maxCommands);
          if (!result.ok) return result;
        }
      } else {
        commands.push({ type: definition.commandType });
      }

      if (commands.length > maxCommands) {
        return { ok: false, message: 'Too many commands. Try a shorter program.' };
      }
    }

    return { ok: true, commands };
  }

  getBlocks() {
    return this.decorateBlocks(this.gameState.programBlocks);
  }

  decorateBlocks(programBlocks) {
    return programBlocks
      .map((programBlock) => ({
        ...programBlock,
        definition: getBlockDefinition(programBlock.blockId),
        children: this.decorateBlocks(programBlock.children ?? []),
      }))
      .filter((programBlock) => programBlock.definition);
  }

  getSelectedContainer() {
    const selected = this.findBlock(this.gameState.selectedContainerId);
    return selected?.children ?? this.gameState.programBlocks;
  }

  findBlock(programBlockId, blocks = this.gameState.programBlocks) {
    if (!programBlockId) return null;

    for (const block of blocks) {
      if (block.id === programBlockId) return block;

      const found = this.findBlock(programBlockId, block.children ?? []);
      if (found) return found;
    }

    return null;
  }

  findLocation(programBlockId, container = this.gameState.programBlocks) {
    for (let index = 0; index < container.length; index += 1) {
      const block = container[index];
      if (block.id === programBlockId) {
        return { container, index, block };
      }

      const found = this.findLocation(programBlockId, block.children ?? []);
      if (found) return found;
    }

    return null;
  }
}

function createProgramBlock(blockId) {
  return {
    id: createProgramBlockId(),
    blockId,
    children: [],
  };
}

function createProgramBlockId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `program-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
