# AuroraBot Documentation

<a href="README.md">中文</a> | <b>English</b> | <a href="README.ja.md">日本語</a>

This directory contains the source for the AuroraBot documentation site, built with [VitePress](https://vitepress.dev/).

## Contents

- **Start**: Getting to know AuroraBot, installation, configuration, and quick-start guide.
- **Architecture**: System overview, the per-package `architecture/packages/` section, and more.
- **Development**: Port extension and contribution guidelines.
- **Reference**: Capability overview and FAQ.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm   # if not already installed
```

## Quick Start

Use the shortcut scripts from the AuroraBot repository root (`docs` is a Git submodule; `docs_setup` initializes it first):

```bash
# Linux / macOS
./scripts/linux/docs_setup.sh        # initialize submodule and install dependencies
./scripts/linux/docs_preview.sh      # local dev server, default http://localhost:5173
./scripts/linux/docs_build.sh        # production build, output to .vitepress/dist
./scripts/linux/docs_update.sh       # pull the latest submodule commit and update dependencies

# Windows (PowerShell)
.\scripts\windows\docs_setup.ps1
.\scripts\windows\docs_preview.ps1
.\scripts\windows\docs_build.ps1
.\scripts\windows\docs_update.ps1
```

Alternatively, run `aurora setup` in the main repository (initializes submodules and installs docs dependencies), or use pnpm directly in this directory:

```bash
pnpm install
pnpm dev        # local dev server, default http://localhost:5173
pnpm build      # production build, output to .vitepress/dist
```
