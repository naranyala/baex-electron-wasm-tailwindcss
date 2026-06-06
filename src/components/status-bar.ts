import { BaexElement, defineComponent, html } from '../framework/index.js';
import { wasm } from '../framework/wasm.js';
import { mathUtils, stringUtils } from '../framework/utils-wasm.js';

export class BaexStatusBar extends BaexElement {
    render() {
        const primitivesCount = Object.keys(wasm).length;
        const utilsCount = Object.keys(mathUtils).length + Object.keys(stringUtils).length;
        
        return html`
            <div class="fixed bottom-0 left-0 right-0 h-6 bg-slate-900/80 backdrop-blur-sm border-t border-white/10 text-[10px] text-white/40 flex items-center px-3 justify-between z-50 pointer-events-none">
                <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Framework Primitives: <span class="text-white font-mono">${primitivesCount}</span>
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Regular WASM Utils: <span class="text-white font-mono">${utilsCount}</span>
                    </span>
                </div>
                <div class="flex items-center gap-2 opacity-60">
                    <span>BAEX Engine v0.0.0</span>
                    <span class="text-white/20">|</span>
                    <span>WASM Ready</span>
                </div>
            </div>
        `;
    }
}

defineComponent('baex-status-bar', BaexStatusBar);
