import React from 'react';
import { FormFieldWrapper, type SectionAccent, ACCENT_COLOR_MAP } from './FormFieldWrapper';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  accent?: SectionAccent;
  icon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({
  label,
  error,
  helperText,
  accent = 'ocean',
  icon,
  className = '',
  id,
  required,
  value,
  ...props
}, ref) => {
  const accentCfg = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.ocean;
  const isFilled = value !== undefined && value !== null && String(value).trim() !== '';

  return (
    <FormFieldWrapper id={id} label={label} required={required} error={error} helperText={helperText} accent={accent}>
      <div className={`relative flex items-center rounded border-2 transition-all duration-150 ${accentCfg.border} ${accentCfg.focusRing} ${isFilled ? accentCfg.subtle : 'bg-surface'} ${error ? 'border-coralRed ring-1 ring-coralRed' : ''}`}>
        {icon && (
          <div className="pl-3 text-secondary flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          value={value}
          required={required}
          className={`w-full px-3 py-2 text-xs font-medium text-primary bg-transparent focus:outline-none placeholder:text-input-placeholder disabled:opacity-60 disabled:cursor-not-allowed ${icon ? 'pl-2' : ''} ${className}`}
          {...props}
        />
      </div>
    </FormFieldWrapper>
  );
});

TextInput.displayName = 'TextInput';
