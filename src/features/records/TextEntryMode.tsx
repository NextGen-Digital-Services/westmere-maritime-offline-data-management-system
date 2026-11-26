import React, { useState, useEffect, useRef } from 'react';
import { type FormTemplate } from '../../forms/types';
import { smartFillParse, type SmartFillResult } from '../../lib/smartFillParser';
import { SmartFillModal } from './SmartFillModal';
import {
  Sparkles, Copy, Trash2, Download, Upload, Check,
  RotateCcw, RotateCw, FileCode, Clock
} from 'lucide-react';

interface TextEntryModeProps {
  initialText?: string;
  template: FormTemplate;
  formData: Record<string, any>;
  onTextChange: (newText: string) => void;
  onApplySmartFill: (appliedFields: Record<string, any>, preserveUnmapped: boolean) => void;
  isLocked?: boolean;
}

export const TextEntryMode: React.FC<TextEntryModeProps> = ({
  initialText = '',
  template,
  formData,
  onTextChange,
  onApplySmartFill,
  isLocked = false
}) => {
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [smartFillResult, setSmartFillResult] = useState<SmartFillResult | null>(null);
  const [smartFillModalOpen, setSmartFillModalOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Undo / Redo history stack
  const historyRef = useRef<string[]>([initialText]);
  const historyIndexRef = useRef<number>(0);

  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
    }
  }, [initialText]);

  const handleUpdate = (newVal: string) => {
    setText(newVal);
    onTextChange(newVal);
    setLastSavedAt(new Date().toLocaleTimeString());

    // Push history
    const currIdx = historyIndexRef.current;
    const newHistory = historyRef.current.slice(0, currIdx + 1);
    newHistory.push(newVal);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prev = historyRef.current[historyIndexRef.current];
      setText(prev);
      onTextChange(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const next = historyRef.current[historyIndexRef.current];
      setText(next);
      onTextChange(next);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Clear all text from this entry?')) {
      handleUpdate('');
    }
  };

  const handleInsertTemplateSkeleton = () => {
    const lines: string[] = [];
    template.sections.forEach(s => {
      s.fields.forEach(f => {
        lines.push(`${f.label}: `);
      });
    });
    const skeleton = lines.join('\n');
    handleUpdate(text ? `${text}\n\n${skeleton}` : skeleton);
  };

  const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) handleUpdate(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}_entry_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerSmartFill = () => {
    const result = smartFillParse(text, template, formData);
    setSmartFillResult(result);
    setSmartFillModalOpen(true);
  };

  const lineCount = text ? text.split('\n').length : 0;
  const charCount = text.length;

  return (
    <div className="space-y-3">
      {/* Action Toolbar */}
      <div className="bg-surface border border-border rounded-lg p-2.5 shadow-solid-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleTriggerSmartFill}
            disabled={!text.trim() || isLocked}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal" />
            <span>Smart Fill to Form</span>
          </button>

          <button
            type="button"
            onClick={handleInsertTemplateSkeleton}
            disabled={isLocked}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-surface-alt hover:bg-surface border border-border rounded text-xs font-bold text-primary"
            title="Insert field skeleton"
          >
            <FileCode className="w-3.5 h-3.5 text-signalOrange" />
            <span>Insert Skeleton</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndexRef.current <= 0 || isLocked}
            className="p-1.5 border border-border rounded text-secondary hover:bg-surface-alt disabled:opacity-40"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndexRef.current >= historyRef.current.length - 1 || isLocked}
            className="p-1.5 border border-border rounded text-secondary hover:bg-surface-alt disabled:opacity-40"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 border border-border rounded text-secondary hover:bg-surface-alt"
            title="Copy text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-seaGreen" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <label
            className="p-1.5 border border-border rounded text-secondary hover:bg-surface-alt cursor-pointer"
            title="Import .txt file"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".txt" onChange={handleImportTxt} className="hidden" disabled={isLocked} />
          </label>
          <button
            type="button"
            onClick={handleExportTxt}
            className="p-1.5 border border-border rounded text-secondary hover:bg-surface-alt"
            title="Export .txt file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!text || isLocked}
            className="p-1.5 border border-border rounded text-coralRed hover:bg-coralRed-subtle disabled:opacity-40"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Monospace Textarea */}
      <div className="relative bg-surface rounded-lg border-2 border-ocean/40 focus-within:border-ocean focus-within:ring-2 focus-within:ring-ocean/30 shadow-solid-sm overflow-hidden transition-all">
        <textarea
          rows={22}
          value={text}
          disabled={isLocked}
          onChange={e => handleUpdate(e.target.value)}
          placeholder={`Enter or paste operational report in plain text format...\n\nExample:\nVoyage: VOY-2026-14\nCoordinates: 54.2150 N, 003.4510 E\nCourse: 242 deg\nSpeed: 14.8 kts\nROB HFO: 642.5 MT\nROB MDO: 88.2 MT\nRemarks: All main propulsion telemetry stable.`}
          className="w-full p-4 font-mono text-xs leading-relaxed text-primary bg-transparent focus:outline-none placeholder:text-input-placeholder resize-y"
        />
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <div className="flex items-center space-x-3 font-mono text-[11px]">
          <span>Lines: <strong className="text-primary">{lineCount}</strong></span>
          <span>Chars: <strong className="text-primary">{charCount}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-seaGreen font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>{lastSavedAt ? `Saved locally at ${lastSavedAt}` : 'Saved locally in IndexedDB'}</span>
        </div>
      </div>

      {/* Smart Fill Preview Modal */}
      {smartFillResult && (
        <SmartFillModal
          isOpen={smartFillModalOpen}
          onClose={() => setSmartFillModalOpen(false)}
          result={smartFillResult}
          onApply={onApplySmartFill}
        />
      )}
    </div>
  );
};
