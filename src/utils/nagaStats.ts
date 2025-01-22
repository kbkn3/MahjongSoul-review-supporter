import type { Game } from '../types/naga'
import type { PlayerStats } from '../types/stats'

export const calculateNagaStats = (games: Game[]): PlayerStats => {
  const gameCount = games.length
  if (gameCount === 0) {
    return {
      totalGames: 0,
      winRate: 0,
      averageScore: 0,
      topRate: 0,
      history: [],
      recentTrend: {
        wins: 0,
        losses: 0,
        lastFiveGames: []
      }
    }
  }

  const wins = games.filter(g => g.rank === 1).length
  const tops = games.filter(g => g.rank <= 2).length
  const totalScore = games.reduce((sum, g) => sum + g.score, 0)
  const lastFive = games.slice(-5)

  return {
    totalGames: gameCount,
    winRate: (wins / gameCount) * 100,
    averageScore: totalScore / gameCount,
    topRate: (tops / gameCount) * 100,
    history: games.map(g => ({ ...g, kyoku: 1, honba: 0, result: '' })),
    recentTrend: {
      wins: lastFive.filter(g => g.rank === 1).length,
      losses: lastFive.filter(g => g.rank === 4).length,
      lastFiveGames: lastFive.map(g => g.rank)
    }
  }
} 