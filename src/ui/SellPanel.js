import { CROPS } from '../game/Crop.js';

export class SellPanel {
  constructor({ gameState, onSellCrop }) {
    this.gameState = gameState;
    this.onSellCrop = onSellCrop;
    this.cropList = document.querySelector('[data-sell-crop-list]');
    this.marketTimer = document.querySelector('[data-market-timer]');
  }

  render(now = Date.now()) {
    this.renderTimer(now);
    this.renderCropList();
  }

  renderTimer(now) {
    if (!this.marketTimer) return;

    const remainingMs = Math.max(0, this.gameState.nextMarketPriceUpdateAt - now);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
    this.marketTimer.textContent = `${minutes}:${seconds}`;
  }

  renderCropList() {
    if (!this.cropList) return;
    this.cropList.textContent = '';

    for (const cropId of Object.keys(CROPS)) {
      this.cropList.append(this.createCropCard(cropId));
    }
  }

  createCropCard(cropId) {
    const crop = CROPS[cropId];
    const count = this.gameState.cropInventory[cropId] ?? 0;
    const price = this.gameState.cropPrices[cropId] ?? crop.baseSellPrice;
    const card = document.createElement('article');
    card.className = 'sell-crop-card';

    const icon = document.createElement('img');
    icon.src = crop.imageSrc;
    icon.alt = '';

    const content = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = crop.name;
    const meta = document.createElement('p');
    meta.textContent = `보유 ${count}개 / 개당 ${price}코인`;
    content.append(title, meta);

    const button = document.createElement('button');
    button.className = 'mini-btn';
    button.type = 'button';
    button.textContent = '판매';
    button.disabled = count <= 0;
    button.addEventListener('click', () => this.onSellCrop(cropId));

    card.append(icon, content, button);
    return card;
  }
}
