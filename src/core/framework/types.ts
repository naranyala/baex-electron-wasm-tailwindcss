export interface PropertyDeclaration {
  type?:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ObjectConstructor
    | ArrayConstructor;
  attribute?: string | boolean;
  reflect?: boolean;
  hasChanged?(value: unknown, oldValue: unknown): boolean;
}

export type PropertyValues = Record<string, unknown>;

export interface PropertyPatch {
  propName: string;
  value: unknown;
}
