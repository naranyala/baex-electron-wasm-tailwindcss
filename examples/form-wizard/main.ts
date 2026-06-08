import { defineComponent, BaexElement, createSignal, html } from '@core/framework/index';
import { ensureWasmReady } from '@core/framework/wasm';

interface WizardStep {
    id: string;
    title: string;
    fields: Array<{ id: string, label: string, type: string, placeholder: string }>;
}

const WIZARD_STEPS: WizardStep[] = [
    {
        id: 'account',
        title: 'Account Details',
        fields: [
            { id: 'username', label: 'Username', type: 'text', placeholder: 'johndoe' },
            { id: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com' },
            { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
        ]
    },
    {
        id: 'profile',
        title: 'Personal Profile',
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { id: 'bio', label: 'Short Bio', type: 'text', placeholder: 'Software Engineer...' },
            { id: 'location', label: 'Location', type: 'text', placeholder: 'New York, USA' },
        ]
    },
    {
        id: 'preferences',
        title: 'Preferences',
        fields: [
            { id: 'theme', label: 'Preferred Theme', type: 'text', placeholder: 'Dark / Light' },
            { id: 'notifications', label: 'Notification Level', type: 'text', placeholder: 'All / Important only' },
        ]
    },
    {
        id: 'review',
        title: 'Review & Confirm',
        fields: []
    }
];

class FormWizard extends BaexElement {
    currentStepIdx = createSignal('wizard-step', 0);
    formData = createSignal('wizard-data', {} as Record<string, string>);
    isSubmitted = createSignal('wizard-submitted', false);

    next() {
        if (this.currentStepIdx.value < WIZARD_STEPS.length - 1) {
            this.currentStepIdx.value++;
        }
    }

    prev() {
        if (this.currentStepIdx.value > 0) {
            this.currentStepIdx.value--;
        }
    }

    updateField(id: string, value: string) {
        this.formData.value = { ...this.formData.value, [id]: value };
    }

    isStepValid(): boolean {
        const step = WIZARD_STEPS[this.currentStepIdx.value];
        if (step.id === 'review') return true;
        return step.fields.every(f => !!this.formData.value[f.id]?.trim());
    }

    submit() {
        if (this.isStepValid()) {
            this.isSubmitted.value = true;
            console.log('Form Submitted:', this.formData.value);
        }
    }

    render() {
        if (this.isSubmitted.value) {
            return html`
                <div class="text-center p-12 bg-slate-800 rounded-3xl border border-emerald-500/30 shadow-2xl max-w-md animate-in fade-in zoom-in duration-300">
                    <div class="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
                    <h2 class="text-3xl font-bold mb-2">All Set!</h2>
                    <p class="text-slate-400 mb-8">Your account has been successfully created and configured.</p>
                    <button 
                        @click=${() => {
                            this.isSubmitted.value = false;
                            this.currentStepIdx.value = 0;
                            this.formData.value = {};
                        }}
                        class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/20"
                    >
                        Start Over
                    </button>
                </div>
            `;
        }

        const step = WIZARD_STEPS[this.currentStepIdx.value];
        const progress = ((this.currentStepIdx.value + 1) / WIZARD_STEPS.length) * 100;
        const valid = this.isStepValid();

        return html`
            <div class="w-full max-w-xl p-8 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <!-- Header -->
                <div class="mb-8">
                    <div class="flex justify-between items-end mb-3">
                        <div>
                            <span class="text-blue-400 text-xs font-bold uppercase tracking-widest">Step ${this.currentStepIdx.value + 1} of ${WIZARD_STEPS.length}</span>
                            <h2 class="text-2xl font-bold">${step.title}</h2>
                        </div>
                        <div class="text-slate-500 text-sm font-mono">${Math.round(progress)}%</div>
                    </div>
                    <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            class="h-full bg-blue-500 transition-all duration-500 ease-out" 
                            style="width: ${progress}%"
                        ></div>
                    </div>
                </div>

                <!-- Content -->
                <div class="space-y-6 mb-10 min-h-[320px]">
                    ${step.id === 'review' 
                        ? html`
                            <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 space-y-4 animate-in fade-in duration-300">
                                <h3 class="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <span class="w-1 h-4 bg-blue-500 rounded-full"></span>
                                    Review your information
                                </h3>
                                <div class="grid gap-3">
                                    ${Object.entries(this.formData.value).length > 0 
                                        ? Object.entries(this.formData.value).map(([key, val]) => html`
                                            <div class="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl border border-white/5 transition-colors hover:border-white/10">
                                                <span class="text-slate-500 text-xs uppercase font-bold">${key}</span>
                                                <span class="text-white font-medium">${val || 'Not provided'}</span>
                                            </div>
                                        `).join('')
                                        : html`<p class="text-center text-slate-600 py-8 italic">No data entered yet</p>`
                                    }
                                </div>
                            </div>
                        `
                        : html`
                            <div class="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                ${step.fields.map(f => html`
                                    <div class="flex flex-col gap-2 group">
                                        <label class="text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">${f.label}</label>
                                        <input 
                                            type="${f.type}" 
                                            placeholder="${f.placeholder}"
                                            class="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-600"
                                            .value=${this.formData.value[f.id] || ''}
                                            @input=${(e: any) => this.updateField(f.id, e.target.value)}
                                        />
                                    </div>
                                `).join('')}
                            </div>
                        `
                    }
                </div>

                <!-- Footer -->
                <div class="flex justify-between items-center">
                    <button 
                        @click=${() => this.prev()}
                        class="px-6 py-3 rounded-xl font-bold transition-all ${this.currentStepIdx.value === 0 ? 'invisible' : 'text-slate-400 hover:text-white hover:bg-slate-700'}"
                    >
                        Back
                    </button>
                    
                    ${this.currentStepIdx.value === WIZARD_STEPS.length - 1 
                        ? html`
                            <button 
                                @click=${() => this.submit()}
                                class="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Finish & Submit
                            </button>
                        `
                        : html`
                            <button 
                                @click=${() => this.next()}
                                class="px-8 py-3 ${!valid ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-slate-200'} rounded-xl font-bold transition-all active:scale-95"
                                ${!valid ? 'disabled' : ''}
                            >
                                Continue
                            </button>
                        `
                    }
                </div>
            </div>
        `;
    }
}

async function init() {
    await ensureWasmReady();
    defineComponent('baex-form-wizard', FormWizard);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<baex-form-wizard></baex-form-wizard>';
    }
}

init();
