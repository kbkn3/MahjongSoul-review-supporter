import type React from 'react';
import { useState, useEffect } from 'react';
import { sendToContentScript } from '@plasmohq/messaging';
import type { NagaData, NagaRequest, NagaResponse, NagaStats, Game } from '../../types/naga';
import { getMessage } from '../../utils/i18n';
import type { Language } from '../../i18n/messages';
import { calculateNagaStats } from '../../utils/nagaStats'
import { StatsPanel } from '../stats/StatsPanel'
import { processGameStats } from '../../utils/statsProcessor'
import type { PlayerStats } from '../../types/stats'

// モックデータの追加
const MOCK_GAMES: Game[] = [
  { date: "2024-03-20", rank: 1, score: 45000 },
  { date: "2024-03-19", rank: 2, score: 35000 },
  { date: "2024-03-18", rank: 4, score: 15000 },
  { date: "2024-03-17", rank: 1, score: 48000 },
  { date: "2024-03-16", rank: 3, score: 25000 }
]

interface NagaPanelProps {
  data: NagaData;
  lang: Language;
  useMockData?: boolean; // フラグを追加
}

// アニメーション用のクラス定義を追加
const ANIMATION_CLASSES = {
  fadeIn: "transition-opacity duration-300 ease-in-out",
  slideIn: "transition-transform duration-300 ease-in-out",
  shake: "animate-shake",
} as const

export const NagaPanel: React.FC<NagaPanelProps> = ({ data, lang, useMockData = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  const handleTransfer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendToContentScript<NagaRequest, NagaResponse>({
        name: "naga",
        body: {
          type: 'TRANSFER_TO_NAGA',
          data
        }
      });

      if (!response.success && response.error) {
        setError(response.error.message);
      }
    } catch (_error) {
      setError(getMessage('naga.errors.communicationError', lang));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (useMockData) {
      const calculatedStats = calculateNagaStats(MOCK_GAMES)
      setStats(calculatedStats)
    } else if (data) {
      const stats = processGameStats(data)
      setStats(stats)
    }
  }, [data, useMockData])

  return (
    <div className="p-4 bg-white rounded shadow max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-4 flex items-center">
        {getMessage('naga.title', lang)}
        {isLoading && (
          <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"/>
        )}
      </h2>
      
      {/* プレビュー */}
      <div className={`mb-4 ${ANIMATION_CLASSES.fadeIn}`}>
        <h3 className="font-medium mb-2">{getMessage('naga.preview', lang)}</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {/* エラー表示 */}
      {error && (
        <div 
          className={`mb-4 p-2 bg-red-100 text-red-700 rounded ${ANIMATION_CLASSES.slideIn} ${ANIMATION_CLASSES.shake}`}
          role="alert"
        >
          <div className="flex items-center">
            <svg aria-hidden="true" className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* 転送ボタン */}
      <button
        type="button"
        onClick={handleTransfer}
        disabled={isLoading}
        className={`
          w-full sm:w-auto
          bg-blue-500 text-white px-6 py-2 rounded
          hover:bg-blue-600 
          disabled:bg-gray-400
          transition-colors duration-200
          flex items-center justify-center
        `}
      >
        {isLoading ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"/>
            {getMessage('naga.transfer', lang)}
          </>
        ) : getMessage('transferButton', lang)}
      </button>

      {/* 統計情報 */}
      {stats && (
        <div className={`mt-6 ${ANIMATION_CLASSES.fadeIn}`}>
          <StatsPanel stats={stats} lang={lang} />
        </div>
      )}
    </div>
  );
}; 