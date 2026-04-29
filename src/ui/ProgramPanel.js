export class ProgramPanel {
  constructor({
    program,
    onMoveUp,
    onMoveDown,
    onRemove,
    onClear,
    onSelectContainer,
    onBackToMain,
  }) {
    this.program = program;
    this.onMoveUp = onMoveUp;
    this.onMoveDown = onMoveDown;
    this.onRemove = onRemove;
    this.onClear = onClear;
    this.onSelectContainer = onSelectContainer;
    this.onBackToMain = onBackToMain;
    this.programList = document.querySelector('[data-program-list]');
    this.clearButton = document.querySelector('[data-clear-program]');
    this.editingLabel = document.querySelector('[data-editing-container]');
    this.backButton = document.querySelector('[data-back-main-program]');

    this.clearButton?.addEventListener('click', () => this.onClear());
    this.backButton?.addEventListener('click', () => this.onBackToMain());
  }

  render() {
    if (!this.programList) return;
    this.programList.textContent = '';

    if (this.editingLabel) {
      this.editingLabel.textContent = this.program.getSelectedContainerLabel();
    }

    if (this.backButton) {
      this.backButton.disabled = this.program.getSelectedContainerLabel() === 'Main Program';
    }

    const blocks = this.program.getBlocks();
    if (blocks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'placeholder-box compact';
      empty.textContent = 'Click an owned block to add it here.';
      this.programList.append(empty);
      return;
    }

    this.renderBlockList(blocks, this.programList, 0);
  }

  renderBlockList(blocks, parent, depth) {
    blocks.forEach((programBlock, index) => {
      const item = document.createElement('article');
      item.className = programBlock.definition.hasChildren
        ? 'program-block repeat-program-block'
        : 'program-block';
      item.style.marginLeft = `${depth * 18}px`;

      if (programBlock.definition.hasChildren) {
        item.addEventListener('click', () => this.onSelectContainer(programBlock.id));
      }

      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${programBlock.definition.name}`;
      item.append(label);

      const controls = document.createElement('div');
      controls.className = 'program-actions';
      controls.append(
        this.createActionButton('Up', (event) => {
          event.stopPropagation();
          this.onMoveUp(programBlock.id);
        }, index === 0),
        this.createActionButton('Down', (event) => {
          event.stopPropagation();
          this.onMoveDown(programBlock.id);
        }, index === blocks.length - 1),
        this.createActionButton('Del', (event) => {
          event.stopPropagation();
          this.onRemove(programBlock.id);
        }),
      );

      item.append(controls);
      parent.append(item);

      if (programBlock.definition.hasChildren) {
        if (programBlock.children.length === 0) {
          const emptyChild = document.createElement('div');
          emptyChild.className = 'repeat-empty';
          emptyChild.style.marginLeft = `${(depth + 1) * 18}px`;
          emptyChild.textContent = 'Click this repeat block, then add owned blocks.';
          parent.append(emptyChild);
        } else {
          this.renderBlockList(programBlock.children, parent, depth + 1);
        }
      }
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
