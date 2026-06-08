# Baex Framework

<!-- ![bee-holding-axe](./bee-holding-axe.jpg) -->

<div style="width: 100%; text-align: center;"><img src="./bee-holding-axe2.jpg" width="30%"></div>

Baex is a high-performance, reactive web framework built on top of Rust/WASM, designed to extend Browser APIs with modern reactive capabilities.

## Overview

Baex bridges the gap between low-level performance and high-level developer experience by utilizing WebAssembly for intensive computations and a custom reactive TypeScript layer for DOM management.

## Key Features

- **Reactive State Management:** Automated signal-based reactivity with dependency tracking.
- **Intermediate Representation (IR) Pipeline:** A robust data pipeline for efficient template processing.
- **WASM Integration:** Rust-based engine for template parsing, state management, and high-performance primitives.
- **Component System:** Base element class with property and state management.
- **Advanced Primitives:** Built-in support for conditional rendering (`Show`) and list mapping (`For`).
- **Dependency Injection:** Context API for managing global state across component trees.

## Getting Started

1. **Prerequisites:** Ensure Bun and wasm-pack are installed.
2. **Installation:** Run `bun install`.
3. **Development:** Use `bun run dev` to start the development server.
4. **Build:** Use `bun run build` to compile the project.

## Project Structure

- `rust-wasm/`: Core engine implemented in Rust.
- `src/`: TypeScript framework and components.
- `dist/`: Build artifacts.

## Roadmap
For a detailed list of current progress and upcoming performance optimizations, see [TODOS.md](./TODOS.md).
