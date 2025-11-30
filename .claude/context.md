# Project Context - Influencer Marketing Tool

本プロジェクトは、インフルエンサーマーケティングプラットフォームの開発プロジェクトです。このコンテキストファイルは、開発時に常に参照すべき重要なドキュメントへのナビゲーションを提供します。

---

## 🎯 はじめに

このプロジェクトに着手する際は、**必ず以下の順序でドキュメントを読んでください**：

1. **📋 [08-workflow.md](../docs/08-workflow.md)** ⭐⭐⭐ **最優先**
   - プラットフォームのすべてのワークフロー（全18章）
   - ユーザーの行動フロー
   - システムの処理フロー

2. **📄 [01-overview.md](../docs/01-overview.md)**
   - プロジェクトの全体像
   - ミッション・価値提案

3. **👥 [02-users.md](../docs/02-users.md)**
   - ユーザーロール（企業、インフルエンサー、管理者）
   - 各ロールのジャーニー・権限

4. **🛠️ [03-tech-stack.md](../docs/03-tech-stack.md)**
   - フロントエンド・バックエンド技術
   - データベーススキーマ
   - API エンドポイント設計

5. **⚙️ [04-features.md](../docs/04-features.md)**
   - ワークフロー別の詳細機能仕様
   - 各フェーズの実装要件

6. **🔐 [05-security.md](../docs/05-security.md)**
   - セキュリティ要件
   - 認証・認可・データ保護
   - コンプライアンス

7. **📊 [06-performance.md](../docs/06-performance.md)**
   - パフォーマンス目標
   - スケーラビリティ要件
   - モニタリング

8. **💻 [07-development-rules.md](../docs/07-development-rules.md)**
   - コーディング規約
   - Git ワークフロー
   - CI/CD パイプライン

---

## 📚 詳細ドキュメントマップ

### 要件定義ドキュメント

| ドキュメント | 説明 | 用途 |
|------------|------|------|
| **[08-workflow.md](../docs/08-workflow.md)** | インフルエンサーマッチングワークフロー全体（18章） | 全体設計の理解 |
| **[01-overview.md](../docs/01-overview.md)** | プロジェクト概要・ミッション | プロジェクト理解 |
| **[02-users.md](../docs/02-users.md)** | ユーザーロール・ジャーニー | ユーザー理解 |
| **[03-tech-stack.md](../docs/03-tech-stack.md)** | 技術仕様・データベース設計・API | 実装の技術的詳細 |
| **[04-features.md](../docs/04-features.md)** | ワークフロー別機能仕様 | 機能実装ガイド |
| **[05-security.md](../docs/05-security.md)** | セキュリティ・認証・データ保護 | セキュア実装 |
| **[06-performance.md](../docs/06-performance.md)** | パフォーマンス・スケーラビリティ | 性能最適化 |
| **[07-development-rules.md](../docs/07-development-rules.md)** | コーディング規約・Git・CI/CD | 開発プロセス |

---

## 🚀 開発フェーズ別アクセスガイド

### フェーズ 1: セットアップ・全体設計

```
1. 08-workflow.md を全体で読む
2. 01-overview.md で概要を理解
3. 02-users.md でユーザーを理解
4. 07-development-rules.md でセットアップ方法を確認
```

### フェーズ 2: フロントエンド開発

```
1. 04-features.md で実装する機能を確認
2. 03-tech-stack.md で必要な技術を確認
3. 07-development-rules.md のコーディング規約を確認
4. 05-security.md で要件を確認
```

### フェーズ 3: バックエンド開発

```
1. 04-features.md で API 仕様を確認
2. 03-tech-stack.md でAPI エンドポイント・DB設計を確認
3. 07-development-rules.md でコーディング規約を確認
4. 05-security.md でセキュリティ要件を確認
```

### フェーズ 4: インテグレーション・テスト

```
1. 06-performance.md でパフォーマンス目標を確認
2. 05-security.md でセキュリティテスト項目を確認
3. 07-development-rules.md でテスト手順を確認
```

### フェーズ 5: デプロイ・本番運用

```
1. 05-security.md でセキュリティチェックリストを実施
2. 07-development-rules.md でデプロイ手順を確認
3. 06-performance.md でモニタリング設定を確認
```

---

## 🔑 ワークフロー（08-workflow.md）の章構成

### 第1章：ユーザー登録・審査
- 企業・インフルエンサーの登録
- 本人確認・SNS認証
- ポートフォリオ・口座情報登録

**関連**: [02-users.md](../docs/02-users.md)、[04-features.md](../docs/04-features.md)

### 第2章：プロジェクト作成・募集
- プロジェクト作成・公開
- 下書き管理
- インフルエンサーの検索・ウォッチリスト

**関連**: [04-features.md](../docs/04-features.md)

### 第3章：マッチング
- インフルエンサー検索・お気に入り
- 応募・スカウト
- マッチング成立・リピート依頼

**関連**: [04-features.md](../docs/04-features.md)

### 第4章：チャット・コミュニケーション
- プロジェクト内チャット
- リアルタイム通知
- メッセージ監視

**関連**: [03-tech-stack.md](../docs/03-tech-stack.md)（Socket.io）

### 第5章：契約締結
- 条件調整
- NDA 署名
- 契約書発行

**関連**: [04-features.md](../docs/04-features.md)、[05-security.md](../docs/05-security.md)

### 第6章：制作・納品
- マイルストーン管理
- 構成案レビュー
- 動画納品・投稿確認

**関連**: [04-features.md](../docs/04-features.md)

### 第7章：請求・支払い
- 月次請求書発行
- 入金確認
- インフルエンサーへの振込

