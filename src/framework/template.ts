import { wasm } from './wasm';
import { logPhase } from './debug';
import { DOMInstruction, BindingInstruction, OptimizedIR } from './ir';

export interface EventBinding {
  marker: string;
  type: 'event';
  eventName: string;
  value: EventListener;
}
export interface PropertyBinding {
  marker: string;
  type: 'property';
  propName: string;
  value: unknown;
}
export interface BoolBinding {
  marker: string;
  type: 'bool';
  attrName: string;
  value: unknown;
}
export type Binding = EventBinding | PropertyBinding | BoolBinding;

export interface TemplateResult {
  root: DOMInstruction;
  bindings: Binding[];
}

export const Raw = (value: string) => ({ __raw: true, value });

interface ProcessedBinding {
  marker: string;
  type: 'event' | 'property' | 'bool';
  eventName?: string;
  propName?: string;
  attrName?: string;
  valueIdx?: number;
  value?: unknown;
}

function isSignalLike(v: unknown): v is { value: unknown } {
  return typeof v === 'object' && v !== null && 'value' in v;
}

function compileToIR(htmlString: string, bindings: ProcessedBinding[]): OptimizedIR {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const body = doc.body;

  const walk = (node: Node): DOMInstruction => {
    if (node.nodeType === Node.TEXT_NODE) {
      return { type: 'text', content: node.textContent || '' };
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      // Find bindings associated with this element's marker
      const marker = el.getAttribute('data-baex');
      const elementBindings: BindingInstruction[] = [];
      if (marker) {
        const found = bindings.find(b => b.marker === marker);
        if (found) {
          elementBindings.push({
            type: found.type,
            name: found.eventName || found.propName || found.attrName || '',
            valueIdx: found.valueIdx ?? -1,
            marker: found.marker
          });
        }
      }

      return {
        type: 'element',
        tag: tagName,
        children: Array.from(el.childNodes).map(walk),
        bindings: elementBindings
      };
    }

    return { type: 'text', content: '' };
  };

  return {
    root: walk(body),
    bindings: bindings.map(b => ({
      type: b.type,
      name: b.eventName || b.propName || b.attrName || '',
      valueIdx: b.valueIdx ?? -1,
      marker: b.marker
    }))
  };
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult {
  const nestedBindings: Binding[] = [];

  const processValue = (v: unknown): unknown => {
    if (Array.isArray(v)) {
      let htmlContent = '';
      for (const item of v) {
        const processed = processValue(item);
        if (processed && typeof processed === 'object' && '__raw' in processed) {
          htmlContent += (processed as unknown as { value: string }).value;
        } else {
          htmlContent += String(processed ?? '');
        }
      }
      return Raw(htmlContent);
    }
    if (v && typeof v === 'object' && 'root' in v && 'bindings' in v) {
      const tr = v as TemplateResult;
      nestedBindings.push(...tr.bindings);
      // Since we are now using a DOM-Node IR, we can't just return a string for nested templates.
      // We'll return a special marker that the builder will handle.
      return Raw(`<!--baex-nested-root-->`);
    }
    return v;
  };

  const processedValues = values.map(processValue);
  const raw = wasm.processTemplate(strings, processedValues);

  const ir = compileToIR(raw.html, raw.bindings);

  const resolvedBindings: Binding[] = ir.bindings.map((b: BindingInstruction) => {
    if (b.valueIdx !== -1) {
      const rawValue = processedValues[b.valueIdx];
      if (b.type === 'property' && isSignalLike(rawValue)) {
        return {
          marker: b.marker,
          type: 'property',
          propName: b.name,
          value: (rawValue as { value: unknown }).value
        };
      } else {
        return {
          marker: b.marker,
          type: b.type === 'event' ? 'event' : b.type === 'bool' ? 'bool' : 'property',
          eventName: b.type === 'event' ? b.name : undefined,
          propName: b.type === 'property' ? b.name : undefined,
          attrName: b.type === 'bool' ? b.name : undefined,
          value: rawValue
        };
      }
    }
    return { marker: b.marker, type: 'property', propName: b.name, value: undefined } as any;
  });

  const result: TemplateResult = { root: ir.root, bindings: [...resolvedBindings, ...nestedBindings] };
  logPhase('TEMPLATE_RESULT', result);
  return result;
}

export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i] ?? '');
    }
  }
  return result;
}
