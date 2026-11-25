import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { clientDb, type RecordItem } from '../../db/clientDb';
import { recordRepository } from '../../db/repositories/recordRepository';
import { attachmentRepository } from '../../db/repositories/attachmentRepository';
import { MARINE_TEMPLATES } from '../../forms/schemas/marineSchemas';
import { FormRenderer } from '../../forms/FormRenderer';
import { StatusBadge } from '../../components/ui/Badge';
import { exportRecordToPdf } from '../../lib/pdfExport';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ArrowLeft, FileDown, History, Paperclip, Upload } from 'lucide-react';

export const RecordEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, currentVessel } = useAuthStore();
  const { showToast } = useNotificationStore();

  const [record, setRecord] = useState<RecordItem | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    searchParams.get('type') || 'noon_report'
  );
  const [attachments, setAttachments] = useState<any[]>([]);

  const isNew = !id;

  useEffect(() => {
    if (id) {
      recordRepository.getById(id).then(r => {
        if (r) {
          setRecord(r);
          setSelectedTemplateKey(r.formType);
          attachmentRepository.getAll(r.id).then(setAttachments);
        }
      });
    }
  }, [id]);

  const template = MARINE_TEMPLATES[selectedTemplateKey] || MARINE_TEMPLATES['noon_report'];

  const handleAutosave = async (formData: Record<string, any>) => {
    const saved = await recordRepository.saveDraft({
      id: record?.id,
      formType: selectedTemplateKey,
      title: formData.voyageNumber || formData.reportDate ? `${template.title} (${formData.reportDate || 'Draft'})` : template.title,
      vesselId: currentVessel?.id || 'vessel-1',
      createdBy: currentUser?.id || 'user-officer',
      authorName: currentUser?.name || 'Bridge Officer',
      data: formData
    });
    setRecord(saved);
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    let currentId = record?.id;
    if (!currentId) {
      const saved = await recordRepository.saveDraft({
        formType: selectedTemplateKey,
        title: `${template.title} - ${formData.reportDate || new Date().toISOString().split('T')[0]}`,
        vesselId: currentVessel?.id || 'vessel-1',
        createdBy: currentUser?.id || 'user-officer',
        authorName: currentUser?.name || 'Bridge Officer',
        data: formData
      });
      currentId = saved.id;
    }

    const submitted = await recordRepository.submitRecord(currentId);
    setRecord(submitted);
    showToast('Record Submitted', `"${submitted.title}" queued for satellite synchronization.`, 'success');
    navigate('/records');
  };

  const handleReopen = async () => {
    if (!record) return;
    const reopened = await recordRepository.reopenRecord(record.id);
    setRecord(reopened);
    showToast('Record Reopened', `New Version ${reopened.version} draft created.`, 'info');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !record) return;
    const meta = await attachmentRepository.saveFile(
      file,
      currentUser?.name || 'Officer',
      currentVessel?.id || 'vessel-1',
      record.id
    );
    setAttachments(prev => [meta, ...prev]);
    showToast('Attachment Added', `File "${file.name}" attached locally.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center space-x-3">
          <Link to="/records" className="p-1.5 border rounded hover:bg-canvas-subtle">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold font-heading text-navy dark:text-canvas">
                {isNew ? `New ${template.title}` : record?.title}
              </h1>
              {record && <StatusBadge status={record.status} />}
            </div>
            <div className="text-xs text-canvas-muted mt-0.5">
              {isNew ? 'Drafting local operational report' : `Record #${record?.id} • Version ${record?.version}`}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {record && (
            <>
              <button
                type="button"
                onClick={() => exportRecordToPdf(record, currentVessel?.name)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-canvas-card border rounded text-xs font-bold hover:bg-canvas-subtle"
              >
                <FileDown className="w-3.5 h-3.5 text-ocean" />
                <span>Export PDF</span>
              </button>
              <Link
                to={`/records/${record.id}/history`}
                className="flex items-center space-x-1 px-3 py-1.5 bg-canvas-card border rounded text-xs font-bold hover:bg-canvas-subtle"
              >
                <History className="w-3.5 h-3.5 text-teal" />
                <span>History</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Template Switcher for New Records */}
      {isNew && (
        <div className="bg-canvas-card border rounded-lg p-3.5 shadow-solid-sm">
          <label className="block text-xs font-bold text-navy dark:text-canvas mb-1.5">
            Select Marine Report Type:
          </label>
          <select
            value={selectedTemplateKey}
            onChange={e => setSelectedTemplateKey(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-canvas border rounded font-semibold focus:outline-none focus:border-ocean"
          >
            {Object.values(MARINE_TEMPLATES).map(t => (
              <option key={t.id} value={t.id}>
                {t.title} — {t.description.substring(0, 60)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Dynamic Form Engine */}
      <FormRenderer
        template={template}
        initialData={record?.data || {}}
        isLocked={record?.isLocked || false}
        onAutosave={handleAutosave}
        onSubmit={handleSubmit}
        onReopen={handleReopen}
      />

      {/* Linked Attachments Section */}
      {record && (
        <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-2 font-bold text-sm text-navy dark:text-canvas">
              <Paperclip className="w-4 h-4 text-violet" />
              <span>Linked Attachments ({attachments.length})</span>
            </div>
            <label className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-canvas-subtle border rounded cursor-pointer hover:bg-canvas font-semibold">
              <Upload className="w-3.5 h-3.5" />
              <span>Attach File</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {attachments.length === 0 ? (
            <p className="text-xs text-canvas-muted py-2">No files attached to this record yet.</p>
          ) : (
            <div className="divide-y divide-canvas-border text-xs">
              {attachments.map(att => (
                <div key={att.id} className="py-2 flex items-center justify-between">
                  <span className="font-semibold">{att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)</span>
                  <span className="text-teal font-mono text-[10px]">{att.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
