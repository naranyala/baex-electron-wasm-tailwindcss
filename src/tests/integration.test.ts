import { beforeAll, describe, expect, it } from 'vitest';
import { BaexElement } from '../framework/baex-element.js';
import { createSignal, html } from '../framework/index.js';
import { testWasm, setupWasm } from '../framework/setup.js';

describe('Framework Integration (Real WASM)', () => {
  beforeAll(async () => {
    await setupWasm();
  });

  it('wasm module exposes all expected functions', () => {
    expect(testWasm.processTemplate).toBeTypeOf('function');
    expect(testWasm.createSignal).toBeTypeOf('function');
    expect(testWasm.resolveObservedAttributes).toBeTypeOf('function');
  });

  it('renders HTML using the Rust engine', async () => {
    await setupWasm();
    const result = html`<div>Hello ${'WASM'}</div>`;
    expect(result.html).toBe('<div>Hello WASM</div>');
  });

  it('processes bindings using the Rust engine', async () => {
    await setupWasm();
    const handler = () => {};
    const result = html`<button @click=${handler}>Go</button>`;
    expect(result.html).toContain('data-baex="b');
    const binding = result.bindings[0] as Extract<typeof result.bindings[number], { type: 'event' }>;
    expect(binding.type).toBe('event');
    expect(binding.eventName).toBe('click');
    expect(binding.value).toBe(handler);
  });

  it('syncs Signals between JS and Rust', async () => {
    await setupWasm();
    const s = createSignal('int_sig', 100);

    expect(s.value).toBe(100);
    expect(testWasm.getSignal(testWasm.getOrCreateSignalId('int_sig'))).toBe(100);

    s.value = 200;
    expect(testWasm.getSignal(testWasm.getOrCreateSignalId('int_sig'))).toBe(200);
  });

  it('resolves observed attributes via Rust helper', async () => {
    await setupWasm();

    class TestComp extends BaexElement {
      static properties = {
        name: { type: String },
        age: { attribute: false },
        id: { attribute: 'data-id' },
      };
      name = '';
      age = 0;
      id = '';
      render() {
        return { html: '', bindings: [] } as never;
      }
    }

    const attrs = (TestComp as unknown as typeof BaexElement).observedAttributes;
    expect(attrs).toContain('name');
    expect(attrs).toContain('data-id');
    expect(attrs).not.toContain('age');
  });

  it('serializes and deserializes properties via Rust', async () => {
    await setupWasm();

    const serNum = testWasm.serializeProperty(42, 'number');
    expect(serNum).toBe('42');
    expect(testWasm.deserializeProperty('42', 'number')).toBe(42);

    const serBoolT = testWasm.serializeProperty(true, 'boolean');
    expect(serBoolT).toBe('');
    expect(testWasm.deserializeProperty('', 'boolean')).toBe(true);

    const serBoolF = testWasm.serializeProperty(false, 'boolean');
    expect(serBoolF).toBeNull();
    expect(testWasm.deserializeProperty('false', 'boolean')).toBe(false);

    const obj = { foo: 'bar' };
    const serObj = testWasm.serializeProperty(obj, 'object');
    expect(serObj).toBe('{"foo":"bar"}');
    expect(testWasm.deserializeProperty('{"foo":"bar"}', 'object')).toEqual({
      foo: 'bar',
    });
  });

  it('handles nested TemplateResults via Rust engine', async () => {
    await setupWasm();
    const inner = html`<span>inner</span>`;
    const outer = html`<div>${inner}</div>`;
    expect(outer.html).toBe('<div><span>inner</span></div>');
  });
});
