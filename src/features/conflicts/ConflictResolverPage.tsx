import React, { useState, useEffect } from 'react';
import { clientDb, type RecordItem } from '../../db/clientDb';
import { conflictService, type ConflictDetails } from '../../sync/conflict';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { GitMerge, Check, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConflictResolverPage: React.FC = () => {
  const [conflictRecords, setConflictRecords] = useState<RecordItem[]>([]);
  const [activeDetails, setActiveDetails] = useState<ConflictDetails | null>(null);
  const [selectedResolutions, setSelectedResolutions] = useState<Record<string, 'local' | 'server'>>({});

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

    await conflictService.resolveMergeFields(
      activeDetails.recordId,
      mergedData,
      currentUser?.id || 'user-officer',
      currentUser?.name || 'Chief Officer'
    );
    showToast('Conflict Merged', 'Fields combined and queued for shore synchronization.', 'success');
    setActiveDetails(null);
    loadConflicts();
  };

  if (conflictRecords.length === 0) {
    return (
      <div className="bg-canvas-card border rounded-lg p-10 text-center space-y-3">
        <div className="w-12 h-12 bg-seaGreen-subtle text-seaGreen rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-navy dark:text-canvas">Zero Data Conflicts Detected</h2>
        <p className="text-xs text-canvas-muted max-w-md mx-auto">
          All local vessel reports and shoreside updates are fully in sync. If a conflict occurs during offline edits, you will be alerted here to review field-by-field.
        </p>
        <Link to="/demo-lab" className="inline-flex items-center space-x-1 text-xs text-ocean font-bold hover:underline">
          <span>Go to Demo Control Lab to simulate a conflict</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-navy dark:text-canvas">Conflict Resolver</h1>
        <p className="text-xs text-canvas-muted mt-0.5">
          Side-by-side reconciliation between vessel offline changes and shoreside updates
        </p>
      </div>

      {/* Record Selector Pills */}
      <div className="flex items-center space-x-2">
        {conflictRecords.map(r => (
          <button
            key={r.id}
            onClick={() => handleSelectRecord(r.id)}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
              activeDetails?.recordId === r.id ? 'bg-violet text-white' : 'bg-canvas-card'
            }`}
          >
            {r.title} ({r.id})
          </button>
        ))}
      </div>

      {activeDetails && (
        <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-navy dark:text-canvas">{activeDetails.localRecord.title}</h3>
              <p className="text-xs text-coralRed font-semibold mt-0.5">
                Version Skew: Local v{activeDetails.localRecord.version} vs Shore v{activeDetails.serverRecord.version}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResolveKeepLocal}
                className="px-3 py-1.5 bg-canvas-subtle border rounded text-xs font-bold hover:bg-canvas"
              >
                Keep Mine (Vessel)
              </button>
              <button
                onClick={handleResolveKeepServer}
                className="px-3 py-1.5 bg-canvas-subtle border rounded text-xs font-bold hover:bg-canvas"
              >
                Keep Server (Shore)
              </button>
              <button
                onClick={handleResolveMerge}
                className="px-3 py-1.5 bg-violet hover:bg-violet-dark text-white rounded text-xs font-bold"
              >
                Merge Selected Fields
              </button>
            </div>
          </div>

          {/* Conflicting Fields Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-canvas-muted tracking-wider">
              Conflicting Fields ({activeDetails.conflictingFields.length})
            </h4>

            <div className="divide-y divide-canvas-border border rounded-lg overflow-hidden">
              {activeDetails.conflictingFields.map(field => {
                const choice = selectedResolutions[field.key] || 'local';
                return (
                  <div key={field.key} className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div>
                      <span className="font-bold text-xs text-navy dark:text-canvas block">{field.label}</span>
                      <span className="text-[10px] font-mono text-canvas-muted">{field.key}</span>
                    </div>

                    {/* Local Choice */}
                    <div
                      onClick={() => setSelectedResolutions(prev => ({ ...prev, [field.key]: 'local' }))}
                      className={`p-2.5 rounded border cursor-pointer text-xs transition-all ${
                        choice === 'local' ? 'border-2 border-ocean bg-ocean-subtle dark:bg-navy-light font-bold' : 'border-dashed'
                      }`}
                    >
                      <div className="text-[10px] text-ocean font-bold mb-1">LOCAL (Vessel)</div>
                      <div>{String(field.localValue ?? 'Empty')}</div>
                    </div>

                    {/* Server Choice */}
                    <div
                      onClick={() => setSelectedResolutions(prev => ({ ...prev, [field.key]: 'server' }))}
                      className={`p-2.5 rounded border cursor-pointer text-xs transition-all ${
                        choice === 'server' ? 'border-2 border-seaGreen bg-seaGreen-subtle dark:bg-navy-light font-bold' : 'border-dashed'
                      }`}
                    >
                      <div className="text-[10px] text-seaGreen font-bold mb-1">SERVER (Shore Desk)</div>
                      <div>{String(field.serverValue ?? 'Empty')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
