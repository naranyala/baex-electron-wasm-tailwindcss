import { describe, it, expect, beforeAll } from 'vitest';
import { setupWasm } from '../../src/framework/setup';
import { defineComponent, BaexElement, createSignal, html, Computed } from '../../src/framework/index';

beforeAll(async () => {
    await setupWasm();
});

describe('Example: Counter', () => {
    class Counter extends BaexElement {
        count = createSignal('count', 0);
    render() {
        return html`<button @click=${() => {
            console.log('Button clicked!');
            this.count.value++;
        }}>${this.count.value}</button>`;
    }
    }

    it('should increment count on click', async () => {
        defineComponent('test-counter', Counter);
        const el = document.createElement('test-counter') as any;
        document.body.appendChild(el);
        
        // Wait for initial render
        await new Promise(res => queueMicrotask(res));
        
        expect(el.count.value).toBe(0);
        
        // Simulate click
        const btn = el.querySelector('button');
        btn?.click();
        
        // Wait for update
        await new Promise(res => queueMicrotask(res));
        expect(el.count.value).toBe(1);
        document.body.removeChild(el);
    });
});

describe('Example: Computed', () => {
    
    it('should update computed values', () => {
        const a = createSignal('a', 1);
        const b = createSignal('b', 2);
        const sum = new Computed(() => a.value + b.value);
        
        expect(sum.value).toBe(3);
        a.value = 10;
        expect(sum.value).toBe(12);
    });
});
