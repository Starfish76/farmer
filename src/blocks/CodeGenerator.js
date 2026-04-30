import { getBlockDefinition } from './BlockDefinitions.js';

export class CodeGenerator {
  generate(programBlocks) {
    if (programBlocks.length === 0) {
      return '# 블록을 추가해서 프로그램을 만드세요';
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
