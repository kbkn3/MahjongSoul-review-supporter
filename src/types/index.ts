import type { Language } from '../i18n/messages'

// 牌譜データの基本型
export interface PaifuData {
  title: string;
  player: string;
  rule: number;
  log: string[];
}

// 局情報の型
export interface KyokuInfo {
  kyoku: number;      // 局数
  honba: number;      // 本場
  kyotaku: number;    // 供託
  scores: number[];   // 点数状況
  tehais: string[];   // 手牌
  result: string;     // 結果
  isSelect: boolean;  // 選択状態
}

// 統計データの型
export interface RecipeData {
  gameId: string;     // ゲームID
  name: string;       // プレイヤー名
  point: number;      // 素点
  rank: number;       // 順位
  win: number;        // 和了回数
  lose: number;       // 放銃回数
  riichi: number;     // 立直回数
  meld: number;       // 副露回数
  tsumo: number;      // ツモ回数
  ron: number;        // ロン回数
  games: number;      // 総局数
  draws: number;      // 流局数
}

// 言語設定の型
export type { Language }

// サーバー設定の型
export interface ServerConfig {
  type: LanguageType;
  domain: string;
}

// NAGAデータの型
export interface NagaData {
  log: string;        // 天鳳形式の牌譜データ
  kyokuInfos: KyokuInfo[];  // 局情報の配列
}

// mjai-reviewerデータの型
export interface MjaiData {
  url: string;        // 牌譜URL
  playerNo: number;   // プレイヤー番号
}

// メッセージの型
export interface MessageData {
  direction: string;
  message: string;
  data?: unknown;
}

// Chrome Storage データの型
export interface StorageData {
  DisplayLang: LanguageType;
  MSLang: LanguageType;
  rule: string;
  toNagaData?: NagaData;
  toMjaiData?: MjaiData;
  toMjaiData_no?: number;
}

// エラー型
export interface ExtensionError extends Error {
  code?: string;
  details?: unknown;
}

// コンポーネントのProps型
export type TabProps = {
  displayLang: LanguageType
  onError?: (error: ExtensionError) => void
}

export interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface TableProps {
  data: RecipeData[];
  headers: string[];
  displayLang: LanguageType;
}

// 共通コンポーネントのProps型
export interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
} 