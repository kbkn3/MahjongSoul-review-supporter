// 雀魂の牌譜データの型定義
export interface MahjongSoulPaifu {
  title: [string, string]  // [卓名, 時刻]
  name: string[]          // プレイヤー名の配列
  rule: {
    disp: string         // ルール表示名
    aka51: number        // 赤5萬
    aka52: number        // 赤5筒
    aka53: number        // 赤5索
  }
  log: PaifuLog[][]      // 牌譜データ
}

// 牌譜の1局分のデータ
export interface PaifuLog {
  type: 'RecordNewRound' | 'RecordDealTile' | 'RecordDiscardTile' | 'RecordChiPengGang' | 'RecordAnGangAddGang' | 'RecordHule' | 'RecordNoTile'
  seat: number          // 席番号
  tiles?: string        // 単体の牌
  tileArray?: string[]  // 複数の牌（鳴きなど）
  moqie?: boolean
  callType?: number
  fromSeat?: number     // 和了時の放銃者
  delta_scores?: number[]  // 点数の増減
  scores?: number[]     // 点数状況
  liqi?: boolean       // 立直
  doras?: string[]     // ドラ表示牌
  hules?: HuleInfo[]   // 和了情報
}

// 和了情報の型
export interface HuleInfo {
  seat: number         // 和了者
  score: number        // 点数
  hand: string[]       // 手牌
  ming: string[]       // 副露牌
  huTile: string      // 和了牌
  fans: Fan[]         // 役と翻数
  fu: number          // 符数
  title?: string      // 役満などの称号
}

// 役と翻数の型
export interface Fan {
  name: string        // 役名
  val: number        // 翻数
}

// 天鳳形式の牌譜データ
export interface TenhouPaifu {
  title: [string, string]
  name: string[]        // 配列に修正
  rule: {
    disp: string
    aka: boolean
  }
  log: TenhouLog[]
}

// 天鳳形式の1局分のデータ
export interface TenhouLog {
  round: [number, number, number]  // [場風, 局数, 本場数]
  scores: number[]
  tehais: string[][]
  draws: string[][]
  discards: string[][]
}

export interface GameRecord {
  head: {
    uuid: string;
    end_time: number;
    config: {
      meta: {
        mode_id?: number;
        room_id?: number;
        contest_uid?: string;
      };
      mode: {
        mode: number;
        detail_rule: {
          dora_count: number;
          have_zimosun: boolean;
        };
      };
    };
    accounts: Array<{
      seat: number;
      nickname: string;
      level: {
        id: number;
        score: number;
      };
      character: {
        charid: number;
      };
    }>;
    result: {
      players: Array<{
        seat: number;
        part_point_1: number;
        total_point: number;
      }>;
    };
  };
  data: ArrayBuffer;
} 