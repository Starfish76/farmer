export class ProgramPanel {
  constructor({ program, onMoveUp, onMoveDown, onRemove, onClear }) {
    this.program = program;
    this.onMoveUp = onMoveUp;
    this.onMoveDown = onMoveDown;
    this.onRemove = onRemove;
    this.onClear = onClear;
    this.programList = document.querySelector('[data-program-list]');
    this.clearButton = document.querySelector('[data-clear-program]');

    this.clearButton?.addEventListener('click', () => this.onClear());
  }

  render() {
    if (!this.programList) return;
    this.programList.textContent = '';

    const blocks = this.program.getBlocks();
    if (blocks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'placeholder-box compact';
      empty.textContent = 'Click an owned block to add it here.';
      this.programList.append(empty);
      return;
    }

    blocks.forEach((programBlock, index) => {
      const item = document.createElement('article');
      item.className = 'program-block';

      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${programBlock.definition.name}`;
      item.append(label);

      const controls = document.createElement('div');
      controls.className = 'program-actions';
      controls.append(
        this.createActionButton('Up', () => this.onMoveUp(programBlock.id), index === 0),
        this.createActionButton('Down', () => this.onMoveDown(programBlock.id), index === blocks.length - 1),
        this.createActionButton('Del', () => this.onRemove(programBlock.id)),
      );

      item.append(controls);
      this.programList.append(item);
    });
  }

  createActionButton(label, handler, disabled = false) {
    const button = document.createElement('button');
    button.className = 'icon-btn';
    button.type = 'button';
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener('click', handler);
    return button;
  }
}
