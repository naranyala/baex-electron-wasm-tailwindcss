export interface ApiItem {
  name: string;
  signature: string;
  desc: string;
  group: 'wasm' | 'framework';
  code?: string;
  lang?: string;
}

export const API_ITEMS: ApiItem[] = [
  {
    group: 'wasm',
    name: 'blablabla',
    signature: 'blablabla(name: string): string',
    desc: 'Calls the Rust `greet()` function — returns "Hello, {name}! from Rust"',
    code: "window.blablabla('World') // → Hello, World! from Rust",
    lang: 'javascript',
  },
  {
    group: 'wasm',
    name: 'add_numbers',
    signature: 'add_numbers(a: number, b: number): number',
    desc: 'Calls the Rust `add()` function — performs integer addition in WASM',
    code: 'window.add_numbers(3, 4) // → 7',
    lang: 'javascript',
  },
  {
    group: 'wasm',
    name: 'createSignal',
    signature: 'createSignal(key: string, initial: any): any',
    desc: 'Creates a named reactive value in the WASM global signal store.',
    code: "window.createSignal('count', 0) // → 0",
    lang: 'javascript',
  },
  {
    group: 'wasm',
    name: 'setSignal',
    signature: 'setSignal(key: string, value: any): void',
    desc: 'Updates a signal value in the WASM store and notifies all JS subscribers.',
    code: "window.setSignal('count', 42)",
    lang: 'javascript',
  },
  {
    group: 'wasm',
    name: 'getSignal',
    signature: 'getSignal(key: string): any',
    desc: 'Reads the current value of a signal from the WASM store.',
    code: 'window.getSignal("count") // → 42',
    lang: 'javascript',
  },
  {
    group: 'wasm',
    name: 'onSignalChange',
    signature: 'onSignalChange(key: string, callback: Function): void',
    desc: 'Subscribes a JS callback to fire whenever the given signal value changes.',
    code: 'window.onSignalChange("count", (v) => console.log(v))',
    lang: 'javascript',
  },
  {
    group: 'wasm',
    name: 'create_component',
    signature: 'create_component(tag: string, template: string): void',
    desc: 'Defines a custom element via JS eval that renders the given HTML template in its shadow DOM.',
    code: "window.create_component('my-el', '<p>Hello</p>')",
    lang: 'javascript',
  },
  {
    group: 'framework',
    name: 'BaexElement',
    signature: 'abstract class BaexElement extends HTMLElement',
    desc: 'Base class for all BAEX components. Provides reactive properties, light DOM rendering, batched updates via `requestUpdate()`, and lifecycle hooks.',
    code: `class MyEl extends BaexElement {
  static properties = { name: { type: String } }
  name = 'World'
  render() { return html\`<p>Hello \${this.name}</p>\` }
}`,
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'html',
    signature: 'html(strings, ...values): TemplateResult',
    desc: 'Tagged template literal that returns a `TemplateResult` with the rendered HTML string and a list of bindings (@event, .property, ?boolean).',
    code: 'html`<button @click={handler}>Click</button>`',
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'css',
    signature: 'css(strings, ...values): string',
    desc: 'Tagged template literal for defining scoped CSS styles as a plain string.',
    code: 'css`:host { color: hotpink; }`',
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'Signal<T>',
    signature: 'class Signal<T>',
    desc: 'Reactive value container with `.value` getter/setter and `.subscribe()` for change notifications.',
    code: `const s = new Signal('key', 0)
s.subscribe(v => console.log(v))
s.value = 1 // logs 1`,
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'createSignal / getSignal',
    signature: 'createSignal<T>(key, initial): Signal<T>',
    desc: 'Factory functions that create and retrieve named Signal instances from a global JS cache.',
    code: 'const count = createSignal<number>(null, 0)',
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'defineComponent',
    signature: 'defineComponent(tag: string, cls: typeof BaexElement): void',
    desc: 'Wraps `customElements.define()` with a duplicate guard.',
    code: "defineComponent('x-foo', FooElement)",
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'property / state',
    signature:
      'property(decl?): PropertyDecorator / state(): PropertyDecorator',
    desc: 'Decorators that declare reactive properties. `property()` maps to an attribute; `state()` sets `attribute: false`.',
    code: `@property({ type: Number }) count = 0
@state() internal = 'private'`,
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'TemplateResult / Binding',
    signature: 'TemplateResult { html: string; bindings: Binding[] }',
    desc: 'Return type of `html`. Contains rendered HTML string and a discriminated union of bindings.',
    code: '',
    lang: 'typescript',
  },
  {
    group: 'framework',
    name: 'requestUpdate',
    signature: 'requestUpdate(): void',
    desc: 'Schedules a microtask-batched re-render. All reactive property setters call this automatically.',
    code: 'this.requestUpdate() // triggers render() on next microtask',
    lang: 'typescript',
  },
];

export const WASM_ITEMS = API_ITEMS.filter((i) => i.group === 'wasm');
export const FRAMEWORK_ITEMS = API_ITEMS.filter((i) => i.group === 'framework');
