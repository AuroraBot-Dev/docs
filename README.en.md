# AuroraBot Documentation

This directory contains the source for the AuroraBot documentation site, built with [VitePress](https://vitepress.dev/).

## Contents

- **Start**: Installation, configuration, and quick-start guide.
- **Architecture**: System overview, AgentTree semantics, and per-package `architecture/packages/` section.
- **Development**: Port extension and contribution guidelines.
- **RFC**: Single authoritative design baseline (`rfc/0300-unified-architecture-and-contracts.md`).

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm   # if not already installed
```

## Quick Start

```bash
cd docs
pnpm install
pnpm dev        # local dev server, default http://localhost:5173
pnpm build      # production build, output to .vitepress/dist
```

Or use scripts from the repository root:

```bash
# Linux / macOS
./scripts/linux/docs_preview.sh      # or scripts/macos/docs_preview.command
./scripts/linux/docs_build.sh        # or scripts/macos/docs_build.command

# Windows (PowerShell)
.\scripts\windows\docs_preview.ps1
.\scripts\windows\docs_build.ps1
```

## Notes

- `.npmrc` sets `node-linker=hoisted` so pnpm installs dependencies in a flat layout compatible with Vite's dependency pre-bundling.
- Mermaid diagrams are integrated via `vitepress-plugin-mermaid`.
- Reading enhancements are provided by `@nolebase/vitepress-plugin-enhanced-readabilities`.

## Conventions

- Design changes first update `rfc/0300-unified-architecture-and-contracts.md`, then sync to the `architecture/` pages.
- New packages must follow `architecture/packages/package-baseline.md`.
