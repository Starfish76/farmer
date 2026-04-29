export class CodePreviewPanel {
  constructor({ codeGenerator, gameState }) {
    this.codeGenerator = codeGenerator;
    this.gameState = gameState;
    this.codeElement = document.querySelector('[data-code-preview]');
  }

  render() {
    if (!this.codeElement) return;
    this.codeElement.textContent = this.codeGenerator.generate(this.gameState.programBlocks);
  }
}
