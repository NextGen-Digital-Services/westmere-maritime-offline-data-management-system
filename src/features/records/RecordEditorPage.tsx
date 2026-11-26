import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { clientDb, type RecordItem, type EntryMode } from '../../db/clientDb';
import { recordRepository } from '../../db/repositories/recordRepository';
import { attachmentRepository } from '../../db/repositories/attachmentRepository';
import { MARINE_TEMPLATES } from '../../forms/schemas/marineSchemas';
import { FormRenderer } from '../../forms/FormRenderer';
import { TextEntryMode } from './TextEntryMode';
import { FormToTextViewModal, generatePlainTextFromForm } from './FormToTextViewModal';
import { StatusBadge } from '../../components/ui/Badge';
import { exportRecordToPdf } from '../../lib/pdfExport';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ArrowLeft, FileDown, History, Paperclip, Upload, FileText, LayoutTemplate, Send } from 'lucide-react';

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
  const [entryMode, setEntryMode] = useState<EntryMode>('form');
  const [rawText, setRawText] = useState<string>('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [textViewOpen, setTextViewOpen] = useState(false);

  const isNew = !id;

  useEffect(() => {
    if (id) {
      recordRepository.getById(id).then(r => {
        if (r) {
          setRecord(r);
          setSelectedTemplateKey(r.formType);
          setEntryMode(r.entryMode || 'form');
          setRawText(r.rawText || '');
          attachmentRepository.getAll(r.id).then(setAttachments);
        }
      });
    }
  }, [id]);

  const template = MARINE_TEMPLATES[selectedTemplateKey] || MARINE_TEMPLATES['noon_report'];

  const handleModeSwitch = (newMode: EntryMode) => {
    if (newMode === 'text' && !rawText && record?.data) {
      // Pre-fill text with formatted form data
      const textFromForm = generatePlainTextFromForm(template, record.data);
      setRawText(textFromForm);
    }
    setEntryMode(newMode);
  };

  const handleAutosaveForm = async (formData: Record<string, any>) => {
    const saved = await recordRepository.saveDraft({
      id: record?.id,
      formType: selectedTemplateKey,
      title: formData.voyageNumber || formData.reportDate ? `${template.title} (${formData.reportDate || 'Draft'})` : template.title,
      vesselId: currentVessel?.id || 'vessel-1',
      createdBy: currentUser?.id || 'user-officer',
      authorName: currentUser?.name || 'Bridge Officer',
      data: formData,
      rawText,
      entryMode
    });
    setRecord(saved);
  };

  const handleTextChange = async (newText: string) => {
    setRawText(newText);
    const saved = await recordRepository.saveDraft({
      id: record?.id,
      formType: selectedTemplateKey,
      title: record?.title || template.title,
      vesselId: currentVessel?.id || 'vessel-1',
      createdBy: currentUser?.id || 'user-officer',
      authorName: currentUser?.name || 'Bridge Officer',
      data: record?.data || {},
      rawText: newText,
      entryMode: 'text'
    });
    setRecord(saved);
  };

  const handleApplySmartFill = async (appliedFields: Record<string, any>, preserveUnmapped: boolean) => {
    const currentData = record?.data || {};
    const updatedData = { ...currentData, ...appliedFields };

    if (preserveUnmapped && rawText) {
      const existingRemarks = updatedData.remarks || '';
      updatedData.remarks = existingRemarks ? `${existingRemarks}\n\n[Imported Text]:\n${rawText}` : `[Imported Text]:\n${rawText}`;
    }

    const saved = await recordRepository.saveDraft({
      id: record?.id,
      formType: selectedTemplateKey,
      title: record?.title || template.title,
      vesselId: currentVessel?.id || 'vessel-1',
      createdBy: currentUser?.id || 'user-officer',
      authorName: currentUser?.name || 'Bridge Officer',
      data: updatedData,
      rawText,
      entryMode: 'hybrid'
    });

    setRecord(saved);
    setEntryMode('form'); // Switch to form to review applied values
    showToast('Smart Fill Applied', 'Extracted values mapped to form fields.', 'success');
  };

  const handleSubmit = async (formData?: Record<string, any>) => {
    let currentId = record?.id;
    if (!currentId) {
      const saved = await recordRepository.saveDraft({
        formType: selectedTemplateKey,
        title: `${template.title} - ${formData?.reportDate || new Date().toISOString().split('T')[0]}`,
        vesselId: currentVessel?.id || 'vessel-1',
        createdBy: currentUser?.id || 'user-officer',
        authorName: currentUser?.name || 'Bridge Officer',
        data: formData || record?.data || {},
        rawText,
        entryMode
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <Link to="/records" className="p-1.5 border border-border rounded bg-surface hover:bg-surface-alt text-primary font-bold">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold font-heading text-primary">
                {isNew ? `New ${template.title}` : record?.title}
              </h1>
              {record && <StatusBadge status={record.status} />}
              {record?.entryMode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-subtle text-violet border border-violet/30 uppercase">
                  {record.entryMode}
                </span>
              )}
            </div>
            <div className="text-xs text-secondary mt-0.5">
              {isNew ? 'Drafting local operational report' : `Record #${record?.id} • Version ${record?.version}`}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {entryMode === 'form' && (
            <button
              type="button"
              onClick={() => setTextViewOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface border-2 border-ocean rounded text-xs font-bold text-primary hover:bg-ocean-subtle"
            >
              <FileText className="w-3.5 h-3.5 text-ocean" />
              <span>View as Text</span>
            </button>
          )}

          {record && (
            <>
              <button
                type="button"
                onClick={() => exportRecordToPdf(record, currentVessel?.name)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface border-2 border-border rounded text-xs font-bold text-primary hover:bg-surface-alt"
              >
                <FileDown className="w-3.5 h-3.5 text-ocean" />
                <span>Export PDF</span>
              </button>
              <Link
                to={`/records/${record.id}/history`}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface border-2 border-border rounded text-xs font-bold text-primary hover:bg-surface-alt"
              >
                <History className="w-3.5 h-3.5 text-teal" />
                <span>History</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Segmented Mode Switcher: Form Mode | Text Mode */}
      <div className="flex items-center justify-between bg-surface border border-border p-1.5 rounded-lg shadow-solid-sm">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleModeSwitch('form')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-bold transition-all ${
              entryMode === 'form'
                ? 'bg-ocean text-white shadow-solid'
                : 'text-secondary hover:text-primary hover:bg-surface-alt'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Form Mode</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('text')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-bold transition-all ${
              entryMode === 'text'
                ? 'bg-ocean text-white shadow-solid'
                : 'text-secondary hover:text-primary hover:bg-surface-alt'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Text Mode (Offline Narrative)</span>
          </button>
        </div>

        <span className="text-[11px] text-muted hidden sm:inline font-medium pr-2">
          Switch modes freely without losing data
        </span>
      </div>

      {/* Template Switcher for New Records */}
      {isNew && (
        <div className="bg-surface border border-border rounded-lg p-3.5 shadow-solid-sm">
          <label className="block text-xs font-bold text-primary mb-1.5">
            Select Marine Report Type:
          </label>
          <select
            value={selectedTemplateKey}
            onChange={e => setSelectedTemplateKey(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface border-2 border-ocean/40 rounded font-bold text-primary focus:outline-none focus:border-ocean cursor-pointer"
          >
            {Object.values(MARINE_TEMPLATES).map(t => (
              <option key={t.id} value={t.id} className="text-primary bg-surface font-semibold py-1">
                {t.title} — {t.description.substring(0, 65)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mode Render: Form vs Text */}
      {entryMode === 'form' ? (
        <FormRenderer
          template={template}
          initialData={record?.data || {}}
          isLocked={record?.isLocked || false}
          onAutosave={handleAutosaveForm}
          onSubmit={handleSubmit}
          onReopen={handleReopen}
        />
      ) : (
        <div className="space-y-4">
          <TextEntryMode
            initialText={rawText}
            template={template}
            formData={record?.data || {}}
            onTextChange={handleTextChange}
            onApplySmartFill={handleApplySmartFill}
            isLocked={record?.isLocked || false}
          />

          {!record?.isLocked && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="flex items-center space-x-2 px-6 py-2.5 bg-signalOrange hover:bg-signalOrange-dark text-white rounded font-bold shadow-solid transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Text Report to Sync</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Linked Attachments Section */}
      {record && (
        <div className="bg-surface border border-border rounded-lg p-5 shadow-solid-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center space-x-2 font-bold text-sm text-primary">
              <Paperclip className="w-4 h-4 text-violet" />
              <span>Linked Attachments ({attachments.length})</span>
            </div>
            <label className="flex items-center space-x-1 px-3 py-1 text-xs bg-surface-alt border border-border rounded cursor-pointer hover:bg-surface font-bold text-primary">
              <Upload className="w-3.5 h-3.5" />
              <span>Attach File</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {attachments.length === 0 ? (
            <p className="text-xs text-muted py-2">No files attached to this record yet.</p>
          ) : (
            <div className="divide-y divide-border text-xs">
              {attachments.map(att => (
                <div key={att.id} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-primary">{att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)</span>
                  <span className="text-teal font-mono text-[10px] font-bold">{att.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form-to-Text Modal */}
      <FormToTextViewModal
        isOpen={textViewOpen}
        onClose={() => setTextViewOpen(false)}
        template={template}
        formData={record?.data || {}}
        recordTitle={record?.title}
      />
    </div>
  );
};
