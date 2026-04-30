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
    title: '레벨 1: 첫 걸음',
    description: '로봇을 목표 타일까지 이동하세요.',
    mission: '로봇을 목표 타일까지 이동하세요.',
    learningGoal: '함수 호출과 순차 실행을 배웁니다.',
    pythonConcept: '함수는 하나의 명령입니다. 각 블록은 하나의 함수 호출을 뜻합니다.',
    initialCoins: 20,
    grid: LEVEL_1_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { x: 2, y: 1 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right'],
    winConditionType: 'reach_target',
    hint: 'move()와 turn_right()를 올바른 순서로 사용하세요.',
    requiredBlocks: ['move()', 'turn_left()', 'turn_right()'],
  },
  {
    id: 2,
    title: '레벨 2: 밀 심기',
    description: '세 칸에 밀을 심으세요.',
    mission: '세 칸에 밀을 심으세요.',
    learningGoal: '농사 함수, 명령 순서, 함수 인자를 배웁니다.',
    pythonConcept: 'plant("wheat")는 값을 넣어 함수를 호출하는 코드입니다.',
    initialCoins: 20,
    grid: LEVEL_2_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 3 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat'],
    winConditionType: 'plant_wheat',
    hint: '로봇이 칸 위에 있을 때 plant("wheat")를 먼저 실행하고, 그 다음 move()로 이동하세요.',
    requiredBlocks: ['move()', 'plant("wheat")'],
  },
  {
    id: 3,
    title: '레벨 3: 밀 키우고 수확하기',
    description: '밀 두 개를 키워 수확하세요.',
    mission: '밀 두 개를 키워 수확하세요.',
    learningGoal: '시간 기반 상태 변화, 대기, 수확, 작물 성장 시간을 배웁니다.',
    pythonConcept: '객체는 시간이 지나며 상태가 바뀔 수 있습니다. 밀은 5초 뒤 다 자랍니다.',
    initialCoins: 35,
    grid: LEVEL_3_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'wheat', count: 2 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_wheat', 'wait', 'harvest'],
    winConditionType: 'harvest_wheat',
    hint: '밀은 다 자라기까지 5초가 필요합니다. harvest() 전에 wait(1)을 여러 번 사용하세요.',
    requiredBlocks: ['plant("wheat")', 'wait(1)', 'harvest()'],
  },
  {
    id: 4,
    title: '레벨 4: 반복 자동화',
    description: '다섯 칸에 당근을 심으세요.',
    mission: '다섯 칸에 당근을 심으세요.',
    learningGoal: 'for 반복문으로 명령 묶음을 반복하는 방법을 배웁니다.',
    pythonConcept: 'for 반복문은 같은 코드 묶음을 여러 번 실행합니다.',
    initialCoins: 50,
    grid: LEVEL_4_GRID,
    robotStart: { x: 0, y: 0 },
    robotDirection: 'east',
    target: { type: 'carrot', count: 5 },
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'plant_carrot', 'repeat_5'],
    winConditionType: 'plant_carrot',
    hint: 'Repeat 5 안에 plant("carrot")와 move()를 넣어보세요.',
    requiredBlocks: ['for i in range(5):', 'plant("carrot")', 'move()'],
  },
  {
    id: 5,
    title: '레벨 5: 수확 알고리즘',
    description: '반복문 안의 조건으로 다 자란 작물을 수확하세요.',
    mission: '다 자란 당근을 모두 수확하세요.',
    learningGoal: '조건, 반복, 알고리즘 사고를 함께 사용합니다.',
    pythonConcept: '조건문과 반복문을 함께 쓰면 현재 상태에 맞춰 움직이는 알고리즘을 만들 수 있습니다.',
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
      { x: 0, y: 0, type: 'carrot', stage: 'grown' },
      { x: 1, y: 0, type: 'carrot', stage: 'grown' },
      { x: 2, y: 0, type: 'carrot', stage: 'grown' },
      { x: 3, y: 0, type: 'carrot', stage: 'grown' },
      { x: 4, y: 0, type: 'carrot', stage: 'grown' },
    ],
    unlockedBlocks: ['move', 'turn_left', 'turn_right', 'water', 'harvest', 'repeat_5', 'if_crop_ready'],
    winConditionType: 'harvest_all_target_crops',
    hint: 'if crop_ready()로 다 자란 작물만 수확하고, 다음 칸으로 이동하세요.',
    requiredBlocks: ['for i in range(5):', 'if crop_ready():', 'harvest()', 'move()'],
  },
];
