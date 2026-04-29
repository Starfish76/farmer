import { GameEngine } from './game/GameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine('game-canvas');
  // 메인 루프 시작
  requestAnimationFrame((t) => engine.update(t));
});