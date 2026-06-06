import { defineComponent, BaexElement, createSignal, html } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';

interface User {
    id: number;
    name: string;
    email: string;
    company: { name: string };
}

class UserList extends BaexElement {
    users = createSignal('users', [] as User[]);
    loading = createSignal('loading', false);
    error = createSignal('error', '');

    async fetchUsers() {
        this.loading.value = true;
        this.error.value = '';
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            this.users.value = await response.json();
        } catch (e: any) {
            this.error.value = e.message;
        } finally {
            this.loading.value = false;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchUsers();
    }

    render() {
        return html`
            <div class="w-full max-w-2xl p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold">API Integration Demo</h1>
                    <button 
                        @click=${() => this.fetchUsers()}
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                    >
                        Refresh Data
                    </button>
                </div>

                ${this.loading.value ? html`
                    <div class="flex justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ` : ''}

                ${this.error.value ? html`
                    <div class="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg mb-4">
                        ${this.error.value}
                    </div>
                ` : ''}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${this.users.value.map(user => html`
                        <div class="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-blue-500 transition-colors">
                            <div class="font-bold text-lg">${user.name}</div>
                            <div class="text-slate-400 text-sm">${user.email}</div>
                            <div class="mt-2 text-xs text-blue-400 font-medium">${user.company.name}</div>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-user-list', UserList);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-user-list></baex-user-list>';
    }
}

init();
