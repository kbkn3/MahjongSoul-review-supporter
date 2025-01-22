import type { GameHistory, PlayerStats } from '../types/stats'
import type { NagaData } from '../types/naga'

export const processGameStats = (data: NagaData): PlayerStats => {
  const history: GameHistory[] = data.kyokuInfos.map(info => ({
    date: new Date().toISOString(), // TODO: 実際の日付を取得
    rank: info.scores.indexOf(Math.max(...info.scores)) + 1,
    score: Math.max(...info.scores),
    kyoku: info.kyoku,
    honba: info.honba,
    result: info.result
  }))

  const totalGames = history.length
  const wins = history.filter(g => g.rank === 1).length
  const tops = history.filter(g => g.rank <= 2).length
  const totalScore = history.reduce((sum, g) => sum + g.score, 0)

  const lastFive = history.slice(-5)
  const recentWins = lastFive.filter(g => g.rank === 1).length
  const recentLosses = lastFive.filter(g => g.rank === 4).length

  return {
    totalGames,
    winRate: (wins / totalGames) * 100,
    averageScore: totalScore / totalGames,
    topRate: (tops / totalGames) * 100,
    history,
    recentTrend: {
      wins: recentWins,
      losses: recentLosses,
      lastFiveGames: lastFive.map(g => g.rank)
    }
  }
} 