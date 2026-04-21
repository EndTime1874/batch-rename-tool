# Repository Guidelines

## Project Structure & Module Organization

This is a Tauri 2 desktop app with a React frontend and Rust backend. Frontend code lives in `src/`: UI components are under `src/components`, hooks under `src/hooks`, shared TypeScript types under `src/types`, utilities under `src/utils`, and global styling in `src/styles/global.css`. Rust code lives in `src-tauri/src`: `core` contains scanner, rules, conflict detection, backup, validation, and rename execution logic; `commands` exposes Tauri command handlers; `models` defines shared data structures; `utils` contains path helpers. App icons and packaging assets are in `src-tauri/icons`, `src-tauri/app-icon.png`, and platform configs in `src-tauri/tauri.*.conf.json`.

## Build, Test, and Development Commands

- `npm install`: install JavaScript dependencies.
- `npm run dev`: start the Vite frontend only.
- `npm run tauri dev`: run the full desktop app in development mode.
- `npm run build`: type-check and build frontend assets.
- `cd src-tauri && cargo test`: run Rust unit tests.
- `cd src-tauri && cargo fmt --check`: verify Rust formatting.
- `npm run tauri:build:mac`: build a macOS DMG.
- `npm run tauri:build:windows`: build a Windows NSIS installer on Windows.

## Coding Style & Naming Conventions

Use TypeScript with React function components and explicit prop interfaces. Component files use `PascalCase.tsx`; hooks use `useName.ts`; Rust modules use `snake_case.rs`. Keep UI state in hooks or top-level containers, and call Tauri through `src/utils/tauriInvoke.ts`. Rust should prefer `Result<T, String>` for user-facing command errors and avoid `unwrap`/`expect` in production code. Run `cargo fmt` before committing Rust changes.

## Testing Guidelines

Rust unit tests are the primary test suite and are colocated in `#[cfg(test)]` modules. Name tests by behavior, for example `scanner_ignores_macos_ds_store` or `renamer_records_failures_without_interrupting_remaining_items`. Add tests when changing core rename rules, scanning, conflict detection, backup, templates, or validation. Always run `cargo test` and `npm run build` before packaging.

## Commit & Pull Request Guidelines

Recent commits use short imperative messages, such as `implement template management` and `harden cross-platform error handling`. Keep commits focused and avoid mixing unrelated refactors. Pull requests should include a concise summary, verification commands run, linked issues if applicable, and screenshots or screen recordings for visible UI changes. For packaging changes, include the target platform and generated artifact path.

## Security & Configuration Tips

Do not commit generated `dist/` or `src-tauri/target/` output. Keep Tauri capabilities minimal in `src-tauri/capabilities/default.json`. Treat filesystem operations carefully: validate paths, preserve friendly errors, and avoid destructive actions outside selected files.
