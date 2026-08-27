# AuroraBot ドキュメント

<a href="README.md">中文</a> | <a href="README.en.md">English</a> | <b>日本語</b>

このディレクトリは [VitePress](https://vitepress.dev/) で構築された AuroraBot ドキュメントサイトのソースです。

## コンテンツ

- **スタート**: AuroraBot の紹介、インストール、設定、クイックスタートガイド。
- **アーキテクチャ**: システム概要、AgentTree セマンティクス、パッケージ別 `architecture/packages/` セクション。
- **開発**: ポート拡張方法とコントリビューションガイドライン。
- **参考**: できること一覧と FAQ。

## 前提条件

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm   # まだインストールしていない場合
```

## クイックスタート

```bash
cd docs
pnpm install
pnpm dev        # ローカル開発サーバー、デフォルト http://localhost:5173
pnpm build      # 本番ビルド、.vitepress/dist に出力
```

リポジトリルートからスクリプトを使用することもできます（`docs` は Git サブモジュールで、`docs_setup` が最初にサブモジュールを初期化します）：

```bash
# Linux / macOS
./scripts/linux/docs_setup.sh        # サブモジュールの初期化と依存関係のインストール
./scripts/linux/docs_update.sh       # サブモジュールを最新に更新し依存関係を更新
./scripts/linux/docs_preview.sh      # ローカルプレビュー（または scripts/macos/docs_*.command）
./scripts/linux/docs_build.sh        # 本番ビルド

# Windows (PowerShell)
.\scripts\windows\docs_setup.ps1
.\scripts\windows\docs_update.ps1
.\scripts\windows\docs_preview.ps1
.\scripts\windows\docs_build.ps1
```
