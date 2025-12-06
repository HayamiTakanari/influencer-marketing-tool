import React from 'react';

interface AccountTypeSelectorProps {
  value: 'influencer' | 'company';
  onChange: (type: 'influencer' | 'company') => void;
}

export const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        アカウントタイプ
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('influencer')}
          className={`px-4 py-3.5 rounded-lg text-sm font-medium transition-all border-2 ${
            value === 'influencer'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          インフルエンサー
        </button>
        <button
          type="button"
          onClick={() => onChange('company')}
          className={`px-4 py-3.5 rounded-lg text-sm font-medium transition-all border-2 ${
            value === 'company'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          企業
        </button>
      </div>
    </div>
  );
};
