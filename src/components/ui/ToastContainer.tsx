import React from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let borderClass = 'border-ocean text-ocean';
        let bgClass = 'bg-canvas-card border-l-4';
        let Icon = Info;

        if (toast.type === 'success') {
          borderClass = 'border-seaGreen text-seaGreen';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          borderClass = 'border-coralRed text-coralRed';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          borderClass = 'border-signalOrange text-signalOrange';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-3.5 rounded shadow-solid-md ${bgClass} ${borderClass} border border-canvas-border transition-all animate-soft-pulse`}
          >
            <div className="flex items-start space-x-2.5">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-canvas">{toast.title}</h4>
                <p className="text-xs text-canvas-muted mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-canvas-muted hover:text-canvas ml-2 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
