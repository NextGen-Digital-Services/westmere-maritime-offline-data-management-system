import React from 'react';
import { type SectionAccent, ACCENT_COLOR_MAP } from './FormFieldWrapper';
import { Check } from 'lucide-react';

export interface CheckboxInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  accent?: SectionAccent;
}

export const CheckboxInput = React.forwardRef<HTMLInputElement, CheckboxInputProps>(({
  label,
  description,
  accent = 'ocean',
  className = '',
  id,
  checked,
  disabled,
  onChange,
  ...props
}, ref) => {
  const accentCfg = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.ocean;

  return (
    <label className={`flex items-start space-x-2.5 p-2 rounded cursor-pointer transition-colors hover:bg-surface-alt/70 ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${checked ? `${accentCfg.dot} border-transparent text-white` : 'border-secondary/60 bg-surface'}`}>
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
      <div className="flex-1">
        <span className="text-xs font-bold text-primary block leading-tight">{label}</span>
        {description && <span className="text-[11px] text-muted block mt-0.5">{description}</span>}
      </div>
    </label>
  );
});

CheckboxInput.displayName = 'CheckboxInput';
