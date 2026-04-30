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
    if (!selected) return '메인 프로그램';

    const definition = getBlockDefinition(selected.blockId);
    return definition?.name ?? '메인 프로그램';
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
    const validation = this.validateChildren(this.gameState.programBlocks);
    if (!validation.ok) {
      return validation;
    }

    const estimatedCount = this.estimateCommandCount(this.gameState.programBlocks);

    if (estimatedCount > maxCommands) {
      return { ok: false, message: '명령이 너무 많습니다. 더 짧은 프로그램을 만들어 주세요.' };
    }

    return {
      ok: true,
      commands: this.buildCommands(this.gameState.programBlocks),
      estimatedCount,
    };
  }

  validateChildren(programBlocks) {
    for (const programBlock of programBlocks) {
      const definition = getBlockDefinition(programBlock.blockId);
      if (!definition) continue;

      if (definition.hasChildren && (programBlock.children ?? []).length === 0) {
        return { ok: false, message: `${definition.name} 안에 실행할 블록이 없습니다.` };
      }

      const childValidation = this.validateChildren(programBlock.children ?? []);
      if (!childValidation.ok) return childValidation;
    }

    return { ok: true };
  }

  buildCommands(programBlocks) {
    const commands = [];

    for (const programBlock of programBlocks) {
      const definition = getBlockDefinition(programBlock.blockId);
      if (!definition) continue;

      if (definition.repeatCount) {
        commands.push({
          type: 'repeat',
          count: definition.repeatCount,
          children: this.buildCommands(programBlock.children ?? []),
        });
      } else if (definition.conditionType) {
        commands.push({
          type: 'if',
          conditionType: definition.conditionType,
          children: this.buildCommands(programBlock.children ?? []),
        });
      } else {
        commands.push({ type: definition.commandType });
      }
    }

    return commands;
  }

  estimateCommandCount(programBlocks) {
    let count = 0;

    for (const programBlock of programBlocks) {
      const definition = getBlockDefinition(programBlock.blockId);
      if (!definition) continue;

      if (definition.repeatCount) {
        count += definition.repeatCount * this.estimateCommandCount(programBlock.children ?? []);
      } else if (definition.conditionType) {
        count += this.estimateCommandCount(programBlock.children ?? []);
      } else {
        count += 1;
      }
    }

    return count;
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
