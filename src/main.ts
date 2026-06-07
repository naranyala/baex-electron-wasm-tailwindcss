import './index.css';
import { ensureWasmReady } from './framework/wasm.js';
import { initDatabase, seedDatabase, executeSql, querySql } from './sqlite/db.js';
import { handleGlobalError } from './framework/error-handler.js';
import './components/app.js';
 
const rootEl = document.querySelector('#root');
if (!rootEl) throw new Error('#root not found');
 
const loaderText = document.getElementById('loader-text');
 
const steps = [
  { msg: 'Compiling WebAssembly modules…', at: 0 },
  { msg: 'Initializing WASM engine…', at: 300 },
  { msg: 'Initializing SQLite…', at: 500 },
  { msg: 'Registering signal store…', at: 700 },
  { msg: 'Mounting BAEX framework…', at: 1200 },
];
 
for (const step of steps) {
  setTimeout(() => {
    if (loaderText) loaderText.textContent = step.msg;
  }, step.at);
}
 
async function boot() {
  try {
    await ensureWasmReady();
    await initDatabase();
 
    window.db = {
      init: async () => {
        await initDatabase();
        return 'In-memory database initialized successfully';
      },
      seed: async () => seedDatabase(),
      execute: async (sql: string, params: any[]) => executeSql(sql, params),
      query: async (sql: string, params: any[]) => querySql(sql, params),
    };
 
    if (loaderText) loaderText.textContent = 'Ready ✦';
    setTimeout(() => {
      document.body.classList.add('loaded');
      setTimeout(() => {
        rootEl!.innerHTML = '<baex-app></baex-app>';
      }, 300);
    }, 400);
  } catch (e) {
    handleGlobalError(e instanceof Error ? e : new Error(String(e)), 'Boot Process');
  }
}
 
// Catch unhandled promise rejections
// (Moved to setupGlobalErrorHandling in index.html)

// Catch synchronous uncaught errors
// (Moved to setupGlobalErrorHandling in index.html)
 
boot();

