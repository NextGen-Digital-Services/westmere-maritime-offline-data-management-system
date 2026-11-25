import React from 'react';
import { type RecordItem } from '../../db/clientDb';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Upload } from 'lucide-react';

export const PendingItemsList: React.FC<{ records: RecordItem[] }> = ({ records }) => {
  const pendingRecords = records.filter(r => r.status === 'Pending Sync' || r.status === 'Syncing');

  if (pendingRecords.length === 0) {
    return (
      <div className="bg-canvas-card border rounded-lg p-5 text-center">
        <div className="inline-flex p-3 rounded-full bg-seaGreen-subtle text-seaGreen mb-2">
          <Clock className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-canvas">Sync Queue is Idle</h4>
        <p className="text-xs text-canvas-muted mt-1">All operational records and attachments are synchronized with shore.</p>
      </div>
    );
  }

  return (
    <div className="bg-canvas-card border rounded-lg p-4 shadow-solid-sm space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          <Upload className="w-4 h-4 text-signalOrange" />
          <h3 className="text-xs font-bold text-navy dark:text-canvas">
            Pending Satellite Delivery ({pendingRecords.length})
          </h3>
        </div>
        <Link to="/sync" className="text-xs text-ocean hover:underline flex items-center space-x-1 font-semibold">
          <span>Manage Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-canvas-border">
        {pendingRecords.slice(0, 5).map(record => (
          <div key={record.id} className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-canvas hover:text-ocean truncate max-w-xs sm:max-w-md">
                <Link to={`/records/${record.id}`}>{record.title}</Link>
              </div>
              <div className="text-[10px] text-canvas-muted flex items-center space-x-2 mt-0.5">
                <span>{record.authorName}</span>
                <span>•</span>
                <span>v{record.version}</span>
                <span>•</span>
                <span>{new Date(record.clientUpdatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
            <StatusBadge status={record.status} />
          </div>
        ))}
      </div>
    </div>
  );
};
