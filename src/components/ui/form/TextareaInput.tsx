import React from 'react';
import { FormFieldWrapper, type SectionAccent, ACCENT_COLOR_MAP } from './FormFieldWrapper';

export interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  accent?: SectionAccent;
  showCharCount?: boolean;
}

export const TextareaInput = React.forwardRef<HTMLTextAreaElement, TextareaInputProps>(({
  label,
  error,
  helperText,
  accent = 'ocean',
  showCharCount = false,
  className = '',
  id,
  required,
  value,
  maxLength,
  rows = 3,
  ...props
}, ref) => {
  const accentCfg = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.ocean;
  const currentLength = value !== undefined ? String(value).length : 0;
  const isFilled = currentLength > 0;

  return (
    <FormFieldWrapper id={id} label={label} required={required} error={error} helperText={helperText} accent={accent}>
      <div className={`relative rounded border-2 transition-all duration-150 ${accentCfg.border} ${accentCfg.focusRing} ${isFilled ? accentCfg.subtle : 'bg-surface'} ${error ? 'border-coralRed' : ''}`}>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          required={required}
          className={`w-full px-3 py-2 text-xs font-medium text-primary bg-transparent focus:outline-none placeholder:text-input-placeholder disabled:opacity-60 disabled:cursor-not-allowed resize-y ${className}`}
          {...props}
        />
        {showCharCount && maxLength && (
          <div className="text-right pr-2 pb-1 text-[10px] text-muted">
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
});

TextareaInput.displayName = 'TextareaInput';
