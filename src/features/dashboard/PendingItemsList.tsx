import React from 'react';
import { type RecordItem } from '../../db/clientDb';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Upload } from 'lucide-react';

export const PendingItemsList: React.FC<{ records: RecordItem[] }> = ({ records }) => {
  const pendingRecords = records.filter(r => r.status === 'Pending Sync' || r.status === 'Syncing');

  if (pendingRecords.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-5 text-center shadow-solid-sm">
        <div className="inline-flex p-3 rounded-full bg-seaGreen-subtle text-seaGreen mb-2">
          <Clock className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-primary">Sync Queue is Idle</h4>
        <p className="text-xs text-muted mt-1">All operational records and attachments are synchronized with shore.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-solid-sm space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-signalOrange-subtle text-signalOrange">
            <Upload className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
            Pending Satellite Delivery ({pendingRecords.length})
          </h3>
        </div>
        <Link to="/sync" className="text-xs text-ocean hover:underline flex items-center space-x-1 font-bold">
          <span>Manage Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {pendingRecords.slice(0, 5).map(record => (
          <div key={record.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-alt/50 px-1 rounded transition-colors">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-primary hover:text-ocean truncate">
                <Link to={`/records/${record.id}`}>{record.title}</Link>
              </div>
              <div className="text-[11px] text-secondary flex items-center space-x-2 mt-0.5">
                <span className="font-medium">{record.authorName}</span>
                <span>•</span>
                <span className="font-mono font-semibold">v{record.version}</span>
                {record.entryMode && (
                  <>
                    <span>•</span>
                    <span className="uppercase text-[9px] font-bold px-1 rounded bg-violet-subtle text-violet border border-violet/30">
                      {record.entryMode}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{new Date(record.clientUpdatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={record.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
