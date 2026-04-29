export class MissionPanel {
  constructor({ onPrevious, onNext, onReset }) {
    this.title = document.querySelector('[data-level-title]');
    this.mission = document.querySelector('[data-level-mission]');
    this.concept = document.querySelector('[data-level-concept]');
    this.hint = document.querySelector('[data-level-hint]');
    this.requiredBlocks = document.querySelector('[data-level-required-blocks]');
    this.previousButton = document.querySelector('[data-prev-level]');
    this.nextButton = document.querySelector('[data-next-level]');
    this.resetButton = document.querySelector('[data-reset-level]');

    this.previousButton?.addEventListener('click', onPrevious);
    this.nextButton?.addEventListener('click', onNext);
    this.resetButton?.addEventListener('click', onReset);
  }

  render(level, { canGoPrevious, canGoNext, levelComplete }) {
    if (this.title) this.title.textContent = level.title;
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
