import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clientDb, type RecordItem, type AuditLog } from '../../db/clientDb';
import { ArrowLeft, Clock, History, UserCheck, Shield } from 'lucide-react';

export const RecordHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<RecordItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (id) {
      clientDb.records.get(id).then(r => r && setRecord(r));
      clientDb.auditLogs.where('entityId').equals(id).reverse().sortBy('timestamp').then(setAuditLogs);
    }
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 border-b pb-4">
        <Link to={`/records/${id}`} className="p-1.5 border rounded hover:bg-canvas-subtle">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold font-heading text-navy dark:text-canvas">
            Audit Trail & Version Timeline
          </h1>
          <p className="text-xs text-canvas-muted mt-0.5">
            Immutable operational change log for {record?.title || id}
          </p>
        </div>
      </div>

      {/* Version Status Summary */}
      <div className="bg-canvas-card border rounded-lg p-4 shadow-solid-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-canvas-muted block">Current Version:</span>
          <span className="text-base font-bold font-mono text-ocean">v{record?.version || 1}</span>
        </div>
        <div>
          <span className="text-canvas-muted block">Local Timestamp:</span>
          <span className="font-semibold">{record?.clientUpdatedAt ? new Date(record.clientUpdatedAt).toLocaleString() : 'N/A'}</span>
        </div>
        <div>
          <span className="text-canvas-muted block">Server ACK Time:</span>
          <span className="font-semibold text-seaGreen">{record?.serverUpdatedAt ? new Date(record.serverUpdatedAt).toLocaleString() : 'Unsynced'}</span>
        </div>
        <div>
          <span className="text-canvas-muted block">Author Officer:</span>
          <span className="font-semibold">{record?.authorName || 'Bridge Officer'}</span>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-4">
        <div className="flex items-center space-x-2 font-bold text-sm text-navy dark:text-canvas border-b pb-2">
          <History className="w-4 h-4 text-teal" />
          <span>Lifecycle Audit Log</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-xs text-canvas-muted py-4 text-center">
            Initial record creation captured. Awaiting subsequent version amend cycles.
          </div>
        ) : (
          <div className="relative border-l-2 border-canvas-border ml-3 space-y-6 my-2">
            {auditLogs.map((log, idx) => (
              <div key={log.id} className="relative pl-6">
                <span className="absolute -left-2 top-1 w-3.5 h-3.5 rounded-full bg-ocean border-2 border-white" />
                <div className="text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-navy dark:text-canvas">{log.action}</span>
                    <span className="text-canvas-muted text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-canvas mt-1 font-medium">{log.details}</p>
                  <div className="text-[10px] text-canvas-muted flex items-center space-x-1 mt-1">
                    <UserCheck className="w-3 h-3 text-teal" />
                    <span>Logged by {log.userName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
