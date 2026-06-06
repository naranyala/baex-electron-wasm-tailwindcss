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

export type OptimizedIR = {
  html: string;
  bindings: any[]; // Matches the expected binding structure
};

// @RULE: Every IR layer transformation MUST be pure and deterministic.
// @RULE: The 'marker' field is mandatory for any dynamic element/binding.

// @ANOMALY: Our current parser in Rust (process_template) conflates AST generation with template serialization.
// @ANOMALY: No explicit 'OptimizedIR' node type exists yet, causing inefficient runtime DOM traversal.
