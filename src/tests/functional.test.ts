import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignal, createEffect } from '../framework/signals';
import { html } from '../framework/template';
import { mount } from '../framework/component';

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

describe('Functional Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mount a basic functional component', () => {
    const container = document.createElement('div');
    const MyComp = () => html`<div>Hello Functional!</div>`;
    
    mount(MyComp, container);
    expect(container.innerHTML).toContain('Mocked HTML');
  });

  it('should be reactive', async () => {
    const container = document.createElement('div');
    const count = createSignal('count', 0);
    
    const MyComp = () => html`<div>Count: ${count.value}</div>`;
    
    mount(MyComp, container);
    expect(container.innerHTML).toContain('Mocked HTML');
    
    count.value = 1;
    
    return new Promise(resolve => {
      queueMicrotask(() => {
        expect(container.innerHTML).toContain('Mocked HTML');
        resolve(undefined);
      });
    });
  });

  it('should support cleanup', () => {
    const container = document.createElement('div');
    let cleaned = false;
    
    const MyComp = () => {
      createEffect(() => {
        return () => { cleaned = true; };
      });
      return html`<div>Test</div>`;
    };
    
    const dispose = mount(MyComp, container);
    dispose();
    
    expect(cleaned).toBe(true);
  });
});
