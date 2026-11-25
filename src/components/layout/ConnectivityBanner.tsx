import React from 'react';
import { useConnectivity } from '../../hooks/useConnectivity';
import { WifiOff, Radio, AlertTriangle } from 'lucide-react';

export const ConnectivityBanner: React.FC = () => {
  const { state, latencyMs, isSimulatedOffline } = useConnectivity();

  if (state === 'Online') return null;

  const isOffline = state === 'Offline';

  return (
    <div
      className={`w-full py-2 px-4 text-xs font-semibold flex items-center justify-between transition-colors ${
        isOffline
          ? 'bg-coralRed text-white animate-gentle-shake'
          : 'bg-sunshineYellow text-navy'
      }`}
    >
      <div className="flex items-center space-x-2 max-w-5xl mx-auto w-full">
        {isOffline ? (
          <WifiOff className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Radio className="w-4 h-4 flex-shrink-0" />
        )}
        <span>
          {isOffline
            ? `VESSEL OFFLINE MODE ${isSimulatedOffline ? '(Simulated via Demo Lab)' : ''}: Zero connection to shore. SeaSync is persisting all reports locally into IndexedDB without data loss.`
            : `WEAK SATELLITE UPLINK: Latency is high (${latencyMs}ms). Sync engine is buffering transfers to prevent duplicate packets.`}
        </span>
      </div>
    </div>
  );
};
