import React, { useState } from 'react';
import { Modal } from './Modal';
import {
  FileSpreadsheet,
  Download,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ExportColumnDef, generateExcelWorkbook, triggerFileDownload, getStandardExportFileName } from '../../lib/excelExport';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  tableName: string;
  sheetName: string;
  columns: ExportColumnDef[];
  filteredData: any[];
  allAccessibleData: any[];
  filtersDescription?: string;
  summaryGenerator?: (wb: any, sheetName: string, tableName: string, rowCount: number) => void;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  tableName,
  sheetName,
  columns,
  filteredData,
  allAccessibleData,
  filtersDescription = 'Current search and category filters',
  summaryGenerator,
}) => {
  const { currentUser, logExport } = useCRM();

  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => columns.map((c) => c.key));
  const [isExporting, setIsExporting] = useState(false);
  const [progressText, setProgressText] = useState('');

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedKeys(columns.map((c) => c.key));
      setScope('filtered');
      setIsExporting(false);
      setProgressText('');
    }
  }, [isOpen, columns]);

  const targetData = scope === 'filtered' ? filteredData : allAccessibleData;
  const isLargeData = targetData.length > 10000;

  const handleToggleSelectAll = () => {
    if (selectedKeys.length === columns.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(columns.map((c) => c.key));
    }
  };

  const handleToggleColumn = (key: string) => {
    if (selectedKeys.includes(key)) {
      if (selectedKeys.length === 1) return; // Keep at least one
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleExecuteExport = async () => {
    try {
      setIsExporting(true);
      setProgressText('Preparing dataset and sanitizing fields...');

      // Small async tick for UI responsiveness
      await new Promise((r) => setTimeout(r, 60));

      setProgressText(`Generating ${moduleName} workbook with Excel Table & Summary formulas...`);
      const blob = await generateExcelWorkbook({
        moduleName,
        tableName,
        sheetName,
        currentUser,
        scope,
        filtersApplied: scope === 'filtered' ? filtersDescription : 'None (Full user scope)',
        selectedColumnKeys: selectedKeys,
        columns,
        data: targetData,
        summaryGenerator,
      });

      const fileName = getStandardExportFileName(moduleName);
      triggerFileDownload(blob, fileName);

      // Audit log entry
      logExport(moduleName, targetData.length, scope, scope === 'filtered' ? filtersDescription : undefined);

      setIsExporting(false);
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message || 'Unknown error'}`);
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isExporting && onClose()}
      title={`Export ${moduleName} to Excel (.xlsx)`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
        {/* Analyst Info Banner */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-[#0B1F4B] dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold text-[#0B1F4B] dark:text-amber-400">
              Analyst-Grade Excel (.xlsx) Export
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Generates genuine OOXML Excel with frozen headers, automatic filter dropdowns, live dynamic COUNTIFS/SUMIFS formulas on Summary sheet, and Data Dictionary on About sheet.
            </p>
          </div>
        </div>

        {/* 1. Scope Selection */}
        <div className="space-y-2">
          <label className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
            1. Select Export Scope
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope('filtered')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                scope === 'filtered'
                  ? 'border-[#0B1F4B] bg-blue-50/40 dark:bg-blue-950/30 text-[#0B1F4B] dark:text-amber-300 font-bold ring-1 ring-[#0B1F4B]'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <Filter className="w-4 h-4 mt-0.5 text-blue-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-bold">Current Filtered View</p>
                <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Exports {filteredData.length} active matching records based on your current filters and search.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScope('all')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                scope === 'all'
                  ? 'border-[#0B1F4B] bg-blue-50/40 dark:bg-blue-950/30 text-[#0B1F4B] dark:text-amber-300 font-bold ring-1 ring-[#0B1F4B]'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 mt-0.5 text-blue-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-bold">All Records I Can Access</p>
                <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Exports all {allAccessibleData.length} records permitted by your {currentUser.role.toUpperCase()} role permissions.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Large Data Warning */}
        {isLargeData && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-bold">Large Dataset Warning: </span>
              Exporting more than 10,000 records ({targetData.length} rows selected). This may take a few seconds and consume daily Firestore read quotas.
            </div>
          </div>
        )}

        {/* 2. Column Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              2. Select Columns ({selectedKeys.length} of {columns.length} selected)
            </label>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-blue-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
            >
              {selectedKeys.length === columns.length ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" /> Select All
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            {columns.map((col) => {
              const isChecked = selectedKeys.includes(col.key);
              return (
                <label
                  key={col.key}
                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-white dark:bg-slate-700 shadow-2xs font-semibold text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleColumn(col.key)}
                    className="w-3.5 h-3.5 rounded text-[#0B1F4B] accent-[#0B1F4B]"
                  />
                  <span className="truncate">{col.header}</span>
                  <span className="text-[10px] text-slate-400 ml-auto font-normal">[{col.dataType}]</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Progress Display */}
        {isExporting && (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center space-y-2 animate-pulse">
            <div className="flex items-center justify-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
              <span>{progressText}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#0B1F4B] dark:bg-[#F5A623] h-1.5 rounded-full w-2/3 animate-ping" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting || selectedKeys.length === 0}
            onClick={handleExecuteExport}
            className="px-5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-extrabold flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer transition-all"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#F5A623]" />
                <span>Download .xlsx ({targetData.length} Rows)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
