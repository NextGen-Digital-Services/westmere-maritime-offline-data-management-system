import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { clientDb, type NotificationItem } from '../../db/clientDb';
import { Bell, CheckCheck, Trash2, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'warning' | 'error'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClearAll = async () => {
    await clientDb.notifications.clear();
    fetchNotifications();
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'warning') return n.type === 'warning';
    if (filter === 'error') return n.type === 'error';
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-navy dark:text-canvas">Notifications & Alerts</h1>
          <p className="text-xs text-canvas-muted mt-0.5">Vessel event stream, sync status alerts, and storage thresholds</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-canvas-card border rounded text-xs font-bold hover:bg-canvas-subtle"
          >
            <CheckCheck className="w-4 h-4 text-seaGreen" />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-2 bg-canvas-card border rounded text-xs font-bold hover:bg-canvas-subtle text-coralRed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b pb-2 text-xs font-semibold">
        {(['all', 'unread', 'warning', 'error'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 rounded capitalize transition-colors ${
              filter === tab ? 'bg-navy text-white dark:bg-canvas dark:text-navy' : 'text-canvas-muted hover:text-canvas'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-canvas-card border rounded-lg shadow-solid-sm divide-y divide-canvas-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-canvas-muted">
            <Bell className="w-8 h-8 text-canvas-muted mx-auto mb-2 opacity-50" />
            No notifications matching the selected filter.
          </div>
        ) : (
          filtered.map(item => {
            let Icon = Info;
            let iconColor = 'text-ocean';
            if (item.type === 'warning') { Icon = AlertTriangle; iconColor = 'text-signalOrange'; }
            if (item.type === 'error') { Icon = AlertCircle; iconColor = 'text-coralRed'; }
            if (item.type === 'success') { Icon = CheckCircle2; iconColor = 'text-seaGreen'; }

            return (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-4 flex items-start justify-between cursor-pointer transition-colors ${
                  !item.isRead ? 'bg-canvas-subtle/50' : 'hover:bg-canvas-subtle/30'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-navy dark:text-canvas">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-signalOrange" />
                      )}
                    </div>
                    <p className="text-xs text-canvas-muted mt-0.5">{item.message}</p>
                    {item.link && (
                      <Link to={item.link} className="text-xs text-ocean font-bold hover:underline mt-1 inline-block">
                        View Details &rarr;
                      </Link>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-canvas-muted whitespace-nowrap ml-3">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
