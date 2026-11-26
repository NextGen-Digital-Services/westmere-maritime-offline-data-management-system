import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { type FormTemplate, type FormField } from './types';
import { CoordinatesField } from './fields/CoordinatesField';
import { SignatureField } from './fields/SignatureField';
import { TextInput } from '../components/ui/form/TextInput';
import { SelectInput } from '../components/ui/form/SelectInput';
import { TextareaInput } from '../components/ui/form/TextareaInput';
import { DatePickerInput } from '../components/ui/form/DatePickerInput';
import { NumberWithUnitInput } from '../components/ui/form/NumberWithUnitInput';
import { CheckboxInput } from '../components/ui/form/CheckboxInput';
import { type SectionAccent, ACCENT_COLOR_MAP } from '../components/ui/form/FormFieldWrapper';
import { CheckCircle2, Clock, Lock, Send, RotateCcw } from 'lucide-react';

interface FormRendererProps {
  template: FormTemplate;
  initialData?: Record<string, any>;
  isLocked?: boolean;
  onAutosave?: (data: Record<string, any>) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onReopen?: () => void;
}

export function getSectionAccent(category: string, title: string): SectionAccent {
  const lower = `${category} ${title}`.toLowerCase();
  if (lower.includes('meteo') || lower.includes('weather') || lower.includes('sea')) return 'teal';
  if (lower.includes('engine') || lower.includes('bunker') || lower.includes('fuel') || lower.includes('sounding')) return 'orange';
  if (lower.includes('cargo') || lower.includes('commercial')) return 'violet';
  if (lower.includes('safety') || lower.includes('drill') || lower.includes('incident')) return 'coral';
  if (lower.includes('crew') || lower.includes('admin') || lower.includes('watch')) return 'green';
  return 'ocean';
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  template,
  initialData = {},
  isLocked = false,
  onAutosave,
  onSubmit,
  onReopen
}) => {
  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: initialData
  });

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const watchedValues = watch();

  const handleFieldChange = useCallback((currentData: Record<string, any>) => {
    if (isLocked || !onAutosave) return;
    setIsSaving(true);
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    debounceTimer.current = window.setTimeout(() => {
      onAutosave(currentData);
      setIsSaving(false);
      setLastSavedAt(new Date().toLocaleTimeString());
    }, 500);
  }, [isLocked, onAutosave]);

  useEffect(() => {
    handleFieldChange(watchedValues);
  }, [watchedValues, handleFieldChange]);

  // Completion calculation
  const { totalRequired, completedRequired, percentComplete } = useMemo(() => {
    let reqCount = 0;
    let filledCount = 0;
    template.sections.forEach(s => {
      s.fields.forEach(f => {
        if (f.required) {
          reqCount++;
          const val = watchedValues[f.id];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            filledCount++;
          }
        }
      });
    });
    const pct = reqCount > 0 ? Math.round((filledCount / reqCount) * 100) : 100;
    return { totalRequired: reqCount, completedRequired: filledCount, percentComplete: pct };
  }, [template, watchedValues]);

  const renderField = (field: FormField, accent: SectionAccent) => {
    return (
      <div key={field.id} className={field.colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
        <Controller
          name={field.id}
          control={control}
          rules={{ required: field.required ? `${field.label} is mandatory` : false }}
          render={({ field: f, fieldState }) => {
            const err = fieldState.error?.message;
            if (field.type === 'coordinates') {
              return <CoordinatesField value={f.value} onChange={f.onChange} disabled={isLocked} required={field.required} />;
            }
            if (field.type === 'signature') {
              return <SignatureField value={f.value} onChange={f.onChange} disabled={isLocked} required={field.required} />;
            }
            if (field.type === 'textarea') {
              return <TextareaInput {...f} label={field.label} required={field.required} placeholder={field.placeholder} disabled={isLocked} accent={accent} error={err} />;
            }
            if (field.type === 'select') {
              return <SelectInput {...f} label={field.label} required={field.required} options={field.options || []} disabled={isLocked} accent={accent} error={err} />;
            }
            if (field.type === 'checkbox') {
              return <CheckboxInput checked={!!f.value} onChange={e => f.onChange(e.target.checked)} label={field.placeholder || field.label} disabled={isLocked} accent={accent} />;
            }
            if (field.type === 'date') {
              return <DatePickerInput {...f} label={field.label} required={field.required} disabled={isLocked} accent={accent} error={err} />;
            }
            if (field.unit) {
              return <NumberWithUnitInput {...f} label={field.label} required={field.required} unit={field.unit} min={field.min} max={field.max} step={field.step} disabled={isLocked} accent={accent} error={err} />;
            }
            return <TextInput {...f} type={field.type} label={field.label} required={field.required} placeholder={field.placeholder} disabled={isLocked} accent={accent} error={err} />;
          }}
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(data => onSubmit?.(data))} className="space-y-6">
      {/* Dynamic Form Completion Progress Bar */}
      <div className="bg-surface border border-border rounded-lg p-3 shadow-solid-sm space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-primary">
          <div className="flex items-center space-x-2">
            <span>Required Fields Progress:</span>
            <span className={percentComplete === 100 ? 'text-seaGreen' : percentComplete > 50 ? 'text-sunshineYellow-dark' : 'text-signalOrange'}>
              {completedRequired} of {totalRequired} complete ({percentComplete}%)
            </span>
          </div>
          <div>
            {isLocked ? (
              <span className="text-seaGreen font-bold flex items-center space-x-1"><Lock className="w-3.5 h-3.5" /><span>Submitted</span></span>
            ) : isSaving ? (
              <span className="text-signalOrange font-semibold flex items-center space-x-1"><Clock className="w-3.5 h-3.5 animate-spin" /><span>Autosaving...</span></span>
            ) : (
              <span className="text-seaGreen font-semibold flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5" /><span>Saved {lastSavedAt ? `at ${lastSavedAt}` : 'locally'}</span></span>
            )}
          </div>
        </div>
        <div className="w-full bg-surface-alt h-2 rounded-full overflow-hidden border border-border">
          <div
            className={`h-full transition-all duration-300 ${percentComplete === 100 ? 'bg-seaGreen' : percentComplete > 50 ? 'bg-sunshineYellow' : 'bg-signalOrange'}`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Sections with Dedicated Accent Header Bars */}
      {template.sections.map((section, idx) => {
        const accent = getSectionAccent(template.category, section.title);
        const accentCfg = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.ocean;

        return (
          <div key={idx} className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden">
            <div className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between ${accentCfg.headerBar}`}>
              <span>{section.title}</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map(f => renderField(f, accent))}
            </div>
          </div>
        );
      })}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        {isLocked && onReopen && (
          <button
            type="button"
            onClick={onReopen}
            className="flex items-center space-x-1 px-4 py-2 bg-surface border-2 border-ocean rounded text-xs font-bold text-primary hover:bg-ocean-subtle"
          >
            <RotateCcw className="w-4 h-4 text-ocean" />
            <span>Reopen for Amendment</span>
          </button>
        )}
        {!isLocked && onSubmit && (
          <button
            type="submit"
            className="ml-auto flex items-center space-x-2 px-6 py-2.5 bg-signalOrange hover:bg-signalOrange-dark text-white rounded font-bold shadow-solid transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Submit to Pending Sync</span>
          </button>
        )}
      </div>
    </form>
  );
};
