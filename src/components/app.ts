import { BaexElement, defineComponent, html } from '../framework/index.js';
import { Raw } from '../framework/template.js';
import { openTab, viewSignal, dbResultsSignal, dbTablesSignal } from '../state/router.js';
import { WASM_ITEMS, FRAMEWORK_ITEMS, type ApiItem } from '../state/api-items.js';
import { BaexCodeBlock } from './code-block.js';
import { BaexNav } from './nav.js';
import { BaexStatusBar } from './status-bar.js';
import embed from 'vega-embed';

defineComponent('baex-code-block', BaexCodeBlock);
defineComponent('baex-nav', BaexNav);
defineComponent('baex-status-bar', BaexStatusBar);

const CORE_TABLES: Array<{ id: string; name: string; desc: string; color: string }> = [
  { id: 'customers', name: 'Customers', desc: 'Client contact information and location.', color: 'blue' },
  { id: 'orders',    name: 'Orders',    desc: 'Customer purchase history and totals.',     color: 'emerald' },
  { id: 'products',  name: 'Products',  desc: 'Inventory list with pricing and category.', color: 'amber' },
  { id: 'order_items', name: 'Order Items', desc: 'Detailed line items for each order.',  color: 'purple' },
];

const VEGA_CHARTS: Array<{ id: string; name: string; desc: string; color: string }> = [
  { id: 'vega_bar', name: 'Bar Chart', desc: 'Distribution of values across categories.', color: 'rose' },
  { id: 'vega_line', name: 'Line Chart', desc: 'Trends over time or sequence.', color: 'indigo' },
  { id: 'vega_scatter', name: 'Scatter Plot', desc: 'Correlation between two variables.', color: 'cyan' },
];

export class AppElement extends BaexElement {
  static properties = {
    dbStatus: { type: String },
  };

  searchQuery = '';
  dbPath = 'app.db';
  sqlInput = 'SELECT * FROM users';
  dbStatus = 'Not initialized';

  private _unsubscribeView: (() => void) | null = null;
  private _copyTimer: number | null = null;

  onConnected() {
    this.addEventListener('click', this._handleClick);
    this.addEventListener('input', this._handleInput);
    this._unsubscribeView = viewSignal.subscribe((val) => {
      this._handleViewChange(val as string);
    });
    this.refreshTables();
  }

