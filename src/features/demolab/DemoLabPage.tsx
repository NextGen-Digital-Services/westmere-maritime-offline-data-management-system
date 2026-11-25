import React, { useState } from 'react';
import { useSyncStore } from '../../store/syncStore';
import { clientDb, type RecordItem } from '../../db/clientDb';
import { serverMockDb } from '../../db/serverMockDb';
import { attachmentRepository } from '../../db/repositories/attachmentRepository';
import { useNotificationStore } from '../../store/notificationStore';
import { v4 as uuidv4 } from 'uuid';
import {
  FlaskConical, WifiOff, Wifi, AlertTriangle, Bug,
  FilePlus, Paperclip, Zap, Trash2, ShieldCheck, Terminal
} from 'lucide-react';

export const DemoLabPage: React.FC = () => {
  const {
    controls,
    events,
    setSimulateOffline,
    setNetworkQuality,
    setForceServerError,
    setInterruptNextUpload,
    addEvent,
    clearEvents
  } = useSyncStore();
  const { showToast } = useNotificationStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate20Records = async () => {
    setIsGenerating(true);
    addEvent('Generating 20 sample operational records...', 'info');

    const types = ['noon_report', 'daily_ops', 'bunker_report', 'engine_log', 'safety_drill'];
    const now = Date.now();
    const newRecords: RecordItem[] = [];

    for (let i = 1; i <= 20; i++) {
      const type = types[i % types.length];
      const recId = `gen-${uuidv4().substring(0, 8)}`;
      newRecords.push({
        id: recId,
        title: `Simulated Batch Log #${i} (${type.replace(/_/g, ' ')})`,
        formType: type,
        vesselId: 'vessel-1',
        createdBy: 'user-officer',
        authorName: 'Chief Mate Lindholm',
        status: 'Pending Sync',
        version: 1,
        isDraft: false,
        isLocked: true,
        clientCreatedAt: new Date(now - i * 60000).toISOString(),
        clientUpdatedAt: new Date(now - i * 60000).toISOString(),
        data: {
          reportDate: new Date().toISOString().split('T')[0],
          notes: `Telemetry sample data point #${i}`,
          speedOverGround: 14.5 + (i % 3),
          course: 220 + i
        }
      });

      // Enqueue in sync queue
      await clientDb.syncQueue.put({
        id: `queue-${uuidv4().substring(0, 8)}`,
        type: 'RECORD',
        entityId: recId,
        action: 'CREATE',
        idempotencyKey: uuidv4(),
        status: 'QUEUED',
        retryCount: 0,
        nextAttemptAt: Date.now(),
        createdAt: new Date().toISOString()
      });
    }

    await clientDb.records.bulkAdd(newRecords);
    setIsGenerating(false);
    showToast('Batch Generated', '20 sample records created and added to Pending Sync queue.', 'success');
    addEvent('20 operational records successfully queued for sync test.', 'success');
  };

  const handleCreateConflict = async () => {
    // Modify an existing record in serverMockDb to create version skew
    const serverRecords = await serverMockDb.serverRecords.toArray();
    if (serverRecords.length === 0) {
      alert('No server records available to create conflict.');
      return;
    }
    const target = serverRecords[0];
    await serverMockDb.serverRecords.update(target.id, {
      version: target.version + 2,
      serverUpdatedAt: new Date().toISOString(),
      data: {
        ...target.data,
        remarks: 'SHORE SUPERINTENDENT OVERRIDE: Data amended during shore review.'
      }
    });

    // Make local record modified too
    await clientDb.records.update(target.id, {
      status: 'Conflict',
      clientUpdatedAt: new Date().toISOString()
    });

    addEvent(`Conflict injected on record "${target.title}" (Server bumped to v${target.version + 2}).`, 'warning');
    showToast('Conflict Injected', `Record "${target.title}" now has a version collision. Check Conflict Resolver.`, 'warning');
  };

  const handleAddLargeAttachment = async () => {
    // Generate a 1MB simulated blob (4 chunks of 256KB)
    const size = 1024 * 1024; // 1 MB
    const dummyBytes = new Uint8Array(size);
    dummyBytes.fill(65); // 'A'
    const file = new File([dummyBytes], `Engine_Overhaul_Manual_${Date.now().toString().slice(-4)}.pdf`, {
      type: 'application/pdf'
    });

    await attachmentRepository.saveFile(file, 'Chief Engineer', 'vessel-1');
    addEvent(`1 MB Attachment added (${file.name}, 4 chunks of 256KB).`, 'info');
    showToast('Attachment Queued', '1 MB multi-chunk file queued for resumable upload.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="bg-signalOrange-subtle border border-signalOrange p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FlaskConical className="w-6 h-6 text-signalOrange flex-shrink-0" />
          <div>
            <h1 className="text-base font-bold text-navy dark:text-canvas">Demo Control Lab & Acceptance Test Rig</h1>
            <p className="text-xs text-canvas-muted mt-0.5">
              Interactive test bench to simulate at-sea disconnects, satellite jitter, and server faults live.
            </p>
          </div>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Simulate Offline */}
        <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase text-canvas-muted">Satellite Uplink State</span>
            {controls.simulateOffline ? <WifiOff className="w-5 h-5 text-coralRed" /> : <Wifi className="w-5 h-5 text-seaGreen" />}
          </div>
          <p className="text-xs text-canvas-muted">Forces the whole PWA into zero-network offline mode.</p>
          <button
            onClick={() => setSimulateOffline(!controls.simulateOffline)}
            className={`w-full py-2.5 rounded font-bold text-xs shadow-solid transition-colors ${
              controls.simulateOffline ? 'bg-coralRed text-white' : 'bg-seaGreen hover:bg-seaGreen-dark text-white'
            }`}
          >
            {controls.simulateOffline ? 'Disable Simulation (Bring Online)' : 'Simulate Mid-Ocean Offline'}
          </button>
        </div>

        {/* Network Quality Simulator */}
        <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase text-canvas-muted">Network Quality & Jitter</span>
            <Zap className="w-5 h-5 text-teal" />
          </div>
          <p className="text-xs text-canvas-muted">Simulates Starlink/FleetBroadband satellite latency profiles.</p>
          <div className="grid grid-cols-3 gap-2">
            {(['fast', 'slow', 'flaky'] as const).map(q => (
              <button
                key={q}
                onClick={() => setNetworkQuality(q)}
                className={`py-2 rounded text-xs font-bold capitalize border transition-colors ${
                  controls.networkQuality === q ? 'bg-navy text-white dark:bg-canvas dark:text-navy' : 'bg-canvas-subtle hover:bg-canvas'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Error & Interrupt Injection */}
        <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase text-canvas-muted">Fault Injection</span>
            <Bug className="w-5 h-5 text-coralRed" />
          </div>
          <p className="text-xs text-canvas-muted">Inject 500 error or interrupt chunk transfer mid-flight.</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setForceServerError(!controls.forceServerError)}
              className={`py-2 px-2 text-[11px] font-bold rounded border transition-colors ${
                controls.forceServerError ? 'bg-coralRed text-white' : 'bg-canvas-subtle'
              }`}
            >
              {controls.forceServerError ? '500 Error ON' : 'Inject 500 Error'}
            </button>
            <button
              onClick={() => setInterruptNextUpload(true)}
              className="py-2 px-2 text-[11px] font-bold rounded bg-sunshineYellow text-navy hover:bg-sunshineYellow-dark"
            >
              Interrupt Upload
            </button>
          </div>
        </div>

        {/* Data Generation Tools */}
        <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-3 md:col-span-2 lg:col-span-3">
          <span className="font-bold text-xs uppercase text-canvas-muted block">Client Demo Data Generators</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleGenerate20Records}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 py-2.5 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors disabled:opacity-50"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create 20 Sample Records</span>
            </button>

            <button
              onClick={handleAddLargeAttachment}
              className="flex items-center justify-center space-x-2 py-2.5 bg-violet hover:bg-violet-dark text-white rounded text-xs font-bold shadow-solid transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              <span>Add 1 MB Chunked Attachment</span>
            </button>

            <button
              onClick={handleCreateConflict}
              className="flex items-center justify-center space-x-2 py-2.5 bg-signalOrange hover:bg-signalOrange-dark text-white rounded text-xs font-bold shadow-solid transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Trigger Version Conflict</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Live Sync Trace Log */}
      <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-2 font-bold text-xs text-navy dark:text-canvas">
            <Terminal className="w-4 h-4 text-teal" />
            <span>Live Sync Engine Event Stream</span>
          </div>
          <button onClick={clearEvents} className="text-xs text-canvas-muted hover:text-coralRed flex items-center space-x-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>

        <div className="bg-navy font-mono text-[11px] text-canvas-subtle p-3 rounded h-52 overflow-y-auto space-y-1">
          {events.map(ev => (
            <div key={ev.id} className="flex items-start space-x-2">
              <span className="text-canvas-muted whitespace-nowrap">[{ev.timestamp}]</span>
              <span className={
                ev.type === 'success' ? 'text-seaGreen' :
                ev.type === 'error' ? 'text-coralRed font-bold' :
                ev.type === 'warning' ? 'text-signalOrange' : 'text-teal'
              }>
                {ev.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
