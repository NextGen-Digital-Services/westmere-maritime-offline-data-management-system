import React from 'react';
import { FormFieldWrapper, type SectionAccent, ACCENT_COLOR_MAP } from './FormFieldWrapper';

export interface NumberWithUnitInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit: string;
  error?: string;
  helperText?: string;
  accent?: SectionAccent;
}

export const NumberWithUnitInput = React.forwardRef<HTMLInputElement, NumberWithUnitInputProps>(({
  label,
  unit,
  error,
  helperText,
  accent = 'ocean',
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
      <div className={`relative flex items-center rounded border-2 transition-all duration-150 ${accentCfg.border} ${accentCfg.focusRing} ${isFilled ? accentCfg.subtle : 'bg-surface'} ${error ? 'border-coralRed' : ''}`}>
        <input
          ref={ref}
          id={id}
          type="number"
          value={value}
          required={required}
          className={`w-full px-3 py-2 pr-14 text-xs font-semibold text-primary bg-transparent focus:outline-none placeholder:text-input-placeholder disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        <div className={`absolute right-1 px-2 py-0.5 text-[10px] font-bold rounded border ${accentCfg.badge} pointer-events-none uppercase`}>
          {unit}
        </div>
      </div>
    </FormFieldWrapper>
  );
});

NumberWithUnitInput.displayName = 'NumberWithUnitInput';
