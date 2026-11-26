import React, { useState } from 'react';
import { type SmartFillResult } from '../../lib/smartFillParser';
import { Sparkles, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface SmartFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SmartFillResult;
  onApply: (appliedFields: Record<string, any>, preserveUnmapped: boolean) => void;
}

export const SmartFillModal: React.FC<SmartFillModalProps> = ({
  isOpen,
  onClose,
  result,
  onApply
}) => {
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    result.mappedFields.forEach(f => {
      init[f.fieldId] = true;
    });
    return init;
  });

  const [appendUnmappedToRemarks, setAppendUnmappedToRemarks] = useState(true);

  if (!isOpen) return null;

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleConfirm = () => {
    const toApply: Record<string, any> = {};
    result.mappedFields.forEach(f => {
      if (selectedFields[f.fieldId]) {
        toApply[f.fieldId] = f.foundValue;
      }
    });
    onApply(toApply, appendUnmappedToRemarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-3xl w-full shadow-solid-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-navy text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-teal rounded text-navy font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Smart Fill - Offline Rule-Based Extraction</h3>
              <p className="text-[11px] text-teal mt-0.5">
                Review parsed fields before applying values to form structure.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {result.mappedFields.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <AlertTriangle className="w-8 h-8 text-signalOrange mx-auto mb-2" />
              <p className="font-bold">No structured &quot;Label: value&quot; pairs recognized</p>
              <p className="text-muted mt-1">
                Ensure lines use &quot;Label: Value&quot; format (e.g. &quot;Course: 242&quot;, &quot;Speed: 14.8 kts&quot;).
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt font-bold text-secondary text-[11px] uppercase border-b">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Apply</th>
                    <th className="p-2.5">Target Field</th>
                    <th className="p-2.5">Extracted Value</th>
                    <th className="p-2.5">Current Value</th>
                    <th className="p-2.5">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.mappedFields.map(f => (
                    <tr key={f.fieldId} className="hover:bg-surface-alt/50">
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedFields[f.fieldId]}
                          onChange={() => toggleField(f.fieldId)}
                          className="rounded text-ocean focus:ring-ocean"
                        />
                      </td>
                      <td className="p-2.5 font-bold text-primary">{f.fieldLabel}</td>
                      <td className="p-2.5 font-mono text-ocean font-bold">{String(f.foundValue)}</td>
                      <td className="p-2.5 text-muted">{f.currentValue !== undefined ? String(f.currentValue) : '—'}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.confidence === 'High' ? 'bg-seaGreen-subtle text-seaGreen' : 'bg-sunshineYellow-subtle text-sunshineYellow-dark'
                        }`}>
                          {f.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Unmapped Lines */}
          {result.unmappedLines.length > 0 && (
            <div className="bg-surface-alt p-3.5 rounded border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-secondary text-xs">
                  Unmapped Narrative Lines ({result.unmappedLines.length})
                </span>
                <label className="flex items-center space-x-1.5 text-xs text-primary font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appendUnmappedToRemarks}
                    onChange={e => setAppendUnmappedToRemarks(e.target.checked)}
                    className="rounded text-ocean"
                  />
                  <span>Preserve in Remarks field</span>
                </label>
              </div>
              <div className="font-mono text-[11px] text-muted max-h-24 overflow-y-auto space-y-0.5 bg-surface p-2 rounded border">
                {result.unmappedLines.map((line, idx) => (
                  <div key={idx} className="truncate">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface-alt px-5 py-3 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded text-xs font-bold text-secondary hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={result.mappedFields.length === 0}
            className="flex items-center space-x-1.5 px-5 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid disabled:opacity-50"
          >
            <span>Apply Selected Fields</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
