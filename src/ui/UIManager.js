export class UIManager {
  constructor(gameState = null) {
    this.logContainer = document.querySelector('.log-content');
    this.statusText = document.querySelector('.status-value');
    this.coinsTexts = [...document.querySelectorAll('[data-coins]')];
    this.wheatCountTexts = [...document.querySelectorAll('[data-wheat-count]')];
    this.logs = gameState?.logs ?? [];
  }

  addLog(message) {
    const now = new Date();
    const timeText = [
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0'),
      now.getSeconds().toString().padStart(2, '0'),
    ].join(':');

    this.logs.unshift(`[${timeText}] ${message}`);
    if (this.logs.length > 10) {
      this.logs.pop();
    }

    this.renderLogs();
  }

  renderLogs() {
    if (!this.logContainer) return;
    this.logContainer.textContent = '';

    for (const log of this.logs) {
      const line = document.createElement('div');
      line.textContent = log;
      this.logContainer.append(line);
    }
  }

  updateStatus(state) {
    if (!this.statusText) return;
    this.statusText.textContent = getStatusLabel(state);
    this.statusText.dataset.state = state;
  }

  updateStats({ coins, cropInventory }) {
    for (const coinsText of this.coinsTexts) {
      coinsText.textContent = coins;
    }

    const wheatCount = cropInventory?.wheat ?? 0;
    for (const wheatCountText of this.wheatCountTexts) {
      wheatCountText.textContent = wheatCount;
    }
  }
}

function getStatusLabel(state) {
  if (state === 'stopped') return '정지';
  if (state === 'running') return '실행 중';
  if (state === 'paused') return '일시정지';
  if (state === 'error') return '오류';
  if (state === 'success') return '완료';
  return state;
}
