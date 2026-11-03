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
  const { currentUser, logExport, showToast } = useCRM();

  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => columns.map((c) => c.key));
  const [isExporting, setIsExporting] = useState(false);
  const [progressText, setProgressText] = useState('');

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
      if (selectedKeys.length === 1) return;
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleExecuteExport = async () => {
    try {
      setIsExporting(true);
      setProgressText('Preparing dataset and sanitizing fields...');

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

      logExport(moduleName, targetData.length, scope, scope === 'filtered' ? filtersDescription : undefined);

      setIsExporting(false);
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      showToast(`Export failed: ${err.message || 'Unknown error'}`, 'error');
      setIsExporting(false);
    }
  };

  const footerContent = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        type="button"
        disabled={isExporting}
        onClick={onClose}
        className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isExporting || selectedKeys.length === 0}
        onClick={handleExecuteExport}
        className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-extrabold flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer transition-all"
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isExporting && onClose()}
      title={`Export ${moduleName} to Excel (.xlsx)`}
      maxWidth="lg"
      footer={footerContent}
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Analyst Info Banner */}
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-[#0B1F4B] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold text-[#0B1F4B]">
              Analyst-Grade Excel (.xlsx) Export
            </p>
            <p className="text-[11px] text-slate-700 mt-0.5">
              Generates genuine OOXML Excel with frozen headers, automatic filter dropdowns, live dynamic COUNTIFS/SUMIFS formulas on Summary sheet, and Data Dictionary on About sheet.
            </p>
          </div>
        </div>

        {/* 1. Scope Selection */}
        <div className="space-y-2">
          <label className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">
            1. Select Export Scope
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope('filtered')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                scope === 'filtered'
                  ? 'border-[#0B1F4B] bg-blue-50/70 text-[#0B1F4B] font-bold ring-1 ring-[#0B1F4B]'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4 mt-0.5 text-[#0B1F4B] shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Current Filtered View</p>
                <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                  Exports {filteredData.length} active matching records based on your current filters and search.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScope('all')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                scope === 'all'
                  ? 'border-[#0B1F4B] bg-blue-50/70 text-[#0B1F4B] font-bold ring-1 ring-[#0B1F4B]'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 mt-0.5 text-[#0B1F4B] shrink-0" />
              <div>
                <p className="font-bold text-slate-900">All Records I Can Access</p>
                <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                  Exports all {allAccessibleData.length} records permitted by your {currentUser.role.toUpperCase()} role permissions.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Large Data Warning */}
        {isLargeData && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-bold">Large Dataset Warning: </span>
              Exporting more than 10,000 records ({targetData.length} rows selected). This may take a few seconds and consume daily Firestore read quotas.
            </div>
          </div>
        )}

        {/* 2. Column Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              2. Select Columns ({selectedKeys.length} of {columns.length} selected)
            </label>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="min-h-[36px] px-2 text-[#0B1F4B] font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
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

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            {columns.map((col) => {
              const isChecked = selectedKeys.includes(col.key);
              return (
                <label
                  key={col.key}
                  className={`flex items-center gap-2.5 p-2 min-h-[40px] rounded-lg text-xs cursor-pointer select-none transition-colors border ${
                    isChecked
                      ? 'bg-white border-slate-200 shadow-2xs font-semibold text-slate-900'
                      : 'border-transparent text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleColumn(col.key)}
                    className="w-4 h-4 rounded text-[#0B1F4B] accent-[#0B1F4B]"
                  />
                  <span className="truncate">{col.header}</span>
                  <span className="text-[10px] text-slate-500 ml-auto font-normal">[{col.dataType}]</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Progress Display */}
        {isExporting && (
          <div className="p-4 rounded-xl bg-slate-100 text-center space-y-2 animate-pulse">
            <div className="flex items-center justify-center gap-2 font-bold text-slate-900">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B1F4B]" />
              <span>{progressText}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#0B1F4B] h-1.5 rounded-full w-2/3 animate-ping" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
