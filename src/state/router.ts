import { createSignal } from '../framework/signals.js';
import { createSignal as createStateSignal } from '../framework/signals.js';

export type ViewId = 'home' | 'wasm' | 'framework' | string;

export interface Tab {
  id: ViewId;
  name: string;
}

export const viewSignal = createSignal<ViewId>('app_view', 'home');
export const tabsSignal = createSignal<Tab[]>('app_tabs', []);

// Global state signals for DB results and tables to enable true reactivity
export const dbResultsSignal = createSignal<any[]>('db_results', []);
export const dbTablesSignal = createSignal<string[]>('db_tables', []);

export function navigateTo(view: ViewId): void {
  viewSignal.value = view;
}

export function openTab(id: ViewId, name: string): void {
  const current = tabsSignal.value;
  if (!current.find((t) => t.id === id)) {
    tabsSignal.value = [...current, { id, name }];
  }
  viewSignal.value = id;
}
