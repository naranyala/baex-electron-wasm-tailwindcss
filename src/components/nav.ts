import { BaexElement, defineComponent, html } from '../framework/index.js';
import { tabsSignal, viewSignal, navigateTo } from '../state/router.js';

interface Tab {
  id: string;
  name: string;
}

export class BaexNav extends BaexElement {
  static properties = {
    tabs: { attribute: false },
    view: { attribute: false },
  };

  tabs: Tab[] = [];
  view: string = 'home';

  private _unsubscribeView: (() => void) | null = null;
  private _unsubscribeTabs: (() => void) | null = null;

  onConnected() {
    this.view = viewSignal.value;
    this.tabs = tabsSignal.value as Tab[];

    this._unsubscribeView = viewSignal.subscribe((val) => {
      this.view = val as string;
      this.requestUpdate();
    });
    this._unsubscribeTabs = tabsSignal.subscribe((val) => {
      this.tabs = val as Tab[];
      this.requestUpdate();
    });
  }

  onDisconnected() {
    this._unsubscribeView?.();
    this._unsubscribeTabs?.();
  }

  onUpdate() {
    this._positionIndicator();
  }

  private _handleNav = (e: Event) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.nav-btn') as HTMLElement | null;
    if (btn) {
      const view = btn.getAttribute('data-view');
      if (view) navigateTo(view);
    }
  };

  private _positionIndicator(): void {
    const indicator = this.querySelector('.nav-indicator') as HTMLElement | null;
    if (!indicator) return;

    const buttons = Array.from(this.querySelectorAll('.nav-btn')) as HTMLElement[];
    const total = buttons.length;
    if (total === 0) {
      indicator.style.opacity = '0';
      return;
    }

    const idx = buttons.findIndex((b) => b.getAttribute('data-view') === this.view);
    const widthPct = 100 / total;
    indicator.style.opacity = '1';
    indicator.style.width = `calc(${widthPct}% - 8px)`;
    indicator.style.transform = `translateX(${idx === -1 ? 0 : idx * 100}%)`;
  }

  private _activeClass(tabId: string): string {
    return this.view === tabId
      ? 'text-white'
      : 'text-white/40 hover:text-white';
  }

  render() {
    return html`
      <nav class="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 bg-[#020917]/80 backdrop-blur-md">
        <div class="absolute left-4">
          <button
            @click=${() => navigateTo('home')}
            class="px-5 py-2 text-sm font-medium text-white/80 transition-colors duration-200 rounded-full bg-white/5 hover:bg-white/10 hover:text-white"
          >
            Home
          </button>
        </div>
        
        <div
          @click=${this._handleNav}
          class="relative flex items-center gap-1 cursor-pointer bg-white/5 p-1 rounded-full"
        >
          <div class="nav-indicator absolute top-0 bottom-0 left-0 rounded-full bg-white/10 transition-all duration-300 ease-out"></div>

          ${this.tabs.map(
            (tab) => html`
              <button
                data-view=${tab.id}
                class="nav-btn relative px-5 py-2 text-sm font-medium transition-colors duration-200 rounded-full ${this._activeClass(tab.id)}"
              >
                ${tab.name}
              </button>
            `,
          )}
        </div>
      </nav>
    `;
  }
}

defineComponent('baex-nav', BaexNav);
