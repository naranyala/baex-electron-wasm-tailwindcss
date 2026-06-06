import './index.css';
import { ensureWasmReady } from './framework/wasm.js';
import './components/app.js';

const rootEl = document.querySelector('#root');
if (!rootEl) throw new Error('#root not found');

ensureWasmReady().then(() => {
  rootEl.innerHTML = '<baex-app></baex-app>';
});
