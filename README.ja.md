# AuroraBot ドキュメント

このディレクトリは [VitePress](https://vitepress.dev/) で構築された AuroraBot ドキュメントサイトのソースです。

## コンテンツ

- **スタート**: インストール、設定、クイックスタートガイド。
- **アーキテクチャ**: システム概要、AgentTree セマンティクス、パッケージ別 `architecture/packages/` セクション。
- **開発**: ポート拡張方法とコントリビューションガイドライン。
- **RFC**: 唯一の設計ベースライン（`rfc/0300-unified-architecture-and-contracts.md`）。

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

`docs_setup` と `docs_update` は `git submodule update --init` で `docs` サブモジュールがチェックアウトされていることを確認（未初期化の場合は自動で初期化）してから依存関係をインストールします。`docs_update` はサブモジュールをリモートの最新コミットに更新します。ポインタが変わった場合は、メインリポジトリでその変更をコミットしてください。

## 備考

- `.npmrc` で `node-linker=hoisted` を設定し、pnpm が Vite の依存関係プリバンドルと互換性のあるフラットレイアウトでインストールします。
- Mermaid 図表は `vitepress-plugin-mermaid` で統合されています。
- 読みやすさの強化は `@nolebase/vitepress-plugin-enhanced-readabilities` で提供されます。

## 約束事

- 設計変更はまず `rfc/0300-unified-architecture-and-contracts.md` を更新し、その後 `architecture/` のページと同期します。
- 新しいパッケージは `architecture/packages/package-baseline.md` に従う必要があります。
