import React, { useState, useEffect } from 'react';
import { clientDb, type Vessel, type User, type AuditLog } from '../../db/clientDb';
import { serverMockDb, type ServerRecord } from '../../db/serverMockDb';
import { SEED_VESSELS, SEED_USERS } from '../../db/seedData';
import { Ship, Users, Database, History, Anchor } from 'lucide-react';

export const AdminPortalPage: React.FC = () => {
  const [vessels, setVessels] = useState<Vessel[]>(SEED_VESSELS);
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [serverRecords, setServerRecords] = useState<ServerRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState<'fleet' | 'users' | 'server_records' | 'audit'>('fleet');

  useEffect(() => {
    clientDb.vessels.toArray().then(setVessels);
    clientDb.users.toArray().then(setUsers);
    serverMockDb.serverRecords.toArray().then(setServerRecords);
    clientDb.auditLogs.toCollection().reverse().sortBy('timestamp').then(setAuditLogs);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-primary">Shore Fleet Operations Portal</h1>
        <p className="text-xs text-secondary mt-0.5">Central shoreside fleet telemetry, device authorizations, and audit compliance</p>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setTab('fleet')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded font-bold transition-all ${
            tab === 'fleet' ? 'bg-navy text-white shadow-solid' : 'bg-surface text-secondary hover:text-primary hover:bg-surface-alt border border-border'
          }`}
        >
          <Ship className="w-3.5 h-3.5" />
          <span>Fleet Vessels ({vessels.length})</span>
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded font-bold transition-all ${
            tab === 'users' ? 'bg-navy text-white shadow-solid' : 'bg-surface text-secondary hover:text-primary hover:bg-surface-alt border border-border'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Crew & Roles ({users.length})</span>
        </button>
        <button
          onClick={() => setTab('server_records')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded font-bold transition-all ${
            tab === 'server_records' ? 'bg-navy text-white shadow-solid' : 'bg-surface text-secondary hover:text-primary hover:bg-surface-alt border border-border'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Shoreside Records DB ({serverRecords.length})</span>
        </button>
        <button
          onClick={() => setTab('audit')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded font-bold transition-all ${
            tab === 'audit' ? 'bg-navy text-white shadow-solid' : 'bg-surface text-secondary hover:text-primary hover:bg-surface-alt border border-border'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Security Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {tab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vessels.map(v => (
            <div key={v.id} className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col justify-between">
              <div className="h-2 w-full bg-ocean" />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded bg-ocean-subtle text-ocean">
                      <Anchor className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-primary">{v.name}</span>
                  </div>
                  <span className="text-[10px] bg-teal-subtle text-teal font-extrabold px-2 py-0.5 rounded border border-teal/30">
                    ACTIVE
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-secondary font-bold">IMO Number:</span>
                    <span className="text-primary font-mono font-bold">{v.imoNumber}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-secondary font-bold">Flag State:</span>
                    <span className="text-primary font-semibold">{v.flag}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-secondary font-bold">Vessel Type:</span>
                    <span className="text-primary font-semibold">{v.type}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-secondary font-bold">Call Sign:</span>
                    <span className="text-primary font-mono font-bold">{v.callSign}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-secondary font-bold">Deadweight:</span>
                    <span className="text-primary font-bold">{v.dwt?.toLocaleString()} MT</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-solid-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] uppercase font-bold">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Vessel</th>
                <th className="p-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-alt/50">
                  <td className="p-3">
                    <div className="font-bold text-primary">{u.name}</div>
                    <div className="text-[10px] text-secondary font-mono">{u.email}</div>
                  </td>
                  <td className="p-3 font-bold text-ocean">{u.role}</td>
                  <td className="p-3 text-secondary font-mono font-bold">{u.vesselId}</td>
                  <td className="p-3 text-primary font-medium">{new Date(u.lastLoginAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'server_records' && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-solid-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] uppercase font-bold">
              <tr>
                <th className="p-3">Record Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Version</th>
                <th className="p-3">Vessel</th>
                <th className="p-3">Server Commited At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {serverRecords.map(r => (
                <tr key={r.id} className="hover:bg-surface-alt/50">
                  <td className="p-3 font-bold text-primary">{r.title}</td>
                  <td className="p-3 text-secondary capitalize font-semibold">{r.formType.replace(/_/g, ' ')}</td>
                  <td className="p-3 uppercase text-[10px] font-bold text-violet">{r.entryMode || 'form'}</td>
                  <td className="p-3 font-mono font-bold text-ocean">v{r.version}</td>
                  <td className="p-3 font-mono text-secondary font-bold">{r.vesselId}</td>
                  <td className="p-3 text-primary font-medium">{new Date(r.serverUpdatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-solid-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] uppercase font-bold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.slice(0, 20).map(log => (
                <tr key={log.id} className="hover:bg-surface-alt/50">
                  <td className="p-3 font-mono text-[10px] text-secondary font-semibold">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-bold text-primary">{log.userName}</td>
                  <td className="p-3 font-bold text-ocean">{log.action}</td>
                  <td className="p-3 text-primary font-medium">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
