export class UIManager {
  constructor() {
    this.logContainer = document.querySelector('.log-content');
    this.statusText = document.querySelector('.status-value');
    this.logs = [];
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
    this.statusText.textContent = state;
    this.statusText.dataset.state = state;
  }
}
