import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';

import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { RecordsListPage } from '../features/records/RecordsListPage';
import { RecordEditorPage } from '../features/records/RecordEditorPage';
import { RecordHistoryPage } from '../features/records/RecordHistoryPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { SyncCenterPage } from '../features/sync/SyncCenterPage';
import { ConflictResolverPage } from '../features/conflicts/ConflictResolverPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { StorageManagerPage } from '../features/storage/StorageManagerPage';
import { AdminPortalPage } from '../features/admin/AdminPortalPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { DemoLabPage } from '../features/demolab/DemoLabPage';
import { NotFoundPage } from '../features/help/NotFoundPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false
}) => {
  const { isAuthenticated, currentUser } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser?.role !== 'Shore Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="records" element={<RecordsListPage />} />
        <Route path="records/new" element={<RecordEditorPage />} />
        <Route path="records/:id" element={<RecordEditorPage />} />
        <Route path="records/:id/history" element={<RecordHistoryPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="sync" element={<SyncCenterPage />} />
        <Route path="conflicts" element={<ConflictResolverPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="storage" element={<StorageManagerPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPortalPage />
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="demo-lab" element={<DemoLabPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