  private async _handleViewChange(view: string) {
    if (view === 'home' || view === 'wasm' || view === 'framework' || view === 'sqlite') {
      return;
    }

    if (view.startsWith('vega_')) {
      const specs: Record<string, any> = {
        vega_bar: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          description: 'A simple bar chart with embedded data',
          data: { values: [{ a: 'A', b: 28 }, { a: 'B', b: 55 }, { a: 'C', b: 43 }, { a: 'D', b: 91 }, { a: 'E', b: 14 }] },
          mark: 'bar',
          encoding: {
            x: { field: 'a', type: 'nominal', axis: { labelColor: 'white', titleColor: 'white' } },
            y: { field: 'b', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
          },
          config: { background: 'transparent', axis: { gridColor: 'rgba(255,255,255,0.1)' } },
        },
        vega_line: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          description: 'A simple line chart with embedded data',
          data: { values: [{ x: 0, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 15 }, { x: 3, y: 30 }, { x: 4, y: 25 }] },
          mark: 'line',
          encoding: {
            x: { field: 'x', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
            y: { field: 'y', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
          },
          config: { background: 'transparent', axis: { gridColor: 'rgba(255,255,255,0.1)' } },
        },
        vega_scatter: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          description: 'A simple scatter plot with embedded data',
          data: { values: [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 1 }, { x: 4, y: 8 }, { x: 5, y: 6 }] },
          mark: 'point',
          encoding: {
            x: { field: 'x', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
            y: { field: 'y', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
          },
          config: { background: 'transparent', axis: { gridColor: 'rgba(255,255,255,0.1)' } },
        },
      };

      const spec = specs[view] || specs.vega_bar;
      
      // Wait for the next tick so the DOM is rendered
      setTimeout(async () => {
        const container = this.querySelector('#vega-chart-container');
        if (container) {
          try {
            await embed(container, spec, { actions: false });
          } catch (e) {
            console.error('Vega embed error:', e);
          }
        }
      }, 0);
      return;
    }
    
    dbResultsSignal.value = [];

    if (!window.db) {
      dbResultsSignal.value = [{ error: 'Database not initialized. Please go to SQLite Native view and click Initialize.' }];
      return;
    }

    try {
      const results = await window.db.query(`SELECT * FROM ${view}`, []);
      dbResultsSignal.value = results;
    } catch (e: any) {
      dbResultsSignal.value = [{ error: e.message || e }];
    }
  }

  private async refreshTables() {
    if (!window.db) return;
    try {
      const result = await window.db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        []
      );
      dbTablesSignal.value = result.map(r => r.name);
    } catch (e: any) {
      if (e.message?.includes('Database not initialized')) {
        dbTablesSignal.value = [];
      } else {
        console.error("Failed to refresh tables:", e);
      }
    }
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

  private _handleDbInit = async () => {
    try {
      this.dbStatus = 'Initializing...';
      this.requestUpdate();
      const res = await window.db.init(this.dbPath);
      
      // Automatically seed the database after successful initialization
      this.dbStatus = 'Seeding demo data...';
      this.requestUpdate();
      await window.db.seed();
      
      this.dbStatus = res + ' (with demo data)';
      await this.refreshTables();
    } catch (e: any) {
      this.dbStatus = `Error: ${e.message || e}`;
    }
    this.requestUpdate();
  };

  private _handleDbQuery = async () => {
    try {
      const results = await window.db.query(this.sqlInput, []);
      dbResultsSignal.value = results;
    } catch (e: any) {
      dbResultsSignal.value = [{ error: e.message || e }];
    }
  };

  private _handleDbExecute = async () => {
    try {
      const res = await window.db.execute(this.sqlInput, []);
      this.dbStatus = res;
    } catch (e: any) {
      this.dbStatus = `Error: ${e.message || e}`;
    }
    this.requestUpdate();
  };

  private _handleSqlInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.sqlInput = target.value;
  };

  private _handlePathInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.dbPath = target.value;
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

  private _renderHome() {
    return html`
      <div class="space-y-24 py-12">
        <!-- Hero Section -->
        <section class="text-center space-y-6">
          <div class="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            Now in Public Beta
          </div>
          <h1 class="text-6xl md:text-7xl font-extrabold tracking-tight text-white">
            Browser API <br/>
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Extended
            </span>
          </h1>
          <p class="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            BAEX is a high-performance bridge between Rust/WASM and the DOM. 
            Experience native-speed computation with a seamless reactive framework.
          </p>
          <div class="flex items-center justify-center gap-4 pt-4">
            <button @click=${() => openTab('sqlite', 'SQLite Native')} class="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all">
              Get Started
            </button>
            <button @click=${() => openTab('framework', 'Framework')} class="px-8 py-3 bg-white/5 text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all">
              View Docs
            </button>
          </div>
        </section>

        <!-- Value Props -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 transition-all group">
            <div class="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <span class="text-2xl">⚡</span>
            </div>
            <h3 class="text-xl font-bold text-white mb-3">WASM Powered</h3>
            <p class="text-white/50 leading-relaxed">
              Execute computationally heavy tasks at near-native speed directly in the browser.
            </p>
          </div>
          <div class="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/30 transition-all group">
            <div class="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <span class="text-2xl">⚛️</span>
            </div>
            <h3 class="text-xl font-bold text-white mb-3">Reactive DOM</h3>
            <p class="text-white/50 leading-relaxed">
              A signal-based reactivity system that minimizes re-renders and maximizes efficiency.
            </p>
          </div>
          <div class="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/30 transition-all group">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <span class="text-2xl">💾</span>
            </div>
            <h3 class="text-xl font-bold text-white mb-3">Native SQLite</h3>
            <p class="text-white/50 leading-relaxed">
              Full relational database capabilities available directly in the client.
            </p>
          </div>
        </section>

        <!-- Feature Showcase -->
        <section class="space-y-8">
          <div class="text-center space-y-2">
            <h2 class="text-3xl font-bold text-white">Explore Capabilities</h2>
            <p class="text-white/50">Deep dive into the BAEX primitive set.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${[...WASM_ITEMS, ...FRAMEWORK_ITEMS].slice(0, 6).map((item) => html`
              <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all group cursor-pointer" @click=${() => openTab(item.group, item.group)}>
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white/40 uppercase tracking-wider">
                    ${item.group}
                  </span>
                  <span class="text-white/20 group-hover:text-white/60 transition-colors">→</span>
                </div>
                <h4 class="font-semibold text-white mb-1">${item.name}</h4>
                <p class="text-sm text-white/50 line-clamp-2">${item.desc}</p>
              </div>
            `)}
          </div>
          <div class="text-center">
            <button @click=${() => openTab('framework', 'Framework')} class="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
              View all primitives →
            </button>
          </div>
        </section>
      </div>
    `;
  }


