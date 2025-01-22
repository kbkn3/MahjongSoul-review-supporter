export interface GameHistory {
  date: string
  rank: number
  score: number
  kyoku: number
  honba: number
  result: string
}

export interface PlayerStats {
  totalGames: number
  winRate: number
  averageScore: number
  topRate: number
  history: GameHistory[]
  recentTrend: {
    wins: number
    losses: number
    lastFiveGames: number[]  // 直近5戦の順位
  }
} 