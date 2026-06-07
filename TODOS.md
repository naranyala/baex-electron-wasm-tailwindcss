# BAEX Framework Evolution

## ✅ Completed
- [x] **Architectural Redefinition**: Instruction-based `DOMInstruction` set.
- [x] **IR Compiler**: JS-side compiler using `DOMParser`.
- [x] **Rendering Engine**: Recursive DOM building via `document.createElement` (replacing root `innerHTML`).
- [x] **Reactive Primitives**: 
  - [x] `createEffect` for side effects.
  - [x] `createStore` for nested reactive state.
  - [x] `Show` for conditional rendering.
  - [x] `For` for list rendering.
- [x] **Context API**: Dependency injection for components.

## 🚀 Performance-Focused Roadmap (Current Priority)

### 🛠️ Level 1: Stability & Memory (High Priority)
- [ ] **Lifecycle Cleanup**: Implement an `onCleanup` mechanism to dispose of signal subscriptions and effects when components unmount.
- [ ] **Binary Signal IDs**: Transition from string-based signal keys to numeric IDs to reduce JS-WASM bridge overhead.

### ⚡ Level 2: Rendering Optimization (Medium Priority)
- [ ] **Keyed Reconciliation**: Replace `innerHTML = ''` in `Show` and `For` primitives with a diffing algorithm to prevent DOM thrashing.
- [ ] **Fragment-based Patching**: Optimize partial updates to only touch the minimum required DOM nodes.

### 🏗️ Level 3: Build-time Transformation (Long Term)
- [ ] **Vite Compilation Plugin**: Move Rust-WASM template parsing and IR generation from runtime to build-time.
- [ ] **AOT Template Functions**: Compile templates directly into optimized JS functions that instantiate DOM nodes.

## 🧪 Verification
- [ ] **Regression Testing**: Comprehensive suite for all primitives.
- [ ] **Performance Benchmark**: Compare `innerHTML` lists vs. Keyed reconciliation.
- [ ] **Leak Detection**: Verify memory stability during high-frequency mount/unmount cycles.
