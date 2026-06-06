# Baex Framework Development TODOs

## Core Framework (JS/TS)

- [ ] Surgical Rendering
  - [ ] Move from innerHTML to a patch-based update system.
  - [ ] Implement _applyPatches(patches) to perform precise DOM modifications.
  - [ ] Ensure DOM state (focus, selection) is preserved across updates.
- [ ] DX Improvements
  - [ ] Implement @property and @state decorators.
  - [ ] Improve TemplateResult type definitions for better IDE support.
  - [ ] Implement whenUpdate as a first-class lifecycle method.

## WASM Engine (Rust)

- [ ] Diffing Algorithm
  - [ ] Implement a virtual-diffing engine that returns PropertyPatch sets.
  - [ ] Optimize the process_template function for repeated executions.
- [ ] State Management
  - [ ] Implement a more robust ComponentState to handle nested components.
  - [ ] Enhance serializeProperty / deserializeProperty for complex JS objects.
- [ ] Signal Graph
  - [ ] Implement a dependency graph to allow one signal to derive from another.

## Quality Assurance

- [ ] Testing Suite
  - [ ] Create integration-complex.test.ts with deeply nested component trees.
  - [ ] Add performance benchmarks for render cycles (TBT/LCP).
  - [ ] Test edge cases for template interpolations (nulls, undefineds, empty arrays).
- [ ] Stability
  - [ ] Resolve NotSupportedError issues in jsdom.
  - [ ] Implement a strict mode for property declarations.

## Tooling & Distribution

- [ ] Build Pipeline
  - [ ] Optimize WASM binary size using wasm-opt.
  - [ ] Implement a development server with Hot Module Replacement (HMR) for components.
- [ ] Documentation
  - [ ] Write comprehensive API guides for BaexElement.
  - [ ] Create Getting Started tutorials.
