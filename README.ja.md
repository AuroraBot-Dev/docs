# AuroraBot ドキュメント

<a href="README.md">中文</a> | <a href="README.en.md">English</a> | <b>日本語</b>

このディレクトリは [VitePress](https://vitepress.dev/) で構築された AuroraBot ドキュメントサイトのソースです。

## コンテンツ

- **スタート**: AuroraBot の紹介、インストール、設定、クイックスタートガイド。
- **アーキテクチャ**: システム概要、パッケージ別 `architecture/packages/` セクションなど。
- **開発**: ポート拡張方法とコントリビューションガイドライン。
- **参考**: できること一覧と FAQ。

## 前提条件

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm   # まだインストールしていない場合
```

## クイックスタート

`docs` は Git サブモジュールです。メインリポジトリで `aurora setup` を実行するとサブモジュールの初期化と依存関係のインストールが行われ、その後メインリポジトリのルートから `aurora docs` でこのディレクトリの pnpm スクリプトを実行できます：

```bash
aurora docs dev      # ローカル開発サーバー、デフォルト http://localhost:5173
aurora docs build    # 本番ビルド、.vitepress/dist に出力
```

このディレクトリで直接 pnpm を使用することもできます：

```bash
pnpm install
pnpm dev        # ローカル開発サーバー、デフォルト http://localhost:5173
pnpm build      # 本番ビルド、.vitepress/dist に出力
```
