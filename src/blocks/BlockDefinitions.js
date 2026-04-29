export const BLOCK_DEFINITIONS = [
  {
    id: 'move',
    name: 'Move',
    category: 'Movement',
    cost: 0,
    description: 'Move the robot one tile forward.',
    codePreview: 'move()',
    commandType: 'move',
  },
  {
    id: 'turn_left',
    name: 'Turn Left',
    category: 'Movement',
    cost: 0,
    description: 'Rotate the robot 90 degrees to the left.',
    codePreview: 'turn_left()',
    commandType: 'turn_left',
  },
  {
    id: 'turn_right',
    name: 'Turn Right',
    category: 'Movement',
    cost: 0,
    description: 'Rotate the robot 90 degrees to the right.',
    codePreview: 'turn_right()',
    commandType: 'turn_right',
  },
  {
    id: 'wait',
    name: 'Wait',
    category: 'Utility',
    cost: 5,
    description: 'Pause the robot for one command turn.',
    codePreview: 'wait()',
    commandType: 'wait',
  },
];

export const FREE_BLOCK_IDS = BLOCK_DEFINITIONS
  .filter((block) => block.cost === 0)
  .map((block) => block.id);

export function getBlockDefinition(blockId) {
  return BLOCK_DEFINITIONS.find((block) => block.id === blockId);
}

