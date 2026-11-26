import React from 'react';
import { FormFieldWrapper, type SectionAccent, ACCENT_COLOR_MAP } from './FormFieldWrapper';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  accent?: SectionAccent;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(({
  label,
  options,
  placeholder = '-- Select an option --',
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
        <select
          ref={ref}
          id={id}
          value={value}
          required={required}
          className={`w-full px-3 py-2 pr-8 text-xs font-semibold text-primary bg-transparent focus:outline-none appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {placeholder && <option value="" className="text-secondary bg-surface">{placeholder}</option>}
          {options.map(opt => (
            <option key={String(opt.value)} value={opt.value} className="text-primary bg-surface font-medium py-1">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2.5 pointer-events-none text-secondary">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </FormFieldWrapper>
  );
});

SelectInput.displayName = 'SelectInput';
