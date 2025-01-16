import React, { useState } from 'react';
import { TabProps, KyokuInfo } from '../../types';
import Button from '../common/Button';
import { getMessage } from '../../utils/i18n';

const NagaPanel: React.FC<TabProps> = ({ displayLang, onError }) => {
  const [kyokuList, setKyokuList] = useState<KyokuInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    setIsLoading(true);
    try {
      // 転送処理は後で実装
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {kyokuList.map((kyoku, index) => (
          <div 
            key={index} 
            className="p-3 hover:bg-gray-50 border-b border-gray-200 cursor-pointer transition-colors"
          >
            {/* 局情報の表示は後で実装 */}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleTransfer} disabled={isLoading}>
          {getMessage('transferButton')}
        </Button>
      </div>
    </div>
  );
};

export default NagaPanel; 