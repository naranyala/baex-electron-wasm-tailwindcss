import { BaexElement, defineComponent, html, createSignal } from '@core/framework/index';
import { wasm } from '@core/framework/wasm';
import { mathUtils, stringUtils } from '@core/framework/utils-wasm';

export class BaexStatusBar extends BaexElement {
    isOpen = createSignal('status-bar-open', false);
    searchQuery = createSignal('status-bar-search', '');
    showDevTools = createSignal('baex-devtools-open', false);

    private _projectName: string = '';

    onConnected() {
        const base = document.baseURI || '';
        const match = base.match(/([^/]+)\/dist\//);
        this._projectName = match ? match[1] : 'baex-framework';
    }

    private _getAllFunctions() {
        const primitives = Object.keys(wasm).map(key => ({
            name: key,
            category: 'Framework Primitive',
            color: 'text-blue-400'
        }));
        const maths = Object.keys(mathUtils).map(key => ({
            name: key,
            category: 'Math Utility',
            color: 'text-purple-400'
        }));
        const strings = Object.keys(stringUtils).map(key => ({
            name: key,
            category: 'String Utility',
            color: 'text-purple-400'
        }));
        return [...primitives, ...maths, ...strings];
    }

    render() {
        const primitivesCount = Object.keys(wasm).length;
        const utilsCount = Object.keys(mathUtils).length + Object.keys(stringUtils).length;
        const allFuncs = this._getAllFunctions().filter(f => 
            f.name.toLowerCase().includes(this.searchQuery.value.toLowerCase())
        );
        
        return html`
            <div class="baex-status-bar-container">
                <div 
                    @click=${() => {
                        if (this.isOpen.value) {
                            this.isOpen.value = false;
                        } else {
                            this.isOpen.value = true;
                            this.showDevTools.value = false;
                        }
                    }}
                    class="fixed bottom-0 left-0 right-0 h-6 bg-[#020917]/90 backdrop-blur-sm border-t border-white/[0.04] text-[10px] text-white/35 flex items-center px-4 justify-between z-50 cursor-pointer hover:bg-[#020917] transition-colors"
                >
                    <div class="flex items-center gap-1 min-w-0 truncate">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span class="font-mono truncate">${this._projectName}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            FW: <span class="text-white font-mono">${primitivesCount}</span>
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            WASM: <span class="text-white font-mono">${utilsCount}</span>
                        </span>
                        <span class="text-white/20">|</span>
                        <span @click=${(e: any) => {
                            e.stopPropagation();
                            this.showDevTools.value = true;
                            this.isOpen.value = false;
                        }} class="hover:text-white cursor-pointer transition-colors font-bold">DEVTOOLS</span>
                        <span class="text-white/20">|</span>
                        <span>v0.0.0</span>
                        <span class="text-white/20">|</span>
                        <span>WASM Ready</span>
                    </div>
                </div>

                ${this.isOpen.value ? html`
                    <div 
                        @click=${() => {
                            this.isOpen.value = false;
                        }}
                        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        <div 
                            @click=${(e: any) => {
                                e.stopPropagation();
                            }}
                            class="w-full max-w-md bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div class="p-4 border-b border-white/10 bg-slate-800/50">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-bold">WASM Registry</h3>
                                    <button @click=${() => {
                                        this.isOpen.value = false;
                                    }} class="text-white/40 hover:text-white text-xl">&times;</button>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Fuzzy search functions..."
                                    class="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                    .value=${this.searchQuery.value}
                                    @input=${(e: any) => this.searchQuery.value = e.target.value}
                                />
                            </div>
                            <div class="overflow-y-auto p-2 space-y-1">
                                ${allFuncs.length > 0 
                                    ? allFuncs.map(f => html`
                                        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default group">
                                            <span class="font-mono text-sm ${f.color}">${f.name}</span>
                                            <span class="text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">${f.category}</span>
                                        </div>
                                    `).join('')
                                    : html`<div class="text-center py-8 text-white/30 text-sm">No functions match your search</div>`
                                }
                            </div>
                            <div class="p-3 bg-slate-900/50 border-t border-white/10 text-center text-[10px] text-white/30">
                                Total functions exposed: ${this._getAllFunctions().length}
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${this.showDevTools.value ? html`
                    <div 
                        @click=${() => {
                            this.showDevTools.value = false;
                        }}
                        class="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-8"
                    >
                        <div 
                            @click=${(e: any) => {
                                e.stopPropagation();
                            }}
                            class="w-full max-w-5xl bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh]"
                        >
                            <div class="p-6 border-b border-white/10 flex items-center justify-between bg-slate-800/50">
                                <div>
                                    <h3 class="text-2xl font-black text-white tracking-tight">BAEX <span class="text-blue-500">DevTools</span></h3>
                                    <p class="text-xs text-white/40">Intermediate Representation & Pipeline Inspector</p>
                                </div>
                                <button @click=${() => {
                                    this.showDevTools.value = false;
                                }} class="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors text-2xl">&times;</button>
                            </div>
                            
                            <div class="flex-1 overflow-hidden flex">
                                <div class="w-64 border-r border-white/10 bg-slate-950/50 p-4 flex flex-col gap-2">
                                    <div class="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Pipeline Layers</div>
                                    <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">Source Template</div>
                                    <div class="p-2 rounded-lg hover:bg-white/5 text-white/60 text-sm cursor-pointer transition-colors">AST Parser</div>
                                    <div class="p-2 rounded-lg hover:bg-white/5 text-white/60 text-sm cursor-pointer transition-colors">Optimized IR</div>
                                    <div class="p-2 rounded-lg hover:bg-white/5 text-white/60 text-sm cursor-pointer transition-colors">Binding Map</div>
                                </div>
                                
                                <div class="flex-1 overflow-auto p-6 bg-slate-900">
                                    <div class="mb-6">
                                        <h4 class="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
                                            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Current IR State
                                        </h4>
                                        <div class="bg-black/40 rounded-xl p-4 font-mono text-xs text-emerald-400 border border-white/5 leading-relaxed whitespace-pre-wrap">
                                            ${`// Pipeline: Template -> AST -> OptimizedIR\n\n{`}\n
                                            ${`  "html": "...",\n`}\n
                                            ${`  "bindings": [\n`}\n
                                            ${`    { "marker": "b1", "type": "property", "prop": "value" },\n`}\n
                                            ${`    { "marker": "b2", "type": "event", "event": "click" }\n`}\n
                                            ${`  ]\n`}\n
                                            ${`}`}
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div class="text-xs font-bold text-white/30 uppercase mb-2">WASM Component ID</div>
                                            <div class="text-xl font-mono text-white">0x${(Math.random()*0xFFFFFF).toString(16).toUpperCase()}</div>
                                        </div>
                                        <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div class="text-xs font-bold text-white/30 uppercase mb-2">Dependency Count</div>
                                            <div class="text-xl font-mono text-white">12 Signals</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-4 bg-slate-950 border-t border-white/10 flex justify-between items-center">
                                <div class="flex items-center gap-4 text-[10px] text-white/30">
                                    <span class="flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-green-500"></span> Sync Active</span>
                                    <span class="flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-blue-500"></span> Tracking Enabled</span>
                                </div>
                                <div class="text-[10px] font-mono text-white/20">BAEX_IR_V1.0.4</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

defineComponent('baex-status-bar', BaexStatusBar);
