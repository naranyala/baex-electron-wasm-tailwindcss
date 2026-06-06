import { wasm } from './wasm';
import type { PropertyDeclaration } from './types';

export function getTypeName(type?: unknown): string | undefined {
  if (type === String) return 'string';
  if (type === Number) return 'number';
  if (type === Boolean) return 'boolean';
  if (type === Object) return 'object';
  if (type === Array) return 'array';
  return undefined;
}

export function resolveAttributeName(
  propName: string,
  decl: PropertyDeclaration,
): string | null {
  if (decl.attribute === false) return null;
  if (decl.attribute === true || decl.attribute === undefined)
    return propName.toLowerCase();
  return decl.attribute;
}

export function normalizePatches(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(
      ([propName, value]) => ({ propName, value }),
    );
  }
  return [];
}

export function deserializeProperty(value: string | null, type?: unknown): unknown {
  return wasm.deserializeProperty(value, getTypeName(type));
}

export function serializeProperty(value: unknown, type?: unknown): string | null {
  const result = wasm.serializeProperty(value, getTypeName(type));
  if (result === null || result === undefined) return null;
  return String(result);
}
