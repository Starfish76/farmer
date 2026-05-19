export class MissionPanel {
  constructor({ onPrevious, onNext, onReset, onResetAll, onStartMainGame }) {
    this.panel = document.querySelector('.mission-panel');
    this.title = document.querySelector('[data-level-title]');
    this.mission = document.querySelector('[data-level-mission]');
    this.concept = document.querySelector('[data-level-concept]');
    this.hint = document.querySelector('[data-level-hint]');
    this.requiredBlocks = document.querySelector('[data-level-required-blocks]');
    this.detailRows = [...document.querySelectorAll('.mission-detail')];
    this.levelControls = document.querySelector('.level-controls');
    this.previousButton = document.querySelector('[data-prev-level]');
    this.nextButton = document.querySelector('[data-next-level]');
    this.resetButton = document.querySelector('[data-reset-level]');
    this.resetAllButton = document.querySelector('[data-reset-all]');
    this.startMainButton = document.querySelector('[data-start-main-game]');

    this.previousButton?.addEventListener('click', onPrevious);
    this.nextButton?.addEventListener('click', onNext);
    this.resetButton?.addEventListener('click', onReset);
    this.resetAllButton?.addEventListener('click', onResetAll);
    this.startMainButton?.addEventListener('click', onStartMainGame);
  }

  render(level, { canGoPrevious, canGoNext, levelComplete }) {
    this.show();
    this.setTutorialRowsVisible(true);

    if (this.title) {
      this.title.textContent = levelComplete ? `${level.title} - 완료` : level.title;
      this.title.dataset.complete = levelComplete ? 'true' : 'false';
    }
    if (this.mission) this.mission.textContent = level.mission;
    if (this.concept) this.concept.textContent = level.pythonConcept;
    if (this.hint) this.hint.textContent = level.hint;
    if (this.requiredBlocks) {
      this.requiredBlocks.textContent = level.requiredBlocks.join(', ');
    }

    if (this.previousButton) this.previousButton.disabled = !canGoPrevious;
    if (this.nextButton) this.nextButton.disabled = !canGoNext || !levelComplete;
  }

  renderTutorialComplete() {
    this.show();
    this.setTutorialRowsVisible(false);

    if (this.title) {
      this.title.textContent = '튜토리얼 끝!';
      this.title.dataset.complete = 'true';
    }

    if (this.mission) {
      this.mission.textContent = '본격적으로 게임 시작! 1만원 모으기!';
    }
  }

  hideForMainGame() {
    this.panel?.classList.add('hidden');
  }

  show() {
    this.panel?.classList.remove('hidden');
  }

  setTutorialRowsVisible(isVisible) {
    for (const row of this.detailRows) {
      row.hidden = !isVisible;
    }

    if (this.levelControls) this.levelControls.hidden = !isVisible;
    if (this.startMainButton) this.startMainButton.hidden = isVisible;
  }
}
