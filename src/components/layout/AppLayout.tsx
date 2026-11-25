import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ConnectivityBanner } from './ConnectivityBanner';
import { ToastContainer } from '../ui/ToastContainer';
import { HowItWorksModal } from '../../features/help/HowItWorksModal';
import { useNotificationStore } from '../../store/notificationStore';

export const AppLayout: React.FC = () => {
  const [helpOpen, setHelpOpen] = useState(false);
  const { fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-canvas">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header onOpenHelp={() => setHelpOpen(true)} />
        <ConnectivityBanner />

        {/* Viewport Outlet */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>

      {/* Persistent Toasts */}
      <ToastContainer />

      {/* How SeaSync Works Modal */}
      <HowItWorksModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
};
