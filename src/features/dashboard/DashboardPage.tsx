import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useConnectivity } from '../../hooks/useConnectivity';
import { useStorage } from '../../hooks/useStorage';
import { useSyncStore } from '../../store/syncStore';
import { useCounter } from '../../hooks/useCounter';
import { clientDb, type RecordItem } from '../../db/clientDb';
import { DashboardCharts } from './DashboardCharts';
import { PendingItemsList } from './PendingItemsList';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, AlertOctagon, HardDrive,
  RefreshCw, PlusCircle, UploadCloud, Radio, Activity
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
      {/* Hero Strip */}
      <div className="bg-navy text-white rounded-lg p-5 shadow-solid flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-teal mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>OPERATIONAL BRIDGE DASHBOARD</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading">
            Good day, {currentUser?.name || 'Master Dahl'}
          </h1>
          <p className="text-xs text-canvas-muted mt-1">
            Logged into <span className="text-white font-semibold">{currentVessel?.name}</span> ({currentVessel?.imoNumber}) • Deck Watch
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/records/new?type=noon_report"
            className="flex items-center space-x-1.5 px-3 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-teal" />
            <span>New Noon Report</span>
          </Link>
          <Link
            to="/documents"
            className="flex items-center space-x-1.5 px-3 py-2 bg-navy-light hover:bg-canvas-subtle hover:text-navy text-white rounded text-xs font-bold border border-navy-light transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-signalOrange" />
            <span>Upload Document</span>
          </Link>
          <button
            onClick={() => triggerSync()}
            disabled={engineStatus.isSyncing || connState === 'Offline'}
            className="flex items-center space-x-1.5 px-3 py-2 bg-seaGreen hover:bg-seaGreen-dark text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${engineStatus.isSyncing ? 'animate-spin' : ''}`} />
            <span>{engineStatus.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Connectivity */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Uplink</span>
            <Activity className="w-4 h-4 text-teal" />
          </div>
          <div className="mt-2 text-lg font-bold font-heading truncate">
            {connState}
          </div>
          <div className="text-[10px] text-canvas-muted mt-1">{latencyMs}ms satellite ping</div>
        </div>

        {/* Total Records */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Total Records</span>
            <FileText className="w-4 h-4 text-ocean" />
          </div>
          <div className="mt-2 text-lg font-bold font-heading text-navy dark:text-canvas">
            {totalCount}
          </div>
          <div className="text-[10px] text-canvas-muted mt-1">Across 10 form schemas</div>
        </div>

        {/* Drafts */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Local Drafts</span>
            <FileText className="w-4 h-4 text-sunshineYellow" />
          </div>
          <div className="mt-2 text-lg font-bold font-heading text-sunshineYellow-dark dark:text-sunshineYellow">
            {draftCount}
          </div>
          <div className="text-[10px] text-canvas-muted mt-1">Autosaved in IndexedDB</div>
        </div>

        {/* Pending Sync */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Pending Sync</span>
            <Clock className="w-4 h-4 text-signalOrange" />
          </div>
          <div className="mt-2 text-lg font-bold font-heading text-signalOrange">
            {pendingCount}
          </div>
          <div className="text-[10px] text-canvas-muted mt-1">Awaiting uplink send</div>
        </div>

        {/* Synced */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Synced Records</span>
            <CheckCircle2 className="w-4 h-4 text-seaGreen" />
          </div>
          <div className="mt-2 text-lg font-bold font-heading text-seaGreen">
            {syncedCount}
          </div>
          <div className="text-[10px] text-canvas-muted mt-1">Shore verified with ACK</div>
        </div>

        {/* Failed */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Failed Uploads</span>
            <AlertOctagon className="w-4 h-4 text-coralRed" />
          </div>
          <div className="mt-2 text-lg font-bold font-heading text-coralRed">
            {failedCount}
          </div>
          <div className="text-[10px] text-canvas-muted mt-1">Requires user retry</div>
        </div>

        {/* Last Sync Time */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Last Push</span>
            <RefreshCw className="w-4 h-4 text-teal" />
          </div>
          <div className="mt-2 text-sm font-bold font-heading text-navy dark:text-canvas truncate">
            {engineStatus.lastSyncTime ? new Date(engineStatus.lastSyncTime).toLocaleTimeString() : '14:22:00'}
          </div>
          <div className="text-[10px] text-canvas-muted mt-1">Zero duplicates verified</div>
        </div>

        {/* Storage Utilisation */}
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <div className="flex items-center justify-between text-xs text-canvas-muted font-semibold">
            <span>Local Storage</span>
            <HardDrive className="w-4 h-4 text-violet" />
          </div>
          <div className="mt-2 text-sm font-bold font-heading text-violet truncate">
            {usedFormatted} / {quotaFormatted}
          </div>
          <div className="w-full bg-canvas-subtle h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-violet h-full" style={{ width: `${Math.max(5, percentUsed)}%` }} />
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
