/**
 * 雀魂の牌譜データを解析・変換するユーティリティ
 * 
 * dd.jsからの移行コード
 * ライセンス: Apache License 2.0 
 * Based on: 雀魂の牌譜をNAGAに解析させる－完全版－ (https://lions.blue/07813) by ちぃといつ
 */

// 設定値
const NAMEPREF = 0; // 2 for English, 1 for romanized, 0 for Japanese
const VERBOSELOG = false; // 詳細ログを出力するか
const PRETTY = true; // 人間が読みやすい形式にするか
const SHOWFU = false; // 役満でも符・翻を表示するか

// 言語設定
const JPNAME = 0;
const RONAME = 1;
const ENNAME = 2;

// 用語変換テーブル
const RUNES = {
  // 役満・満貫系
  "mangan": ["満貫", "Mangan ", "Mangan "],
  "haneman": ["跳満", "Haneman ", "Haneman "],
  "baiman": ["倍満", "Baiman ", "Baiman "],
  "sanbaiman": ["三倍満", "Sanbaiman ", "Sanbaiman "],
  "yakuman": ["役満", "Yakuman ", "Yakuman "],
  "kazoeyakuman": ["役満", "Kazoe Yakuman ", "Counted Yakuman "],
  "kiriagemangan": ["切り上げ満貫", "Kiriage Mangan ", "Rounded Mangan "],
  
  // 局終了系
  "agari": ["和了", "Agari", "Agari"],
  "ryuukyoku": ["流局", "Ryuukyoku", "Exhaustive Draw"],
  "nagashimangan": ["流し満貫", "Nagashi Mangan", "Mangan at Draw"],
  "suukaikan": ["四開槓", "Suukaikan", "Four Kan Abortion"],
  "sanchahou": ["三家和", "Sanchahou", "Three Ron Abortion"],
  "kyuushukyuuhai": ["九種九牌", "Kyuushu Kyuuhai", "Nine Terminal Abortion"],
  "suufonrenda": ["四風連打", "Suufon Renda", "Four Wind Abortion"],
  "suuchariichi": ["四家立直", "Suucha Riichi", "Four Riichi Abortion"],
  
  // 点数関連
  "fu": ["符", "符", "Fu"],
  "han": ["飜", "飜", "Han"],
  "points": ["点", "点", "Points"],
  "all": ["∀", "∀", "∀"],
  "pao": ["包", "pao", "Responsibility"],
  
  // 部屋・ルール
  "tonpuu": ["東喰", " East", " East"],
  "hanchan": ["南喰", " South", " South"],
  "friendly": ["友人戦", "Friendly", "Friendly"],
  "tournament": ["大会戦", "Tournament", "Tournament"],
  "sanma": ["三", "3-Player ", "3-Player "],
  "red": ["赤", " Red", " Red Fives"],
  "nored": ["", " Aka Nashi", " No Red Fives"]
};

// 責任払い関連
const DAISANGEN = 37; // 大三元のconfig id
const DAISUUSHI = 50; // 大四喜のconfig id
const TSUMOGIRI = 60; // 天鳳のツモ切りシンボル

// グローバル変数
let ALLOW_KIRIAGE = false;
let TSUMOLOSSOFF = false; // 三麻のツモ損

/**
 * 雀魂の牌表記を天鳳形式に変換
 * @param str 雀魂の牌表記（例: '2m'）
 * @returns 天鳳形式の数値
 */
function tm2t(str: string): number {
  // 天鳳の牌エンコーディング:
  // 11-19: 1-9萬
  // 21-29: 1-9筒
  // 31-39: 1-9索
  // 41-47: 東南西北白發中
  // 51,52,53: 赤5萬,筒,索
  
  const num = parseInt(str[0]);
  const tcon: { [key: string]: number } = { m: 1, p: 2, s: 3, z: 4 };
  
  return num ? 10 * tcon[str[1]] + num : 50 + tcon[str[1]];
}

/**
 * 赤ドラから通常牌に変換
 * @param til 牌番号
 * @returns 通常牌の番号
 */
