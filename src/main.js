import { GameEngine } from './game/GameEngine.js';
import { PanelTabs } from './ui/PanelTabs.js';

document.addEventListener('DOMContentLoaded', () => {
  new PanelTabs('blocks');
  const engine = new GameEngine('game-canvas');
  requestAnimationFrame((time) => engine.update(time));
});
