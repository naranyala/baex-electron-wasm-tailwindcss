import { buildDOM, RenderContext } from './renderer';
import { tracker } from './dependency-tracker';
import { createEffect } from './signals';
import type { TemplateResult, Binding } from './template';

export type FunctionalComponent = () => TemplateResult;

export function mount(
  component: FunctionalComponent, 
  container: HTMLElement
) {
  // 1. Create a scope for the functional component
  const scope = {
    bindingMap: new Map<string, Array<{ node: Node; binding: Binding }>>(),
    
    applyBinding: (el: HTMLElement, b: Binding) => {
      // In a functional component, we can't use the class-based _applyBindingToNode.
      // We implement a generic version here.
      if (b.type === 'event') {
        el.addEventListener(b.eventName, b.value);
      } else if (b.type === 'property') {
        (el as any)[b.propName] = b.value;
      } else if (b.type === 'bool') {
        if (b.value) el.setAttribute(b.attrName, '');
        else el.removeAttribute(b.attrName);
      }
    },
    
    applyPatch: (marker: string, newValue: unknown) => {
      const targets = scope.bindingMap.get(marker);
      if (!targets) return;
      for (const { node, binding } of targets) {
        const el = node as HTMLElement;
        if (binding.type === 'property') {
          (el as any)[binding.propName] = newValue;
        } else if (binding.type === 'bool') {
          if (newValue) el.setAttribute(binding.attrName, '');
          else el.removeAttribute(binding.attrName);
        }
      }
    }
  };

  const ctx: RenderContext = {
    bindingMap: scope.bindingMap,
    applyBinding: scope.applyBinding,
    applyPatch: scope.applyPatch
  };

  const render = () => {
    tracker.begin();
    const result = component();
    const rootNode = buildDOM(result.root, result.bindings, ctx);
    
    // Functional components currently use a simple replacement for the root
    container.innerHTML = '';
    container.appendChild(rootNode);
    tracker.end();
  };

  createEffect(render);
  
  // Return a dispose function
  return () => {
    // Functional components don't have a BaexElement cleanup stack, 
    // but we should still clear any global tracking if necessary.
    tracker.reset();
  };
}
