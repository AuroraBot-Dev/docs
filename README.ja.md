<p align="center">
  <img src="./assets/logo.svg" width="120" alt="AuroraBot ロゴ" />
</p>

<h1 align="center">AuroraBot ドキュメント</h1>

<p align="center">
  <b>日本語</b> | <a href="README.md">中文</a> | <a href="README.en.md">English</a>
</p>

<p align="center">
  <em>NoneBot2 ベースの新世代の内発的・自律的意思決定エージェントフレームワーク</em>
</p>

<p align="center">
  宣言的認知トポロジー · 三層連合記憶 · 統一 LLM ゲートウェイ
</p>

<p align="center">
  <a href="https://github.com/AuroraBot-Dev/AuroraBot"><img src="https://img.shields.io/badge/GitHub-リポジトリ-black?logo=github" alt="GitHub" /></a>
  <a href="https://www.aurorabot.org/"><img src="https://img.shields.io/badge/Docs-ドキュメント-blue?logo=vitepress" alt="Docs" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-CC%20BY%20SA%204.0-blue" alt="License" /></a>
</p>

---

## クイックナビゲーション

### はじめに

| ドキュメント                                                                           | 説明                                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [概要](https://www.aurorabot.org/start/overview.html)                                  | AuroraBot の位置付けと4層アーキテクチャを素早く理解              |
| [クイックスタート](https://www.aurorabot.org/start/getting-started.html)               | プロジェクトをゼロから起動する                                    |
| [設定](https://www.aurorabot.org/start/configuration.html)                             | 環境変数、プラットフォーム設定、アプリ設定、ペルソナドキュメント   |
| [オフラインドキュメント](https://www.aurorabot.org/start/offline-docsite.html)         | ドキュメントサイトをローカルでオフライン表示                      |

### アーキテクチャ

| ドキュメント                                                                             | 説明                                                                  |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [システムアーキテクチャ](https://www.aurorabot.org/architecture/system-overview.html)    | Apps / Platform / Kernel / Brain の4層を理解する                      |
| [プラットフォームランタイム](https://www.aurorabot.org/architecture/platform-runtime.html) | ホストと App のランタイム関係を理解する                               |
| [カーネルランタイム](https://www.aurorabot.org/architecture/kernel-runtime.html)         | Circuit + EventBridge の起動、スケジューリング、停止                  |
| [認知アーキテクチャ](https://www.aurorabot.org/architecture/brain-architecture.html)     | ファイル駆動の認知パイプラインと現在有効なトポロジー                  |
| [ノードシステム](https://www.aurorabot.org/architecture/node-system.html)                | Node / Agent / Router のデータ構造、イベントバス、状態マシン          |
| [記憶システム](https://www.aurorabot.org/architecture/memory-system.html)                | L1 / L2 / L3 三層連合記憶の保存と検索                                 |

### 開発

| ドキュメント                                                                               | 説明                                           |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| [認知ノード開発](https://www.aurorabot.org/develop/brain-node-development.html)            | Agent / Router ノードを作成する                |
| [App 開発ガイド](https://www.aurorabot.org/develop/app-development.html)                   | 構造からライフサイクルまで自作 App を開発      |
| [AUR CLI](https://www.aurorabot.org/develop/aur-cli.html)                                  | アプリケーション開発ツールチェーンロードマップ |

### Q&A

| ドキュメント                                                                      | 説明                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [クロスプラットフォーム](https://www.aurorabot.org/qa/cross-platform.html)         | OS とデプロイ環境の互換性                              |
| [マルチIM対応](https://www.aurorabot.org/qa/about-multi-im.html)                   | 複数チャットプラットフォームのアーキテクチャと拡張方法 |
| [アダプターについて](https://www.aurorabot.org/qa/about-adapters.html)             | NapCat、NoneBot2 アダプター、プロトコルクライアント    |
| [OneBotプロトコルについて](https://www.aurorabot.org/qa/about-onebot.html)         | OneBot v11 標準プロトコルの概要                        |

### 付録

| ドキュメント                                                                                     | 説明                                                     |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| [カーネルランタイムフロー](https://www.aurorabot.org/appendix/kernel-runtime-flow.html)           | 起動、実行、イベント処理のシーケンス図                   |
| [認知エンジン設計ノート](https://www.aurorabot.org/appendix/cortex-forge-whitebook.html)          | ファイル駆動、イベントバス、宣言的トポロジーの設計理念   |

## オープンソース謝辞

| ドキュメント                                                                           | 説明                         |
| -------------------------------------------------------------------------------------- | ---------------------------- |
| [VitePress](https://github.com/vuejs/vitepress)                                        | 静的サイトジェネレーター     |
| [Mermaid](https://github.com/mermaid-js/mermaid)                                       | 図表・フローチャート描画     |
| [vitepress-plugin-mermaid](https://github.com/emersonbottero/vitepress-plugin-mermaid) | VitePress Mermaid プラグイン |
| [vitepress-sidebar](https://github.com/jooy2/vitepress-sidebar)                        | サイドバー自動生成           |

## ライセンス

ドキュメントの内容は [CC BY-SA 4.0](https://creativecommons.org/licenses/by/4.0/) ライセンスに準拠します。詳細は [LICENSE](./LICENSE) をご参照ください。

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/JuFireX">JuFireX</a> | <a href="https://github.com/AuroraBot-Dev">AuroraBot-Dev</a></sub>
</p>
