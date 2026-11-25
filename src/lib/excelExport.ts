import * as XLSX from 'xlsx';
import { type RecordItem } from '../db/clientDb';

export function exportRecordsToExcel(records: RecordItem[], filename = 'SeaSync_Operational_Records.xlsx') {
  const rows = records.map(r => ({
    'Record ID': r.id,
    'Title': r.title,
    'Form Type': r.formType,
    'Status': r.status,
    'Version': r.version,
    'Author': r.authorName,
    'Vessel ID': r.vesselId,
    'Created (Local)': r.clientCreatedAt,
    'Updated (Local)': r.clientUpdatedAt,
    'Synced (Server)': r.serverUpdatedAt || 'Unsynced'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Operational Records');
  XLSX.writeFile(workbook, filename);
}

export async function parseExcelPreview(file: File): Promise<{ sheetNames: string[]; rows: any[] }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  return {
    sheetNames: workbook.SheetNames,
    rows
  };
}
