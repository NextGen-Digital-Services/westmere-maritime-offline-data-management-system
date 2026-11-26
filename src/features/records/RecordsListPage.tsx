import React, { useState, useEffect } from 'react';
import { clientDb, type RecordItem } from '../../db/clientDb';
import { StatusBadge } from '../../components/ui/Badge';
import { exportRecordsToExcel } from '../../lib/excelExport';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Plus, Download, FileSpreadsheet,
  ChevronLeft, ChevronRight, Eye, FileText
} from 'lucide-react';

export const RecordsListPage: React.FC = () => {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    clientDb.records.toCollection().reverse().sortBy('clientUpdatedAt').then(setRecords);
  }, []);

  const filtered = records.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && r.formType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchAuthor = r.authorName.toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      const matchData = JSON.stringify(r.data || {}).toLowerCase().includes(q);
      const matchText = (r.rawText || '').toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchId || matchData || matchText;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(r => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? records.filter(r => selectedIds.has(r.id))
      : filtered;
    exportRecordsToExcel(toExport);
  };

  const statuses = [
    { label: 'ALL', color: 'bg-navy text-white' },
    { label: 'Draft', color: 'badge-draft' },
    { label: 'Pending Sync', color: 'badge-pending' },
    { label: 'Syncing', color: 'badge-syncing' },
    { label: 'Synced', color: 'badge-synced' },
    { label: 'Failed', color: 'badge-failed' },
    { label: 'Conflict', color: 'badge-conflict' }
  ];

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'border-l-sunshineYellow';
      case 'Pending Sync': return 'border-l-signalOrange';
      case 'Syncing': return 'border-l-ocean';
      case 'Synced': return 'border-l-seaGreen';
      case 'Failed': return 'border-l-coralRed';
      case 'Conflict': return 'border-l-violet';
      default: return 'border-l-border';
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-primary">Operational Records</h1>
          <p className="text-xs text-secondary mt-0.5">Maritime operational forms, navigation logs, and machinery records</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-surface border-2 border-seaGreen rounded text-xs font-bold text-primary hover:bg-seaGreen-subtle transition-colors shadow-solid-sm"
          >
            <Download className="w-4 h-4 text-seaGreen" />
            <span>Export to Excel ({selectedIds.size > 0 ? selectedIds.size : 'All'})</span>
          </button>
          <Link
            to="/records/new"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold transition-colors shadow-solid"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Record</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-solid-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-secondary" />
            <input
              type="text"
              placeholder="Search by title, author, coordinates, readings, or raw text body..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium text-primary bg-surface-alt border-2 border-border rounded focus:outline-none focus:border-ocean placeholder:text-input-placeholder"
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs font-bold text-primary bg-surface-alt border-2 border-border rounded focus:outline-none focus:border-ocean cursor-pointer"
            >
              <option value="ALL">All Form Types (11 Schemas)</option>
              <option value="noon_report">Noon Report</option>
              <option value="free_text">Free Text Report</option>
              <option value="daily_ops">Daily Operations Log</option>
              <option value="bunker_report">Bunker / Fuel Report</option>
              <option value="engine_log">Engine Room Log</option>
              <option value="port_report">Port Arrival / Departure</option>
              <option value="cargo_ops">Cargo Operations Report</option>
              <option value="safety_drill">Safety Drill Report</option>
              <option value="incident_report">Incident / Near-Miss</option>
              <option value="work_order">Maintenance Work Order</option>
              <option value="crew_change">Crew Change Report</option>
            </select>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-secondary mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Filter Status:
          </span>
          {statuses.map(s => {
            const isActive = statusFilter === s.label;
            return (
              <button
                key={s.label}
                onClick={() => { setStatusFilter(s.label); setCurrentPage(1); }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                  isActive
                    ? 'ring-2 ring-ocean bg-navy text-white shadow-solid'
                    : 'bg-surface-alt text-secondary border-border hover:bg-surface'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] uppercase tracking-wider select-none font-bold">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded text-ocean"
                  />
                </th>
                <th className="p-3">Record Title & Narrative</th>
                <th className="p-3">Type</th>
                <th className="p-3">Author</th>
                <th className="p-3">Status</th>
                <th className="p-3">Version</th>
                <th className="p-3">Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted font-medium">
                    No operational records matched the filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map(record => (
                  <tr
                    key={record.id}
                    className={`border-l-4 ${getStatusBorderColor(record.status)} hover:bg-ocean-subtle hover:border-l-ocean transition-all`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => toggleSelectOne(record.id)}
                        className="rounded text-ocean"
                      />
                    </td>
                    <td className="p-3 font-semibold max-w-xs truncate">
                      <Link to={`/records/${record.id}`} className="text-primary hover:text-ocean block font-bold text-xs truncate">
                        {record.title}
                      </Link>
                      <div className="flex items-center space-x-2 text-[10px] text-secondary font-mono mt-0.5">
                        <span>{record.id}</span>
                        {record.entryMode && (
                          <span className="uppercase font-bold px-1 rounded bg-violet-subtle text-violet border border-violet/30">
                            {record.entryMode}
                          </span>
                        )}
                        {record.rawText && (
                          <span className="truncate max-w-[160px] text-muted italic font-sans">
                            &quot;{record.rawText.substring(0, 30)}...&quot;
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-secondary capitalize">
                      {record.formType.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-secondary font-medium">{record.authorName}</td>
                    <td className="p-3">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="p-3 font-mono font-bold text-ocean">
                      <span className="px-1.5 py-0.5 bg-ocean-subtle rounded border border-ocean/30">
                        v{record.version}
                      </span>
                    </td>
                    <td className="p-3 text-primary font-medium">
                      {new Date(record.clientUpdatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/records/${record.id}`}
                        className="inline-flex items-center px-2.5 py-1 bg-surface border-2 border-ocean rounded text-xs hover:bg-ocean hover:text-white text-ocean font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-border bg-surface-alt flex items-center justify-between text-xs text-secondary font-medium">
          <div>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} records
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-border bg-surface disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-primary">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-border bg-surface disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
