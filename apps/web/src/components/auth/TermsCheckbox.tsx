import React from 'react';
import Link from 'next/link';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ checked, onChange }) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id="agreeTerms"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          style={{
            accentColor: '#059669'
          }}
        />
      </div>
      <label htmlFor="agreeTerms" className="text-sm text-gray-700 leading-5 cursor-pointer">
        <Link 
          href="/terms" 
          className="text-emerald-600 hover:text-emerald-700 font-medium underline"
          target="_blank"
        >
          利用規約
        </Link>
        と
        <Link 
          href="/privacy" 
          className="text-emerald-600 hover:text-emerald-700 font-medium underline"
          target="_blank"
        >
          プライバシーポリシー
        </Link>
        に同意します
      </label>
    </div>
  );
};
