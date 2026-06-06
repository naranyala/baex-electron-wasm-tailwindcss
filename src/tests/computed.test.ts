import { beforeAll, describe, expect, it } from 'vitest';
import { createSignal, Computed } from '../framework/signals.js';
import { setupWasm } from './setup.js';

beforeAll(async () => {
  await setupWasm();
});

describe('Computed Signal', () => {
  it('should recompute when dependencies change', () => {
    const s1 = createSignal('s1', 10);
    const s2 = createSignal('s2', 20);
    
    const sum = new Computed(() => s1.value + s2.value);
    
    expect(sum.value).toBe(30);
    
    s1.value = 15;
    expect(sum.value).toBe(35);
    
    s2.value = 25;
    expect(sum.value).toBe(40);
  });
});
