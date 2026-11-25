import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { initializeDatabaseSeed } from '../db/seedData';
import { useAuthStore } from '../store/authStore';

export const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const { initAuth } = useAuthStore();

  useEffect(() => {
    // 1. Initialize Seed Data (Vessels, Users, 25 Records, Attachments, Sync Logs)
    initializeDatabaseSeed()
      .then(() => initAuth())
      .finally(() => setIsReady(true));

    // 2. Restore saved theme
    const savedTheme = localStorage.getItem('seasync_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [initAuth]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin" />
        <h2 className="font-heading font-bold text-sm tracking-wide">INITIALIZING SEASYNC OFFLINE STORAGE...</h2>
        <p className="text-xs text-canvas-muted">Indexing IndexedDB tables & verifying persistent quota</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
