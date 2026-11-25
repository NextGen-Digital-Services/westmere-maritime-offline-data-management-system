import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FolderOpen,
  RefreshCw,
  Menu,
  X,
  HardDrive,
  GitMerge,
  FlaskConical,
  Settings,
  Shield
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { currentUser } = useAuthStore();
  const { engineStatus } = useSyncStore();
  const isAdmin = currentUser?.role === 'Shore Admin';

  const primaryItems = [
    { to: '/dashboard', label: 'Dash', icon: LayoutDashboard },
    { to: '/records', label: 'Records', icon: FileSpreadsheet },
    { to: '/documents', label: 'Docs', icon: FolderOpen },
    {
      to: '/sync',
      label: 'Sync',
      icon: RefreshCw,
      badge: engineStatus.pendingCount > 0 ? engineStatus.pendingCount : undefined
    }
  ];

  const drawerItems = [
    { to: '/conflicts', label: 'Conflict Resolver', icon: GitMerge },
    { to: '/storage', label: 'Storage & Backup', icon: HardDrive },
    ...(isAdmin ? [{ to: '/admin', label: 'Fleet Admin', icon: Shield }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/demo-lab', label: 'Demo Control Lab', icon: FlaskConical }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-navy text-white z-50 transform transition-transform lg:hidden flex flex-col ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-navy-light flex items-center justify-between">
          <span className="font-heading font-bold text-base text-white">SeaSync Navigation</span>
          <button onClick={() => setDrawerOpen(false)} className="p-1 text-canvas-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {drawerItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded text-sm font-semibold ${
                    isActive ? 'bg-ocean text-white' : 'text-canvas-muted hover:text-white hover:bg-navy-light'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-navy border-t border-navy-light z-30 lg:hidden flex items-center justify-around h-14">
        {primaryItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold relative ${
                  isActive ? 'text-teal' : 'text-canvas-muted hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute top-1.5 right-6 w-4 h-4 bg-signalOrange text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold text-canvas-muted hover:text-white"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
