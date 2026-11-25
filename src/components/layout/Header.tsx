import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useConnectivity } from '../../hooks/useConnectivity';
import { useSyncStore } from '../../store/syncStore';
import { useNotificationStore } from '../../store/notificationStore';
import {
  Wifi,
  WifiOff,
  Radio,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  Ship,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC<{ onOpenHelp: () => void }> = ({ onOpenHelp }) => {
  const { currentUser, currentVessel, logout } = useAuthStore();
  const { state, latencyMs } = useConnectivity();
  const { engineStatus, triggerSync } = useSyncStore();
  const { unreadCount } = useNotificationStore();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('seasync_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('seasync_theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="h-14 bg-navy text-white px-4 flex items-center justify-between border-b border-navy-light z-30 select-none">
      {/* Vessel Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-navy-light px-2.5 py-1 rounded">
          <Ship className="w-4 h-4 text-teal" />
          <span className="text-xs font-bold tracking-wide">
            {currentVessel?.name || 'MV Westmere Voyager'}
          </span>
          <span className="text-[10px] bg-teal text-navy px-1.5 py-0.2 rounded font-mono font-bold">
            {currentVessel?.imoNumber || 'IMO 9845231'}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Connectivity Pill */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            state === 'Online'
              ? 'bg-teal-subtle text-teal dark:bg-teal-dark dark:text-white animate-soft-pulse'
              : state === 'Weak'
              ? 'bg-sunshineYellow text-navy'
              : 'bg-coralRed text-white animate-gentle-shake'
          }`}
          title={`Status: ${state} (${latencyMs}ms)`}
        >
          {state === 'Online' ? (
            <Wifi className="w-3.5 h-3.5 text-seaGreen" />
          ) : state === 'Weak' ? (
            <Radio className="w-3.5 h-3.5 text-navy" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-white" />
          )}
          <span className="hidden sm:inline">{state.toUpperCase()}</span>
        </div>

        {/* Sync Now Button with Rotating Ring */}
        <button
          onClick={() => triggerSync()}
          disabled={engineStatus.isSyncing || state === 'Offline'}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs bg-ocean hover:bg-ocean-hover text-white rounded font-semibold transition-all disabled:opacity-50"
          title="Trigger immediate sync with shore server"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${engineStatus.isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{engineStatus.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-1.5 text-canvas-muted hover:text-white rounded hover:bg-navy-light transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-signalOrange text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-canvas-muted hover:text-white rounded hover:bg-navy-light transition-colors"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-sunshineYellow" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* How it Works / Help */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 text-teal hover:text-white rounded hover:bg-navy-light transition-colors"
          title="How SeaSync Works"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Role Pill & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-navy-light">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold leading-tight">{currentUser?.name || 'Officer'}</div>
            <div className="text-[10px] text-teal font-medium">{currentUser?.role || 'Master'}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-coralRed hover:bg-navy-light rounded transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
