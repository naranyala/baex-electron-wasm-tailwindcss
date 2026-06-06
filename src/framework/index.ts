import { BaexElement } from './baex-element';

export type { PropertyDeclaration, PropertyValues } from './baex-element';
export { BaexElement, property, state } from './baex-element';
export type { SignalSubscriber } from './signals';
export { createSignal, getSignal, Signal } from './signals';
export type { Binding, TemplateResult } from './template';
export { css, html } from './template';
export { Raw } from './template';

export function defineComponent(
  tagName: string,
  elementClass: typeof BaexElement,
): void {
  if (customElements.get(tagName)) {
    console.warn(`Component <${tagName}> is already defined.`);
    return;
  }
  customElements.define(tagName, elementClass as unknown as CustomElementConstructor);
}
