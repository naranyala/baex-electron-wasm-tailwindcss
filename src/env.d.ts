/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface Window {
  ipcRenderer: any;
  db: {
    init: (path: string) => Promise<string>;
    seed: () => Promise<string>;
    execute: (sql: string, params: any[]) => Promise<string>;
    query: (sql: string, params: any[]) => Promise<any[]>;
  };
}
