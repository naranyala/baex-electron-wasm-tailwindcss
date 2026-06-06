import { describe, it, expect, beforeEach } from 'vitest';
import { setupWasm } from '../framework/setup.js';
import { BaexElement, defineComponent, html } from '../framework/index.js';
import { Signal } from '../framework/signals.js';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('Framework Stress Tests', () => {
  beforeEach(async () => {
    await setupWasm();
  });

  it('should handle rapid property updates with batched rendering', async () => {
    class StressEl extends BaexElement {
      static properties = { count: { type: Number } };
      count = 0;
      render() {
        return html`<div>${this.count}</div>`;
      }
    }
    defineComponent('stress-el', StressEl);
    const el = new StressEl();
    document.body.appendChild(el);


    let renderCount = 0;
    const originalRender = el.render.bind(el);
    el.render = () => {
      renderCount++;
      return originalRender();
    };

    for (let i = 0; i < 1000; i++) {
      el.count = i;
    }

    expect(renderCount).toBe(0);

    await flush();

    expect(renderCount).toBe(1);
    expect(el.innerHTML).toContain('999');
    document.body.removeChild(el);
  });

  it('should handle mass component creation and destruction', async () => {
    class TinyEl extends BaexElement {
      static properties = { val: { type: String } };
      val = '';
      render() {
        return html`<span>${this.val}</span>`;
      }
    }
    defineComponent('tiny-el', TinyEl);

    const count = 1000;
    const elements: TinyEl[] = [];

    for (let i = 0; i < count; i++) {
      const el = new TinyEl();
      el.val = `val-${i}`;
      elements.push(el);
    }

    const container = document.createElement('div');
    elements.forEach((el) => container.appendChild(el));
    document.body.appendChild(container);

    elements.forEach((el, i) => {
      el.val = `updated-${i}`;
    });

    await flush();

    expect(elements[0].innerHTML).toContain('updated-0');
    expect(elements[999].innerHTML).toContain('updated-999');

    document.body.removeChild(container);
  });

  it('should handle a signal flood', async () => {
    const signalCount = 100;
    const signals: Signal<number>[] = [];

    for (let i = 0; i < signalCount; i++) {
      signals.push(new Signal(`sig-${i}`, 0));
    }

    class SignalEl extends BaexElement {
      render() {
        return html`<div>${signals.map((s) => s.value).join(',')}</div>`;
      }
    }
    defineComponent('signal-el', SignalEl);
    const el = new SignalEl();
    document.body.appendChild(el);

    for (let i = 0; i < 500; i++) {
      const sig = signals[Math.floor(Math.random() * signalCount)];
      sig.value += 1;
    }

    el.requestUpdate();
    await flush();

    expect(el.innerHTML).toContain(',');
    document.body.removeChild(el);
  });

  it('should handle deeply nested templates', async () => {
    const depth = 50;
    const createNested = (d: number): ReturnType<typeof html> => {
      if (d === 0) return html`<span>base</span>`;
      return html`<div>${createNested(d - 1)}</div>`;
    };

    const result = createNested(depth);

    class NestedEl extends BaexElement {
      render() {
        return result;
      }
    }
    defineComponent('nested-el', NestedEl);
    const el = new NestedEl();
    document.body.appendChild(el);

    await flush();
    expect(el.innerHTML).toContain('base');
    document.body.removeChild(el);
  });

  it('should handle complex property types (objects/arrays)', async () => {
    class ComplexEl extends BaexElement {
      static properties = {
        data: { type: Object },
        list: { type: Array },
      };
      data: { a: number; b?: number } = { a: 1 };
      list: number[] = [1, 2];
      render() {
        return html`<div>${JSON.stringify(this.data)} ${JSON.stringify(this.list)}</div>`;
      }
    }
    defineComponent('complex-el', ComplexEl);
    const el = document.createElement('complex-el') as ComplexEl;
    document.body.appendChild(el);

    el.data = { a: 2, b: 3 };
    el.list = [1, 2, 3];

    await flush();
    expect(el.innerHTML).toContain('{"a":2,"b":3}');
    expect(el.innerHTML).toContain('[1,2,3]');
    document.body.removeChild(el);
  });
});
