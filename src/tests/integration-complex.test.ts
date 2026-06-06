import { beforeAll, describe, expect, it } from 'vitest';
import { BaexElement, defineComponent, createSignal } from '../framework/index.js';
import { html } from '../framework/template.js';
import { setupWasm } from '../framework/setup.js';

beforeAll(async () => {
  await setupWasm();
});

class ChildElement extends BaexElement {
  static properties = {
    text: { type: String },
  };
  text = '';
  render() {
    return html`<span>Child: ${this.text}</span>`;
  }
}

class ParentElement extends BaexElement {
  static properties = {
    message: { type: String },
  };
  message = 'Hello';
  render() {
    return html`
      <div>
        <p>Parent: ${this.message}</p>
        <child-element .text=${this.message}></child-element>
      </div>
    `;
  }
}

describe('Complex Integration', () => {
  it('propagates properties to nested components', async () => {
    defineComponent('child-element', ChildElement);
    defineComponent('parent-element', ParentElement);

    const parent = new ParentElement();
    document.body.appendChild(parent);
    await new Promise((r) => setTimeout(r, 0));

    expect(parent.innerHTML).toContain('Parent: Hello');
    expect(parent.innerHTML).toContain('Child: Hello');

    parent.message = 'World';
    await new Promise((r) => setTimeout(r, 0));

    expect(parent.innerHTML).toContain('Parent: World');
    expect(parent.innerHTML).toContain('Child: World');
    document.body.removeChild(parent);
  });

  it('handles shared signals across component tree', async () => {
    const sharedSignal = createSignal('shared', 'initial');

    class SignalConsumer extends BaexElement {
      render() {
        return html`<div>Signal: ${sharedSignal.value}</div>`;
      }
    }
    defineComponent('sig-consumer', SignalConsumer);

    const el1 = new SignalConsumer();
    const el2 = new SignalConsumer();
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    await new Promise((r) => setTimeout(r, 0));

    expect(el1.innerHTML).toContain('Signal: initial');
    expect(el2.innerHTML).toContain('Signal: initial');

    sharedSignal.value = 'updated';
    await new Promise((r) => setTimeout(r, 0));

    expect(el1.innerHTML).toContain('Signal: updated');
    expect(el2.innerHTML).toContain('Signal: updated');
    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });

});
