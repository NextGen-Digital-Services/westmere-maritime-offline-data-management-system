import React, { useState, useEffect } from 'react';
import { type AttachmentMeta } from '../../db/clientDb';
import { attachmentRepository } from '../../db/repositories/attachmentRepository';
import { parseExcelPreview } from '../../lib/excelExport';
import { X, Download, FileText, Table } from 'lucide-react';

interface PreviewProps {
  meta: AttachmentMeta | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<PreviewProps> = ({ meta, onClose }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<{ sheetNames: string[]; rows: any[] } | null>(null);

  useEffect(() => {
    if (!meta) return;

    attachmentRepository.getFileBlob(meta.id).then(async blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      if (meta.fileName.endsWith('.xlsx') || meta.fileName.endsWith('.xls') || meta.fileName.endsWith('.csv')) {
        const file = new File([blob], meta.fileName, { type: meta.fileType });
        const parsed = await parseExcelPreview(file);
        setExcelData(parsed);
      }
    });

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [meta]);

  if (!meta) return null;

  const isImage = meta.fileType.startsWith('image/');
  const isPdf = meta.fileType === 'application/pdf';
  const isExcel = meta.fileName.endsWith('.xlsx') || meta.fileName.endsWith('.xls') || meta.fileName.endsWith('.csv');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-canvas-card border rounded-lg max-w-4xl w-full shadow-solid-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-navy text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-teal" />
            <span className="font-bold text-sm truncate max-w-md">{meta.fileName}</span>
          </div>
          <div className="flex items-center space-x-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={meta.fileName}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-ocean rounded font-bold hover:bg-ocean-hover text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
            <button onClick={onClose} className="p-1 hover:text-coralRed text-canvas-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-auto bg-canvas">
          {isImage && blobUrl && (
            <div className="flex justify-center">
              <img src={blobUrl} alt={meta.fileName} className="max-h-[60vh] object-contain rounded" />
            </div>
          )}

          {isPdf && blobUrl && (
            <iframe src={blobUrl} title={meta.fileName} className="w-full h-[60vh] border rounded" />
          )}

          {isExcel && excelData && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-navy dark:text-canvas">
                <Table className="w-4 h-4 text-seaGreen" />
                <span>SheetJS Table Preview ({excelData.rows.length} rows)</span>
              </div>
              <div className="overflow-x-auto border rounded max-h-[55vh]">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-canvas-border">
                    {excelData.rows.slice(0, 50).map((row: any[], rIdx) => (
                      <tr key={rIdx} className={rIdx === 0 ? 'bg-canvas-subtle font-bold' : ''}>
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="p-2 border-r truncate max-w-xs">{String(cell ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isImage && !isPdf && !isExcel && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-violet mx-auto mb-2" />
              <h4 className="font-bold text-sm">Preview not available for this binary format</h4>
              <p className="text-xs text-canvas-muted mt-1">Download to inspect locally on your workstation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
