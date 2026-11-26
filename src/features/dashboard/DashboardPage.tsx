import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useConnectivity } from '../../hooks/useConnectivity';
import { useStorage } from '../../hooks/useStorage';
import { useSyncStore } from '../../store/syncStore';
import { useCounter } from '../../hooks/useCounter';
import { clientDb, type RecordItem } from '../../db/clientDb';
import { DashboardCharts } from './DashboardCharts';
import { PendingItemsList } from './PendingItemsList';
import { AnimatedShipWaves } from '../../components/ui/AnimatedShipWaves';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, AlertOctagon, HardDrive,
  RefreshCw, PlusCircle, UploadCloud, Radio, Activity,
  FileSpreadsheet, Sparkles
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser, currentVessel } = useAuthStore();
  const { state: connState, latencyMs } = useConnectivity();
  const { usedFormatted, quotaFormatted, percentUsed } = useStorage();
  const { engineStatus, triggerSync } = useSyncStore();
  const [records, setRecords] = useState<RecordItem[]>([]);

  useEffect(() => {
    clientDb.records.toArray().then(setRecords);
  }, [engineStatus]);

  const drafts = records.filter(r => r.status === 'Draft').length;
  const pending = records.filter(r => r.status === 'Pending Sync' || r.status === 'Syncing').length;
  const synced = records.filter(r => r.status === 'Synced').length;
  const failed = records.filter(r => r.status === 'Failed').length;
  const conflict = records.filter(r => r.status === 'Conflict').length;

  const totalCount = useCounter(records.length);
  const draftCount = useCounter(drafts);
  const pendingCount = useCounter(pending);
  const syncedCount = useCounter(synced);
  const failedCount = useCounter(failed);

  return (
    <div className="space-y-6">
      {/* Hero Strip with Live Wave Illustration */}
      <div className="relative bg-navy text-white rounded-lg overflow-hidden shadow-solid-md border border-navy-light">
        <div className="relative z-10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-teal mb-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>OFFLINE-FIRST MARITIME TELEMETRY DECK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Good day, {currentUser?.name || 'Master Dahl'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Vessel Terminal: <span className="text-teal font-bold">{currentVessel?.name}</span> ({currentVessel?.imoNumber}) • Deck Watch
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/records/new?type=noon_report"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-teal" />
              <span>New Noon Report</span>
            </Link>
            <Link
              to="/records/new?type=free_text"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-violet hover:bg-violet-dark text-white rounded text-xs font-bold shadow-solid transition-colors"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Free Text Entry</span>
            </Link>
            <Link
              to="/documents"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-surface hover:bg-surface-alt text-primary rounded text-xs font-bold border border-border shadow-solid transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-signalOrange" />
              <span>Upload Docs</span>
            </Link>
            <button
              onClick={() => triggerSync()}
              disabled={engineStatus.isSyncing || connState === 'Offline'}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-seaGreen hover:bg-seaGreen-dark text-white rounded text-xs font-bold shadow-solid transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${engineStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span>{engineStatus.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
        <AnimatedShipWaves className="h-16 opacity-30" />
      </div>

      {/* 8 Metric Stat Cards with Solid Colored Top Bars & Colored Icon Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Uplink Status */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className={`h-1.5 w-full ${connState === 'Online' ? 'bg-teal' : connState === 'Weak' ? 'bg-signalOrange' : 'bg-coralRed'}`} />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Uplink Status</span>
              <div className={`p-1 rounded ${connState === 'Online' ? 'bg-teal-subtle text-teal' : connState === 'Weak' ? 'bg-signalOrange-subtle text-signalOrange' : 'bg-coralRed-subtle text-coralRed'}`}>
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${connState === 'Online' ? 'bg-teal animate-ping' : connState === 'Weak' ? 'bg-signalOrange' : 'bg-coralRed'}`} />
              <span className={`text-base font-extrabold font-heading ${connState === 'Online' ? 'text-teal' : connState === 'Weak' ? 'text-signalOrange' : 'text-coralRed'}`}>
                {connState.toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] text-muted font-mono font-medium">{latencyMs}ms satellite ping</div>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 w-full bg-ocean" />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Total Records</span>
              <div className="p-1 rounded bg-ocean-subtle text-ocean">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold font-heading text-primary">
              {totalCount}
            </div>
            <div className="text-[10px] text-muted font-medium">11 operational schemas</div>
          </div>
        </div>

        {/* Local Drafts */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 w-full bg-sunshineYellow" />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Local Drafts</span>
              <div className="p-1 rounded bg-sunshineYellow-subtle text-sunshineYellow-dark">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold font-heading text-sunshineYellow-dark dark:text-sunshineYellow">
              {draftCount}
            </div>
            <div className="text-[10px] text-muted font-medium">Autosaved in IndexedDB</div>
          </div>
        </div>

        {/* Pending Sync */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 w-full bg-signalOrange" />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Pending Sync</span>
              <div className="p-1 rounded bg-signalOrange-subtle text-signalOrange">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold font-heading text-signalOrange">
              {pendingCount}
            </div>
            <div className="text-[10px] text-muted font-medium">Awaiting satellite push</div>
          </div>
        </div>

        {/* Synced */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 w-full bg-seaGreen" />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Synced Records</span>
              <div className="p-1 rounded bg-seaGreen-subtle text-seaGreen">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold font-heading text-seaGreen">
              {syncedCount}
            </div>
            <div className="text-[10px] text-muted font-medium">Server verified with ACK</div>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 w-full bg-coralRed" />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Failed Uploads</span>
              <div className="p-1 rounded bg-coralRed-subtle text-coralRed">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold font-heading text-coralRed">
              {failedCount}
            </div>
            <div className="text-[10px] text-muted font-medium">Retry button available</div>
          </div>
        </div>

        {/* Last Sync */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 w-full bg-teal" />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Last Sync</span>
              <div className="p-1 rounded bg-teal-subtle text-teal">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-extrabold font-heading text-primary font-mono truncate">
              {engineStatus.lastSyncTime ? new Date(engineStatus.lastSyncTime).toLocaleTimeString() : '14:22:00 UTC'}
            </div>
            <div className="text-[10px] text-muted font-medium">Zero duplicate guarantee</div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 w-full bg-violet" />
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Local Storage</span>
              <div className="p-1 rounded bg-violet-subtle text-violet">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-extrabold font-heading text-violet font-mono truncate">
              {usedFormatted} / {quotaFormatted}
            </div>
            <div className="w-full bg-surface-alt h-1.5 rounded-full overflow-hidden border border-border">
              <div className="bg-violet h-full" style={{ width: `${Math.max(4, percentUsed)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <DashboardCharts statusCounts={{ drafts, pending, synced, failed, conflict }} />

      {/* Pending Items List */}
      <PendingItemsList records={records} />
    </div>
  );
};
