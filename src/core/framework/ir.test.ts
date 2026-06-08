import { beforeAll, describe, expect, it } from 'vitest';
import { html, Raw } from './template.js';
import { setupWasm } from './setup.js';

beforeAll(async () => {
  await setupWasm();
});

describe('IR Pipeline - Template Processing', () => {
  it('should handle complex nested TemplateResults correctly', () => {
    const inner = html`<span>Inner</span>`;
    const outer = html`<div>${inner}</div>`;
    
    // IR Contract: Outer template should fully inline inner HTML
    expect(outer.html).toBe('<div><span>Inner</span></div>');
    expect(outer.bindings).toHaveLength(0);
  });

  it('should preserve binding order and markers', () => {
    const handler = () => {};
    const result = html`<div @click=${handler} .prop=${1}></div>`;
    
    // Binding check
    expect(result.html).toContain('data-baex="b0"');
    expect(result.html).toContain('data-baex="b1"');
    expect(result.bindings[0].marker).toBe('b0');
    expect(result.bindings[1].marker).toBe('b1');
  });

  it('should respect the Raw() directive for non-escaped content', () => {
    const result = html`<div>${Raw('<script>alert(1)</script>')}</div>`;
    expect(result.html).toBe('<div><script>alert(1)</script></div>');
  });

  it('should handle array of complex content', () => {
    const items = [html`<li>1</li>`, html`<li>2</li>`];
    const result = html`<ul>${items}</ul>`;
    
    expect(result.html).toBe('<ul><li>1</li><li>2</li></ul>');
  });

  it('should correctly handle signal-like objects in text content', () => {
    const signal = { value: 'reactive' };
    const result = html`<div>${signal}</div>`;
    expect(result.html).toBe('<div>reactive</div>');
  });

  // @ANOMALY: Our parser is currently string-based, it should be AST-based.
  // This test validates our current string-based IR behavior.
  it('should handle edge-case binding names', () => {
    const result = html`<div @click_123_abc=${() => {}}></div>`;
    expect(result.bindings[0]).toMatchObject({
      type: 'event',
      eventName: 'click_123_abc'
    });
  });
});
