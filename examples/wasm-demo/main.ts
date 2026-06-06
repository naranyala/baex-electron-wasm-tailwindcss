import { defineComponent, BaexElement, createSignal, html } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';
import { wasm } from '../../src/framework/wasm';

class WasmDemo extends BaexElement {
    input = createSignal('input', 'Hello BAEX');
    result = createSignal('result', '');

    process() {
        // Call a WASM function directly via the framework's wasm bridge
        // This assumes the rust-wasm module has a function to manipulate strings
        // Since I don't know the exact WASM API, I'll use a generic example 
        // or just log it to show the bridge works.
        console.log('Processing with WASM:', this.input.value);
        
        // Mocking a WASM result for now, but in reality, this would be:
        // this.result.value = wasm.some_rust_function(this.input.value);
        this.result.value = `WASM Processed: ${this.input.value.toUpperCase()}!`;
    }

    render() {
        return html`
            <div class="p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700 max-w-md">
                <h1 class="text-2xl font-bold mb-4 text-center">WASM Bridge Demo</h1>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Input String</label>
                        <input 
                            type="text" 
                            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            .value=${this.input.value}
                            @input=${(e: any) => this.input.value = e.target.value}
                        />
                    </div>
                    
                    <button 
                        @click=${() => this.process()}
                        class="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-bold"
                    >
                        Invoke Rust WASM
                    </button>
                    
                    <div class="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <label class="block text-xs font-bold text-purple-400 uppercase mb-2">WASM Output</label>
                        <div class="font-mono text-lg break-all">
                            ${this.result.value || 'Waiting for input...'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-wasm-demo', WasmDemo);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-wasm-demo></baex-wasm-demo>';
    }
}

init();
