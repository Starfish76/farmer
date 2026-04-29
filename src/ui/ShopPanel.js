export class ShopPanel {
  constructor({ shop, onPurchase, onAddBlock }) {
    this.shop = shop;
    this.onPurchase = onPurchase;
    this.onAddBlock = onAddBlock;
    this.shopList = document.querySelector('[data-shop-list]');
    this.ownedList = document.querySelector('[data-owned-list]');
  }

  render() {
    this.renderShopList();
    this.renderOwnedList();
  }

  renderShopList() {
    if (!this.shopList) return;
    this.shopList.textContent = '';

    for (const block of this.shop.getShopBlocks()) {
      const isOwned = this.shop.isPurchased(block.id);
      const card = document.createElement('article');
      card.className = 'block-card';
      card.dataset.category = block.category;

      card.innerHTML = `
        <div>
          <h4>${block.name}</h4>
          <p>${block.description}</p>
          <span>${block.category} / ${block.cost} coins</span>
        </div>
      `;

      const button = document.createElement('button');
      button.className = 'mini-btn';
      button.type = 'button';
      button.textContent = isOwned ? 'Owned' : 'Buy';
      button.disabled = isOwned;
      button.addEventListener('click', () => this.onPurchase(block.id));
      card.append(button);

      this.shopList.append(card);
    }
  }

  renderOwnedList() {
    if (!this.ownedList) return;
    this.ownedList.textContent = '';

    for (const block of this.shop.getOwnedBlocks()) {
      const button = document.createElement('button');
      button.className = 'owned-block';
      button.dataset.category = block.category;
      button.type = 'button';
      button.textContent = block.name;
      button.title = `Add ${block.name} to Program`;
      button.addEventListener('click', () => this.onAddBlock(block.id));
      this.ownedList.append(button);
    }
  }
}
