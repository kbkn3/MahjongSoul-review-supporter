# mjslog→天鳳形式変換の完全実装分析

## 現状分析

### 現在の実装状況 (`entrypoints/mahjongDataParser.ts`)
- **行116-134**: 簡略化された1局のログ生成
- **問題点**: mjslogの完全な変換が未実装
- **TODOコメント**: 5箇所の重要な実装不足

```typescript
// TODO: Implement full conversion from mjslog to tenhou format (line 116)
// TODO: get from mjslog (line 120)
// TODO: get actual result (line 125)
// TODO: Convert account level to dan display (line 145)
// TODO: Get actual rating (line 150)
```

### dd.jsの完全な変換ロジック (`src/content-scripts/dd.js`)
- **generatelog関数** (line 318): メイン変換処理
- **kyoku状態管理** (line 251-310): 局データ管理システム
- **parsehule関数** (line 123-248): 和了スコア計算
- **完全なmjslogレコード処理**: 全てのゲームアクションを処理

## 実装すべき核心機能

### 1. ユーティリティ関数群
```javascript
// 牌記法変換: '2m' → 12
function tm2t(str) { /* line 90-100 */ }

// 赤牌処理
function deaka(til) { /* line 103-108 */ }
function makeaka(til) { /* line 111-115 */ }

// 相対座席計算: 0=上家, 1=対面, 2=下家
function relativeseating(seat0, seat1) { /* line 313-315 */ }

// 配列パディング（三麻対応）
const pad_right = (a, l, f) => { /* line 85-87 */ }
```

### 2. kyoku状態管理システム
```javascript
// 局初期化 (RecordNewRound時)
kyoku.init = function(leaf) { /* line 252-276 */ }

// 天鳳形式データ出力
kyoku.dump = function(uras) { /* line 279-292 */ }

// 責任払い追跡（大三元・大四喜）
kyoku.countpao = function(tile, owner, feeder) { /* line 299-310 */ }
```

### 3. メインのgeneratelog関数 (line 318-553)
```javascript
function generatelog(mjslog) {
    let log = [];
    mjslog.forEach((e, leafidx) => {
        switch (e.constructor.name) {
            case "RecordNewRound":     // 新局開始
            case "RecordDiscardTile":  // 打牌（ツモ切り・リーチ判定）
            case "RecordDealTile":     // ツモ・ドラ更新
            case "RecordChiPengGang":  // チー・ポン・大明槓
            case "RecordAnGangAddGang": // 暗槓・加槓
            case "RecordBaBei":        // 北抜き（三麻）
            case "RecordLiuJu":        // 途中流局
            case "RecordNoTile":       // 荒牌平局
            case "RecordHule":         // 和了
        }
    });
    return log;
}
```

### 4. 和了処理とスコア計算 (line 123-248)
```javascript
function parsehule(h, kyoku) {
    // 点数計算
    // 責任払い処理（大三元・大四喜）
    // 役満・マンガン判定
    // デルタ配列生成
    return [pad_right(delta, 4, 0.), res];
}
```

## レコードタイプ別処理詳細

### RecordNewRound (line 322-326)
- kyoku.init()で局データ初期化
- 局・本場・リーチ棒設定
- 初期点数・ドラ・配牌設定

### RecordDiscardTile (line 327-349)
- ツモ切り判定 (TSUMOGIRI = 60)
- リーチ宣言処理 ("r" + symbol)
- ドラ更新処理

### RecordDealTile (line 350-358)
- ツモ牌記録
- ドラ追加（カン後）

### RecordChiPengGang (line 359-424)
```javascript
switch (e.type) {
    case 0: // チー: "c" + tiles
    case 1: // ポン: "p" + tiles (責任払い追跡)
    case 2: // 大明槓: "m" + tiles + discards push 0
}
```

### RecordAnGangAddGang (line 425-474)
```javascript
switch (e.type) {
    case 3: // 暗槓: tiles + "a" + tile
    case 2: // 加槓: nakis.replace(/p/, "k" + til)
}
```

### RecordHule (line 527-542)
- parsehule()でスコア計算
- 裏ドラ処理
- 複数和了（ダブロン）対応

### RecordLiuJu/RecordNoTile (line 491-526)
- 途中流局・荒牌平局
- 流し満貫判定
- デルタスコア計算

## プレイヤー情報処理 (line 614-637)

### 段位変換
```javascript
res["dan"][e.seat] = cfg.level_definition.level_definition.map_[e.level.id].full_name_jp
```

### レート取得
```javascript
res["rate"][e.seat] = e.level.score // レベルスコアが最も近い値
```

### 性別情報
```javascript
res["sx"][e.seat] = (1 == sex) ? "F" : (2 == sex ? "M" : "C");
```

## 定数とルール情報

### 牌エンコーディング (tenhou形式)
- 11-19: 1-9萬子
- 21-29: 1-9筒子  
- 31-39: 1-9索子
- 41-47: 東南西北白発中
- 51-53: 赤5萬・筒・索

### 責任払いルール
- DAISANGEN = 37: 大三元の設定ID
- DAISUUSHI = 50: 大四喜の設定ID

## 実装タスク優先順位

### 高優先度 (Phase 1)
1. ユーティリティ関数群の実装
2. kyoku状態管理システムの実装  
3. generatelog関数の基本構造実装

### 中優先度 (Phase 2)
4. RecordNewRound処理
5. RecordDiscardTile/RecordDealTile処理
6. RecordChiPengGang/RecordAnGangAddGang処理

### 低優先度 (Phase 3)
7. RecordHule処理とparsehule関数
8. RecordLiuJu/RecordNoTile処理
9. プレイヤー情報の正確な取得

### テスト・検証 (Phase 4)
10. 単局テスト
11. 複数局ゲームでの動作確認
12. エラーハンドリング強化

## 技術的考慮事項

### TypeScript移植時の注意点
- globalThis型定義の活用
- エラーハンドリングの強化
- WXT環境での動作確認
- デバッグログの追加

### パフォーマンス最適化
- 不要な配列コピー削減  
- メモリ使用量の最適化
- 大量データ処理時の安定性

### 互換性確保
- 三麻・四麻両対応
- 各種ルール設定対応
- 赤牌有無の判定

## 期待される効果
- **現在**: 1局の簡略ログのみ
- **実装後**: 全局の完全な牌譜データ
- **NAGA分析**: 正確な戦術分析が可能
- **和了詳細**: スコア・役・責任払い情報
- **流局処理**: 聴牌・流し満貫等の詳細情報