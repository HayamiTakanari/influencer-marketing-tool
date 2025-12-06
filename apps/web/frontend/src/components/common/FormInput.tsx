import React, { useState, useCallback } from 'react';

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  rules?: ValidationRule[];
  hint?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  showCharCount?: boolean;
  maxLength?: number;
  onBlur?: () => void;
  onFocus?: () => void;
}

const FormInput: React.FC<FormInputProps> = React.memo(({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  rules = [],
  hint = '',
  error: externalError = '',
  className = '',
  inputClassName = '',
  showCharCount = false,
  maxLength,
  onBlur,
  onFocus
}) => {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState('');

  const validateField = useCallback((val: string) => {
    if (required && !val.trim()) {
      setInternalError('このフィールドは必須です');
      return false;
    }

    for (const rule of rules) {
      if (!rule.validate(val)) {
        setInternalError(rule.message);
        return false;
      }
    }

    setInternalError('');
    return true;
  }, [required, rules]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    onChange(newValue);

    if (touched) {
      validateField(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateField(value);
    onBlur?.();
  };

  const handleFocus = () => {
    setInternalError('');
    onFocus?.();
  };

  const displayError = externalError || internalError;
  const isError = displayError && touched;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:outline-none focus:ring-2 transition-colors
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${isError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            ${inputClassName}
          `}
        />

        {value && !isError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            ✓
          </div>
        )}
      </div>

      {/* エラーメッセージ */}
      {isError && (
        <div className="flex items-start gap-2">
          <span className="text-red-500 text-sm font-medium flex-shrink-0">⚠</span>
          <p className="text-red-600 text-sm">{displayError}</p>
        </div>
      )}

      {/* ヒント & 文字数 */}
      <div className="flex items-center justify-between">
        {hint && !isError && (
          <p className="text-gray-500 text-xs">{hint}</p>
        )}
        {showCharCount && maxLength && (
          <p className={`text-xs ${value.length > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
