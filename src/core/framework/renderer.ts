import { createEffect } from './signals';
import type { Binding } from './template';

export interface RenderContext {
  bindingMap: Map<string, Array<{ node: Node; binding: Binding }>>;
  applyBinding: (el: HTMLElement, b: Binding) => void;
  applyPatch: (marker: string, newValue: unknown) => void;
}

export function buildDOM(
  instruction: any, 
  allBindings: Binding[], 
  ctx: RenderContext
): Node {
  if (instruction.type === 'text') {
    return document.createTextNode(instruction.content);
  }

  if (instruction.type === 'fragment') {
    const fragment = document.createDocumentFragment();
    for (const child of instruction.children) {
      fragment.appendChild(buildDOM(child, allBindings, ctx));
    }
    return fragment;
  }

  if (instruction.type === 'element') {
    const el = document.createElement(instruction.tag);
    
    if (instruction.attrs) {
      for (const [name, value] of Object.entries(instruction.attrs)) {
        el.setAttribute(name, value);
      }
    }

    if (instruction.bindings) {
      for (const bInst of instruction.bindings) {
        const binding = allBindings.find(b => b.marker === bInst.marker);
        if (binding) {
          ctx.applyBinding(el, binding);
          
          const marker = bInst.marker;
          if (!ctx.bindingMap.has(marker)) {
            ctx.bindingMap.set(marker, []);
          }
          ctx.bindingMap.get(marker)!.push({ node: el, binding });
        }
      }
    }

    for (const child of instruction.children) {
      el.appendChild(buildDOM(child, allBindings, ctx));
    }
    return el;
  }

  if (instruction.type === 'show') {
    const container = document.createElement('span');
    container.style.display = 'contents';
    
    let currentBranch: 'then' | 'else' | null = null;
    let thenNode: Node | null = null;
    let elseNode: Node | null = null;

    const update = () => {
      const condition = (instruction.condition as any)?.value ?? instruction.condition;
      const targetBranch = condition ? 'then' : (instruction.elseBranch ? 'else' : null);
      
      if (targetBranch === currentBranch) return;
      
      currentBranch = targetBranch;
      container.innerHTML = '';
      
      if (targetBranch === 'then') {
        if (!thenNode) thenNode = buildDOM(instruction.thenBranch, allBindings, ctx);
        container.appendChild(thenNode);
      } else if (targetBranch === 'else') {
        if (!elseNode) elseNode = buildDOM(instruction.elseBranch!, allBindings, ctx);
        container.appendChild(elseNode);
      }
    };

    update();
    createEffect(update);
    return container;
  }

  if (instruction.type === 'for') {
    const container = document.createElement('span');
    container.style.display = 'contents';
    const nodeMap = new Map<any, Node>();
    
    const update = () => {
      const list = (instruction.list as any)?.value ?? instruction.list;
      const keyFn = instruction.keyFn || ((item: any) => item);
      
      if (!Array.isArray(list)) return;

      const currentKeys = list.map(item => keyFn(item));
      const existingKeys = Array.from(nodeMap.keys());

      for (const key of existingKeys) {
        if (!currentKeys.includes(key)) {
          const node = nodeMap.get(key);
          if (node && node.parentNode) {
            node.parentNode.removeChild(node);
          }
          nodeMap.delete(key);
        }
      }

      list.forEach((item, index) => {
        const key = keyFn(item);
        let node = nodeMap.get(key);
        
        if (!node) {
          node = buildDOM(instruction.itemTemplate(item), allBindings, ctx);
          nodeMap.set(key, node);
        }
        
        if (container.children[index] !== node) {
          container.insertBefore(node, container.children[index] || null);
        }
      });
    };

    update();
    createEffect(update);
    return container;
  }

  return document.createTextNode('');
}
