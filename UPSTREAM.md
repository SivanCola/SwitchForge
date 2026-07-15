# Upstream policy

- Upstream repository: https://github.com/farion1231/cc-switch
- Pinned base commit: `f6e37ed99443890a865669e28bf1caf5e85d466d`
- Base release: `v3.17.0` plus the upstream cross-platform CI fix
- Local remote name: `upstream`
- Pushes to `upstream` are disabled

SwitchForge does not merge upstream `main` wholesale. Security fixes and
Claude Code or Codex compatibility fixes are reviewed and cherry-picked
individually. Every imported patch must be tested against SwitchForge's reduced
feature set and credited to its original authors.