function deaka(til: number): number {
  if (5 == Math.floor(til / 10)) {
    return 10 * (til % 10) + Math.floor(til / 10);
  }
  return til;
}

/**
 * 通常牌を赤ドラに変換
 * @param til 牌番号
 * @returns 赤ドラの番号
 */
function makeaka(til: number): number {
  if (5 == (til % 10)) {
    return 10 * (til % 10) + Math.floor(til / 10);
  }
  return til;
}

/**
 * ツモ損ありの場合の端数処理
 * @param x 点数
 * @returns 処理後の点数
 */
function tlround(x: number): number {
  return TSUMOLOSSOFF ? 100 * Math.ceil(x / 100) : 0;
}

// deepCopyはsrc/utils/dataConversion.jsから提供される

/**
 * 配列を指定の長さまで値で埋める
 * @param a 配列
 * @param l 目標の長さ
 * @param f 埋める値
 * @returns 埋められた配列
 */
const pad_right = (a: any[], l: number, f: any): any[] => {
  const diff = l - a.length;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      a.push(f);
    }
  }
  return a;
};

/**
 * ファイルダウンロード機能
 * @param filename ファイル名
 * @param text ファイル内容
 */
function download(filename: string, text: string): void {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * 相対席順の計算
 * @param seat0 基準席
 * @param seat1 対象席
 * @returns 相対位置（0: 上家, 1: 対面, 2: 下家）
 */
function relativeseating(seat0: number, seat1: number): number {
  return (seat0 - seat1 + 4 - 1) % 4;
}

// 風牌・三元牌（責任払い用）
const WINDS = ["1z", "2z", "3z", "4z"].map(e => tm2t(e));
const DRAGS = ["5z", "6z", "7z", "0z"].map(e => tm2t(e)); // 0z would be aka haku

/**
 * 局状態管理クラス
 * RecordNewRoundごとにリセットされる局情報を管理
 */
class Kyoku {
  nplayers: number = 4;
  round: number[] = [0, 0, 0]; // [kyoku, honba, riichi sticks]
  initscores: number[] = [25000, 25000, 25000, 25000];
  doras: number[] = [];
  draws: (number | string)[][] = [[], [], [], []];
  discards: (number | string)[][] = [[], [], [], []];
  haipais: number[][] = [[], [], [], []];
  
  // 内部管理変数
  poppedtile: number = 0; // 親の14枚目の牌
  dealerseat: number = 0; // 親の席
  ldseat: number = -1; // 最後に牌を切った席
  nriichi: number = 0; // 現在のリーチ数
  nkan: number = 0; // 現在のカン数
  
  // 責任払い管理
  nowinds: number[] = [0, 0, 0, 0]; // 各プレイヤーの風牌ポン・カン数
  nodrags: number[] = [0, 0, 0, 0]; // 各プレイヤーの三元牌ポン・カン数  
  paowind: number = -1; // 大四喜責任払い対象席
  paodrag: number = -1; // 大三元責任払い対象席

  /**
   * 局データを初期化
   * @param leaf RecordNewRoundデータ
   */
  init(leaf: any): Kyoku {
    this.nplayers = leaf.scores.length;
    this.round = [4 * leaf.chang + leaf.ju, leaf.ben, leaf.liqibang];
    this.initscores = [...leaf.scores];
    pad_right(this.initscores, 4, 0);
    
    // ドラ処理
    this.doras = leaf.dora ? [tm2t(leaf.dora)] : leaf.doras.map((e: string) => tm2t(e));
    
    // 各プレイヤーのデータ初期化
    this.draws = [[], [], [], []];
    this.discards = [[], [], [], []];
    this.haipais = this.draws.map((_, i) => 
      leaf["tiles" + i].map((f: string) => tm2t(f))
    );
    
    // 親の最後の牌を引いた牌として扱う
    this.poppedtile = this.haipais[leaf.ju].pop() || 0;
    this.draws[leaf.ju].push(this.poppedtile);
    
    // 局管理情報
    this.dealerseat = leaf.ju;
    this.ldseat = -1;
    this.nriichi = 0;
    this.nkan = 0;
    
    // 責任払い管理初期化
    this.nowinds = [0, 0, 0, 0];
    this.nodrags = [0, 0, 0, 0];
    this.paowind = -1;
    this.paodrag = -1;
    
    return this;
  }

  /**
   * 局データを天鳳形式で出力
   * @param uras 裏ドラ配列
   */
  dump(uras: number[]): any[] {
    const entry: any[] = [];
    entry.push(this.round);
    entry.push(this.initscores);
    entry.push(this.doras);
    entry.push(uras);
    
    this.haipais.forEach((f, i) => {
      entry.push(f);
      entry.push(this.draws[i]);
      entry.push(this.discards[i]);
    });
    
    return entry;
  }

  /**
   * 責任払いカウント処理
   * ポン・大明槓・暗槓時に呼び出される
   * @param tile 牌番号（天鳳形式）
   * @param owner ポン・カンしたプレイヤー席
   * @param feeder 牌を供給したプレイヤー席（-1で暗槓）
   */
  countpao(tile: number, owner: number, feeder: number): void {
    if (WINDS.includes(tile)) {
      if (4 === ++this.nowinds[owner]) {
        this.paowind = feeder;
      }
    } else if (DRAGS.includes(tile)) {
      if (3 === ++this.nodrags[owner]) {
        this.paodrag = feeder;
      }
    }
  }
}

/**
 * 和了データを天鳳形式に変換
 * @param h 和了データ（mjslog）
 * @param kyoku 局状態
 * @returns [デルタ配列, 結果配列]
 */
function parsehule(h: any, kyoku: Kyoku): [number[], any[]] {
  // 天鳳ログビューアーは「点」「飜」「役満」で終わる文字列を要求
  // [和了者席, 払い手席, 責任者席]
  let res = [h.seat, h.zimo ? h.seat : kyoku.ldseat, h.seat];
  let delta: number[] = []; // 点数変動配列
  let points: number | string = 0;
  
  // リーチ棒の点数計算（-1は既に取られた場合）
  let rp = (-1 !== kyoku.nriichi) ? 1000 * (kyoku.nriichi + kyoku.round[2]) : 0;
  let hb = 100 * kyoku.round[1]; // 本場料

  // 責任払いロジック
  let pao = false;
  let liableseat = -1;
  let liablefor = 0;

  if (h.yiman) { // 役満の場合のみチェック
    h.fans.forEach((e: any) => {
      if (DAISUUSHI === e.id && (-1 !== kyoku.paowind)) { // 大四喜責任払い
        pao = true;
        liableseat = kyoku.paowind;
        liablefor += e.val;
      } else if (DAISANGEN === e.id && (-1 !== kyoku.paodrag)) { // 大三元責任払い
        pao = true;
        liableseat = kyoku.paodrag;
        liablefor += e.val;
      }
    });
  }

  if (h.zimo) { // ツモの場合
    delta = new Array(kyoku.nplayers).fill(-hb - h.point_zimo_xian - tlround((1 / 2) * h.point_zimo_xian));
    
    if (h.seat === kyoku.dealerseat) { // 親ツモ
      delta[h.seat] = rp + (kyoku.nplayers - 1) * (hb + h.point_zimo_xian) + 2 * tlround((1 / 2) * h.point_zimo_xian);
      points = h.point_zimo_xian + tlround((1 / 2) * h.point_zimo_xian);
    } else { // 子ツモ
      delta[h.seat] = rp + hb + h.point_zimo_qin + (kyoku.nplayers - 2) * (hb + h.point_zimo_xian) + 2 * tlround((1 / 2) * h.point_zimo_xian);
      delta[kyoku.dealerseat] = -hb - h.point_zimo_qin - tlround((1 / 2) * h.point_zimo_xian);
      points = h.point_zimo_xian + "-" + h.point_zimo_qin;
    }
  } else { // ロンの場合
    delta = new Array(kyoku.nplayers).fill(0);
    delta[h.seat] = rp + (kyoku.nplayers - 1) * hb + h.point_rong;
    delta[kyoku.ldseat] = -(kyoku.nplayers - 1) * hb - h.point_rong;
    points = h.point_rong;
    kyoku.nriichi = -1; // リーチ棒を取られたマーク（ダブロン対応）
  }

  // 責任払い処理
  const OYA = 0;
  const KO = 1;
  const RON = 2;
  const YSCORE = [ // 役満点数テーブル
    [0, 16000, 48000], // 親が勝つ場合
    [16000, 8000, 32000]  // 子が勝つ場合
  ];

  if (pao) {
    res[2] = liableseat; // 責任者を設定
    
    if (h.zimo) { // 責任払いツモ
      if (h.qinjia) { // 親ツモ
        delta[liableseat] -= 2 * hb + liablefor * 2 * YSCORE[OYA][KO] + tlround((1 / 2) * liablefor * YSCORE[OYA][KO]);
        delta.forEach((e, i) => {
          if (liableseat !== i && h.seat !== i && kyoku.nplayers >= i) {
            delta[i] += hb + liablefor * YSCORE[OYA][KO] + tlround((1 / 2) * liablefor * YSCORE[OYA][KO]);
          }
        });
        if (3 === kyoku.nplayers) { // 三麻の場合
          delta[h.seat] += (TSUMOLOSSOFF ? 0 : liablefor * YSCORE[OYA][KO]);
        }
      } else { // 子ツモ
        delta[liableseat] -= (kyoku.nplayers - 2) * hb + liablefor * (YSCORE[KO][OYA] + YSCORE[KO][KO]) + tlround((1 / 2) * liablefor * YSCORE[KO][KO]);
        delta.forEach((e, i) => {
          if (liableseat !== i && h.seat !== i && kyoku.nplayers >= i) {
            if (kyoku.dealerseat === i) {
              delta[i] += hb + liablefor * YSCORE[KO][OYA] + tlround((1 / 2) * liablefor * YSCORE[KO][KO]);
            } else {
              delta[i] += hb + liablefor * YSCORE[KO][KO] + tlround((1 / 2) * liablefor * YSCORE[KO][KO]);
            }
          }
        });
      }
    } else { // 責任払いロン
      delta[liableseat] -= (kyoku.nplayers - 1) * hb + (1 / 2) * liablefor * YSCORE[h.qinjia ? OYA : KO][RON];
      delta[kyoku.ldseat] += (kyoku.nplayers - 1) * hb + (1 / 2) * liablefor * YSCORE[h.qinjia ? OYA : KO][RON];
    }
  }

  // 点数に記号を追加
  points += RUNES.points[JPNAME] + ((h.zimo && h.qinjia) ? RUNES.all[NAMEPREF] : "");

  // スコア文字列作成
  let fuhan = h.fu + RUNES.fu[NAMEPREF] + h.count + RUNES.han[NAMEPREF];
  
  if (h.yiman) { // 役満
    res.push((SHOWFU ? fuhan : "") + RUNES.yakuman[NAMEPREF] + points);
  } else if (13 <= h.count) { // 数え役満
    res.push((SHOWFU ? fuhan : "") + RUNES.kazoeyakuman[NAMEPREF] + points);
  } else if (11 <= h.count) { // 三倍満
    res.push((SHOWFU ? fuhan : "") + RUNES.sanbaiman[NAMEPREF] + points);
  } else if (8 <= h.count) { // 倍満
    res.push((SHOWFU ? fuhan : "") + RUNES.baiman[NAMEPREF] + points);
  } else if (6 <= h.count) { // 跳満
    res.push((SHOWFU ? fuhan : "") + RUNES.haneman[NAMEPREF] + points);
  } else if (5 <= h.count || (4 <= h.count && 40 <= h.fu) || (3 <= h.count && 70 <= h.fu)) { // 満貫
    res.push((SHOWFU ? fuhan : "") + RUNES.mangan[NAMEPREF] + points);
  } else if (ALLOW_KIRIAGE && ((4 === h.count && 30 === h.fu) || (3 === h.count && 60 === h.fu))) { // 切り上げ満貫
    res.push((SHOWFU ? fuhan : "") + RUNES.kiriagemangan[NAMEPREF] + points);
  } else { // 通常手
    res.push(fuhan + points);
  }

  // 役リストを追加
  h.fans.forEach((e: any) => res.push(
    (JPNAME === NAMEPREF ? `cfg.fan.fan.map_[${e.id}].name_jp` : `cfg.fan.fan.map_[${e.id}].name_en`) +
    "(" + (h.yiman ? RUNES.yakuman[JPNAME] : (e.val + RUNES.han[JPNAME])) + ")"
  ));

  return [pad_right(delta, 4, 0), res];
}

/**
 * mjslogレコードを天鳳形式のlogに変換
 * @param mjslog 雀魂のmjslogレコード配列
 * @returns 天鳳形式のlog配列
 */
function generatelog(mjslog: any[]): any[][] {
  const log: any[][] = [];
  const kyoku = new Kyoku();
  
  mjslog.forEach((e: any, leafidx: number) => {
    switch (e.constructor?.name) {
      case "RecordNewRound":
        // 新局開始
        kyoku.init(e);
        return;
        
      case "RecordDiscardTile":
        // 打牌 - ツモ切り・リーチ判定
        {
          let symbol: number | string = e.moqie ? TSUMOGIRI : tm2t(e.tile);
          
          // 親の初回打牌でツモ切り判定（14枚目の牌として扱った牌の処理）
          if (e.seat === kyoku.dealerseat
              && !kyoku.discards[e.seat].length 
              && symbol === kyoku.poppedtile) {
            symbol = TSUMOGIRI;
          }
          
          // リーチ宣言処理
          if (e.is_liqi) {
            kyoku.nriichi++;
            symbol = "r" + symbol;
          }
          
          kyoku.discards[e.seat].push(symbol);
          kyoku.ldseat = e.seat; // ロン・ポン等の対象席
          
          // ドラ更新（カン後等）
          if (e.doras && e.doras.length > kyoku.doras.length) {
            kyoku.doras = e.doras.map((f: string) => tm2t(f));
          }
          
          return;
        }
        
      case "RecordDealTile":
        // ツモ・カン後のドラ更新
        {
          // ドラ追加（カン後）
          if (e.doras && e.doras.length > kyoku.doras.length) {
            kyoku.doras = e.doras.map((f: string) => tm2t(f));
          }
          
          kyoku.draws[e.seat].push(tm2t(e.tile));
          
          return;
        }
        
      case "RecordChiPengGang":
        // チー・ポン・大明槓
        {
          switch (e.type) {
            case 0: // チー
              kyoku.draws[e.seat].push(
                "c" + tm2t(e.tiles[2]) + tm2t(e.tiles[0]) + tm2t(e.tiles[1])
              );
              return;
              
            case 1: // ポン
              {
                const worktiles = e.tiles.map((f: string) => tm2t(f));
                const idx = relativeseating(e.seat, kyoku.ldseat);
                kyoku.countpao(worktiles[0], e.seat, kyoku.ldseat);
                
                // 呼んだ牌を'p'付きで挿入
                worktiles.splice(idx, 0, "p" + worktiles.pop());
                kyoku.draws[e.seat].push(worktiles.join(""));
                
                return;
              }
              
            case 2: // 大明槓
              {
                const calltiles = e.tiles.map((f: string) => tm2t(f));
                const idx = relativeseating(e.seat, kyoku.ldseat);
                
                kyoku.countpao(calltiles[0], e.seat, kyoku.ldseat);
                calltiles.splice(2 === idx ? 3 : idx, 0, "m" + calltiles.pop());
                kyoku.draws[e.seat].push(calltiles.join(""));
                
                // 天鳳では大明槓時に捨て牌に0を追加
                kyoku.discards[e.seat].push(0);
                kyoku.nkan++;
                
                return;
              }
              
            default:
              console.log(
                "didn't know what to do with " + e.constructor?.name + "(" + leafidx + ")"
              );
              return;
          }
        }
        
      case "RecordAnGangAddGang":
        // 暗槓・加槓
        {
          const til = tm2t(e.tiles);
          kyoku.ldseat = e.seat; // チャンカン用
          
          switch (e.type) {
            case 3: // 暗槓
              {
                kyoku.countpao(til, e.seat, -1); // 責任払い対象としてカウントするが責任者は設定しない
                
                // 手牌と引いた牌から暗槓対象牌を取得
                const ankantiles = kyoku.haipais[e.seat]
                  .filter(t => deaka(t) === deaka(til))
                  .concat(kyoku.draws[e.seat].filter((t: any) => 
                    typeof t === 'number' && deaka(t) === deaka(til)
                  ));
                  
                const selectedTile = ankantiles.pop() || til;
                kyoku.discards[e.seat].push(ankantiles.join("") + "a" + selectedTile);
                kyoku.nkan++;
                
                return;
              }
              
            case 2: // 加槓
              {
                // drawsからポンの鳴きを探して加槓に変換
                const nakis = kyoku.draws[e.seat].filter(w => {
                  if (typeof w === 'string') {
                    return w.includes("p" + deaka(til)) || w.includes("p" + makeaka(til));
                  }
                  return false;
                });
                
                if (nakis.length > 0) {
                  kyoku.discards[e.seat].push(nakis[0].replace(/p/, "k" + til));
                  kyoku.nkan++;
                }
                
                return;
              }
              
            default:
              console.log("didn't know what to do with " + e.constructor?.name + " type: " + e.type);
              return;
          }
        }
        
      case "RecordBaBei":
        // 北抜き（三麻）
        {
          // 天鳳では北抜きのタイミングに関係なく"f44"で記録
          kyoku.discards[e.seat].push("f44");
          return;
        }
        
      case "RecordLiuJu":
        // 途中流局
        {
          const entry = kyoku.dump([]);
          
          if (1 === e.type) {
            entry.push([RUNES.kyuushukyuuhai[NAMEPREF]]);
          } else if (2 === e.type) {
            entry.push([RUNES.suufonrenda[NAMEPREF]]);
          } else if (4 === kyoku.nriichi) {
            entry.push([RUNES.suuchariichi[NAMEPREF]]);
          } else if (4 <= kyoku.nkan) {
            entry.push([RUNES.suukaikan[NAMEPREF]]);
          } else {
            entry.push([RUNES.sanchahou[NAMEPREF]]);
          }
          
          log.push(entry);
          return;
        }
        
      case "RecordNoTile":
        // 荒牌平局
        {
          const entry = kyoku.dump([]);
          const delta = new Array(4).fill(0);
          
          // 雀魂がdelta_scoresを提供する場合の処理
          if (e.scores && e.scores[0] && e.scores[0].delta_scores && e.scores[0].delta_scores.length) {
            e.scores.forEach((f: any) => 
              f.delta_scores.forEach((g: number, i: number) => delta[i] += g)
            );
          }
          
          if (e.liujumanguan) { // 流し満貫
            entry.push([RUNES.nagashimangan[NAMEPREF], delta]);
          } else { // 通常の流局
            entry.push([RUNES.ryuukyoku[NAMEPREF], delta]);
          }
          
          log.push(entry);
          return;
        }
        
      case "RecordHule":
        // 和了
        {
          const agari: any[] = [];
          let ura: number[] = [];
          
          e.hules.forEach((f: any) => {
            // 裏ドラは最長のものを採用（ダブロンでリーチ+ダマの場合）
            if (ura.length < (f.li_doras ? f.li_doras.length : 0)) {
              ura = f.li_doras.map((g: string) => tm2t(g));
            }
            agari.push(parsehule(f, kyoku));
          });
          
          const entry = kyoku.dump(ura);
          entry.push([RUNES.agari[JPNAME]].concat(agari.flat()));
          
          log.push(entry);
          return;
        }
        
      default:
        console.log(
          "didn't know what to do with " + e.constructor?.name + "(" + leafidx + ")"
        );
        return;
    }
  });
  
  return log;
}

/**
 * プレイヤー段位情報を取得
 * @param record ゲームレコード
 * @param cfg 雀魂の設定データ
 * @returns 段位配列
 */
function getPlayerDan(record: any, cfg: any): string[] {
  const dan = new Array(4).fill('');
  
  if (record.head && record.head.accounts) {
    record.head.accounts.forEach((e: any) => {
      if (cfg && cfg.level_definition && cfg.level_definition.level_definition && cfg.level_definition.level_definition.map_) {
        dan[e.seat] = JPNAME === NAMEPREF 
          ? cfg.level_definition.level_definition.map_[e.level.id].full_name_jp 
          : cfg.level_definition.level_definition.map_[e.level.id].full_name_en;
      } else {
        // フォールバック：初心1として設定
        dan[e.seat] = JPNAME === NAMEPREF ? '初心★1' : 'Novice ★1';
      }
    });
  }
  
  return dan;
}

/**
 * プレイヤーレート情報を取得
 * @param record ゲームレコード  
 * @returns レート配列
 */
function getPlayerRate(record: any): number[] {
  const rate = new Array(4).fill(1500);
  
  if (record.head && record.head.accounts) {
    record.head.accounts.forEach((e: any) => {
      // レベルスコアが最も近い値
      rate[e.seat] = e.level ? e.level.score : 1500;
    });
  }
  
  return rate;
}

/**
 * プレイヤー性別情報を取得
 * @param record ゲームレコード
 * @param cfg 雀魂の設定データ
 * @returns 性別配列（"M", "F", "C"）
 */
function getPlayerSex(record: any, cfg: any): string[] {
  const sx = new Array(4).fill('C');
  
  if (record.head && record.head.accounts) {
    record.head.accounts.forEach((e: any) => {
      if (cfg && cfg.item_definition && cfg.item_definition.character && cfg.item_definition.character.map_ && e.character) {
        const sex = cfg.item_definition.character.map_[e.character.charid] ? 
          cfg.item_definition.character.map_[e.character.charid].sex : 0;
        sx[e.seat] = (1 === sex) ? "F" : (2 === sex ? "M" : "C");
      } else {
        sx[e.seat] = "C"; // デフォルト
      }
    });
  }
  
  return sx;
}

/**
 * ルール表示文字列を生成
 * @param record ゲームレコード
 * @param cfg 雀魂の設定データ
 * @returns ルール表示文字列
 */
function getRuleDisplay(record: any, cfg: any): string {
  let ruledisp = "";
  const nplayers = record.head.result.players.length;
  
  // 三麻判定
  if (3 === nplayers && JPNAME === NAMEPREF) {
    ruledisp += RUNES.sanma[JPNAME];
  }
  
  // ルーム・モード判定
  if (record.head.config.meta.mode_id) {
    // 段位戦・カジュアル
    if (cfg && cfg.desktop && cfg.desktop.matchmode && cfg.desktop.matchmode.map_) {
      ruledisp += JPNAME === NAMEPREF
        ? cfg.desktop.matchmode.map_[record.head.config.meta.mode_id].room_name_jp
        : cfg.desktop.matchmode.map_[record.head.config.meta.mode_id].room_name_en;
    } else {
      // フォールバック
      ruledisp += JPNAME === NAMEPREF ? "段位戦" : "Ranked";
    }
  } else if (record.head.config.meta.room_id) {
    // 友人戦
    ruledisp += RUNES.friendly[NAMEPREF];
  } else if (record.head.config.meta.contest_uid) {
    // 大会戦
    ruledisp += RUNES.tournament[NAMEPREF];
  }
  
  // 東風/東南判定
  if (1 === record.head.config.mode.mode) {
    ruledisp += RUNES.tonpuu[NAMEPREF];
  } else if (2 === record.head.config.mode.mode) {
    ruledisp += RUNES.hanchan[NAMEPREF];
  }
  
  return ruledisp;
}

export {
  tm2t,
  deaka,
  makeaka,
  tlround,
  pad_right,
  download,
  relativeseating,
  Kyoku,
  parsehule,
  generatelog,
  getPlayerDan,
  getPlayerRate,
  getPlayerSex,
  getRuleDisplay,
  WINDS,
  DRAGS,
  RUNES,
  DAISANGEN,
  DAISUUSHI,
  TSUMOGIRI,
  JPNAME,
  RONAME,
  ENNAME,
  NAMEPREF,
  VERBOSELOG,
  PRETTY,
  SHOWFU
};