# SwitchForge

SwitchForge is a focused desktop control deck for managing providers, MCP
servers, and skills used by Claude Code and Codex.

> Status: early alpha. macOS is the first supported release platform.

## Direction

SwitchForge is intentionally smaller than its upstream foundation:

- Claude Code and Codex only
- Provider import, editing, validation, and one-click switching
- Unified MCP and skills management
- Local backups and tray switching
- No local LLM proxy, protocol conversion, usage tracking, session browser, or
  cloud sync

The current branch is being reduced incrementally. Features not listed above
may still be present while the alpha migration is in progress and are not part
of the supported SwitchForge surface.

## Development

Requirements:

- Node.js 22.12 or newer in the Node 22 line
- pnpm 10.12.3
- Rust 1.95
- Tauri 2 platform prerequisites

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:unit
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri dev
```

## Data

SwitchForge stores its own state under `~/.switchforge`. It does not modify
CC Switch data unless the user explicitly starts the legacy import flow.

Claude Code and Codex live configuration files are backed up before managed
writes. Keep an independent backup of important credentials during alpha
testing.

## Upstream and license

SwitchForge is an independent derivative of
[CC Switch](https://github.com/farion1231/cc-switch), based on commit
`f6e37ed99443890a865669e28bf1caf5e85d466d`.

The project is distributed under the MIT License. See [LICENSE](LICENSE),
[NOTICE.md](NOTICE.md), and [UPSTREAM.md](UPSTREAM.md).
