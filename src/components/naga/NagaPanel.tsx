import type React from 'react';
import { useState } from 'react';
import { sendToContentScript } from '@plasmohq/messaging';
import type { NagaData, NagaRequest, NagaResponse } from '../../types/naga';
import { getMessage } from '../../utils/i18n';
import type { Language } from '../../i18n/messages';

interface NagaPanelProps {
  data: NagaData;
  lang: Language;
}

export const NagaPanel: React.FC<NagaPanelProps> = ({ data, lang }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">{getMessage('naga.title', lang)}</h2>
      
      {/* プレビュー */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">{getMessage('naga.preview', lang)}</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 転送ボタン */}
      <button
        type="button"
        onClick={handleTransfer}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? getMessage('naga.transfer', lang) : getMessage('transferButton', lang)}
      </button>
    </div>
  );
}; 