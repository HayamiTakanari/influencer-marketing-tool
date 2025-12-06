import React, { useState } from 'react';

interface FormInputProps {
  label: string;
  id: string;
  name?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  showPasswordToggle?: boolean;
  autoComplete?: string;
  showTooltip?: boolean;
  tooltipContent?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  showPasswordToggle = false,
  autoComplete,
  showTooltip = false,
  tooltipContent
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTooltipPopup, setShowTooltipPopup] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  
  const getAutoComplete = () => {
    if (autoComplete) return autoComplete;
    if (type === 'email') return 'email';
    if (type === 'password' && id === 'confirmPassword') return 'new-password';
    if (type === 'password' && id === 'password') return 'new-password';
    return undefined;
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {showTooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltipPopup(true)}
              onMouseLeave={() => setShowTooltipPopup(false)}
              onClick={() => setShowTooltipPopup(!showTooltipPopup)}
              className="text-gray-400 hover:text-emerald-600 focus:outline-none transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showTooltipPopup && (
              <div className="absolute left-0 top-6 z-10 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                {tooltipContent}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={getAutoComplete()}
          className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${showPasswordToggle ? 'pr-10' : ''}`}
          placeholder={placeholder}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
