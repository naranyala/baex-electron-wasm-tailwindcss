import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BaexElement, defineComponent } from './index.js';
import { setupWasm } from './setup.js';

beforeAll(async () => {
  await setupWasm();
});

class TestComp extends BaexElement {
  render() {
    return { html: '', bindings: [] } as never;
  }
}

describe('defineComponent', () => {
  it('registers a component with customElements.define', () => {
    const spy = vi.spyOn(customElements, 'define');
    const tag = 'test-define-comp';
    defineComponent(tag, TestComp);
    expect(spy).toHaveBeenCalledWith(tag, expect.anything());
  });

  it('prevents duplicate registration', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tag = 'test-dup-comp';

    vi.spyOn(customElements, 'get').mockReturnValueOnce(TestComp as unknown as CustomElementConstructor);

    defineComponent(tag, TestComp);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('already defined'),
    );

    spy.mockRestore();
  });
});
