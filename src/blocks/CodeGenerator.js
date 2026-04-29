import { getBlockDefinition } from './BlockDefinitions.js';

export class CodeGenerator {
  generate(programBlocks) {
    if (programBlocks.length === 0) {
      return '# Add blocks to build a program';
    }

    return programBlocks
      .map((programBlock) => getBlockDefinition(programBlock.blockId)?.codePreview)
      .filter(Boolean)
      .join('\n');
  }
}

