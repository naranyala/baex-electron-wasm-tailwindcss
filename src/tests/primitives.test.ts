import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignal, createEffect, createStore, Computed, clearSignalCache } from '../framework/signals';
import { createContext, provideContext, consumeContext } from '../framework/context';
import { html, Show, For } from '../framework/template';
import { BaexElement } from '../framework/baex-element';

vi.mock('../framework/wasm', () => {
  return {
    wasm: {
      createSignal: vi.fn(),
      setSignal: vi.fn(),
      onSignalChange: vi.fn(),
      processTemplate: vi.fn((_strings, _values) => ({
        html: '<div>Mocked HTML</div>',
        bindings: []
      })),
      register_component: vi.fn(() => 1),
      update_component_property: vi.fn(),
      get_component_property: vi.fn(),
      remove_component: vi.fn(),
      clear_component_changed_properties: vi.fn(),
      get_component_changed_properties: vi.fn(() => []),
      resolveObservedAttributes: vi.fn(() => []),
    }
  };
});

describe('Framework Primitives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSignalCache();
    if (!customElements.get('baex-element')) {
      customElements.define('baex-element', BaexElement);
    }
  });

  it('createEffect should run and react to signals', async () => {
    const count = createSignal('count', 0);
    let effectRunCount = 0;

    createEffect(() => {
      effectRunCount++;
      console.log('Effect ran:', count.value);
    });

    expect(effectRunCount).toBe(1);
    count.value = 1;
    expect(effectRunCount).toBe(2);
    count.value = 2;
    expect(effectRunCount).toBe(3);
  });

  it('Computed should be reactive', () => {
    const count = createSignal('count', 1);
    const double = new Computed(() => count.value * 2);

    expect(double.value).toBe(2);
    count.value = 2;
    expect(double.value).toBe(4);
  });

  it('createStore should be reactive', () => {
    const state = createStore({ user: { name: 'Alice', age: 30 }, tags: ['js', 'wasm'] });
    let runCount = 0;
    createEffect(() => {
      runCount++;
      console.log('Store change:', state.user.name);
    });

    expect(runCount).toBe(1);
    state.user.name = 'Bob';
    expect(runCount).toBe(2);
  });

  it('Context should provide and consume values', () => {
    const ThemeContext = createContext();
    const el = document.createElement('div');
    const child = document.createElement('div');
    el.appendChild(child);

    provideContext(el, ThemeContext, { color: 'blue' });
    const value = consumeContext(child, ThemeContext) as { color: string } | undefined;

    expect(value?.color).toBe('blue');
  });

  it('Show should conditionally render', () => {
    const visible = createSignal('visible', true);
    const template = Show(
      visible,
      html`<div>Visible</div>`,
      html`<div>Hidden</div>`
    );

    const element = document.createElement('baex-element') as any;
    element.render = () => template;
    
    element.connectedCallback();
    expect(element.innerHTML).toContain('Visible');

    visible.value = false;
    return new Promise(resolve => {
      queueMicrotask(() => {
        expect(element.innerHTML).toContain('Hidden');
        resolve(undefined);
      });
    });
  });

  it('For should render lists', () => {
    const items = createSignal('items', ['A', 'B', 'C']);
    const template = For(
      items,
      (item) => html`<li>${item}</li>`
    );

    const element = document.createElement('baex-element') as any;
    element.render = () => template;
    
    element.connectedCallback();
    expect(element.innerHTML).toContain('<li>A</li>');
    expect(element.innerHTML).toContain('<li>B</li>');
    expect(element.innerHTML).toContain('<li>C</li>');

    items.value = ['D', 'E'];
    return new Promise(resolve => {
      queueMicrotask(() => {
        expect(element.innerHTML).not.toContain('<li>A</li>');
        expect(element.innerHTML).toContain('<li>D</li>');
        expect(element.innerHTML).toContain('<li>E</li>');
        resolve(undefined);
      });
    });
  });
});
