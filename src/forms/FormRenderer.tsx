import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { type FormTemplate, type FormField } from './types';
import { CoordinatesField } from './fields/CoordinatesField';
import { SignatureField } from './fields/SignatureField';
import { CheckCircle2, Clock, Lock, Send, RotateCcw } from 'lucide-react';

interface FormRendererProps {
  template: FormTemplate;
  initialData?: Record<string, any>;
  isLocked?: boolean;
  onAutosave?: (data: Record<string, any>) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onReopen?: () => void;
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

  const renderField = (field: FormField) => {
    return (
      <div key={field.id} className={field.colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
        <label className="block text-xs font-semibold text-canvas-muted mb-1">
          {field.label} {field.required && <span className="text-coralRed">*</span>}
        </label>
        <Controller
          name={field.id}
          control={control}
          rules={{ required: field.required ? `${field.label} is mandatory` : false }}
          render={({ field: f }) => {
            if (field.type === 'coordinates') {
              return <CoordinatesField value={f.value} onChange={f.onChange} disabled={isLocked} required={field.required} />;
            }
            if (field.type === 'signature') {
              return <SignatureField value={f.value} onChange={f.onChange} disabled={isLocked} required={field.required} />;
            }
            if (field.type === 'textarea') {
              return (
                <textarea
                  {...f}
                  disabled={isLocked}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-canvas border rounded focus:outline-none focus:border-ocean disabled:opacity-60"
                />
              );
            }
            if (field.type === 'select') {
              return (
                <select
                  {...f}
                  disabled={isLocked}
                  className="w-full px-3 py-2 text-sm bg-canvas border rounded focus:outline-none focus:border-ocean disabled:opacity-60"
                >
                  <option value="">-- Select {field.label} --</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              );
            }
            if (field.type === 'checkbox') {
              return (
                <label className="flex items-center space-x-2 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!f.value}
                    disabled={isLocked}
                    onChange={e => f.onChange(e.target.checked)}
                    className="w-4 h-4 text-ocean rounded border-gray-300 focus:ring-ocean"
                  />
                  <span className="text-sm font-medium">{field.placeholder || field.label}</span>
                </label>
              );
            }
            return (
              <div className="relative">
                <input
                  type={field.type}
                  {...f}
                  disabled={isLocked}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="w-full px-3 py-2 text-sm bg-canvas border rounded focus:outline-none focus:border-ocean disabled:opacity-60"
                />
                {field.unit && (
                  <span className="absolute right-3 top-2 text-xs text-canvas-muted font-medium pointer-events-none">
                    {field.unit}
                  </span>
                )}
              </div>
            );
          }}
        />
        {errors[field.id] && (
          <p className="text-xs text-coralRed mt-1 font-medium">{errors[field.id]?.message as string}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(data => onSubmit?.(data))} className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-canvas-border">
        <div className="flex items-center space-x-2 text-xs">
          {isLocked ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-seaGreen-subtle text-seaGreen font-semibold border border-seaGreen">
              <Lock className="w-3.5 h-3.5" />
              <span>Record Locked (Submitted)</span>
            </span>
          ) : isSaving ? (
            <span className="inline-flex items-center space-x-1.5 text-signalOrange font-medium">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Autosaving draft...</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 text-seaGreen font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved locally {lastSavedAt ? `at ${lastSavedAt}` : 'in IndexedDB'}</span>
            </span>
          )}
        </div>
        {isLocked && onReopen && (
          <button
            type="button"
            onClick={onReopen}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-canvas-subtle border rounded hover:bg-canvas font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reopen for Amendment</span>
          </button>
        )}
      </div>

      {template.sections.map((section, idx) => (
        <div key={idx} className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-base font-bold text-navy dark:text-canvas">{section.title}</h3>
            {section.description && <p className="text-xs text-canvas-muted mt-0.5">{section.description}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map(renderField)}
          </div>
        </div>
      ))}

      {!isLocked && onSubmit && (
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-signalOrange hover:bg-signalOrange-dark text-white rounded font-bold shadow-solid transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Submit to Pending Sync</span>
          </button>
        </div>
      )}
    </form>
  );
};
