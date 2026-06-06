import { defineComponent, BaexElement, createSignal, html } from '../../src/framework/index';
import { setupWasm } from '../../src/framework/setup';

class TodoApp extends BaexElement {
    todos = createSignal('todos', [] as { id: number, text: string, done: boolean }[]);
    inputValue = createSignal('inputValue', '');

    addItem() {
        if (!this.inputValue.value.trim()) return;
        
        const newTodo = {
            id: Date.now(),
            text: this.inputValue.value,
            done: false
        };
        
        this.todos.value = [...this.todos.value, newTodo];
        this.inputValue.value = '';
    }

    toggleTodo(id: number) {
        this.todos.value = this.todos.value.map(t => 
            t.id === id ? { ...t, done: !t.done } : t
        );
    }

    removeTodo(id: number) {
        this.todos.value = this.todos.value.filter(t => t.id !== id);
    }

    render() {
        return html`
            <div class="w-full max-w-md p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
                <h1 class="text-2xl font-bold mb-6 text-center">BAEX Tasks</h1>
                
                <div class="flex gap-2 mb-6">
                    <input 
                        type="text" 
                        class="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What needs to be done?"
                        .value=${this.inputValue.value}
                        @input=${(e: any) => this.inputValue.value = e.target.value}
                    />
                    <button 
                        @click=${() => this.addItem()}
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Add
                    </button>
                </div>

                <ul class="space-y-3">
                    ${this.todos.value.map(todo => html`
                        <li class="flex items-center justify-between p-3 bg-slate-700 rounded-lg group transition-all">
                            <div class="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    .checked=${todo.done}
                                    @change=${() => this.toggleTodo(todo.id)}
                                    class="w-4 h-4 rounded border-slate-500 text-blue-600 focus:ring-blue-500"
                                />
                                <span class="${todo.done ? 'line-through text-slate-500' : 'text-slate-200'}">
                                    ${todo.text}
                                </span>
                            </div>
                            <button 
                                @click=${() => this.removeTodo(todo.id)}
                                class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                            >
                                ✕
                            </button>
                        </li>
                    `)}
                </ul>

                ${this.todos.value.length === 0 ? html`
                    <p class="text-center text-slate-500 mt-4">No tasks yet. Enjoy your day!</p>
                ` : ''}
            </div>
        `;
    }
}

async function init() {
    await setupWasm();
    defineComponent('baex-todo', TodoApp);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-todo></baex-todo>';
    }
}

init();
