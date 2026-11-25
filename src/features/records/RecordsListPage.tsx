import React, { useState, useEffect } from 'react';
import { clientDb, type RecordItem, type RecordStatus } from '../../db/clientDb';
import { StatusBadge } from '../../components/ui/Badge';
import { exportRecordsToExcel } from '../../lib/excelExport';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Plus, Download, FileSpreadsheet,
  ChevronLeft, ChevronRight, Eye, Trash2
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
      const matchData = JSON.stringify(r.data).toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchId || matchData;
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

  const statuses = ['ALL', 'Draft', 'Pending Sync', 'Syncing', 'Synced', 'Failed', 'Conflict'];

  return (
    <div className="space-y-5">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-navy dark:text-canvas">Operational Records</h1>
          <p className="text-xs text-canvas-muted mt-0.5">Maritime operational forms, navigation logs, and machinery records</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-canvas-card border rounded text-xs font-bold hover:bg-canvas-subtle transition-colors"
          >
            <Download className="w-4 h-4 text-seaGreen" />
            <span>Export to Excel ({selectedIds.size > 0 ? selectedIds.size : 'All'})</span>
          </button>
          <Link
            to="/records/new"
            className="flex items-center space-x-1.5 px-3 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Record</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-canvas-muted" />
            <input
              type="text"
              placeholder="Full-text search records, author, coordinates, readings..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border rounded focus:outline-none focus:border-ocean"
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1.5 text-xs bg-canvas border rounded focus:outline-none focus:border-ocean font-medium"
            >
              <option value="ALL">All Form Types (10 Schemas)</option>
              <option value="noon_report">Noon Report</option>
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
          <span className="text-[11px] font-bold text-canvas-muted mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Status:
          </span>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-navy text-white dark:bg-canvas dark:text-navy'
                  : 'bg-canvas-subtle text-canvas-muted hover:text-canvas'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-canvas-card border rounded-lg shadow-solid-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded text-ocean"
                  />
                </th>
                <th className="p-3">Record Title & Details</th>
                <th className="p-3">Form Type</th>
                <th className="p-3">Author</th>
                <th className="p-3">Status</th>
                <th className="p-3">Version</th>
                <th className="p-3">Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-canvas-muted">
                    No operational records matched the filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map(record => (
                  <tr key={record.id} className="hover:bg-canvas-subtle transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => toggleSelectOne(record.id)}
                        className="rounded text-ocean"
                      />
                    </td>
                    <td className="p-3 font-semibold text-canvas max-w-xs truncate">
                      <Link to={`/records/${record.id}`} className="hover:text-ocean">
                        {record.title}
                      </Link>
                      <div className="text-[10px] text-canvas-muted font-mono">{record.id}</div>
                    </td>
                    <td className="p-3 font-medium text-canvas-muted capitalize">
                      {record.formType.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-canvas-muted">{record.authorName}</td>
                    <td className="p-3">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="p-3 font-mono font-bold">v{record.version}</td>
                    <td className="p-3 text-canvas-muted">
                      {new Date(record.clientUpdatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/records/${record.id}`}
                        className="inline-flex items-center px-2 py-1 bg-canvas border rounded text-xs hover:border-ocean text-ocean font-semibold"
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
        <div className="p-3 border-t bg-canvas-subtle flex items-center justify-between text-xs text-canvas-muted">
          <div>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} records
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border bg-canvas disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-canvas">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border bg-canvas disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
