import React, { useState, useEffect } from 'react';
import { clientDb, type AttachmentMeta } from '../../db/clientDb';
import { attachmentRepository } from '../../db/repositories/attachmentRepository';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import {
  FolderOpen, Upload, File, FileText, Image as ImageIcon,
  Table, Eye, Trash2, Search, LayoutGrid, List
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [previewItem, setPreviewItem] = useState<AttachmentMeta | null>(null);

  const { currentUser, currentVessel } = useAuthStore();
  const { showToast } = useNotificationStore();

  const loadData = () => {
    clientDb.attachments.toCollection().reverse().sortBy('createdAt').then(setAttachments);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await attachmentRepository.saveFile(
        file,
        currentUser?.name || 'Officer',
        currentVessel?.id || 'vessel-1'
      );
    }
    loadData();
    showToast('Uploaded', `${files.length} document(s) saved in local IndexedDB.`, 'success');
  };

  const handleDelete = async (id: string, isSynced: boolean) => {
    if (!isSynced) {
      const confirmDelete = window.confirm(
        'Warning: This attachment is NOT yet synchronized with shore or backed up. Are you sure you want to delete?'
      );
      if (!confirmDelete) return;
    }
    await attachmentRepository.delete(id);
    loadData();
    showToast('Deleted', 'Document removed from local database.', 'info');
  };

  const filtered = attachments.filter(a => a.fileName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-navy dark:text-canvas">Document Manager</h1>
          <p className="text-xs text-canvas-muted mt-0.5">Resumable 256KB chunked attachments & maritime certificates</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1.5 px-3 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload Documents</span>
            <input type="file" multiple onChange={e => handleFileUpload(e.target.files)} className="hidden" />
          </label>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-canvas-card border rounded-lg p-3 shadow-solid-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2 text-canvas-muted" />
          <input
            type="text"
            placeholder="Search documents by filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1 text-xs bg-canvas border rounded focus:outline-none focus:border-ocean"
          />
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded border ${viewMode === 'grid' ? 'bg-ocean text-white' : 'bg-canvas text-canvas-muted'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded border ${viewMode === 'list' ? 'bg-ocean text-white' : 'bg-canvas text-canvas-muted'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid or List Views */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(att => (
            <div key={att.id} className="bg-canvas-card border rounded-lg p-4 shadow-solid-sm flex flex-col justify-between space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-violet-subtle text-violet rounded">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-navy dark:text-canvas truncate" title={att.fileName}>
                    {att.fileName}
                  </h4>
                  <div className="text-[10px] text-canvas-muted mt-0.5">
                    {(att.fileSize / 1024).toFixed(1)} KB • {att.status}
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar if Uploading */}
              {att.status === 'Uploading' && (
                <div className="w-full bg-canvas-subtle h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ocean h-full transition-all" style={{ width: `${att.uploadProgress}%` }} />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <button
                  onClick={() => setPreviewItem(att)}
                  className="flex items-center space-x-1 text-ocean font-semibold hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleDelete(att.id, att.status === 'Synced')}
                  className="text-coralRed hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-canvas-card border rounded-lg overflow-hidden shadow-solid-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] uppercase">
              <tr>
                <th className="p-3">File Name</th>
                <th className="p-3">Size</th>
                <th className="p-3">Status</th>
                <th className="p-3">Checksum</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-border">
              {filtered.map(att => (
                <tr key={att.id} className="hover:bg-canvas-subtle">
                  <td className="p-3 font-semibold">{att.fileName}</td>
                  <td className="p-3 text-canvas-muted">{(att.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="p-3 font-mono font-bold text-teal">{att.status}</td>
                  <td className="p-3 font-mono text-[10px] text-canvas-muted">{att.checksum.slice(0, 12)}...</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => setPreviewItem(att)} className="text-ocean font-semibold">Preview</button>
                    <button onClick={() => handleDelete(att.id, att.status === 'Synced')} className="text-coralRed">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      <DocumentPreviewModal meta={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
};
