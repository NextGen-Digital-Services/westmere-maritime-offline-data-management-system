import React, { useState, useEffect } from 'react';
import { clientDb, type AppSettings } from '../../db/clientDb';
import { DEFAULT_SETTINGS } from '../../db/seedData';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { TextInput } from '../../components/ui/form/TextInput';
import { SelectInput } from '../../components/ui/form/SelectInput';
import { SliderInput } from '../../components/ui/form/SliderInput';
import { CheckboxInput } from '../../components/ui/form/CheckboxInput';
import { Save, Radio, HardDrive, Shield } from 'lucide-react';

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
        <h1 className="text-xl font-bold font-heading text-primary">System Settings</h1>
        <p className="text-xs text-secondary mt-0.5">Terminal configuration, satellite polling intervals, and storage limits</p>
      </div>

      <form onSubmit={handleSave} className="bg-surface border border-border rounded-lg p-6 shadow-solid-sm space-y-6">
        {/* Profile Card */}
        <div className="border-b border-border pb-5">
          <div className="flex items-center space-x-2 text-xs font-bold text-ocean uppercase tracking-wide mb-3">
            <Shield className="w-4 h-4" />
            <span>Authenticated Seafarer Profile</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Active Seafarer Name"
              value={currentUser?.name || ''}
              disabled
              accent="ocean"
            />
            <TextInput
              label="Shipboard Role"
              value={currentUser?.role || ''}
              disabled
              accent="teal"
            />
          </div>
        </div>

        {/* Server & Sync Polling */}
        <div className="border-b border-border pb-5 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-signalOrange uppercase tracking-wide">
            <Radio className="w-4 h-4" />
            <span>Shore Server & Satellite Uplink</span>
          </div>
          
          <TextInput
            label="Shore API Base URL"
            value={settings.serverUrl}
            onChange={e => setSettings({ ...settings, serverUrl: e.target.value })}
            helperText="Default points to Westmere In-Browser Mock Server. Replace with local satellite terminal proxy if needed."
            accent="orange"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Background Sync Interval"
              value={settings.syncIntervalSeconds}
              onChange={e => setSettings({ ...settings, syncIntervalSeconds: Number(e.target.value) })}
              options={[
                { value: 15, label: 'Every 15 Seconds (Fast Uplink)' },
                { value: 30, label: 'Every 30 Seconds (Standard)' },
                { value: 60, label: 'Every 60 Seconds (Low Bandwidth)' },
                { value: 300, label: 'Every 5 Minutes (Satellite Saver)' }
              ]}
              accent="orange"
            />

            <div className="pt-5">
              <CheckboxInput
                label="Vessel Wi-Fi Restriction"
                description="Only sync when connected to shipboard local network"
                checked={settings.wifiOnly}
                onChange={e => setSettings({ ...settings, wifiOnly: e.target.checked })}
                accent="orange"
              />
            </div>
          </div>
        </div>

        {/* Storage Alerts */}
        <div className="border-b border-border pb-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-violet uppercase tracking-wide">
            <HardDrive className="w-4 h-4" />
            <span>Storage Health Threshold</span>
          </div>

          <SliderInput
            label="Storage Alert Warning Threshold"
            value={settings.storageAlertThresholdPercent}
            min={50}
            max={95}
            step={5}
            unit="%"
            onChange={e => setSettings({ ...settings, storageAlertThresholdPercent: Number(e.target.value) })}
            accent="orange"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center space-x-1.5 px-6 py-2.5 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
