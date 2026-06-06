import { BaexElement, defineComponent, html } from '../framework/index.js';
import { Raw } from '../framework/template.js';
import { openTab, viewSignal } from '../state/router.js';
import { WASM_ITEMS, FRAMEWORK_ITEMS, type ApiItem } from '../state/api-items.js';
import { BaexCodeBlock } from './code-block.js';
import { BaexNav } from './nav.js';

defineComponent('baex-code-block', BaexCodeBlock);
defineComponent('baex-nav', BaexNav);

const HOME_CARDS: Array<{ id: string; name: string; desc: string; color: string }> = [
  { id: 'wasm',      name: 'Wasm Primitives',       desc: 'Raw functions exposed by the Rust/WASM web-core module.',     color: 'amber'  },
  { id: 'framework', name: 'Framework Primitives',  desc: 'BAEX (Browser API Extended) framework built on top of WASM.',  color: 'blue'   },
  { id: 'props',     name: 'Reactive Properties',   desc: 'High-performance reactive state with fine-grained updates.', color: 'green'  },
  { id: 'elements',  name: 'Custom Elements',       desc: 'Extend HTMLElement with the BaexElement base class.',          color: 'purple' },
  { id: 'templates', name: 'Template Engine',       desc: 'Tagged template literals with HTML auto-escaping.',           color: 'pink'   },
  { id: 'signals',   name: 'Signal API',            desc: 'Global reactive value store bridged with Rust.',              color: 'cyan'   },
];

export class AppElement extends BaexElement {
  static properties = {
    view: { type: String },
  };

  view = 'home';
  searchQuery = '';

  private _unsubscribeView: (() => void) | null = null;
  private _copyTimer: number | null = null;

  onConnected() {
    this.addEventListener('click', this._handleClick);
    this.addEventListener('input', this._handleInput);
    this.view = viewSignal.value as string;
    this._unsubscribeView = viewSignal.subscribe((val) => {
      this.view = val as string;
      this.requestUpdate();
    });
  }

  onDisconnected() {
    this.removeEventListener('click', this._handleClick);
    this.removeEventListener('input', this._handleInput);
    this._unsubscribeView?.();
    if (this._copyTimer !== null) {
      clearTimeout(this._copyTimer);
      this._copyTimer = null;
    }
  }

  private _openTab = (id: string, name: string) => {
    openTab(id, name);
  };

  private _handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.matches('[data-search]')) {
      this.searchQuery = target.value.toLowerCase();
      this.requestUpdate(true);
    }
  };

  private _handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const header = target.closest('[data-acc-header]') as HTMLElement | null;
    if (header) {
      const isOpen = header.getAttribute('data-open') === 'true';
      const next = isOpen ? 'false' : 'true';
      header.setAttribute('data-open', next);
      const idx = header.getAttribute('data-acc-header');
      if (idx !== null) {
        const body = this.querySelector(`[data-acc-body="${idx}"]`);
        body?.classList.toggle('open', next === 'true');
      }
    }
  };

  private _fuzzyMatch(str: string, query: string): boolean {
    if (!query) return true;
    return str.toLowerCase().includes(query);
  }

  private _renderAccordionItem(item: ApiItem, idx: number) {
    const escapedCode = item.code ? item.code.replace(/"/g, '&quot;') : '';
    const escapedLang = item.lang ? item.lang.replace(/"/g, '&quot;') : '';
    return html`
      <div class="rounded-lg mb-1.5 bg-white/[0.03] border border-white/[0.06]">
        <button
          class="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-inherit font-inherit cursor-pointer text-left transition-colors duration-150 hover:bg-white/[0.05] data-[open=true]:bg-white/[0.06]"
          data-acc-header=${idx}
          data-open="false"
        >
          <span class="font-semibold text-[0.95rem] whitespace-nowrap">${item.name}</span>
          <span class="text-[0.75rem] opacity-45 truncate flex-1 min-w-0">${item.signature}</span>
          <span class="chevron text-[0.75rem] opacity-50 shrink-0 transition-transform duration-200">▸</span>
        </button>
        <div class="accordion-body" data-acc-body=${idx}>
          <div class="overflow-hidden">
            <div class="px-4 py-4">
              <p class="text-[0.9rem] leading-relaxed opacity-80 mb-3">${item.desc}</p>
              ${
                item.code
                  ? Raw(`<baex-code-block code="${escapedCode}" lang="${escapedLang}"></baex-code-block>`)
                  : ''
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const view = this.view;
    return html`
      <div class="flex flex-col items-center min-h-screen px-4 py-8">
        <div class="w-full max-w-2xl mt-24">
          <h1 class="text-3xl font-bold text-center mb-1">Wasm Browser API Extended</h1>
          <p class="text-[1.1rem] text-center text-white/60 mt-0 mb-6">BAEX framework × Rust/Wasm</p>

          ${view === 'home'
            ? html`
              <div class="mt-6">
                <div class="relative mb-6">
                  <input
                    data-search
                    type="text"
                    placeholder="Search features..."
                    class="w-full px-4 py-3 pl-10 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                  />
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${HOME_CARDS
                    .filter((card) => this._fuzzyMatch(card.name + card.desc, this.searchQuery))
                    .map((card) => html`
                      <div
                        @click=${() => this._openTab(card.id, card.name)}
                        class="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/20 cursor-pointer transition-all duration-200"
                      >
                        <div class="flex items-center gap-2 mb-2">
                          <span class="w-2 h-2 rounded-full bg-${card.color}-400"></span>
                          <h3 class="font-semibold text-sm">${card.name}</h3>
                        </div>
                        <p class="text-xs text-white/50 leading-relaxed">${card.desc}</p>
                      </div>
                    `)}
                </div>
              </div>
            `
            : view === 'wasm'
              ? html`
                <div class="text-[1.1rem] font-bold text-amber-400 mt-6 mb-3 pb-2 border-b border-white/10">Non-framework Primitives</div>
                <p class="text-sm text-white/50 mb-4">
                  Raw functions exposed on <code class="text-[0.8rem] bg-white/10 px-1 py-0.5 rounded">window.*</code>
                  by the Rust/WASM <code class="text-[0.8rem] bg-white/10 px-1 py-0.5 rounded">web-core</code> module
                </p>
                ${WASM_ITEMS.map((item, i) => this._renderAccordionItem(item, i))}
              `
              : view === 'framework'
                ? html`
                  <div class="text-[1.1rem] font-bold text-blue-400 mt-6 mb-3 pb-2 border-b border-white/10">Framework Primitives</div>
                  <p class="text-sm text-white/50 mb-4">BAEX (Browser API Extended) framework built on top of the WASM primitives</p>
                  ${FRAMEWORK_ITEMS.map((item, i) => this._renderAccordionItem(item, i + WASM_ITEMS.length))}
                `
                : html`
                  <div class="text-[1.1rem] font-bold text-white/80 mt-6 mb-3 pb-2 border-b border-white/10">${view}</div>
                  <p class="text-sm text-white/50 mb-4">This is a dynamically opened tab from the Home grid.</p>
                `}
        </div>
      </div>
    `;
  }
}

defineComponent('baex-app', AppElement);
