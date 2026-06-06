import { defineComponent, BaexElement, createSignal, html } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';
import { loadWasmUtils, mathUtils, stringUtils } from '../../src/framework/utils-wasm';

class UtilsShowcase extends BaexElement {
    numA = createSignal('numA', 0);
    numB = createSignal('numB', 0);
    textInput = createSignal('textInput', 'Hello BAEX');

    async connectedCallback() {
        super.connectedCallback();
        await loadWasmUtils();
        this.requestUpdate();
    }

    render() {
        return html`
            <div class="w-full max-w-2xl p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 class="text-xl font-bold mb-4 text-blue-400">Math Utilities</h2>
                    <div class="space-y-4">
                        <div class="flex gap-2">
                            <input type="number" class="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                                .value=${this.numA.value} @input=${(e: any) => this.numA.value = parseInt(e.target.value) || 0} />
                            <input type="number" class="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                                .value=${this.numB.value} @input=${(e: any) => this.numB.value = parseInt(e.target.value) || 0} />
                        </div>
                        <div class="p-3 bg-slate-900 rounded-lg font-mono text-sm space-y-1">
                            <div>Add: ${mathUtils.add(this.numA.value, this.numB.value)}</div>
                            <div>Multiply: ${mathUtils.multiply(this.numA.value, this.numB.value)}</div>
                            <div>Factorial (A): ${mathUtils.factorial(this.numA.value)}</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 class="text-xl font-bold mb-4 text-purple-400">String Utilities</h2>
                    <div class="space-y-4">
                        <input type="text" class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg" 
                            .value=${this.textInput.value} @input=${(e: any) => this.textInput.value = e.target.value} />
                        <div class="p-3 bg-slate-900 rounded-lg font-mono text-sm space-y-1">
                            <div>Reverse: ${stringUtils.reverse(this.textInput.value)}</div>
                            <div>Vowels: ${stringUtils.countVowels(this.textInput.value)}</div>
                            <div>SnakeCase: ${stringUtils.toSnakeCase(this.textInput.value)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-utils-showcase', UtilsShowcase);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-utils-showcase></baex-utils-showcase>';
    }
}

init();
