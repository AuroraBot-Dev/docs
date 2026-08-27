# AuroraBot Documentation

<a href="README.md">中文</a> | <b>English</b> | <a href="README.ja.md">日本語</a>

This directory contains the source for the AuroraBot documentation site, built with [VitePress](https://vitepress.dev/).

## Contents

- **Start**: Getting to know AuroraBot, installation, configuration, and quick-start guide.
- **Architecture**: System overview, AgentTree semantics, and per-package `architecture/packages/` section.
- **Development**: Port extension and contribution guidelines.
- **Reference**: Capability overview and FAQ.

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

Or use scripts from the repository root (`docs` is a Git submodule; `docs_setup` initializes it first):

```bash
# Linux / macOS
./scripts/linux/docs_setup.sh        # initialize submodule and install dependencies
./scripts/linux/docs_update.sh       # pull the latest submodule commit and update dependencies
./scripts/linux/docs_preview.sh      # local preview (or scripts/macos/docs_*.command)
./scripts/linux/docs_build.sh        # production build

# Windows (PowerShell)
.\scripts\windows\docs_setup.ps1
.\scripts\windows\docs_update.ps1
.\scripts\windows\docs_preview.ps1
.\scripts\windows\docs_build.ps1
```
