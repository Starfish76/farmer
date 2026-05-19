const LEVEL_1_GRID = [
  ['soil', 'soil', 'soil'],
  ['soil', 'soil', 'soil'],
];

const LEVEL_2_GRID = [
  ['soil', 'soil', 'soil'],
];

const LEVEL_3_GRID = [
  ['soil', 'soil'],
];

const LEVEL_4_GRID = [
  ['soil', 'soil', 'soil', 'soil', 'soil'],
];

const LEVEL_5_GRID = [
  ['soil', 'soil', 'soil', 'soil', 'soil'],
];

export const LEVELS = [
  {
    id: 1,
    title: 'Level 1: First Steps',
    description: 'Move the drone to the target tile.',
    mission: 'Move the drone to the target tile.',
    learningGoal: 'Learn function calls and ordered execution.',
    pythonConcept: 'Each block is like a function call that runs one command.',
    initialCoins: 20,
    grid: LEVEL_1_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { x: 2, y: 1 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right'],
    winConditionType: 'reach_target',
    hint: 'Use move() and turn_right() in the right order.',
    requiredBlocks: ['move()', 'turn_left()', 'turn_right()'],
  },
  {
    id: 2,
    title: 'Level 2: Plant Wheat',
    description: 'Plant wheat on three tiles.',
    mission: 'Plant wheat on three tiles.',
    learningGoal: 'Learn farming commands and command order.',
    pythonConcept: 'plant("wheat") calls a function with a value.',
    initialCoins: 20,
    grid: LEVEL_2_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 3 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat'],
    winConditionType: 'plant_wheat',
    hint: 'Plant wheat first, then move to the next tile.',
    requiredBlocks: ['move()', 'plant("wheat")'],
  },
  {
    id: 3,
    title: 'Level 3: Grow and Harvest',
    description: 'Grow and harvest two wheat crops.',
    mission: 'Grow and harvest two wheat crops.',
    learningGoal: 'Learn waiting, crop growth, and harvesting.',
    pythonConcept: 'Objects can change state over time. Wheat takes 5 seconds to grow.',
    initialCoins: 35,
    grid: LEVEL_3_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 2 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat', 'wait', 'harvest'],
    winConditionType: 'harvest_wheat',
    hint: 'Use wait(1) several times before harvest().',
    requiredBlocks: ['plant("wheat")', 'wait(1)', 'harvest()'],
  },
  {
    id: 4,
    title: 'Level 4: Repeat Automation',
    description: 'Plant wheat on five tiles.',
    mission: 'Plant wheat on five tiles.',
    learningGoal: 'Use a for loop to repeat a group of commands.',
    pythonConcept: 'A for loop runs the same block of code multiple times.',
    initialCoins: 50,
    grid: LEVEL_4_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 5 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat', 'repeat_5'],
    winConditionType: 'plant_wheat',
    hint: 'Put plant("wheat") and move() inside Repeat 5.',
    requiredBlocks: ['for i in range(5):', 'plant("wheat")', 'move()'],
  },
  {
    id: 5,
    title: 'Level 5: Harvest Algorithm',
    description: 'Harvest all grown wheat with a condition inside a loop.',
    mission: 'Harvest all grown wheat.',
    learningGoal: 'Combine conditions and loops.',
    pythonConcept: 'Conditions inside loops let an algorithm react to the current state.',
    initialCoins: 100,
    grid: LEVEL_5_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: {
      cropPositions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ],
    },
    initialCrops: [
      { x: 0, y: 0, type: 'wheat', stage: 'grown' },
      { x: 1, y: 0, type: 'wheat', stage: 'grown' },
      { x: 2, y: 0, type: 'wheat', stage: 'grown' },
      { x: 3, y: 0, type: 'wheat', stage: 'grown' },
      { x: 4, y: 0, type: 'wheat', stage: 'grown' },
    ],
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'water', 'harvest', 'repeat_5', 'if_crop_ready'],
    winConditionType: 'harvest_all_target_crops',
    hint: 'Use if crop_ready() to harvest, then move to the next tile.',
    requiredBlocks: ['for i in range(5):', 'if crop_ready():', 'harvest()', 'move()'],
  },
];
