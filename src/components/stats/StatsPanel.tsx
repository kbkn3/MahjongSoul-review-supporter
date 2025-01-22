import type { PlayerStats } from '../../types/stats'
import type { Language } from '../../i18n/messages'
import { getMessage } from '../../utils/i18n'
import { memo } from 'react'

interface StatsPanelProps {
  stats: PlayerStats
  lang: Language
}

export const StatsPanel: React.FC<StatsPanelProps> = memo(({ stats, lang }) => {
  return (
    <div className="space-y-6">
      {/* 基本統計 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">{getMessage('stats.totalGames', lang)}</div>
          <div className="text-2xl font-bold">{stats.totalGames}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">{getMessage('stats.winRate', lang)}</div>
          <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">{getMessage('stats.topRate', lang)}</div>
          <div className="text-2xl font-bold">{stats.topRate.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">{getMessage('stats.averageScore', lang)}</div>
          <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
        </div>
      </div>

      {/* 最近の傾向 */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-medium mb-2">{getMessage('stats.recentTrend', lang)}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">{getMessage('stats.recentWins', lang)}</div>
            <div className="text-xl font-bold">{stats.recentTrend.wins}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">{getMessage('stats.recentLosses', lang)}</div>
            <div className="text-xl font-bold">{stats.recentTrend.losses}</div>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          {stats.recentTrend.lastFiveGames.map((rank, i) => (
            <div
              key={`${rank}-${stats.recentTrend.lastFiveGames.length - i}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                rank === 2 ? 'bg-gray-100 text-gray-800' :
                rank === 3 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {rank}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

StatsPanel.displayName = 'StatsPanel' 