import React from 'react';
import { AlertCircle } from 'lucide-react';

export type SectionAccent = 'ocean' | 'teal' | 'orange' | 'violet' | 'coral' | 'green';

export interface FormFieldWrapperProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  accent?: SectionAccent;
  children: React.ReactNode;
  className?: string;
}

export const ACCENT_COLOR_MAP: Record<SectionAccent, {
  dot: string;
  border: string;
  focusRing: string;
  headerBar: string;
  subtle: string;
  badge: string;
}> = {
  ocean: {
    dot: 'bg-ocean',
    border: 'border-ocean/40 focus-within:border-ocean hover:border-ocean',
    focusRing: 'focus-within:ring-2 focus-within:ring-ocean/30',
    headerBar: 'bg-ocean text-white',
    subtle: 'bg-ocean-subtle',
    badge: 'bg-ocean-subtle text-ocean border-ocean/30'
  },
  teal: {
    dot: 'bg-teal',
    border: 'border-teal/40 focus-within:border-teal hover:border-teal',
    focusRing: 'focus-within:ring-2 focus-within:ring-teal/30',
    headerBar: 'bg-teal text-white',
    subtle: 'bg-teal-subtle',
    badge: 'bg-teal-subtle text-teal dark:text-teal-light border-teal/30'
  },
  orange: {
    dot: 'bg-signalOrange',
    border: 'border-signalOrange/40 focus-within:border-signalOrange hover:border-signalOrange',
    focusRing: 'focus-within:ring-2 focus-within:ring-signalOrange/30',
    headerBar: 'bg-signalOrange text-white',
    subtle: 'bg-signalOrange-subtle',
    badge: 'bg-signalOrange-subtle text-signalOrange-dark dark:text-signalOrange border-signalOrange/30'
  },
  violet: {
    dot: 'bg-violet',
    border: 'border-violet/40 focus-within:border-violet hover:border-violet',
    focusRing: 'focus-within:ring-2 focus-within:ring-violet/30',
    headerBar: 'bg-violet text-white',
    subtle: 'bg-violet-subtle',
    badge: 'bg-violet-subtle text-violet border-violet/30'
  },
  coral: {
    dot: 'bg-coralRed',
    border: 'border-coralRed/40 focus-within:border-coralRed hover:border-coralRed',
    focusRing: 'focus-within:ring-2 focus-within:ring-coralRed/30',
    headerBar: 'bg-coralRed text-white',
    subtle: 'bg-coralRed-subtle',
    badge: 'bg-coralRed-subtle text-coralRed border-coralRed/30'
  },
  green: {
    dot: 'bg-seaGreen',
    border: 'border-seaGreen/40 focus-within:border-seaGreen hover:border-seaGreen',
    focusRing: 'focus-within:ring-2 focus-within:ring-seaGreen/30',
    headerBar: 'bg-seaGreen text-white',
    subtle: 'bg-seaGreen-subtle',
    badge: 'bg-seaGreen-subtle text-seaGreen border-seaGreen/30'
  }
};

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  id,
  label,
  required = false,
  error,
  helperText,
  accent = 'ocean',
  children,
  className = ''
}) => {
  const accentCfg = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.ocean;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="flex items-center space-x-1.5 text-xs font-bold text-primary">
          <span className={`w-1.5 h-1.5 rounded-full ${accentCfg.dot} flex-shrink-0`} />
          <span>{label}</span>
          {required && <span className="text-coralRed font-bold">*</span>}
        </label>
      )}

      <div>{children}</div>

      {helperText && !error && (
        <p className="text-[11px] text-muted leading-tight">{helperText}</p>
      )}

      {error && (
        <div className="flex items-center space-x-1 text-[11px] text-coralRed font-semibold mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
