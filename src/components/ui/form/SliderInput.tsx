import React from 'react';
import { FormFieldWrapper, type SectionAccent, ACCENT_COLOR_MAP } from './FormFieldWrapper';

export interface SliderInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  error?: string;
  helperText?: string;
  accent?: SectionAccent;
}

export const SliderInput = React.forwardRef<HTMLInputElement, SliderInputProps>(({
  label,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  error,
  helperText,
  accent = 'orange',
  className = '',
  id,
  value,
  onChange,
  ...props
}, ref) => {
  const accentCfg = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.orange;

  return (
    <FormFieldWrapper id={id} label={label} error={error} helperText={helperText} accent={accent}>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted font-medium">Value</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${accentCfg.badge}`}>
            {value}{unit}
          </span>
        </div>
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="w-full accent-signalOrange cursor-pointer"
          {...props}
        />
      </div>
    </FormFieldWrapper>
  );
});

SliderInput.displayName = 'SliderInput';
