import { BaexElement, defineComponent, html } from '../framework/index.js';
import { Raw } from '../framework/template.js';
import { openTab, navigateTo, getViewSignal, getDbResultsSignal, getDbTablesSignal } from '../state/router.js';
import { WASM_ITEMS, FRAMEWORK_ITEMS, type ApiItem } from '../state/api-items.js';
import { BaexCodeBlock } from './code-block.js';
import { BaexNav } from './nav.js';
import { BaexStatusBar } from './status-bar.js';
import embed from 'vega-embed';

defineComponent('baex-code-block', BaexCodeBlock);
defineComponent('baex-nav', BaexNav);
defineComponent('baex-status-bar', BaexStatusBar);

interface GridItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  category: string;
}

const GRID_ITEMS: GridItem[] = [
  { id: 'sqlite', name: 'SQLite Native', desc: 'Initialize and query a local SQLite database via the Rust native addon', icon: '🗄️', color: 'emerald', category: 'database' },
  { id: 'wasm', name: 'WASM Primitives', desc: 'Explore low-level WebAssembly functions — greet, math, and signals', icon: '⚡', color: 'amber', category: 'runtime' },
  { id: 'framework', name: 'Framework', desc: 'Browse the BAEX reactive UI framework components and APIs', icon: '🧩', color: 'blue', category: 'runtime' },
  { id: 'vega_bar', name: 'Bar Chart', desc: 'Visualize categorical data distribution with Vega-Lite', icon: '📊', color: 'rose', category: 'charts' },
  { id: 'vega_line', name: 'Line Chart', desc: 'Plot trends and sequences over time', icon: '📈', color: 'indigo', category: 'charts' },
  { id: 'vega_scatter', name: 'Scatter Plot', desc: 'Explore correlations between two variables', icon: '🔵', color: 'cyan', category: 'charts' },
];

const RAG_GRID_ITEMS: GridItem[] = [
  { id: 'rag_loader', name: 'Data Loaders', desc: 'Connect to PDF, Markdown, S3, or Web sources for raw text extraction', icon: '📥', color: 'emerald', category: 'ingestion' },
  { id: 'rag_chunking', name: 'Text Splitters', desc: 'Configure recursive, character, or semantic chunking strategies', icon: '✂️', color: 'emerald', category: 'ingestion' },
  { id: 'rag_cleaning', name: 'Data Cleaning', desc: 'Remove noise, boilerplate, and PII from extracted content', icon: '🧹', color: 'emerald', category: 'ingestion' },
  { id: 'rag_embeddings', name: 'Embedding Models', desc: 'Select and tune models (OpenAI, HuggingFace, Cohere) for vectorization', icon: '🧬', color: 'amber', category: 'vector_ops' },
  { id: 'rag_vector_store', name: 'Vector Database', desc: 'Manage indexes in Pinecone, Milvus, Weaviate, or FAISS', icon: '🗄️', color: 'amber', category: 'vector_ops' },
  { id: 'rag_index_mgmt', name: 'Index Manager', desc: 'Create, delete, and optimize vector namespaces and collections', icon: '⚙️', color: 'amber', category: 'vector_ops' },
  { id: 'rag_search', name: 'Search Strategies', desc: 'Toggle between Semantic, Keyword (BM25), and Hybrid search', icon: '🔍', color: 'blue', category: 'retrieval' },
  { id: 'rag_reranker', name: 'Re-ranking', desc: 'Apply Cross-Encoders to refine the top-k retrieved documents', icon: '🎯', color: 'blue', category: 'retrieval' },
  { id: 'rag_context', name: 'Context Window', desc: 'Manage top-k results and context compression to avoid LLM overflow', icon: '📦', color: 'blue', category: 'retrieval' },
  { id: 'rag_prompt', name: 'Prompt Studio', desc: 'Design system prompts and define how context is injected into the query', icon: '✍️', color: 'purple', category: 'generation' },
  { id: 'rag_llm_config', name: 'Model Tuning', desc: 'Adjust Temperature, Top-P, and Max Tokens for different LLM versions', icon: '🌡️', color: 'purple', category: 'generation' },
  { id: 'rag_memory', name: 'Chat Memory', desc: 'Configure window-based or summary-based conversation history', icon: '🧠', color: 'purple', category: 'generation' },
  { id: 'rag_eval', name: 'RAGAS Metrics', desc: 'Measure Faithfulness, Answer Relevance, and Context Precision', icon: '📈', color: 'rose', category: 'evaluation' },
  { id: 'rag_ground_truth', name: 'Gold Dataset', desc: 'Compare system responses against manually verified ground truth', icon: '✅', color: 'rose', category: 'evaluation' },
  { id: 'rag_traces', name: 'Chain Tracing', desc: 'Inspect full execution logs from retrieval to final response', icon: '🕵️', color: 'rose', category: 'evaluation' },
  { id: 'rag_keys', name: 'API Key Vault', desc: 'Securely manage keys for OpenAI, Anthropic, and Vector DBs', icon: '🔑', color: 'cyan', category: 'infra' },
  { id: 'rag_monitor', name: 'Resource Monitor', desc: 'Track GPU/CPU usage and API latency for the RAG pipeline', icon: '🖥️', color: 'cyan', category: 'infra' },
];


