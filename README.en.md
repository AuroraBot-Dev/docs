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

`docs` is a Git submodule. Run `aurora setup` in the main repository to initialize the submodule and install dependencies; then drive this directory's pnpm scripts with `aurora docs` from the main repository root:

```bash
aurora docs dev      # local dev server, default http://localhost:5173
aurora docs build    # production build, output to .vitepress/dist
```

Alternatively, use pnpm directly in this directory:

```bash
pnpm install
pnpm dev        # local dev server, default http://localhost:5173
pnpm build      # production build, output to .vitepress/dist
pnpm preview    # preview the production build
pnpm clean      # clean node_modules and build caches
pnpm reinstall  # clean and reinstall dependencies (--del-lock also removes the lockfile)
```
