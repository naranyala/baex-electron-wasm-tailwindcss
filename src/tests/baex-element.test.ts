import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BaexElement, defineComponent } from '../framework/index.js';
import { html } from '../framework/template.js';
import { setupWasm } from './setup.js';

beforeAll(async () => {
  await setupWasm();
});

class TestGreeter extends BaexElement {
  static properties = {
    greeting: { type: String },
    count: { type: Number, reflect: true },
    active: { type: Boolean },
  };

  greeting = 'World';
  count = 0;
  active = false;

  onConnected = vi.fn();
  onDisconnected = vi.fn();
  onUpdate = vi.fn();

  render() {
    return html`<p>Hello ${this.greeting}</p>`;
  }
}

class ExcludesAttr extends BaexElement {
  static properties = {
    pub: { type: String },
    priv: { attribute: false },
  };
  pub = '';
  priv = 'secret';
  render() {
    return { html: '', bindings: [] } as never;
  }
}

class CustomAttr extends BaexElement {
  static properties = {
    data: { attribute: 'data-value' },
  };
  data = '';
  render() {
    return { html: '', bindings: [] } as never;
  }
}

describe('BaexElement', () => {
  beforeEach(() => {
    if (!customElements.get('test-greeter')) {
      defineComponent('test-greeter', TestGreeter);
    }
  });

  it('observedAttributes are derived from properties', () => {
    const attrs = (TestGreeter as unknown as typeof BaexElement).observedAttributes;
    expect(attrs).toContain('greeting');
    expect(attrs).toContain('count');
    expect(attrs).toContain('active');
  });

  it('excludes properties with attribute: false', () => {
    const attrs = (ExcludesAttr as unknown as typeof BaexElement).observedAttributes;
    expect(attrs).toContain('pub');
    expect(attrs).not.toContain('priv');
  });

  it('uses custom attribute name from property declaration', () => {
    const attrs = (CustomAttr as unknown as typeof BaexElement).observedAttributes;
    expect(attrs).toContain('data-value');
  });

  it('calls onConnected when connected to DOM', () => {
    const el = new TestGreeter();
    const spy = vi.spyOn(el, 'onConnected' as never);

    document.body.appendChild(el);
    expect(spy).toHaveBeenCalledOnce();
    document.body.removeChild(el);
  });

  it('calls onDisconnected when removed from DOM', () => {
    const el = new TestGreeter();
    document.body.appendChild(el);

    const spy = vi.spyOn(el, 'onDisconnected' as never);
    document.body.removeChild(el);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('renders on connect', async () => {
    const el = new TestGreeter();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
    expect(el.innerHTML).toContain('Hello World');
    document.body.removeChild(el);
  });

  it('reactive property setter triggers re-render', async () => {
    const el = new TestGreeter();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
    expect(el.innerHTML).toContain('Hello World');

    el.greeting = 'Vitest';
    await new Promise((r) => setTimeout(r, 0));
    expect(el.innerHTML).toContain('Hello Vitest');
    document.body.removeChild(el);
  });

  it('reflects property to attribute when reflect: true', () => {
    const el = new TestGreeter();
    el.count = 42;
    expect(el.getAttribute('count')).toBe('42');
  });

  it('reads initial value from attribute', () => {
    const el = new TestGreeter();
    el.setAttribute('greeting', 'AttrName');
    document.body.appendChild(el);
    expect((el as unknown as TestGreeter).greeting).toBe('AttrName');
    document.body.removeChild(el);
  });

  it('applies event bindings from render', async () => {
    class WithEvent extends BaexElement {
      clicked = false;
      handleClick = () => {
        this.clicked = true;
      };
      render() {
        return html`<button @click=${this.handleClick}>Go</button>`;
      }
    }
    defineComponent('test-withevent', WithEvent);

    const el = new WithEvent();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));

    const btn = el.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(el.clicked).toBe(true);
    document.body.removeChild(el);
  });

  it('applies property bindings from render', async () => {
    class WithProp extends BaexElement {
      static properties = {
        val: { type: String },
      };
      val = 'initial';
      render() {
        return html`<input .value=${this.val}>`;
      }
    }
    defineComponent('test-withprop', WithProp);

    const el = new WithProp();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));

    const input = el.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('initial');

    el.val = 'updated';
    await new Promise((r) => setTimeout(r, 0));
    const updatedInput = el.querySelector('input') as HTMLInputElement;
    expect(updatedInput.value).toBe('updated');
    document.body.removeChild(el);
  });

  it('applies bool bindings from render', async () => {
    class WithBool extends BaexElement {
      static properties = {
        hidden: { type: Boolean },
      };
      hidden = true;
      render() {
        return html`<div ?hidden=${this.hidden}></div>`;
      }
    }
    defineComponent('test-withbool', WithBool);

    const el = new WithBool();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));

    const div = el.querySelector('div') as HTMLDivElement;
    expect(div.hasAttribute('hidden')).toBe(true);

    el.hidden = false;
    await new Promise((r) => setTimeout(r, 0));
    const updatedDiv = el.querySelector('div') as HTMLDivElement;
    expect(updatedDiv.hasAttribute('hidden')).toBe(false);
    document.body.removeChild(el);
  });

  it('whenUpdate runs callback after update if pending', async () => {
    const el = new TestGreeter();
    await new Promise((r) => setTimeout(r, 0));
    const cb = vi.fn();

    el.whenUpdate(cb);
    expect(cb).toHaveBeenCalledOnce();

    el.greeting = 'new';
    const cb2 = vi.fn();
    el.whenUpdate(cb2);
    expect(cb2).not.toHaveBeenCalled();
  });

  it('calls onUpdate with changed properties', async () => {
    const el = new TestGreeter();
    document.body.appendChild(el);

    const spy = vi.fn();
    (el as unknown as { onUpdate: typeof spy }).onUpdate = spy;
    el.greeting = 'Changed';

    await new Promise((r) => setTimeout(r, 0));
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toHaveProperty('greeting');
    document.body.removeChild(el);
  });

  it('forces update via requestUpdate(true)', async () => {
    const el = new TestGreeter();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
    
    const spy = vi.spyOn(el, 'render');
    el.requestUpdate(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(spy).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('reflects boolean properties to attributes', () => {
    class RefBool extends BaexElement {
      static properties = { active: { type: Boolean, reflect: true } };
      active = false;
      render() { return { html: '', bindings: [] } as never; }
    }
    const elBool = new RefBool();
    elBool.active = true;
    expect(elBool.hasAttribute('active')).toBe(true);
    elBool.active = false;
    expect(elBool.hasAttribute('active')).toBe(false);
  });

  it('respects hasChanged hook to skip updates', async () => {
    class CustomChange extends BaexElement {
      static properties = { 
        val: { 
          type: String, 
          hasChanged: (v: unknown, old: unknown) => v !== old && v !== 'skip' 
        } 
      };
      val = 'start';
      render() { return html`<div>${this.val}</div>`; }
    }
    const el = new CustomChange();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
    expect(el.innerHTML).toContain('start');

    el.val = 'skip'; // should be skipped
    await new Promise((r) => setTimeout(r, 0));
    expect(el.innerHTML).toContain('start');

    el.val = 'end'; // should update
    await new Promise((r) => setTimeout(r, 0));
    expect(el.innerHTML).toContain('end');
    document.body.removeChild(el);
  });

  it('follows correct lifecycle order', async () => {
    const logs: string[] = [];
    class LifeCycleEl extends BaexElement {
      static properties = { val: { type: String } };
      val = 'init';
      onConnected() { logs.push('connected'); }
      onUpdate() { logs.push('updated'); }
      render() { 
        logs.push('rendered');
        return html`<div>${this.val}</div>`; 
      }
    }
    const el = new LifeCycleEl();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
    
    expect(logs).toEqual(['connected', 'rendered', 'updated']);
    document.body.removeChild(el);
  });
});