function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (q[qi] === t[ti]) qi++;
  }
  return qi === q.length;
}

export class AppElement extends BaexElement {
  static properties = {
    dbStatus: { type: String },
  };

  searchQuery = '';
  sqlInput = 'SELECT * FROM users';
  dbStatus = 'Not initialized';

  private _unsubscribeView: (() => void) | null = null;
  private _copyTimer: number | null = null;

  onConnected() {
    this.addEventListener('click', this._handleClick);
    this.addEventListener('input', this._handleInput);
    this._unsubscribeView = getViewSignal().subscribe((val: any) => {
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
        const container = this.querySelector('#vega-chart-container') as HTMLElement | null;
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
    
    getDbResultsSignal().value = [];

    if (!window.db) {
      getDbResultsSignal().value = [{ error: 'Database not initialized. Please go to SQLite Native view and click Initialize.' }];
      return;
    }

    try {
      const results = await window.db.query(`SELECT * FROM ${view}`, []);
      getDbResultsSignal().value = results;
    } catch (e: any) {
      getDbResultsSignal().value = [{ error: e.message || e }];
    }
  }

  private async refreshTables() {
    if (!window.db) return;
    try {
      const result = await window.db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        []
      );
      getDbTablesSignal().value = result.map(r => r.name);
    } catch (e: any) {
      if (e.message?.includes('Database not initialized')) {
        getDbTablesSignal().value = [];
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
      this.dbStatus = 'Initializing in-memory database...';
      this.requestUpdate();
      const res = await window.db.init();
      
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
      getDbResultsSignal().value = results;
    } catch (e: any) {
      getDbResultsSignal().value = [{ error: e.message || e }];
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


  private _renderSqliteMgmt() {
    const results = getDbResultsSignal().value;
    return html`
      <div class="text-[1.1rem] font-bold text-emerald-400 mt-6 mb-3 pb-2 border-b border-white/10 capitalize">SQLite (In-Memory)</div>
      <div class="space-y-4 mt-4">
        <div class="flex gap-2">
          <button @click=${this._handleDbInit} class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors">Initialize & Seed</button>
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
              ${results.map((row: any) => html`
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
    const results = getDbResultsSignal().value;
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
            ${results.map((row: any) => html`
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

  private _renderActiveContent(view: string) {
    let title: string;
    let content: any;
 
    if (view === 'sqlite') {
      title = 'SQLite Native';
      content = this._renderSqliteMgmt();
    } else if (view === 'wasm') {
      title = 'Wasm Primitives';
      content = this._renderWasm();
    } else if (view === 'framework') {
      title = 'Framework Primitives';
      content = this._renderFramework();
    } else if (view.startsWith('rag_')) {
      title = view.replace('rag_', '').replace('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      content = this._renderRagDetail(view);
    } else if (view.startsWith('vega_')) {
      title = view.replace('vega_', '').replace('_', ' ') + ' Chart';
      content = this._renderVegaChart(view);
    } else {
      title = view;
      content = this._renderTable(view);
    }
 
    return html`
      <div class="flex items-center gap-3 mb-6">
        <button @click=${() => navigateTo('home')} class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-sm">
          ← Back
        </button>
        <h2 class="text-xl font-bold text-white/90">${title}</h2>
      </div>
      <div class="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
        ${content}
      </div>
    `;
  }

  private _renderRagDetail(id: string) {
    const item = RAG_GRID_ITEMS.find(i => i.id === id);
    return html`
      <div class="space-y-4">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">${item?.icon || '🛠️'}</span>
          <div>
            <h3 class="text-lg font-semibold">${item?.name || 'Unknown'}</h3>
            <p class="text-sm text-white/40">${item?.desc || ''}</p>
          </div>
        </div>
        <div class="p-8 rounded-xl border border-dashed border-white/10 text-center text-white/30">
          Backend implementation for <strong>${item?.name}</strong> is pending.
        </div>
      </div>
    `;
  }


  private _renderVegaChart(chartId: string) {
    return html`
      <div class="text-[1.1rem] font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10 capitalize">${chartId.replace('vega_', '')} Chart</div>
      <div class="mt-4 p-4 rounded border border-white/10 bg-white/[0.02] flex justify-center">
        <div id="vega-chart-container" class="w-full max-w-2xl"></div>
      </div>
      <p class="text-xs text-white/40 mt-2">Vega-Lite integration via npm</p>
    `;
  }

  render() {
    const view = getViewSignal().value;
    const q = this.searchQuery;

    const filtered = q
      ? [...GRID_ITEMS, ...RAG_GRID_ITEMS].filter(
          (item) =>
            fuzzyMatch(q, item.name) ||
            fuzzyMatch(q, item.desc) ||
            fuzzyMatch(q, item.category),
        )
      : [...GRID_ITEMS, ...RAG_GRID_ITEMS];

    const borderColors: Record<string, string> = {
      emerald: 'rgba(52,211,153,0.3)', amber: 'rgba(251,191,36,0.3)',
      blue: 'rgba(96,165,250,0.3)', rose: 'rgba(251,113,133,0.3)',
      indigo: 'rgba(129,140,248,0.3)', cyan: 'rgba(34,211,238,0.3)',
    };
    const categoryColors: Record<string, string> = {
      database: '#10b981', runtime: '#8b5cf6', charts: '#f59e0b',
    };

    return html`
      <div class="flex flex-col min-h-screen">
        <div class="flex-1 px-4 py-8">
          <div class="w-full max-w-5xl mx-auto mt-20 space-y-8">
            <div class="text-center space-y-2">
              <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">
                <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  BAEX
                </span>
              </h1>
            </div>

            <div class="max-w-lg mx-auto relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-lg">⌕</span>
              <input
                data-search
                type="text"
                placeholder="Fuzzy search features…"
                class="w-full px-11 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/90 text-sm placeholder:text-white/20 outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-all"
              />
              ${q ? html`
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">${filtered.length} result${filtered.length !== 1 ? 's' : ''}</span>
              ` : ''}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${filtered.map(
                (item) => html`
                  <div
                    @click=${() => openTab(item.id, item.name)}
                    class="home-card group relative p-5 rounded-2xl bg-white/[0.02] border cursor-pointer transition-all ${view === item.id
                      ? 'border-white/20 ring-1 ring-white/10 bg-white/[0.04]'
                      : 'border-white/[0.05] hover:bg-white/[0.05]'}"
                    style="--hc: ${borderColors[item.color] || 'rgba(255,255,255,0.1)'}"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <span class="text-2xl">${item.icon}</span>
                      <span
                        class="text-[0.65rem] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05]"
                        style="color: ${categoryColors[item.category] || 'rgba(255,255,255,0.3)'}"
                      >
                        ${item.category}
                      </span>
                    </div>
                    <h3 class="font-semibold text-white/90 text-[0.95rem] mb-1.5">${item.name}</h3>
                    <p class="text-xs text-white/40 leading-relaxed line-clamp-2">${item.desc}</p>
                  </div>
                `,
              )}
            </div>

            ${filtered.length === 0 && q ? html`
              <div class="text-center py-16 text-white/30">
                <p class="text-lg">No matches for <span class="text-white/50 font-mono">"${this.searchQuery}"</span></p>
                <p class="text-sm mt-1 text-white/20">Try a different keyword</p>
              </div>
            ` : ''}

            ${filtered.length === 0 && !q ? html`
              <div class="text-center py-16 text-white/20">
                <p class="text-lg">No features available yet.</p>
              </div>
            ` : ''}

            ${view !== 'home' ? html`
              <div class="pt-6 border-t border-white/[0.06]">
                ${this._renderActiveContent(view)}
              </div>
            ` : ''}
          </div>
        </div>
        <baex-status-bar></baex-status-bar>
      </div>
    `;
  }


}

defineComponent('baex-app', AppElement);
