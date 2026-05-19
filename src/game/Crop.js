export const CROPS = {
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    rewardCoins: 5,
    rewardScore: 5,
    growthDurationSeconds: 5,
    color: '#f2c94c',
  },
};

export function createCrop(type, plantedAt) {
  if (!CROPS[type]) {
    throw new Error(`알 수 없는 작물 종류입니다: ${type}`);
  }

  return {
    type,
    plantedAt,
    growthStage: 'seed',
    growthProgress: 0,
  };
}

export function updateGrowthStage(crop, now) {
  const cropDefinition = CROPS[crop.type];
  if (!cropDefinition) return crop;

  const elapsedSeconds = Math.max(0, (now - crop.plantedAt) / 1000);
  const progress = elapsedSeconds / cropDefinition.growthDurationSeconds;
  crop.growthProgress = Math.min(progress, 1);

  if (progress >= 1) {
    crop.growthStage = 'grown';
  } else if (progress >= 0.35) {
    crop.growthStage = 'sprout';
  } else {
    crop.growthStage = 'seed';
  }

  return crop;
}

export function getRemainingGrowthSeconds(crop, now) {
  const cropDefinition = CROPS[crop.type];
  if (!cropDefinition) return 0;

  const elapsedSeconds = Math.max(0, (now - crop.plantedAt) / 1000);
  return Math.max(0, cropDefinition.growthDurationSeconds - elapsedSeconds);
}
