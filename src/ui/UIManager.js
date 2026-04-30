export class UIManager {
  constructor(gameState = null) {
    this.logContainer = document.querySelector('.log-content');
    this.statusText = document.querySelector('.status-value');
    this.coinsText = document.querySelector('[data-coins]');
    this.scoreText = document.querySelector('[data-score]');
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

  updateStats({ coins, score }) {
    if (this.coinsText) {
      this.coinsText.textContent = coins;
    }

    if (this.scoreText) {
      this.scoreText.textContent = score;
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