  private _renderSqliteMgmt() {
    const results = dbResultsSignal.value;
    return html`
      <div class="text-[1.1rem] font-bold text-emerald-400 mt-6 mb-3 pb-2 border-b border-white/10 capitalize">SQLite Native</div>
      <div class="space-y-4 mt-4">
        <div class="flex gap-2">
          <input 
            type="text" 
            value=${this.dbPath} 
            @input=${this._handlePathInput}
            class="flex-1 px-3 py-2 rounded bg-white/[0.03] border border-white/10 text-sm" 
            placeholder="database.db"
          />
          <button @click=${this._handleDbInit} class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors">Initialize</button>
        </div>
        <div class="text-xs text-white/40">Status: <span class="text-white/80">${this.dbStatus}</span></div>
        
        <div class="space-y-2">
          <textarea 
            @input=${this._handleSqlInput}
            class="w-full h-24 px-3 py-2 rounded bg-white/[0.03] border border-white/10 text-sm font-mono" 
            placeholder="Enter SQL here..."
          >${this.sqlInput}</textarea>
          <div class="flex gap-2">
            <button @click=${this._handleDbQuery} class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors">Run Query</button>
            <button @click=${this._handleDbExecute} class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium transition-colors">Execute</button>
          </div>
        </div>

        <div class="mt-4 overflow-auto max-h-64 rounded border border-white/10 bg-white/[0.02]">
          <table class="w-full text-left text-xs">
            <thead class="bg-white/5 sticky top-0">
              <tr>
                ${results[0] ? Object.keys(results[0]).map(key => html`<th class="px-3 py-2 font-semibold">${key}</th>`) : html`<th>No Data</th>`}
              </tr>
            </thead>
            <tbody>
              ${results.map(row => html`
                <tr class="border-t border-white/5">
                  ${Object.values(row).map(val => html`<td class="px-3 py-2 opacity-70">${val}</td>`)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private _renderWasm() {
    return html`
      <div class="text-[1.1rem] font-bold text-amber-400 mt-6 mb-3 pb-2 border-b border-white/10 capitalize">Wasm Primitives</div>
      ${WASM_ITEMS.map((item, i) => this._renderAccordionItem(item, i))}
    `;
  }

  private _renderFramework() {
    return html`
      <div class="text-[1.1rem] font-bold text-blue-400 mt-6 mb-3 pb-2 border-b border-white/10 capitalize">Framework Primitives</div>
      ${FRAMEWORK_ITEMS.map((item, i) => this._renderAccordionItem(item, i + WASM_ITEMS.length))}
    `;
  }

  private _renderTable(tableName: string) {
    const results = dbResultsSignal.value;
    return html`
      <div class="text-[1.1rem] font-bold text-white mb-3 pb-2 border-b border-white/10 capitalize">${tableName}</div>
      <div class="mt-4 overflow-auto rounded border border-white/10 bg-white/[0.02]">
        <table class="w-full text-left text-xs">
          <thead class="bg-white/5 sticky top-0">
            <tr>
              ${results[0] ? Object.keys(results[0]).map(key => html`<th class="px-3 py-2 font-semibold">${key}</th>`) : html`<th>No Data</th>`}
            </tr>
          </thead>
          <tbody>
            ${results.map(row => html`
              <tr class="border-t border-white/5">
                ${Object.values(row).map(val => html`<td class="px-3 py-2 opacity-70">${val}</td>`)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
      <p class="text-xs text-white/40 mt-2">Displaying all rows from table: ${tableName}</p>
    `;
  }

  private _renderViewWrapper(title: string, content: any) {
    return html`
      <div class="max-w-5xl mx-auto py-12 px-6">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <button @click=${() => openTab('home', 'Home')} class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
              ← Back to Home
            </button>
            <h2 class="text-3xl font-bold text-white">${title}</h2>
          </div>
        </div>
        <div class="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8">
          ${content}
        </div>
      </div>
    `;
  }

  private _renderVegaChart(chartId: string) {
    const specs: Record<string, any> = {
      vega_bar: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: 'A simple bar chart with embedded data',
        data: { values: [{ a: 'A', b: 28 }, { a: 'B', b: 55 }, { a: 'C', b: 43 }, { a: 'D', b: 91 }, { a: 'E', b: 14 }] },
        mark: 'bar',
        encoding: {
          x: { field: 'a', type: 'nominal', axis: { labelColor: 'white', titleColor: 'white' } },
          y: { field: 'b', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
        },
        config: { background: 'transparent', axis: { gridColor: 'rgba(255,255,255,0.1)' } },
      },
      vega_line: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: 'A simple line chart with embedded data',
        data: { values: [{ x: 0, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 15 }, { x: 3, y: 30 }, { x: 4, y: 25 }] },
        mark: 'line',
        encoding: {
          x: { field: 'x', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
          y: { field: 'y', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
        },
        config: { background: 'transparent', axis: { gridColor: 'rgba(255,255,255,0.1)' } },
      },
      vega_scatter: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: 'A simple scatter plot with embedded data',
        data: { values: [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 1 }, { x: 4, y: 8 }, { x: 5, y: 6 }] },
        mark: 'point',
        encoding: {
          x: { field: 'x', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
          y: { field: 'y', type: 'quantitative', axis: { labelColor: 'white', titleColor: 'white' } },
        },
        config: { background: 'transparent', axis: { gridColor: 'rgba(255,255,255,0.1)' } },
      },
    };

    const spec = specs[chartId] || specs.vega_bar;

    return html`
      <div class="text-[1.1rem] font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10 capitalize">${chartId.replace('vega_', '')} Chart</div>
      <div class="mt-4 p-4 rounded border border-white/10 bg-white/[0.02] flex justify-center">
        <div id="vega-chart-container" class="w-full max-w-2xl"></div>
      </div>
      <p class="text-xs text-white/40 mt-2">Vega-Lite integration via npm</p>
    `;
  }

  render() {
    const view = viewSignal.value;
    
    if (view === 'home') {
      return html`
        <div class="flex flex-col items-center min-h-screen px-4 py-8">
          <div class="w-full max-w-6xl mt-24">
            ${this._renderHome()}
          </div>
          <baex-status-bar></baex-status-bar>
        </div>
      `;
    }

    let content;
    let title = view;
    if (view === 'sqlite') {
      title = 'SQLite Native';
      content = this._renderSqliteMgmt();
    } else if (view === 'wasm') {
      title = 'Wasm Primitives';
      content = this._renderWasm();
    } else if (view === 'framework') {
      title = 'Framework Primitives';
      content = this._renderFramework();
    } else if (typeof view === 'string' && view.startsWith('vega_')) {
      title = view.replace('vega_', '').replace('_', ' ') + ' Chart';
      content = this._renderVegaChart(view);
    } else {
      content = this._renderTable(view);
    }

    return html`
      <div class="flex flex-col items-center min-h-screen px-4 py-8">
        <div class="w-full max-w-6xl mt-24">
          ${this._renderViewWrapper(title, content)}
        </div>
        <baex-status-bar></baex-status-bar>
      </div>
    `;
  }


}

defineComponent('baex-app', AppElement);
