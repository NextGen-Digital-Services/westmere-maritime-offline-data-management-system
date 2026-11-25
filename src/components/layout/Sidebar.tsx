import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FolderOpen,
  RefreshCw,
  GitMerge,
  HardDrive,
  Shield,
  Settings,
  FlaskConical,
  Anchor
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { engineStatus } = useSyncStore();
  const isAdmin = currentUser?.role === 'Shore Admin';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/records', label: 'Operational Records', icon: FileSpreadsheet },
    { to: '/documents', label: 'Documents & Files', icon: FolderOpen },
    {
      to: '/sync',
      label: 'Sync Centre',
      icon: RefreshCw,
      badge: engineStatus.pendingCount > 0 ? engineStatus.pendingCount : undefined
    },
    { to: '/conflicts', label: 'Conflict Resolver', icon: GitMerge },
    { to: '/storage', label: 'Storage & Backup', icon: HardDrive },
    ...(isAdmin ? [{ to: '/admin', label: 'Shore Fleet Admin', icon: Shield }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/demo-lab', label: 'Demo Control Lab', icon: FlaskConical, highlight: true }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-navy text-canvas-subtle border-r border-navy-light select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-navy-light">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-ocean rounded flex items-center justify-center text-white font-bold">
            <Anchor className="w-5 h-5 text-teal" />
          </div>
          <div>
            <span className="text-lg font-heading font-extrabold tracking-tight text-white block">
              SeaSync
            </span>
            <span className="text-[10px] text-teal font-semibold tracking-wider uppercase block">
              Offline Data Management
            </span>
          </div>
        </div>
        <p className="text-[11px] text-canvas-muted mt-2 font-medium">
          Work offline. Sync everywhere.
        </p>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-ocean text-white font-bold'
                    : item.highlight
                    ? 'text-signalOrange hover:bg-navy-light'
                    : 'text-canvas-muted hover:text-white hover:bg-navy-light'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-signalOrange text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-3 border-t border-navy-light bg-navy-dark text-[11px] text-canvas-muted">
        <div className="flex justify-between items-center">
          <span>SeaSync v1.0.0</span>
          <span className="text-seaGreen font-bold font-mono">DEXIE OK</span>
        </div>
        <div className="text-[10px] text-canvas-muted mt-1">Built by Westmere Marine</div>
      </div>
    </aside>
  );
};
