import React, { useState, useEffect } from 'react';
import { clientDb, type RecordItem } from '../../db/clientDb';
import { conflictService, type ConflictDetails } from '../../sync/conflict';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { GitMerge, Check, AlertTriangle, ShieldCheck, ArrowRight, FileText, SplitSquareVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConflictResolverPage: React.FC = () => {
  const [conflictRecords, setConflictRecords] = useState<RecordItem[]>([]);
  const [activeDetails, setActiveDetails] = useState<ConflictDetails | null>(null);
  const [selectedResolutions, setSelectedResolutions] = useState<Record<string, 'local' | 'server'>>({});
  const [selectedTextResolution, setSelectedTextResolution] = useState<'local' | 'server' | 'both'>('local');

  const { currentUser } = useAuthStore();
  const { showToast } = useNotificationStore();

  const loadConflicts = async () => {
    const list = await clientDb.records.where('status').equals('Conflict').toArray();
    setConflictRecords(list);
    if (list.length > 0 && !activeDetails) {
      const details = await conflictService.getConflict(list[0].id);
      setActiveDetails(details);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  const handleSelectRecord = async (recordId: string) => {
    const details = await conflictService.getConflict(recordId);
    setActiveDetails(details);
    setSelectedResolutions({});
  };

  const handleResolveKeepLocal = async () => {
    if (!activeDetails) return;
    await conflictService.resolveKeepLocal(
      activeDetails.recordId,
      currentUser?.id || 'user-officer',
      currentUser?.name || 'Chief Officer'
    );
    showToast('Conflict Resolved', 'Vessel local changes retained. Queued for server commit.', 'success');
    setActiveDetails(null);
    loadConflicts();
  };

  const handleResolveKeepServer = async () => {
    if (!activeDetails) return;
    await conflictService.resolveKeepServer(
      activeDetails.recordId,
      currentUser?.id || 'user-officer',
      currentUser?.name || 'Chief Officer'
    );
    showToast('Conflict Resolved', 'Shore server version adopted.', 'info');
    setActiveDetails(null);
    loadConflicts();
  };

  const handleResolveMerge = async () => {
    if (!activeDetails) return;
    const mergedData: Record<string, any> = { ...activeDetails.localRecord.data };
    activeDetails.conflictingFields.forEach(f => {
      const choice = selectedResolutions[f.key] || 'local';
      mergedData[f.key] = choice === 'server' ? f.serverValue : f.localValue;
    });

    // Merge raw text if conflict present
    let mergedRawText = activeDetails.localRecord.rawText;
    if (activeDetails.serverRecord.rawText && activeDetails.localRecord.rawText !== activeDetails.serverRecord.rawText) {
      if (selectedTextResolution === 'server') {
        mergedRawText = activeDetails.serverRecord.rawText;
      } else if (selectedTextResolution === 'both') {
        mergedRawText = `${activeDetails.localRecord.rawText || ''}\n\n[Shore Amendments]:\n${activeDetails.serverRecord.rawText}`;
      }
    }

    await conflictService.resolveMergeFields(
      activeDetails.recordId,
      mergedData,
      currentUser?.id || 'user-officer',
      currentUser?.name || 'Chief Officer'
    );

    if (mergedRawText !== activeDetails.localRecord.rawText) {
      await clientDb.records.update(activeDetails.recordId, { rawText: mergedRawText });
    }

    showToast('Conflict Merged', 'Fields combined and queued for shore synchronization.', 'success');
    setActiveDetails(null);
    loadConflicts();
  };

  if (conflictRecords.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-10 text-center space-y-3 shadow-solid-sm">
        <div className="w-12 h-12 bg-seaGreen-subtle text-seaGreen rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-primary">Zero Data Conflicts Detected</h2>
        <p className="text-xs text-secondary max-w-md mx-auto">
          All local vessel reports and shoreside updates are fully in sync. If a conflict occurs during offline edits, you will be alerted here to review field-by-field.
        </p>
        <Link to="/demo-lab" className="inline-flex items-center space-x-1 text-xs text-ocean font-bold hover:underline">
          <span>Go to Demo Control Lab to simulate a conflict</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const localText = activeDetails?.localRecord?.rawText || '';
  const serverText = activeDetails?.serverRecord?.rawText || '';
  const hasTextConflict = localText !== serverText && (Boolean(localText) || Boolean(serverText));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-primary">Conflict Resolver</h1>
        <p className="text-xs text-secondary mt-0.5">
          Side-by-side reconciliation between vessel offline changes and shoreside updates
        </p>
      </div>

      {/* Record Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {conflictRecords.map(r => (
          <button
            key={r.id}
            onClick={() => handleSelectRecord(r.id)}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
              activeDetails?.recordId === r.id
                ? 'bg-violet text-white border-violet shadow-solid'
                : 'bg-surface text-primary border-border hover:bg-surface-alt'
            }`}
          >
            {r.title} ({r.id})
          </button>
        ))}
      </div>

      {activeDetails && (
        <div className="bg-surface border border-border rounded-lg p-5 shadow-solid-sm space-y-5">
          {/* Header & Sticky Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-border pb-3 gap-3">
            <div>
              <h3 className="text-sm font-bold text-primary">{activeDetails.localRecord.title}</h3>
              <p className="text-xs text-coralRed font-bold mt-0.5">
                Version Collision: Local v{activeDetails.localRecord.version} vs Shore v{activeDetails.serverRecord.version}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResolveKeepLocal}
                className="px-3 py-2 bg-surface border-2 border-ocean rounded text-xs font-bold text-primary hover:bg-ocean-subtle transition-colors"
              >
                Keep Mine (Vessel)
              </button>
              <button
                type="button"
                onClick={handleResolveKeepServer}
                className="px-3 py-2 bg-surface border-2 border-seaGreen rounded text-xs font-bold text-primary hover:bg-seaGreen-subtle transition-colors"
              >
                Keep Server (Shore)
              </button>
              <button
                type="button"
                onClick={handleResolveMerge}
                className="px-4 py-2 bg-violet hover:bg-violet-dark text-white rounded text-xs font-bold shadow-solid transition-colors"
              >
                Merge Selected Fields
              </button>
            </div>
          </div>

          {/* Conflicting Structured Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-secondary tracking-wider">
              Structured Form Field Differences ({activeDetails.conflictingFields.length})
            </h4>

            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-surface">
              {activeDetails.conflictingFields.map(field => {
                const choice = selectedResolutions[field.key] || 'local';
                return (
                  <div key={field.key} className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div>
                      <span className="font-bold text-xs text-primary block">{field.label}</span>
                      <span className="text-[10px] font-mono text-muted">{field.key}</span>
                    </div>

                    {/* Local Choice (Solid Light Blue) */}
                    <div
                      onClick={() => setSelectedResolutions(prev => ({ ...prev, [field.key]: 'local' }))}
                      className={`p-3 rounded border-2 cursor-pointer text-xs transition-all ${
                        choice === 'local'
                          ? 'border-ocean bg-[#E3F0FF] text-[#0A2540] font-bold shadow-solid-sm'
                          : 'border-border bg-surface-alt/60 text-secondary hover:border-ocean/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-ocean font-bold mb-1">
                        <span>LOCAL (Vessel)</span>
                        {choice === 'local' && <Check className="w-3.5 h-3.5 text-ocean stroke-[3]" />}
                      </div>
                      <div className="text-primary font-medium">{String(field.localValue ?? 'Empty')}</div>
                    </div>

                    {/* Server Choice (Solid Light Green) */}
                    <div
                      onClick={() => setSelectedResolutions(prev => ({ ...prev, [field.key]: 'server' }))}
                      className={`p-3 rounded border-2 cursor-pointer text-xs transition-all ${
                        choice === 'server'
                          ? 'border-seaGreen bg-[#DDF7EA] text-[#0B3A1C] font-bold shadow-solid-sm'
                          : 'border-border bg-surface-alt/60 text-secondary hover:border-seaGreen/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-seaGreen font-bold mb-1">
                        <span>SERVER (Shore Desk)</span>
                        {choice === 'server' && <Check className="w-3.5 h-3.5 text-seaGreen stroke-[3]" />}
                      </div>
                      <div className="text-primary font-medium">{String(field.serverValue ?? 'Empty')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line-by-Line Narrative Text Diff (if present) */}
          {hasTextConflict && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-secondary tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet" />
                  <span>Narrative Raw Text Differences</span>
                </h4>
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedTextResolution('local')}
                    className={`px-2.5 py-1 rounded border text-[11px] ${selectedTextResolution === 'local' ? 'bg-ocean text-white' : 'bg-surface'}`}
                  >
                    Use Local Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTextResolution('server')}
                    className={`px-2.5 py-1 rounded border text-[11px] ${selectedTextResolution === 'server' ? 'bg-seaGreen text-white' : 'bg-surface'}`}
                  >
                    Use Shore Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTextResolution('both')}
                    className={`px-2.5 py-1 rounded border text-[11px] ${selectedTextResolution === 'both' ? 'bg-violet text-white' : 'bg-surface'}`}
                  >
                    Append Both
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded border-2 border-ocean/40 bg-[#E3F0FF] text-primary">
                  <div className="text-[10px] font-bold text-ocean mb-1">LOCAL NARRATIVE</div>
                  <pre className="whitespace-pre-wrap leading-relaxed">{localText || '[No local text recorded]'}</pre>
                </div>
                <div className="p-3 rounded border-2 border-seaGreen/40 bg-[#DDF7EA] text-primary">
                  <div className="text-[10px] font-bold text-seaGreen mb-1">SHORE SERVER NARRATIVE</div>
                  <pre className="whitespace-pre-wrap leading-relaxed">{serverText || '[No shore text recorded]'}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
