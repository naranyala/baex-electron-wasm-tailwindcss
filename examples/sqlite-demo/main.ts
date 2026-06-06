import { defineComponent, BaexElement, createSignal, html } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';

// Extend window interface for TypeScript
declare global {
  interface Window {
    db: {
      init: (path: string) => Promise<string>;
      execute: (sql: string, params: any[]) => Promise<string>;
      query: (sql: string, params: any[]) => Promise<any[]>;
    };
  }
}

class SqliteDemo extends BaexElement {
    status = createSignal('status', 'Not Initialized');
    results = createSignal('results', [] as any[]);
    queryText = createSignal('queryText', 'SELECT name FROM sqlite_master WHERE type="table"');

    async initDb() {
        try {
            const res = await window.db.init('baex_test.db');
            this.status.value = res;
        } catch (e: any) {
            this.status.value = 'Error: ' + e.message;
        }
    }

    async runQuery() {
        try {
            const res = await window.db.query(this.queryText.value, []);
            this.results.value = res;
        } catch (e: any) {
            this.status.value = 'Query Error: ' + e.message;
        }
    }

    async createTable() {
        try {
            await window.db.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)', []);
            await window.db.execute('INSERT INTO users (name) VALUES ("BAEX User")', []);
            this.status.value = 'Table created and user inserted!';
        } catch (e: any) {
            this.status.value = 'Execute Error: ' + e.message;
        }
    }

    render() {
        return html`
            <div class="w-full max-w-2xl p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700 space-y-6">
                <h1 class="text-2xl font-bold text-center mb-4">SQLite Native Rust Bridge</h1>
                
                <div class="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <span class="text-sm font-medium">DB Status: <span class="text-blue-400">${this.status.value}</span></span>
                    <button @click=${() => this.initDb()} class="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs transition-colors">
                        Initialize DB
                    </button>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 bg-slate-700 rounded-lg border border-slate-600">
                        <h3 class="text-sm font-bold mb-3 text-slate-300">Database Management</h3>
                        <button @click=${() => this.createTable()} class="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors">
                            Create Table & Insert Data
                        </button>
                    </div>

                    <div class="p-4 bg-slate-700 rounded-lg border border-slate-600">
                        <h3 class="text-sm font-bold mb-3 text-slate-300">Query Console</h3>
                        <div class="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                class="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg font-mono text-sm"
                                .value=${this.queryText.value}
                                @input=${(e: any) => this.queryText.value = e.target.value}
                            />
                            <button @click=${() => this.runQuery()} class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors">
                                Run
                            </button>
                        </div>
                        <div class="p-3 bg-slate-900 rounded-lg font-mono text-xs overflow-auto max-h-40 border border-slate-800">
                            ${this.results.value.length > 0 
                                ? this.results.value.map(r => html`<div>${JSON.stringify(r)}</div>`).join('')
                                : '<span class="text-slate-600">No results to display...</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-sqlite-demo', SqliteDemo);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-sqlite-demo></baex-sqlite-demo>';
    }
}

init();
