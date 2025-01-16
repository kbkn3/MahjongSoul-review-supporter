import React from 'react';
import { TabProps } from '../../types';
import { getMessage } from '../../utils/i18n';

const TabPanel: React.FC<TabProps> = ({ displayLang, onError }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          {getMessage('nagaTitle')}
        </h2>
      </div>
      <div className="p-4">
        {/* コンテンツは後で実装 */}
      </div>
    </div>
  );
};

export default TabPanel; 