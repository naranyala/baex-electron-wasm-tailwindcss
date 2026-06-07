import { createSignal } from '../framework/signals.js';

export type ViewId = 'home' | 'wasm' | 'framework' | string;

export interface Tab {
  id: ViewId;
  name: string;
}

let _viewSignal: any;
let _tabsSignal: any;
let _dbResultsSignal: any;
let _dbTablesSignal: any;

export const getViewSignal = () => _viewSignal ||= createSignal<ViewId>('app_view', 'home');
export const getTabsSignal = () => _tabsSignal ||= createSignal<Tab[]>('app_tabs', []);
export const getDbResultsSignal = () => _dbResultsSignal ||= createSignal<any[]>('db_results', []);
export const getDbTablesSignal = () => _dbTablesSignal ||= createSignal<string[]>('db_tables', []);

export function navigateTo(view: ViewId): void {
  getViewSignal().value = view;
}

export function openTab(id: ViewId, name: string): void {
  const signal = getTabsSignal();
  const current = signal.value;
  if (!current.find((t: Tab) => t.id === id)) {
    signal.value = [...current, { id, name }];
  }
  getViewSignal().value = id;
}
