import { BaexElement } from './baex-element';
 
export type { PropertyDeclaration, PropertyValues } from './types';
export { BaexElement, property, state } from './baex-element';
export type { SignalSubscriber } from './signals';
export { createSignal, getSignal, Signal, Computed } from './signals';
export type { Binding, TemplateResult } from './template';
export { css, html } from './template';
export { Raw } from './template';

/**
 * Registers a BAEX component with the browser's CustomElementRegistry.
 * @param tagName The HTML tag name for the component (must contain a hyphen).
 * @param elementClass The BaexElement subclass to register.
 */
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
