import React, { useState } from 'react';
import { type FormTemplate } from '../../forms/types';
import { X, Copy, Download, Check, FileText } from 'lucide-react';

interface FormToTextViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: FormTemplate;
  formData: Record<string, any>;
  recordTitle?: string;
}

export function generatePlainTextFromForm(template: FormTemplate, data: Record<string, any>): string {
  const lines: string[] = [];
  lines.push(`=== ${template.title.toUpperCase()} ===`);
  lines.push(`Generated: ${new Date().toUTCString()}\n`);

  template.sections.forEach(section => {
    lines.push(`--- ${section.title.toUpperCase()} ---`);
    section.fields.forEach(field => {
      const val = data[field.id];
      if (val !== undefined && val !== null && val !== '') {
        const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
        lines.push(`${field.label}: ${valStr}${field.unit ? ` ${field.unit}` : ''}`);
      } else {
        lines.push(`${field.label}: [Not Recorded]`);
      }
    });
    lines.push('');
  });

  return lines.join('\n');
}

export const FormToTextViewModal: React.FC<FormToTextViewModalProps> = ({
  isOpen,
  onClose,
  template,
  formData,
  recordTitle
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const textContent = generatePlainTextFromForm(template, formData);

  const handleCopy = () => {
    navigator.clipboard?.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recordTitle || template.id}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-2xl w-full shadow-solid-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-navy text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-teal" />
            <h3 className="text-sm font-bold text-white">Formatted Plain-Text Report</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <textarea
            readOnly
            value={textContent}
            className="w-full h-80 p-3 font-mono text-xs text-primary bg-surface-alt border border-border rounded focus:outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="bg-surface-alt px-5 py-3 border-t border-border flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 bg-surface border border-border rounded text-xs font-bold text-primary hover:bg-surface-alt"
          >
            {copied ? <Check className="w-4 h-4 text-seaGreen" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy All Text'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid"
          >
            <Download className="w-4 h-4" />
            <span>Download .txt File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
