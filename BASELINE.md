# Baseline

Baseline commit: `f6e37ed99443890a865669e28bf1caf5e85d466d`

Validated on macOS before SwitchForge changes:

- Frontend: 69 test files, 446 tests passed
- Rust library: 1,976 tests passed, 2 ignored
- TypeScript typecheck: passed
- Prettier check: passed
- Renderer production build: passed
- Rust fmt: passed
- Rust Clippy with warnings denied: passed

The upstream WebDAV suite has a temporary-directory collision when duplicate
Rust test processes run concurrently. A single isolated test run passes. The
WebDAV feature is outside SwitchForge's retained scope.
