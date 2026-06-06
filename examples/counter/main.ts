import { defineComponent, BaexElement, createSignal, html, css } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';

class Counter extends BaexElement {
    // Use the framework's signal system
    count = createSignal('count', 0);

    render() {
        return html`
            <div class="p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700 text-center">
                <h1 class="text-2xl font-bold mb-4">BAEX Counter</h1>
                <div class="text-6xl font-mono mb-6">${this.count.value}</div>
                <div class="flex gap-4 justify-center">
                    <button 
                        @click=${() => this.count.value--}
                        class="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                        Decrement
                    </button>
                    <button 
                        @click=${() => this.count.value++}
                        class="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                    >
                        Increment
                    </button>
                </div>
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-counter', Counter);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-counter></baex-counter>';
    }
}

init();
