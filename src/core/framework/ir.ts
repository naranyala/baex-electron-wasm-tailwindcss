import { z } from 'zod';
 
// Pipeline Layers
export type SourceTemplate = {
  strings: TemplateStringsArray;
  values: unknown[];
};
 
export const ASTNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.enum(['element', 'text', 'binding']),
  tagName: z.string().optional(),
  props: z.record(z.string(), z.any()).optional(),
  children: ASTNodeSchema.array().optional(),
  content: z.string().optional(),
  marker: z.string().optional(),
}));
 
export type ASTNode = z.infer<typeof ASTNodeSchema>;
 
export type DOMInstruction = 
  | { type: 'element'; tag: string; attrs: Record<string, string>; children: DOMInstruction[]; bindings: BindingInstruction[] }
  | { type: 'text'; content: string }
  | { type: 'fragment'; children: DOMInstruction[] }
  | { type: 'show'; condition: any; thenBranch: DOMInstruction; elseBranch?: DOMInstruction }
  | { type: 'for'; list: any; itemTemplate: (item: any) => DOMInstruction; keyFn?: (item: any) => any };
 
export type BindingInstruction = {
  type: 'event' | 'property' | 'bool';
  name: string;
  valueIdx: number;
  marker: string;
};
 
export type OptimizedIR = {
  root: DOMInstruction;
  bindings: BindingInstruction[]; 
};
 
// @RULE: Every IR layer transformation MUST be pure and deterministic.
// @RULE: The 'marker' field is mandatory for any dynamic element/binding.
