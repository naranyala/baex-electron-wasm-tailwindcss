import { defineComponent, BaexElement, createSignal, Computed, html } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';

class Calculator extends BaexElement {
    num1 = createSignal('num1', 0);
    num2 = createSignal('num2', 0);
    
    // Computed signal that depends on num1 and num2
    sum = new Computed(() => this.num1.value + this.num2.value);
    product = new Computed(() => this.num1.value * this.num2.value);
    
    render() {
        return html`
            <div class="p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700 max-w-sm">
                <h1 class="text-2xl font-bold mb-6 text-center">Computed Signals</h1>
                
                <div class="space-y-4 mb-8">
                    <div class="flex items-center gap-4">
                        <label class="w-20 text-sm text-slate-400">Value A:</label>
                        <input 
                            type="number" 
                            class="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                            .value=${this.num1.value}
                            @input=${(e: any) => this.num1.value = parseInt(e.target.value) || 0}
                        />
                    </div>
                    <div class="flex items-center gap-4">
                        <label class="w-20 text-sm text-slate-400">Value B:</label>
                        <input 
                            type="number" 
                            class="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                            .value=${this.num2.value}
                            @input=${(e: any) => this.num2.value = parseInt(e.target.value) || 0}
                        />
                    </div>
                </div>

                <div class="space-y-2 p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-400">Sum:</span>
                        <span class="font-mono font-bold text-green-400">${this.sum.value}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-400">Product:</span>
                        <span class="font-mono font-bold text-blue-400">${this.product.value}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-calculator', Calculator);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-calculator></baex-calculator>';
    }
}

init();
