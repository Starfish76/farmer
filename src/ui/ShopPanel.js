export class ShopPanel {
  constructor({ shop, onPurchase, onAddBlock }) {
    this.shop = shop;
    this.onPurchase = onPurchase;
    this.onAddBlock = onAddBlock;
    this.programOwnedList = document.querySelector('[data-program-owned-list]');
    this.shopWindow = document.querySelector('[data-shop-window]');
    this.openShopButton = document.querySelector('[data-open-shop]');
    this.closeShopButton = document.querySelector('[data-close-shop]');
    this.categoryLists = new Map(
      [...document.querySelectorAll('[data-shop-category]')]
        .map((element) => [element.dataset.shopCategory, element]),
    );

    this.openShopButton?.addEventListener('click', () => this.openShop());
    this.closeShopButton?.addEventListener('click', () => this.closeShop());
    this.shopWindow?.addEventListener('click', (event) => {
      if (event.target === this.shopWindow) {
        this.closeShop();
      }
    });
  }

  render() {
    this.renderShopCategories();
    this.renderOwnedList(this.programOwnedList, { compact: true });
  }

  openShop() {
    this.shopWindow?.classList.remove('hidden');
  }

  closeShop() {
    this.shopWindow?.classList.add('hidden');
  }

  renderShopCategories() {
    for (const list of this.categoryLists.values()) {
      list.textContent = '';
    }

    const groupsWithBlocks = new Set();

    for (const block of this.shop.getShopBlocks()) {
      const group = getShopGroup(block);
      const container = this.categoryLists.get(group);
      if (!container) continue;

      groupsWithBlocks.add(group);
      container.append(this.createShopCard(block));
    }

    for (const [group, container] of this.categoryLists) {
      if (!groupsWithBlocks.has(group)) {
        const empty = document.createElement('div');
        empty.className = 'shop-empty';
        empty.textContent = '아직 사용할 수 있는 블록이 없습니다.';
        container.append(empty);
      }
    }
  }

  createShopCard(block) {
    const isOwned = this.shop.isPurchased(block.id);
    const card = document.createElement('article');
    card.className = 'block-card shop-card';
    card.dataset.category = block.category;

    const content = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = block.name;
    const description = document.createElement('p');
    description.textContent = block.description;
    const meta = document.createElement('span');
    meta.textContent = `${getShopGroupLabel(block)} / ${block.cost}코인`;
    content.append(title, description, meta);

    const button = document.createElement('button');
    button.className = 'mini-btn';
    button.type = 'button';
    button.textContent = isOwned ? '보유 중' : '구매';
    button.disabled = isOwned;
    button.addEventListener('click', () => this.onPurchase(block.id));

    card.append(content, button);
    return card;
  }

  renderOwnedList(container, { compact = false } = {}) {
    if (!container) return;
    container.textContent = '';

    for (const block of this.shop.getOwnedBlocks()) {
      const button = document.createElement('button');
      button.className = compact ? 'owned-block compact-owned-block' : 'owned-block';
      button.dataset.category = block.category;
      button.type = 'button';
      button.textContent = block.name;
      button.title = `${block.name} 블록을 프로그램에 추가`;
      button.addEventListener('click', () => this.onAddBlock(block.id));
      container.append(button);
    }
  }
}

function getShopGroup(block) {
  if (block.category === 'Movement') return 'Movement';
  if (block.repeatCount) return 'Loop';
  if (block.conditionType) return 'Condition';
  return 'Action';
}

function getShopGroupLabel(block) {
  const group = getShopGroup(block);
  if (group === 'Movement') return '이동';
  if (group === 'Loop') return '반복';
  if (group === 'Condition') return '조건';
  return '작업';
}
