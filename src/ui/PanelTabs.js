export class PanelTabs {
  constructor(defaultTab = 'blocks') {
    this.buttons = [...document.querySelectorAll('[data-tab-button]')];
    this.panels = [...document.querySelectorAll('[data-tab-panel]')];

    for (const button of this.buttons) {
      button.addEventListener('click', () => this.show(button.dataset.tabButton));
    }

    this.show(defaultTab);
  }

  show(tabName) {
    for (const button of this.buttons) {
      button.classList.toggle('active', button.dataset.tabButton === tabName);
    }

    for (const panel of this.panels) {
      panel.classList.toggle('active', panel.dataset.tabPanel === tabName);
    }
  }
}
