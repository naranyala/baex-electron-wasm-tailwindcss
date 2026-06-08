import fs from 'node:fs';
import path from 'node:path';
import { ensureWasmReady, wasm as wasmApi } from './wasm.js';

let initialized = false;

export async function setupWasm(): Promise<void> {
  if (initialized) return;
  const wasmPath = path.resolve(
    __dirname,
    '../../rust-wasm/pkg/web_core_bg.wasm',
  );
  const bytes = fs.readFileSync(wasmPath);
  await ensureWasmReady(bytes);
  initialized = true;
}

export const testWasm = wasmApi;
