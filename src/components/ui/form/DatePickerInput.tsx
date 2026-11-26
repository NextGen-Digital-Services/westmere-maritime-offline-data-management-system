import React from 'react';
import { FormFieldWrapper, type SectionAccent, ACCENT_COLOR_MAP } from './FormFieldWrapper';
import { Calendar } from 'lucide-react';

export interface DatePickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  accent?: SectionAccent;
}

export const DatePickerInput = React.forwardRef<HTMLInputElement, DatePickerInputProps>(({
  label,
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
          type="date"
          value={value}
          required={required}
          className={`w-full px-3 py-2 text-xs font-semibold text-primary bg-transparent focus:outline-none placeholder:text-input-placeholder cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        <div className="pr-3 text-secondary pointer-events-none">
          <Calendar className="w-4 h-4" />
        </div>
      </div>
    </FormFieldWrapper>
  );
});

DatePickerInput.displayName = 'DatePickerInput';
