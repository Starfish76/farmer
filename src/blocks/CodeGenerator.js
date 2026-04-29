import { getBlockDefinition } from './BlockDefinitions.js';

export class CodeGenerator {
  generate(programBlocks) {
    if (programBlocks.length === 0) {
      return '# Add blocks to build a program';
    }

    return this.generateBlocks(programBlocks).join('\n');
  }

  generateBlocks(programBlocks, depth = 0) {
    const lines = [];
    const indent = '    '.repeat(depth);

    for (const programBlock of programBlocks) {
      const definition = getBlockDefinition(programBlock.blockId);
      if (!definition) continue;

      lines.push(`${indent}${definition.codePreview}`);

      if (definition.hasChildren) {
        const children = programBlock.children ?? [];
        if (children.length === 0) {
          lines.push(`${indent}    pass`);
        } else {
          lines.push(...this.generateBlocks(children, depth + 1));
        }
      }
    }

    return lines;
  }
}
