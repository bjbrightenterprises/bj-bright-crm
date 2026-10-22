import ExcelJS from 'exceljs';
import { Candidate, Client, JobOpening, Interview, PipelineItem, User } from '../types/crm';

/**
 * Formula injection security:
 * Prefix any text cell starting with '=', '+', '-', or '@' with a single quote or space
 */
export function sanitizeCellValue(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.length > 0 && ['=', '+', '-', '@'].includes(trimmed[0])) {
      return `'${trimmed}`;
    }
    return trimmed;
  }
  return val;
}

export interface ExportColumnDef {
  key: string;
  header: string;
  description: string;
  allowedValues: string;
  dataType: 'Text' | 'Number' | 'Date' | 'Boolean';
  width: number;
  format?: string;
  validationList?: string[];
  getValue: (item: any) => any;
}

export interface ExportOptions {
  moduleName: string;
  tableName: string;
  sheetName: string;
  currentUser: User;
  scope: 'filtered' | 'all';
  filtersApplied: string;
  selectedColumnKeys: string[];
  columns: ExportColumnDef[];
  data: any[];
  summaryGenerator?: (wb: ExcelJS.Workbook, dataSheetName: string, tableName: string, rowCount: number) => void;
}

// Helper to compute date analysis helpers
export function getDateAnalysisHelpers(createdDateStr: string | undefined, updatedDateStr: string | undefined) {
  const now = new Date();
  const created = createdDateStr ? new Date(createdDateStr) : now;
  const updated = updatedDateStr ? new Date(updatedDateStr) : created;

  const validCreated = isNaN(created.getTime()) ? now : created;
  const validUpdated = isNaN(updated.getTime()) ? validCreated : updated;

  const daysSinceUpdate = Math.max(0, Math.floor((now.getTime() - validUpdated.getTime()) / (1000 * 60 * 60 * 24)));
  const daysInStatus = daysSinceUpdate; // proxy for days in current status

  const yyyy = validCreated.getFullYear();
  const mm = String(validCreated.getMonth() + 1).padStart(2, '0');
  const monthStr = `${yyyy}-${mm}`;

  // Week calculation
  const startOfYear = new Date(validCreated.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((validCreated.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
  const weekStr = `${yyyy}-W${String(weekNum).padStart(2, '0')}`;

  return {
    createdDate: validCreated,
    createdMonth: monthStr,
    createdWeek: weekStr,
    updatedDate: validUpdated,
    daysSinceUpdate,
    daysInStatus,
  };
}

/**
 * Core Export Engine that produces analyst-grade Excel files
 */
export async function generateExcelWorkbook(options: ExportOptions): Promise<Blob> {
  const {
    moduleName,
    tableName,
    sheetName,
    currentUser,
    scope,
    filtersApplied,
    selectedColumnKeys,
    columns,
    data,
    summaryGenerator,
  } = options;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BJ Bright Enterprises CRM';
  wb.lastModifiedBy = currentUser.name;
  wb.created = new Date();
  wb.modified = new Date();

  // Filter columns based on user selection
  const activeColumns = columns.filter((col) => selectedColumnKeys.includes(col.key));
  const nowIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // 1. "ABOUT" SHEET
  const aboutSheet = wb.addWorksheet('About', {
    views: [{ showGridLines: true }],
  });

  aboutSheet.columns = [
    { header: 'Property', key: 'prop', width: 28 },
    { header: 'Value', key: 'val', width: 45 },
    { header: 'Notes / Description', key: 'notes', width: 40 },
  ];

  // Header banner for About
  aboutSheet.mergeCells('A1:C1');
  const aboutTitle = aboutSheet.getCell('A1');
  aboutTitle.value = `BJ BRIGHT ENTERPRISES — ${moduleName.toUpperCase()} DATA EXPORT`;
  aboutTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  aboutTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  aboutTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  aboutSheet.getRow(1).height = 36;

  aboutSheet.addRow({});
  aboutSheet.addRow({ prop: 'Export Timestamp (IST)', val: `${nowIST} IST`, notes: 'Indian Standard Time' });
  aboutSheet.addRow({ prop: 'Exported By', val: currentUser.name, notes: `${currentUser.email}` });
  aboutSheet.addRow({ prop: 'User Role', val: currentUser.role.toUpperCase().replace('_', ' '), notes: 'Security & Access Matrix Tier' });
  aboutSheet.addRow({ prop: 'Scope Selected', val: scope === 'filtered' ? 'Current Filtered View' : 'All Accessible Records', notes: `${data.length} records exported` });
  aboutSheet.addRow({ prop: 'Active Filters Applied', val: filtersApplied || 'None (Full dataset)', notes: 'User query criteria' });
  aboutSheet.addRow({ prop: 'Total Records Exported', val: data.length, notes: 'Rows present in data sheet' });
  aboutSheet.addRow({ prop: 'Excel Table Name', val: tableName, notes: 'Structured table reference' });
  aboutSheet.addRow({});

  // Style metadata rows
  for (let r = 3; r <= 9; r++) {
    const row = aboutSheet.getRow(r);
    row.getCell(1).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    row.getCell(2).font = { color: { argb: 'FF1E293B' } };
    row.getCell(3).font = { italic: true, color: { argb: 'FF64748B' } };
  }

  // Data Dictionary Section
  const dictHeaderRowIndex = 11;
  aboutSheet.mergeCells(`A${dictHeaderRowIndex}:C${dictHeaderRowIndex}`);
  const dictTitle = aboutSheet.getCell(`A${dictHeaderRowIndex}`);
  dictTitle.value = 'DATA DICTIONARY & FIELD SPECIFICATIONS';
  dictTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  dictTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5A623' } };
  dictTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  aboutSheet.getRow(dictHeaderRowIndex).height = 26;

  const tableHeaderRowIndex = dictHeaderRowIndex + 1;
  const dictHeader = aboutSheet.getRow(tableHeaderRowIndex);
  dictHeader.values = ['Column Name', 'Field Meaning & Description', 'Allowed Values & Data Type'];
  dictHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dictHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  dictHeader.height = 22;

  activeColumns.forEach((col, idx) => {
    const rIdx = tableHeaderRowIndex + 1 + idx;
    const r = aboutSheet.getRow(rIdx);
    r.values = [col.header, col.description, `${col.allowedValues} [${col.dataType}]`];
    r.getCell(1).font = { bold: true };
    r.getCell(2).font = { color: { argb: 'FF334155' } };
    r.getCell(3).font = { color: { argb: 'FF0F766E' } };
    r.alignment = { vertical: 'top', wrapText: true };
    if (idx % 2 === 1) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  // 2. DATA SHEET (Formatted as real Excel Table with filters, frozen panes, banded rows)
  const dataSheet = wb.addWorksheet(sheetName, {
    views: [
      {
        state: 'frozen',
        xSplit: 2, // Freeze first 2 columns
        ySplit: 1, // Freeze header row
        activeCell: 'C2',
        showGridLines: true,
      },
    ],
  });

  // Prepare table columns and rows
  const tableColumns = activeColumns.map((col) => ({
    name: col.header,
    filterButton: true,
  }));

  const tableRows = data.map((item) => {
    return activeColumns.map((col) => {
      const val = col.getValue(item);
      return sanitizeCellValue(val);
    });
  });

  // Fallback if data is empty: create 1 dummy empty row so Excel Table remains valid
  const effectiveRows = tableRows.length > 0 ? tableRows : [activeColumns.map(() => '')];

  dataSheet.addTable({
    name: tableName,
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium9',
      showRowStripes: true,
    },
    columns: tableColumns,
    rows: effectiveRows,
  });

  // Format header row styling (Navy background #0B1F4B, Bold White Text, Gold bottom border)
  const headerRow = dataSheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFF5A623' } },
    };
  });

  // Format data cells and column widths
  activeColumns.forEach((col, cIdx) => {
    const colNum = cIdx + 1;
    const worksheetCol = dataSheet.getColumn(colNum);
    worksheetCol.width = col.width || 18;

    // Apply formatting to cells in this column
    for (let r = 2; r <= effectiveRows.length + 1; r++) {
      const cell = dataSheet.getCell(r, colNum);
      cell.alignment = { vertical: 'middle', wrapText: col.width > 25 };

      if (col.dataType === 'Date' && cell.value instanceof Date) {
        cell.numFmt = 'DD/MM/YYYY';
      } else if (col.dataType === 'Number') {
        cell.numFmt = col.format || '#,##0.00';
      } else if (col.key === 'phone' || col.header.toLowerCase().includes('mobile') || col.header.toLowerCase().includes('phone')) {
        cell.numFmt = '@'; // Force text format for phone
      }

      // Status conditional highlighting
      if (col.key === 'status') {
        const valStr = String(cell.value).toLowerCase();
        if (valStr.includes('joined') || valStr.includes('selected') || valStr.includes('active') || valStr.includes('completed')) {
          cell.font = { bold: true, color: { argb: 'FF065F46' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        } else if (valStr.includes('rejected') || valStr.includes('cancelled') || valStr.includes('overdue')) {
          cell.font = { bold: true, color: { argb: 'FF991B1B' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        } else if (valStr.includes('hold') || valStr.includes('offered') || valStr.includes('interview')) {
          cell.font = { bold: true, color: { argb: 'FF92400E' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        }
      }
    }

    // Add dropdown validation if column has validation list
    if (col.validationList && col.validationList.length > 0) {
      const formulaList = `"${col.validationList.join(',')}"`;
      for (let r = 2; r <= effectiveRows.length + 1; r++) {
        dataSheet.getCell(r, colNum).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formulaList],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: `Please select a valid option from the dropdown for ${col.header}.`,
        };
      }
    }
  });

  // 3. SUMMARY SHEET (with live Excel formulas referencing data sheet)
  if (summaryGenerator) {
    summaryGenerator(wb, sheetName, tableName, effectiveRows.length);
  } else {
    // Default summary
    const summarySheet = wb.addWorksheet('Summary', { views: [{ showGridLines: true }] });
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 32 },
      { header: 'Live Excel Formula Result', key: 'formula', width: 26 },
      { header: 'Formula Applied', key: 'desc', width: 35 },
    ];
    summarySheet.getRow(1).height = 28;
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };

    summarySheet.addRow({
      metric: 'Total Active Records',
      formula: { formula: `COUNTA(${sheetName}!A2:A${effectiveRows.length + 1})` },
      desc: `=COUNTA(${sheetName}!A2:A${effectiveRows.length + 1})`,
    });
  }

  // Export as Buffer
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Download helper with trigger
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Format standard file name: BJ_Bright_<Module>_<YYYY-MM-DD>.xlsx
export function getStandardExportFileName(module: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return `BJ_Bright_${module}_${dateStr}.xlsx`;
}