**関連**: [03-tech-stack.md](../docs/03-tech-stack.md)（Stripe）、[05-security.md](../docs/05-security.md)

### 第8章：完了・評価
- 案件完了
- 相互評価
- ポートフォリオ追加

**関連**: [04-features.md](../docs/04-features.md)

### 第9章：分析・インサイト
- プロジェクト分析
- ROI 計算
- データエクスポート

**関連**: [06-performance.md](../docs/06-performance.md)

### 第10-18章：その他機能
- 例外フロー（キャンセル・紛争解決）
- 料金プラン
- サポート・管理者機能
- 法的文書

**関連**: [04-features.md](../docs/04-features.md)

---

## 💡 タスク・実装別ガイド

### インフルエンサー検索機能を実装する場合

```
読むべきドキュメント:
1. 08-workflow.md - 第2-3章
2. 04-features.md - 第2-3章の機能
3. 03-tech-stack.md - API エンドポイント設計
4. 07-development-rules.md - コーディング規約
5. 06-performance.md - パフォーマンス目標
```

### 支払い・請求機能を実装する場合

```
読むべきドキュメント:
1. 08-workflow.md - 第7章
2. 04-features.md - 第7章の機能
3. 03-tech-stack.md - Stripe 連携、DB設計
4. 05-security.md - 支払い情報セキュリティ
5. 07-development-rules.md - テスト手順
```

### チャット機能を実装する場合

```
読むべきドキュメント:
1. 08-workflow.md - 第4章
2. 04-features.md - 第4章の機能
3. 03-tech-stack.md - Socket.io 設計
4. 05-security.md - チャット監視・セキュリティ
5. 07-development-rules.md - リアルタイム実装
```

### セキュリティ対策を実装する場合

```
読むべきドキュメント:
1. 05-security.md - すべてのセクション
2. 03-tech-stack.md - 認証・暗号化技術
3. 07-development-rules.md - セキュリティチェックリスト
4. 08-workflow.md - 該当フェーズ
```

---

## 🎨 開発時よくある質問

### Q: プロジェクト作成API の仕様は？
**A**: [03-tech-stack.md](../docs/03-tech-stack.md) の「API エンドポイント設計」セクション、および [04-features.md](../docs/04-features.md) の「第2章：プロジェクト作成」を参照。

### Q: インフルエンサー本人確認の流れは？
**A**: [08-workflow.md](../docs/08-workflow.md) の「第1章：1-5 インフルエンサーの本人確認」、[02-users.md](../docs/02-users.md) の「インフルエンサー（Influencer）」セクションを参照。

### Q: NDA の実装仕様は？
**A**: [08-workflow.md](../docs/08-workflow.md) の「第5章：5-2 NDA の締結」、[04-features.md](../docs/04-features.md) の「第5章」を参照。

### Q: 企業担当者の権限制御は？
**A**: [02-users.md](../docs/02-users.md) の「権限ロール」、[05-security.md](../docs/05-security.md) の「権限管理」を参照。

### Q: 決済処理の流れは？
**A**: [08-workflow.md](../docs/08-workflow.md) の「第7章：請求・支払い」、[03-tech-stack.md](../docs/03-tech-stack.md) の「Stripe」、[05-security.md](../docs/05-security.md) の「支払い情報セキュリティ」を参照。

---

## 📋 ドキュメント更新ルール

- **変更検出**: ドキュメント更新時は最下部の「最終更新」を確認
- **関連ドキュメント**: 各ドキュメントの最下部に関連ドキュメントへのリンク
- **期間レビュー**: 月 1 回のドキュメント見直し推奨

---

## 🔗 クイックリンク

### 重要なドキュメント（優先順）
1. ⭐⭐⭐ [08-workflow.md](../docs/08-workflow.md) - **最初に読む**
2. ⭐⭐ [04-features.md](../docs/04-features.md) - 機能実装ガイド
3. ⭐⭐ [03-tech-stack.md](../docs/03-tech-stack.md) - 技術仕様
4. ⭐⭐ [07-development-rules.md](../docs/07-development-rules.md) - 開発ルール
5. ⭐ [05-security.md](../docs/05-security.md) - セキュリティ

### 参考ドキュメント
- [01-overview.md](../docs/01-overview.md) - プロジェクト概要
- [02-users.md](../docs/02-users.md) - ユーザー仕様
- [06-performance.md](../docs/06-performance.md) - パフォーマンス仕様
- [requirements.md](../docs/requirements.md) - 要件定義マスター

---

## 🎓 新しい開発者向けオンボーディング

新しいメンバーが着手する場合：

1. **Day 1**: [08-workflow.md](../docs/08-workflow.md) を全体で読む（3-4 時間）
2. **Day 2**: [01-overview.md](../docs/01-overview.md)、[02-users.md](../docs/02-users.md) を読む（2-3 時間）
3. **Day 3**: [03-tech-stack.md](../docs/03-tech-stack.md)、[07-development-rules.md](../docs/07-development-rules.md) を読む（3-4 時間）
4. **Day 4**: 開発環境セットアップ + 簡単なタスク（[07-development-rules.md](../docs/07-development-rules.md) 参照）
5. **Day 5**: メンターとのペアプログラミング / コードレビュー

---

## 📞 サポート・質問

ドキュメントに掲載されていない内容については：
1. 関連ドキュメントのリンクを追跡
2. メンターに質問
3. チームミーティングで確認

---

**プロジェクト**: Influencer Marketing Tool
**最終更新**: 2025-11-30
**ドキュメント構成**: 要件定義 8 点 + 実装ガイド

このコンテキストファイルをブックマークし、開発時に常に参照してください！
