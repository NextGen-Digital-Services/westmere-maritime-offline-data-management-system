import React, { useState, useEffect } from 'react';
import { clientDb, type AppSettings } from '../../db/clientDb';
import { DEFAULT_SETTINGS } from '../../db/seedData';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Settings, Save, Download, Globe, Radio, BellRing, Sun, Moon } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const { currentUser } = useAuthStore();
  const { showToast } = useNotificationStore();

  useEffect(() => {
    clientDb.settings.get('global-settings').then(s => {
      if (s) setSettings(s);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await clientDb.settings.put(settings);
    showToast('Settings Saved', 'System preferences updated locally.', 'success');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-navy dark:text-canvas">System Settings</h1>
        <p className="text-xs text-canvas-muted mt-0.5">Terminal configuration, satellite polling intervals, and storage limits</p>
      </div>

      <form onSubmit={handleSave} className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-5">
        {/* Profile Card */}
        <div className="border-b pb-4">
          <h3 className="text-xs font-bold text-navy dark:text-canvas uppercase mb-3">User Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-canvas-muted block mb-1">Authenticated Seafarer</span>
              <input
                type="text"
                disabled
                value={currentUser?.name || ''}
                className="w-full px-3 py-1.5 bg-canvas-subtle border rounded font-semibold text-canvas"
              />
            </div>
            <div>
              <span className="text-canvas-muted block mb-1">Assigned Role</span>
              <input
                type="text"
                disabled
                value={currentUser?.role || ''}
                className="w-full px-3 py-1.5 bg-canvas-subtle border rounded font-semibold text-teal"
              />
            </div>
          </div>
        </div>

        {/* Server & Sync Polling */}
        <div className="border-b pb-4 space-y-4">
          <h3 className="text-xs font-bold text-navy dark:text-canvas uppercase">Shore Server & Connectivity</h3>
          
          <div>
            <label className="block text-xs font-semibold text-canvas-muted mb-1">Shore API Base URL</label>
            <input
              type="text"
              value={settings.serverUrl}
              onChange={e => setSettings({ ...settings, serverUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-canvas border rounded font-mono focus:outline-none focus:border-ocean"
            />
            <span className="text-[10px] text-canvas-muted mt-1 block">
              Default points to Westmere Mock Server. Replace with internal ship satellite proxy URL if required.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-canvas-muted mb-1">Background Sync Interval</label>
              <select
                value={settings.syncIntervalSeconds}
                onChange={e => setSettings({ ...settings, syncIntervalSeconds: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-canvas border rounded font-semibold focus:outline-none focus:border-ocean"
              >
                <option value={15}>Every 15 Seconds (Fast)</option>
                <option value={30}>Every 30 Seconds (Standard)</option>
                <option value={60}>Every 60 Seconds (Low Bandwidth)</option>
                <option value={300}>Every 5 Minutes (Satellite Saver)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-canvas-muted mb-1">Connection Restriction</label>
              <label className="flex items-center space-x-2 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wifiOnly}
                  onChange={e => setSettings({ ...settings, wifiOnly: e.target.checked })}
                  className="rounded text-ocean focus:ring-ocean"
                />
                <span className="font-medium">Restrict Sync to Vessel Wi-Fi Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Storage Alerts */}
        <div className="border-b pb-4 space-y-3">
          <h3 className="text-xs font-bold text-navy dark:text-canvas uppercase">Storage Health Threshold</h3>
          <div>
            <div className="flex justify-between text-xs mb-1 font-semibold">
              <span className="text-canvas-muted">Storage Warning Alert Threshold</span>
              <span className="text-signalOrange font-bold">{settings.storageAlertThresholdPercent}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              value={settings.storageAlertThresholdPercent}
              onChange={e => setSettings({ ...settings, storageAlertThresholdPercent: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center space-x-1.5 px-5 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
