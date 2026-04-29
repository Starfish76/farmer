export class MissionPanel {
  constructor({ onPrevious, onNext, onReset, onResetAll }) {
    this.title = document.querySelector('[data-level-title]');
    this.mission = document.querySelector('[data-level-mission]');
    this.concept = document.querySelector('[data-level-concept]');
    this.hint = document.querySelector('[data-level-hint]');
    this.requiredBlocks = document.querySelector('[data-level-required-blocks]');
    this.previousButton = document.querySelector('[data-prev-level]');
    this.nextButton = document.querySelector('[data-next-level]');
    this.resetButton = document.querySelector('[data-reset-level]');
    this.resetAllButton = document.querySelector('[data-reset-all]');

    this.previousButton?.addEventListener('click', onPrevious);
    this.nextButton?.addEventListener('click', onNext);
    this.resetButton?.addEventListener('click', onReset);
    this.resetAllButton?.addEventListener('click', onResetAll);
  }

  render(level, { canGoPrevious, canGoNext, levelComplete }) {
    if (this.title) {
      this.title.textContent = levelComplete ? `${level.title} - Complete` : level.title;
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
}
