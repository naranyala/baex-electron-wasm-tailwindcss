# Baex Framework

![bee-holding-axe](./bee-holding-axe.jpg)

Baex is a high-performance, WASM-driven web component framework designed to minimize JavaScript overhead by offloading the reactive state engine to WebAssembly.

## 🎯 Purpose
The goal of Baex is to provide a "Lit-like" developer experience with the performance and memory safety of Rust, while remaining fully compliant with the native Web Components standard (`CustomElements`, `ShadowDOM`).

## ✨ Feature List

### ✅ Current Features
- **Native Web Component Base:** `BaexElement` extends `HTMLElement`, ensuring compatibility with any browser or framework.
- **WASM-Powered State:** All component properties are stored and managed in Rust for maximum memory efficiency and speed.
- **Declarative Templates:** Use the `html` tagged template literal for concise UI definitions.
- **Powerful Bindings:**
  - **Text Interpolation:** Dynamic content injection.
  - **Event Bindings:** Use `@event` (e.g., `@click`) to bind event listeners.
  - **Property Bindings:** Use `.prop` (e.g., `.value`) to sync state to DOM properties.
  - **Boolean Bindings:** Use `?attr` (e.g., `?hidden`) to toggle attributes based on boolean values.
- **Integrated Signal System:** JS/WASM synchronized signals for shared application state.
- **Reactive Property System:** Automatic re-rendering when class properties are updated.
- **Lifecycle Hooks:** Native support for `onConnected`, `onDisconnected`, and `onUpdate`.
- **Raw HTML Support:** Use the `Raw` helper to inject unescaped HTML content.
- **Microtask Batching:** `requestUpdate` batches multiple changes into a single render cycle.

### 🚀 Upcoming Features (In-Development)
- **Surgical DOM Patching:** Moving from `innerHTML` to a precise "diff and patch" system to preserve DOM state (focus, selection).
- **Automatic Signal Tracking:** components will automatically re-render when any signal used in their template changes.
- **Class Decorators:** `@property` and `@state` decorators to remove the need for `static properties` maps.
- **Stable Markers:** Permanent binding IDs to enable highly efficient surgical updates.
- **Advanced Lifecycle Hooks:** Addition of `willUpdate` and `didUpdate` for fine-grained control.

## 🏗️ Core Architecture: "The Brain and the Shell"
Baex splits the framework into two distinct layers to maximize efficiency:

### 🧠 The Brain (Rust/WASM)
The reactive core resides in WASM. It is responsible for:
- **State Management:** Maintaining the source of truth for all component properties.
- **Reactive Graph:** Tracking signals and their dependencies.
- **Template Processing:** Parsing `html` tagged templates into optimized internal representations.
- **Diffing (Upcoming):** Calculating the minimal set of DOM changes required to synchronize the UI with the state.

### 🐚 The Shell (TypeScript/JS)
The JS layer acts as a thin wrapper around the browser's native APIs:
- **DOM Lifecycle:** Managing `connectedCallback` and `disconnectedCallback`.
- **Rendering:** Executing the instructions provided by the WASM engine.
- **Event Bridge:** Handling DOM events and routing them back to the WASM state.
- **Developer API:** Providing the `BaexElement` base class and `html` tagged templates.

## 🚧 Boundaries & Responsibilities
| Responsibility | Layer | Why? |
| :--- | :--- | :--- |
| Property Storage | WASM | Memory efficiency and fast access in Rust. |
| Dependency Tracking | WASM | Complex graph traversal is faster in compiled code. |
| DOM Manipulation | JS | Direct access to the browser's `HTMLElement` and `Node` APIs. |
| Event Handling | JS | Native browser events must be captured in the JS main thread. |
| Template Parsing | WASM | High-speed string processing and binding extraction. |

## 🗺️ Development Roadmap

### Phase 1: Foundations (Current)
- [x] Basic `BaexElement` implementation.
- [x] WASM-backed property storage.
- [x] String-based template rendering.
- [x] Basic signal implementation.

### Phase 2: Surgical Reactivity (Next)
- [ ] **Surgical DOM Updates:** Replace `innerHTML` rewrites with precise node-level patches.
- [ ] **Auto-Signal Tracking:** Implement a tracking context so components automatically re-render when accessed signals change.
- [ ] **Stable Markers:** Implement stable binding markers to prevent DOM state loss.

### Phase 3: DX Optimization
- [ ] **Property Decorators:** Introduce `@property` and `@state` to eliminate `static properties` boilerplate.
- [ ] **Advanced Bindings:** Support for two-way data binding and complex event modifiers.

### Phase 4: Production Readiness
- [ ] **Tree-shaking & Optimization:** Optimize the WASM binary size.
- [ ] **Advanced Lifecycle:** Implement `willUpdate` and `didUpdate` hooks.
- [ ] **Comprehensive Documentation:** API references and migration guides.
