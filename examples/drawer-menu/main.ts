import { defineComponent, BaexElement, createSignal, html } from '@core/framework/index';
import { ensureWasmReady } from '@core/framework/wasm';
import { openTab } from '@core/state/router';

interface MenuItem {
    id: string;
    label: string;
    icon: string;
    color: string;
    description: string;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'profile', label: 'User Profile', icon: '👤', color: 'bg-blue-500', description: 'Manage your account settings' },
    { id: 'settings', label: 'System Settings', icon: '⚙️', color: 'bg-slate-500', description: 'Customize your experience' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', color: 'bg-amber-500', description: 'Stay updated with alerts' },
    { id: 'security', label: 'Security', icon: '🛡️', color: 'bg-emerald-500', description: 'Privacy & authentication' },
    { id: 'analytics', label: 'Analytics', icon: '📈', color: 'bg-purple-500', description: 'View your usage data' },
    { id: 'support', label: 'Help & Support', icon: '🎧', color: 'bg-rose-500', description: 'Get help from our team' },
];

class DrawerMenu extends BaexElement {
    isOpen = createSignal('drawer-open', false);
    selectedItem = createSignal('drawer-selected', null as string | null);

    render() {
        return html`
            <div class="relative min-h-screen w-full flex flex-col items-center justify-center overflow-y-auto bg-slate-950">
                <!-- Main Content -->
                <div class="text-center p-8 z-10">
                    <h1 class="text-4xl font-black mb-4 tracking-tighter text-white">BAEX <span class="text-blue-500">UI</span></h1>
                    <p class="text-slate-400 mb-8 max-w-xs mx-auto">Experience the power of WASM-driven reactivity with seamless animations.</p>
                    
                    <button 
                        @click=${() => this.isOpen.value = true}
                        class="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                    >
                        Open Quick Menu
                    </button>

                    ${this.selectedItem.value ? html`
                        <div class="mt-12 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            Selected: <span class="font-bold">${MENU_ITEMS.find(i => i.id === this.selectedItem.value)?.label}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Drawer Backdrop -->
                ${this.isOpen.value ? html`
                    <div 
                        @click=${() => this.isOpen.value = false}
                        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                    ></div>
                ` : ''}

                <!-- Sliding Drawer -->
                <div 
                    class="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out ${this.isOpen.value ? 'translate-y-0' : 'translate-y-full'}"
                >
                    <div class="bg-slate-900 border-t border-white/10 rounded-t-[40px] shadow-2xl max-w-2xl mx-auto overflow-hidden">
                        <!-- Handle -->
                        <div class="flex justify-center py-4 cursor-pointer hover:bg-white/5 transition-colors" @click=${() => this.isOpen.value = false}>
                            <div class="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                        </div>

                        <div class="p-8 overflow-y-auto max-h-[80vh]">
                            <div class="flex items-center justify-between mb-8">
                                <h2 class="text-2xl font-bold tracking-tight text-white">Quick Actions</h2>
                                <button 
                                    @click=${() => this.isOpen.value = false}
                                    class="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <!-- Grid of Cards -->
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                ${MENU_ITEMS.map(item => html`
                                    <div 
                                        @click=${() => {
                                            this.selectedItem.value = item.id;
                                            openTab(item.id, item.label);
                                            this.isOpen.value = false;
                                        }}
                                        class="p-4 rounded-3xl border border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-white/10 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        style="animation-delay: ${MENU_ITEMS.indexOf(item) * 50}ms"
                                    >
                                        <div class="w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                            ${item.icon}
                                        </div>
                                        <div class="font-bold text-sm mb-1 text-white">${item.label}</div>
                                        <div class="text-[10px] text-slate-500 leading-tight">${item.description}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="p-6 bg-slate-950/50 border-t border-white/5 text-center">
                            <p class="text-xs text-slate-600 font-mono">BAEX Drawer System v1.0.0</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

async function init() {
    await ensureWasmReady();
    defineComponent('baex-drawer-menu', DrawerMenu);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-drawer-menu></baex-drawer-menu>';
    }
}

init();
