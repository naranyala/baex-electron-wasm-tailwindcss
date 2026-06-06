import { defineComponent, BaexElement, createSignal, html } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';

// Child Component: a simple Card
class InfoCard extends BaexElement {
    // Properties passed from parent
    static properties = {
        title: { type: String },
        content: { type: String },
        color: { type: String }
    };

    render() {
        const bgColor = this.color === 'blue' ? 'bg-blue-900/30 border-blue-500' : 
                        this.color === 'green' ? 'bg-green-900/30 border-green-500' : 
                        'bg-slate-700 border-slate-500';
        
        return html`
            <div class="p-4 rounded-lg border-l-4 ${bgColor}">
                <h3 class="font-bold mb-1">${this.title}</h3>
                <p class="text-sm text-slate-300">${this.content}</p>
            </div>
        `;
    }
}

// Parent Component
class Dashboard extends BaexElement {
    status = createSignal('status', 'Active');

    render() {
        return html`
            <div class="p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700 max-w-lg">
                <h1 class="text-2xl font-bold mb-6 text-center">Composition Demo</h1>
                
                <div class="flex justify-center mb-6">
                    <button 
                        @click=${() => this.status.value = this.status.value === 'Active' ? 'Idle' : 'Active'}
                        class="px-4 py-1 rounded-full text-xs font-bold transition-all ${this.status.value === 'Active' ? 'bg-green-500 text-green-950' : 'bg-slate-600 text-slate-300'}"
                    >
                        System: ${this.status.value}
                    </button>
                </div>

                <div class="grid gap-4">
                    <baex-info-card 
                        title="Performance" 
                        content="The WASM engine is running at peak efficiency." 
                        color="green"
                    ></baex-info-card>
                    
                    <baex-info-card 
                        title="Connectivity" 
                        content="Linked to the Electron main process." 
                        color="blue"
                    ></baex-info-card>
                    
                    <baex-info-card 
                        title="Notice" 
                        content="System status is currently: ${this.status.value}" 
                        color="slate"
                    ></baex-info-card>
                </div>
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-info-card', InfoCard);
    defineComponent('baex-dashboard', Dashboard);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-dashboard></baex-dashboard>';
    }
}

init();
