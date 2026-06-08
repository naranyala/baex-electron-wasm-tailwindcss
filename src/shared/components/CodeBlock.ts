import { highlightCode } from '@core/framework/highlighter';
import { BaexElement } from '@core/framework/index';
import { html, Raw } from '@core/framework/template';

export class BaexCodeBlock extends BaexElement {
  static properties = {
    code: { type: String },
    lang: { type: String },
    highlightedCode: { attribute: false },
    copyState: { attribute: false },
  };

  code = '';
  lang = 'typescript';
  highlightedCode: string = '';
  copyState: 'idle' | 'copied' = 'idle';

  private _copyTimer: number | null = null;

  async onConnected() {
    await this.updateHighlighting();
  }

  onUpdate(changed: Record<string, unknown>) {
    if (changed.code !== undefined || changed.lang !== undefined) {
      void this.updateHighlighting();
    }
  }

  async updateHighlighting() {
    const code = this.code;
    const lang = this.lang || 'typescript';

    if (!code) {
      this.highlightedCode = '';
      return;
    }

    try {
      this.highlightedCode = await highlightCode(code, lang);
    } catch (e) {
      console.error('BaexCodeBlock highlighting failed:', e);
      this.highlightedCode = '';
    }
  }

  private _handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copyState = 'copied';
      if (this._copyTimer !== null) clearTimeout(this._copyTimer);
      this._copyTimer = window.setTimeout(() => {
        this.copyState = 'idle';
        this._copyTimer = null;
      }, 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  private _copyButtonClass(): string {
    const base = 'absolute top-2 right-2 px-2 py-0.5 text-[0.7rem] rounded border cursor-pointer transition-all duration-150 font-inherit';
    return this.copyState === 'copied'
      ? `${base} border-green-400 text-green-400 bg-green-400/10`
      : `${base} border-white/20 text-white/50 bg-white/[0.06] hover:bg-white/10 hover:text-white/80`;
  }

  render() {
    return html`
      <div class="relative group block">
        <span class="block mb-1.5 text-[0.65rem] font-semibold tracking-wider uppercase text-white/30">
          ${this.lang || 'typescript'}
        </span>
        <div class="relative overflow-hidden rounded-md border border-white/[0.06] bg-black/30 p-6">
          ${
            this.highlightedCode
              ? this.highlightedCode
              : Raw(`<pre class="m-0 p-0 text-[0.8rem] leading-relaxed overflow-x-auto whitespace-pre [tab-size:2] font-['JetBrains_Mono',monospace]">${this.code}</pre>`)
          }
          <button
            @click=${this._handleCopy}
            class=${this._copyButtonClass()}
          >
            ${this.copyState === 'copied' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    `;
  }
}
