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
    title: '레벨 1: 첫걸음',
    description: '드론을 목표 타일까지 이동하세요.',
    mission: '드론을 목표 타일까지 이동하세요.',
    learningGoal: '함수 호출과 순서대로 실행되는 흐름을 익힙니다.',
    pythonConcept: '각 블록은 하나의 명령을 실행하는 함수 호출과 같습니다.',
    initialCoins: 20,
    grid: LEVEL_1_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { x: 2, y: 1 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right'],
    winConditionType: 'reach_target',
    hint: 'move()와 turn_right()를 알맞은 순서로 사용하세요.',
    requiredBlocks: ['move()', 'turn_left()', 'turn_right()'],
  },
  {
    id: 2,
    title: '레벨 2: 밀 심기',
    description: '세 개의 타일에 밀을 심으세요.',
    mission: '세 개의 타일에 밀을 심으세요.',
    learningGoal: '농사 명령과 명령 실행 순서를 익힙니다.',
    pythonConcept: 'plant("wheat")는 값을 넣어 함수를 호출하는 방식입니다.',
    initialCoins: 20,
    grid: LEVEL_2_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 3 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat'],
    winConditionType: 'plant_wheat',
    hint: '먼저 밀을 심고 다음 타일로 이동하세요.',
    requiredBlocks: ['move()', 'plant("wheat")'],
  },
  {
    id: 3,
    title: '레벨 3: 재배와 수확',
    description: '밀 두 개를 키우고 수확하세요.',
    mission: '밀 두 개를 키우고 수확하세요.',
    learningGoal: '대기, 작물 성장, 수확 흐름을 익힙니다.',
    pythonConcept: '객체는 시간이 지나며 상태가 바뀔 수 있습니다. 밀은 자라는 데 5초가 걸립니다.',
    initialCoins: 35,
    grid: LEVEL_3_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 2 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat', 'wait', 'harvest'],
    winConditionType: 'harvest_wheat',
    hint: 'harvest()를 사용하기 전에 wait(1)을 여러 번 사용하세요.',
    requiredBlocks: ['plant("wheat")', 'wait(1)', 'harvest()'],
  },
  {
    id: 4,
    title: '레벨 4: 반복 자동화',
    description: '다섯 개의 타일에 밀을 심으세요.',
    mission: '다섯 개의 타일에 밀을 심으세요.',
    learningGoal: 'for 반복문으로 여러 명령을 반복 실행합니다.',
    pythonConcept: 'for 반복문은 같은 코드 묶음을 여러 번 실행합니다.',
    initialCoins: 50,
    grid: LEVEL_4_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 5 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat', 'repeat_5'],
    winConditionType: 'plant_wheat',
    hint: 'Repeat 5 안에 plant("wheat")와 move()를 넣으세요.',
    requiredBlocks: ['for i in range(5):', 'plant("wheat")', 'move()'],
  },
  {
    id: 5,
    title: '레벨 5: 수확 알고리즘',
    description: '반복문 안의 조건을 사용해 다 자란 밀을 모두 수확하세요.',
    mission: '다 자란 밀을 모두 수확하세요.',
    learningGoal: '조건문과 반복문을 함께 사용합니다.',
    pythonConcept: '반복문 안의 조건문은 알고리즘이 현재 상태에 맞게 반응하도록 합니다.',
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
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'harvest', 'repeat_5', 'if_crop_ready'],
    winConditionType: 'harvest_all_target_crops',
    hint: 'if crop_ready()로 수확할지 확인한 뒤 다음 타일로 이동하세요.',
    requiredBlocks: ['for i in range(5):', 'if crop_ready():', 'harvest()', 'move()'],
  },
];
