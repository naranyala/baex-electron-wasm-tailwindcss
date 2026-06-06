# BAEX Framework Evolution: From Template-String to Reactive IR

# BAEX Framework Evolution: From Template-String to Reactive IR

## 🟢 Phase 1: Architectural Redefinition (IR Layer)
- [ ] **Redefine IR Types**: Move from `OptimizedIR { html, bindings }` to an instruction-based `DOMInstruction` set in `src/framework/ir.ts`.
- [ ] **Implement IR Compiler**: Create a JS-side compiler that transforms the WASM-generated HTML string and bindings into a `DOMInstruction` tree using `DOMParser`.
- [ ] **Define Patch IR**: Create a specific IR type for targeted updates (`PropertyPatch`, `AttributePatch`, `TextPatch`).

## 🟡 Phase 2: Rendering Engine Overhaul
- [ ] **Eliminate `innerHTML`**: Rewrite `BaexElement._renderInitial` to build the DOM tree recursively using `document.createElement` based on the `DOMInstruction` tree.
- [ ] **Remove Marker-based Lookups**: Replace `querySelector('[data-baex="..."]')` with direct node references stored during the build phase.
- [ ]: **Direct Binding Application**: Attach event listeners and properties during the node creation process.

## 🔴 Phase 3: Fine-Grained Reactivity (The "Patch" System)
- [ ] **Implement Dependency-to-Node Mapping**: Create a registry that maps specific signals to the exact DOM nodes they affect.
- [ ] **Rewrite `_performUpdate`**: Replace the full re-render cycle with a patching cycle that only updates changed nodes.
- [ ] **Optimize Memory**: Ensure that the node map is cleaned up during `disconnectedCallback` to prevent memory leaks.

## 🧪 Verification
- [ ] **Regression Testing**: Ensure all existing components still render correctly.
- [ ] **Performance Benchmark**: Compare `innerHTML` render time vs. Instruction-based render time.
- [ ] **Leak Detection**: Verify that signal subscriptions are correctly disposed of.

## 🟡 Phase 2: Rendering Engine Overhaul
- [ ] **Eliminate `innerHTML`**: Rewrite `BaexElement._renderInitial` to build the DOM tree using `document.createElement` based on the IR instructions.
- [ ] **Remove Marker-based Lookups**: Replace `querySelector('[data-baex="..."]')` with direct node references stored during the build phase.
- [ ] **Implement Direct Binding**: Bind events and properties during node creation rather than in a second pass.

## 🔴 Phase 3: Fine-Grained Reactivity (The "Patch" System)
- [ ] **Implement Dependency-to-Node Mapping**: Create a registry that maps specific signals to the exact DOM nodes they affect.
- [ ] **Rewrite `_performUpdate`**: Replace the full re-render cycle with a patching cycle that only updates changed nodes.
- [ ] **Optimize Memory**: Ensure that the node map is cleaned up during `disconnectedCallback` to prevent memory leaks.

## 🧪 Verification
- [ ] **Regression Testing**: Ensure all existing components still render correctly.
- [ ] **Performance Benchmark**: Compare `innerHTML` render time vs. Instruction-based render time.
- [ ] **Leak Detection**: Verify that signal subscriptions are correctly disposed of.
