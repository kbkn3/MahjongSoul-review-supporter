# プライバシーポリシー / Privacy Policy

**対象 / Applies to:** Mahjong Soul Review Supporter（ブラウザ拡張機能 / browser extension）
**最終更新 / Last updated:** 2026-08-26

---

## 日本語

### 開発者が収集する情報

**ありません。**

この拡張機能は、利用者のいかなる情報も開発者や第三者のサーバーへ送信しません。アクセス解析、利用統計、クラッシュレポート、広告識別子の類は一切組み込まれていません。開発者は利用者が誰であるか、いつ何回この拡張機能を使ったかを知る手段を持ちません。

### 端末内に保存する情報

以下を利用者のブラウザのローカル領域（`chrome.storage.local`）にのみ保存します。外部へ送信されることはありません。

| 保存内容 | 目的 |
| --- | --- |
| 表示言語の設定 | ポップアップおよび設定画面の言語切り替え |
| 解析ルールの選択状態 | 前回選んだ設定を次回も引き継ぐため |
| 変換済み牌譜データ（一時的） | 転送先ページのフォームへ入力するための受け渡し |

変換済み牌譜データは転送先ページへ入力された直後に空文字で上書きされ、破棄されます。

拡張機能をアンインストールすると、これらのデータはブラウザによって削除されます。

### 牌譜データの取り扱い

この拡張機能は、利用者が雀魂（Mahjong Soul）で牌譜を開いたときに、ブラウザが受信した対局記録を取得します。対局記録には対局した4名（三人麻雀では3名）のプレイヤー名、アカウントID、段位などが含まれます。

**変換処理はすべて利用者のブラウザ内で完結します。** 対局記録が変換のために外部へ送られることはありません。

変換した牌譜は、利用者が明示的に操作したときにのみ、次の宛先で利用されます。

- **NAGA（`naga.dmv.nico`）** および **mjai-reviewer（`mjai.ekyu.moe`）**
  これらのページ上のフォームに値を入力します。各サービスへの実際の解析依頼はそのサービス上での操作によって行われ、送信後のデータの取り扱いは**各サービスのプライバシーポリシーに従います**。本拡張機能はこれらのサービスの運営者ではありません。
- **天鳳牌譜ビューア（`tenhou.net`）**
  牌譜データを URL のフラグメント（`#` 以降）に含めた形で新しいタブを開きます。URL フラグメントは仕様上サーバーへ送信されません。

牌譜には利用者以外の対局者の情報も含まれます。外部サービスへ転送する際は、その点をご了承のうえご利用ください。

### 権限を必要とする理由

| 権限 | 理由 |
| --- | --- |
| `storage` | 上記の設定値および一時データの保存 |
| 雀魂の各ドメインへのアクセス | 牌譜データの取得と変換 |
| `naga.dmv.nico` / `mjai.ekyu.moe` へのアクセス | 変換済み牌譜のフォーム入力 |

### 本ポリシーの変更

変更した場合は本ファイルを更新し、更新日を改めます。変更履歴は Git のコミット履歴で確認できます。

### お問い合わせ

<https://github.com/kbkn3/MahjongSoul-review-supporter/issues>

---

## English

### Information collected by the developer

**None.**

This extension does not transmit any user information to the developer or to any third-party server. It contains no analytics, usage tracking, crash reporting, or advertising identifiers. The developer has no means of knowing who uses this extension, or when or how often it is used.

### Information stored on your device

The following is stored only in your browser's local storage (`chrome.storage.local`) and is never transmitted anywhere.

| Stored data | Purpose |
| --- | --- |
| Display language preference | Language of the popup and options screens |
| Selected review rule settings | Restoring your previous selection |
| Converted game log (temporary) | Handing the data to the destination page's form |

The converted game log is overwritten with an empty string and discarded immediately after it has been entered into the destination page.

Uninstalling the extension causes the browser to delete this data.

### Handling of game log data

When you open a game log on Mahjong Soul, this extension reads the game record that your browser has received. A game record includes the player names, account IDs, and ranks of the four players (three in three-player mahjong).

**All conversion happens locally inside your browser.** Game records are never sent anywhere for conversion.

The converted log is used with the following destinations only when you explicitly choose to do so:

- **NAGA (`naga.dmv.nico`)** and **mjai-reviewer (`mjai.ekyu.moe`)**
  The extension fills in the forms on those pages. The actual review request is made through those services, and any data submitted to them is **governed by their own privacy policies**. This extension is not operated by, or affiliated with, those services.
- **Tenhou log viewer (`tenhou.net`)**
  Opens a new tab with the log embedded in the URL fragment (the part after `#`). By specification, URL fragments are not sent to the server.

Game records also contain information about the other players in the game. Please keep this in mind when transferring logs to external services.

### Why permissions are required

| Permission | Reason |
| --- | --- |
| `storage` | Saving the settings and temporary data described above |
| Access to Mahjong Soul domains | Reading and converting game log data |
| Access to `naga.dmv.nico` / `mjai.ekyu.moe` | Filling in the converted log |

### Changes to this policy

If this policy changes, this file will be updated along with its "Last updated" date. The full history is available in the Git commit log.

### Contact

<https://github.com/kbkn3/MahjongSoul-review-supporter/issues>
