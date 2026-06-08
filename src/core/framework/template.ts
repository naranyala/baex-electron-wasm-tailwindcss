import { wasm } from './wasm';
import { logPhase } from './debug';
import { DOMInstruction as IR_DOMInstruction, BindingInstruction, OptimizedIR } from './ir';

export type DOMInstruction = IR_DOMInstruction;

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
  html: string;
  root: DOMInstruction;
  bindings: Binding[];
}

export type ComponentOrTemplate = TemplateResult | (() => TemplateResult);

/**
 * A conditional rendering primitive.
 * If the condition is truthy, renders the 'thenBranch'; otherwise renders the 'elseBranch'.
 * @param condition The condition to evaluate.
 * @param thenBranch The content to render if condition is true.
 * @param elseBranch Optional content to render if condition is false.
 */
export function Show(condition: any, thenBranch: ComponentOrTemplate, elseBranch?: ComponentOrTemplate): TemplateResult {
  const resolve = (t: ComponentOrTemplate): DOMInstruction => {
    if (typeof t === 'function') {
      return t().root;
    }
    return (t as TemplateResult).root;
  };

  return {
    html: '',
    root: {
      type: 'show',
      condition,
      thenBranch: resolve(thenBranch),
      elseBranch: elseBranch ? resolve(elseBranch) : undefined,
    },
    bindings: [],
  };
}

/**
 * A list rendering primitive.
 * Iterates over a collection and renders a template for each item.
 * @param list The collection to iterate over.
 * @param itemTemplate A function that returns a template for a single item.
 * @param keyFn Optional function to generate a unique key for each item for efficient reconciliation.
 */
export function For(
  list: any, 
  itemTemplate: (item: any) => ComponentOrTemplate,
  keyFn?: (item: any) => any
): TemplateResult {
  return {
    html: '',
    root: {
      type: 'for',
      list,
      keyFn,
      itemTemplate: (item: any) => {
        const res = itemTemplate(item);
        return typeof res === 'function' ? res().root : (res as TemplateResult).root;
      },
    },
    bindings: [],
  };
}

/**
 * Wraps a string to mark it as raw HTML that should not be escaped by the template engine.
 * @param value The raw HTML string.
 */
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
      
      // Extract all static attributes (skip data-baex binding markers)
      const attrs: Record<string, string> = {};
      for (const attr of el.attributes) {
        if (attr.name !== 'data-baex') {
          attrs[attr.name] = attr.value;
        }
      }

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
        attrs,
        children: Array.from(el.childNodes).map(walk),
        bindings: elementBindings
      };
    }

    return { type: 'text', content: '' };
  };

  return {
    root: {
      type: 'fragment',
      children: Array.from(body.childNodes).map(walk)
    },
    bindings: bindings.map(b => ({
      type: b.type,
      name: b.eventName || b.propName || b.attrName || '',
      valueIdx: b.valueIdx ?? -1,
      marker: b.marker
    }))
  };
}

/**
 * The core HTML template function.
 * Uses tagged template literals to produce a reactive TemplateResult.
 * It delegates parsing to the WASM engine for high performance.
 * @param strings The template string parts.
 * @param values The dynamic values embedded in the template.
 */
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
    if (v && typeof v === 'object' && 'html' in v && 'root' in v && 'bindings' in v) {
      const tr = v as TemplateResult;
      nestedBindings.push(...tr.bindings);
      return Raw(tr.html);
    }
    return v;
  };

  const processedValues = values.map(processValue);
  const raw = wasm.processTemplate(strings, processedValues);

  const ir = compileToIR(raw.html, raw.bindings);

  const nestedMarkers = new Set(nestedBindings.map(b => b.marker));
  const resolvedBindings: Binding[] = ir.bindings
    .filter(b => !nestedMarkers.has(b.marker))
    .map((b: BindingInstruction) => {
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

  const result: TemplateResult = { html: raw.html, root: ir.root, bindings: [...resolvedBindings, ...nestedBindings] };
  logPhase('TEMPLATE_RESULT', result);
  return result;
}

/**
 * A tagged template literal for defining CSS styles dynamically.
 * @param strings The CSS template string parts.
 * @param values The dynamic values embedded in the CSS.
 */
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
