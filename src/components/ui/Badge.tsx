import React from 'react';
import { type RecordStatus } from '../../db/clientDb';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, FileText, AlertOctagon } from 'lucide-react';

interface BadgeProps {
  status: RecordStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  switch (status) {
    case 'Draft':
      return (
        <span className={`inline-flex items-center space-x-1 rounded font-semibold badge-draft ${sizeClasses}`}>
          <FileText className="w-3 h-3 text-sunshineYellow-dark" />
          <span>Draft</span>
        </span>
      );
    case 'Pending Sync':
      return (
        <span className={`inline-flex items-center space-x-1 rounded font-semibold badge-pending ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-signalOrange-dark" />
          <span>Pending Sync</span>
        </span>
      );
    case 'Syncing':
      return (
        <span className={`inline-flex items-center space-x-1 rounded font-semibold badge-syncing ${sizeClasses}`}>
          <RefreshCw className="w-3 h-3 text-ocean animate-spin" />
          <span>Syncing</span>
        </span>
      );
    case 'Synced':
      return (
        <span className={`inline-flex items-center space-x-1 rounded font-semibold badge-synced ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-seaGreen" />
          <span>Synced</span>
        </span>
      );
    case 'Failed':
      return (
        <span className={`inline-flex items-center space-x-1 rounded font-semibold badge-failed ${sizeClasses}`}>
          <AlertOctagon className="w-3 h-3 text-coralRed" />
          <span>Failed</span>
        </span>
      );
    case 'Conflict':
      return (
        <span className={`inline-flex items-center space-x-1 rounded font-semibold badge-conflict ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 text-violet" />
          <span>Conflict</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center space-x-1 rounded font-medium bg-canvas-subtle border ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};
