export class ProgramPanel {
  constructor({
    program,
    onMove,
    onRemove,
    onClear,
    onSelectContainer,
  }) {
    this.program = program;
    this.onMove = onMove;
    this.onRemove = onRemove;
    this.onClear = onClear;
    this.onSelectContainer = onSelectContainer;
    this.programList = document.querySelector('[data-program-list]');
    this.clearButton = document.querySelector('[data-clear-program]');
    this.draggedBlockId = null;

    this.clearButton?.addEventListener('click', () => this.onClear());
  }

  render() {
    if (!this.programList) return;
    this.programList.textContent = '';

    const blocks = this.program.getBlocks();
    if (blocks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'placeholder-box compact';
      empty.textContent = '보유한 블록을 클릭하면 여기에 추가됩니다.';
      this.programList.append(empty);
      return;
    }

    this.renderBlockList(blocks, this.programList, 0);
  }

  scrollToEnd() {
    if (!this.programList) return;
    this.programList.scrollTop = this.programList.scrollHeight;
  }

  renderBlockList(blocks, parent, depth) {
    blocks.forEach((programBlock, index) => {
      const item = document.createElement('article');
      item.className = programBlock.definition.hasChildren
        ? 'program-block repeat-program-block'
        : 'program-block';
      item.dataset.category = programBlock.definition.category;
      item.dataset.programBlockId = programBlock.id;
      item.draggable = true;
      item.style.marginLeft = `${depth * 18}px`;

      if (programBlock.id === this.program.gameState.selectedContainerId) {
        item.classList.add('selected-container');
      }

      if (programBlock.definition.hasChildren) {
        item.title = '클릭하면 이 블록 안에 블록을 추가합니다. 다시 클릭하면 메인 프로그램으로 돌아갑니다.';
        item.addEventListener('click', () => this.onSelectContainer(programBlock.id));
      }

      this.attachDragHandlers(item, programBlock.id);

      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${programBlock.definition.name}`;
      item.append(label);

      const controls = document.createElement('div');
      controls.className = 'program-actions';
      controls.append(
        this.createDeleteButton((event) => {
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
          emptyChild.textContent = '이 블록을 클릭한 뒤 안에 넣을 블록을 추가하세요.';
          parent.append(emptyChild);
        } else {
          this.renderBlockList(programBlock.children, parent, depth + 1);
        }
      }
    });
  }

  attachDragHandlers(item, programBlockId) {
    item.addEventListener('dragstart', (event) => {
      this.draggedBlockId = programBlockId;
      item.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', programBlockId);
    });

    item.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (!this.draggedBlockId || this.draggedBlockId === programBlockId) return;

      const position = getDropPosition(item, event.clientY);
      item.classList.toggle('drop-before', position === 'before');
      item.classList.toggle('drop-after', position === 'after');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drop-before', 'drop-after');
    });

    item.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const draggedBlockId = event.dataTransfer.getData('text/plain') || this.draggedBlockId;
      const position = getDropPosition(item, event.clientY);
      item.classList.remove('drop-before', 'drop-after');

      if (draggedBlockId && draggedBlockId !== programBlockId) {
        this.onMove(draggedBlockId, programBlockId, position);
      }
    });

    item.addEventListener('dragend', () => {
      this.draggedBlockId = null;
      this.clearDropClasses();
    });
  }

  clearDropClasses() {
    if (!this.programList) return;
    for (const item of this.programList.querySelectorAll('.program-block')) {
      item.classList.remove('dragging', 'drop-before', 'drop-after');
    }
  }

  createDeleteButton(handler) {
    const button = document.createElement('button');
    button.className = 'icon-btn';
    button.type = 'button';
    button.textContent = '삭제';
    button.addEventListener('click', handler);
    return button;
  }
}

function getDropPosition(item, pointerY) {
  const rect = item.getBoundingClientRect();
  return pointerY < rect.top + rect.height / 2 ? 'before' : 'after';
}
