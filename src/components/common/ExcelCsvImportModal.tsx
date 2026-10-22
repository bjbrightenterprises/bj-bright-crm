import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Edit2,
  Layers,
  FileText,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Candidate, Client, JobOpening } from '../../types/crm';
import {
  generateImportTemplate,
  generateImportErrorsWorkbook,
  parseSpreadsheetData,
  validateCandidateRow,
} from '../../lib/excelImportService';
import { triggerFileDownload } from '../../lib/excelExport';

export interface ColumnMappingField {
  key: string;
  label: string;
  required?: boolean;
  description?: string;
  example?: string;
}

interface ExcelCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'candidates' | 'clients' | 'jobs';
  onImportComplete?: (count: number) => void;
}

export const ExcelCsvImportModal: React.FC<ExcelCsvImportModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onImportComplete,
}) => {
  const {
    candidates,
    clients,
    jobs,
    processCandidateImport,
    bulkImportClients,
    bulkImportJobs,
    currentUser,
    logImport,
  } = useCRM();

  // Multi-step wizard: 1 = Upload, 2 = Map Columns, 3 = Validate & Preview, 4 = Result
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update'>('skip');
  const [updateReason, setUpdateReason] = useState('Bulk update via Excel import');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Result stats
  const [summary, setSummary] = useState<{
    added: number;
    updated: number;
    skipped: number;
    failed: number;
  }>({ added: 0, updated: 0, skipped: 0, failed: 0 });

  // Field definitions (NO resume column!)
  const candidateFields: ColumnMappingField[] = [
    { key: 'fullName', label: 'Full Name', required: true, example: 'Aarav Sharma' },
    { key: 'phone', label: 'Mobile Number (+91)', required: true, example: '+91 98110 12345' },
    { key: 'email', label: 'Email Address', required: true, example: 'aarav.sharma@example.com' },
    { key: 'city', label: 'Current City', example: 'Noida' },
    { key: 'currentCompany', label: 'Current Organization', example: 'TCS' },
    { key: 'experienceYears', label: 'Experience (Years)', example: '5.5' },
    { key: 'currentSalaryLPA', label: 'Current CTC (LPA)', example: '12.0' },
    { key: 'expectedSalaryLPA', label: 'Expected CTC (LPA)', example: '16.5' },
    { key: 'skills', label: 'Skills (Semicolon separated)', example: 'React.js; Node.js; TypeScript' },
    { key: 'education', label: 'Highest Education', example: 'B.Tech CS' },
    { key: 'source', label: 'Source Channel', example: 'Naukri' },
    { key: 'jobTitle', label: 'Position / Job Applied For', example: 'Senior Frontend Engineer' },
    { key: 'clientName', label: 'Target Client', example: 'Tata Consultancy Services' },
    { key: 'assignedRecruiterName', label: 'Assigned Recruiter', example: 'Vikas Saxena' },
    { key: 'expectedJoiningDate', label: 'Expected Joining Date', example: '2026-11-15' },
    { key: 'remarks', label: 'Remarks', example: 'Speaks fluent English, can join in 15 days' },
    { key: 'statusRemark', label: 'Status Remark', example: 'Cleared round 1 technical screening' },
  ];

  const clientFields: ColumnMappingField[] = [
    { key: 'name', label: 'Company / Client Name', required: true, example: 'HCL Technologies' },
    { key: 'industry', label: 'Industry Sector', example: 'Information Technology & Services' },
    { key: 'city', label: 'Location / City', required: true, example: 'Noida' },
    { key: 'address', label: 'Corporate Address', example: 'Plot 3A, Sector 126' },
    { key: 'website', label: 'Website URL', example: 'https://www.hcltech.com' },
    { key: 'contactName', label: 'Primary Contact Person', example: 'Vikas Malhotra' },
    { key: 'contactEmail', label: 'Contact Email', example: 'vikas.m@hcl.com' },
    { key: 'contactPhone', label: 'Contact Phone', example: '+91 98101 23456' },
    { key: 'commissionPercent', label: 'Commission Fee %', example: '8.33' },
    { key: 'paymentTerms', label: 'Payment Terms', example: '30 days net' },
    { key: 'status', label: 'Account Status', example: 'Active' },
  ];

  const jobFields: ColumnMappingField[] = [
    { key: 'title', label: 'Job Requisition Title', required: true, example: 'Senior Java Spring Boot' },
    { key: 'clientName', label: 'Client Company Name', required: true, example: 'Tata Consultancy Services' },
    { key: 'location', label: 'Work Location', required: true, example: 'Noida' },
    { key: 'positions', label: 'Open Vacancies', example: '3' },
    { key: 'minExpYears', label: 'Min Experience (Years)', example: '3' },
    { key: 'maxExpYears', label: 'Max Experience (Years)', example: '7' },
    { key: 'salaryMinLPA', label: 'Min Salary (LPA)', example: '10.0' },
    { key: 'salaryMaxLPA', label: 'Max Salary (LPA)', example: '18.0' },
    { key: 'skillsRequired', label: 'Required Skills', example: 'Java; Spring Boot; Microservices' },
    { key: 'priority', label: 'Priority Level', example: 'High' },
    { key: 'status', label: 'Requisition Status', example: 'Open' },
    { key: 'deadline', label: 'Target Deadline', example: '2026-11-30' },
  ];

  const targetFields =
    entityType === 'candidates'
      ? candidateFields
      : entityType === 'clients'
      ? clientFields
      : jobFields;

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setFileName('');
      setHeaders([]);
      setRawRows([]);
      setColumnMap({});
      setDuplicateHandling('skip');
      setUpdateReason('Bulk update via Excel import');
      setIsProcessing(false);
      setProgressPercent(0);
      setSummary({ added: 0, updated: 0, skipped: 0, failed: 0 });
    }
  }, [isOpen, entityType]);

  // Download official template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await generateImportTemplate(entityType);
      triggerFileDownload(blob, `BJ_Bright_${entityType}_Import_Template.xlsx`);
    } catch (e: any) {
      alert(`Could not download template: ${e.message}`);
    }
  };

  // Handle file selection and parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selectedFile = files[0];

    try {
      setIsProcessing(true);
      setFileName(selectedFile.name);
      setFile(selectedFile);

      const parsed = await parseSpreadsheetData(selectedFile);
      if (parsed.rows.length === 0) {
        throw new Error('Spreadsheet does not contain any data rows.');
      }
      if (parsed.rows.length > 5000) {
        alert(
          'Warning: The file has more than 5,000 rows. Imports are limited to 5,000 rows per batch to safeguard free-tier Firestore quotas. Only the first 5,000 rows will be processed.'
        );
        parsed.rows = parsed.rows.slice(0, 5000);
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto-map columns by name similarity
      const initialMap: Record<string, string> = {};
      targetFields.forEach((field) => {
        const fieldKeyClean = field.key.toLowerCase().replace(/[^a-z]/g, '');
        const fieldLabelClean = field.label.toLowerCase().replace(/[^a-z]/g, '');

        const matchIdx = parsed.headers.findIndex((h) => {
          const hClean = h.toLowerCase().replace(/[^a-z]/g, '');
          if (field.key === 'jobTitle') {
            if (
              hClean === 'position' ||
              hClean.startsWith('position') ||
              hClean.includes('position') ||
              hClean === 'role' ||
              hClean === 'jobrole' ||
              hClean.includes('jobtitle') ||
              hClean === 'job'
            ) {
              return true;
            }
          }
          if (field.key === 'remarks') {
            if (
              hClean === 'remarks' ||
              hClean === 'remark' ||
              hClean.includes('remark') ||
              hClean === 'notes' ||
              hClean.includes('comment')
            ) {
              return true;
            }
          }
          return (
            hClean === fieldKeyClean ||
            hClean === fieldLabelClean ||
            hClean.includes(fieldLabelClean) ||
            fieldLabelClean.includes(hClean)
          );
        });

        if (matchIdx !== -1) {
          initialMap[field.key] = parsed.headers[matchIdx];
        }
      });

      setColumnMap(initialMap);
      setStep(2);
      setIsProcessing(false);
    } catch (err: any) {
      alert(`Failed to parse file: ${err.message || 'Unknown format'}`);
      setIsProcessing(false);
      setFile(null);
    }
  };

  // Validated rows computation
  const validatedRows = useMemo(() => {
    if (step < 3) return [];

    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    return rawRows.map((row, rIdx) => {
      const rowData: Record<string, any> = {};
      targetFields.forEach((field) => {
        const mappedHeader = columnMap[field.key];
        if (mappedHeader) {
          const hIdx = headers.indexOf(mappedHeader);
          if (hIdx !== -1 && row[hIdx] !== undefined) {
            rowData[field.key] = row[hIdx].trim();
          }
        }
      });

      if (entityType === 'candidates') {
        const val = validateCandidateRow(rowData, candidates, seenPhones, seenEmails);
        return {
          rowNumber: rIdx + 2,
          data: rowData,
          rawRow: row,
          isValid: val.isValid,
          isDuplicate: val.isDuplicate,
          duplicateCandidate: val.duplicateCandidate,
          errors: val.errors,
          warnings: val.warnings,
        };
      } else {
        // Simple client/job validation
        const errors: string[] = [];
        if (entityType === 'clients') {
          if (!rowData.name) errors.push('Company Name is required');
          if (!rowData.city) errors.push('City is required');
        } else {
          if (!rowData.title) errors.push('Job title is required');
          if (!rowData.clientName) errors.push('Client company name is required');
        }
        return {
          rowNumber: rIdx + 2,
          data: rowData,
          rawRow: row,
          isValid: errors.length === 0,
          isDuplicate: false,
          errors,
          warnings: [],
        };
      }
    });
  }, [step, rawRows, columnMap, headers, targetFields, entityType, candidates]);

  const counts = useMemo(() => {
    let valid = 0;
    let errors = 0;
    let duplicates = 0;
    let warnings = 0;

    validatedRows.forEach((r) => {
      if (!r.isValid) errors++;
      else valid++;

      if (r.isDuplicate) duplicates++;
      if (r.warnings.length > 0) warnings++;
    });

    return { valid, errors, duplicates, warnings, total: validatedRows.length };
  }, [validatedRows]);

  // Download rejected error rows as .xlsx
  const handleDownloadErrors = async () => {
    const errorRows = validatedRows
      .filter((r) => !r.isValid)
      .map((r) => ({
        rawRow: r.rawRow,
        error: r.errors.join('; '),
      }));

    if (errorRows.length === 0) {
      alert('There are no failed rows to export!');
      return;
    }

    try {
      const blob = await generateImportErrorsWorkbook(headers, errorRows);
      triggerFileDownload(blob, `BJ_Bright_${entityType}_Import_Errors.xlsx`);
    } catch (e: any) {
      alert(`Could not download error file: ${e.message}`);
    }
  };

  // Perform Final Import
  const handleExecuteImport = async () => {
    try {
      setIsProcessing(true);
      setProgressPercent(10);

      let added = 0;
      let updated = 0;
      let skipped = 0;
      let failed = counts.errors;

      if (entityType === 'candidates') {
        const toProcess: Array<{
          isUpdate?: boolean;
          existingId?: string;
          data: Partial<Candidate>;
        }> = [];

        validatedRows.forEach((r) => {
          if (!r.isValid) return; // skip errors

          if (r.isDuplicate) {
            if (duplicateHandling === 'update' && r.duplicateCandidate) {
              toProcess.push({
                isUpdate: true,
                existingId: r.duplicateCandidate.id,
                data: r.data,
              });
            } else {
              skipped++;
            }
          } else {
            toProcess.push({
              isUpdate: false,
              data: r.data,
            });
          }
        });

        setProgressPercent(50);
        const res = processCandidateImport(toProcess, updateReason);
        added = res.added;
        updated = res.updated;
        skipped += res.skipped;
      } else if (entityType === 'clients') {
        const validClients = validatedRows
          .filter((r) => r.isValid)
          .map((r) => ({
            name: r.data.name,
            industry: r.data.industry || 'Information Technology',
            city: r.data.city || 'Noida',
            address: r.data.address || 'Corporate Park',
            website: r.data.website || 'https://example.com',
            contactPersons: r.data.contactName
              ? [
                  {
                    id: `cp_${Date.now()}`,
                    name: r.data.contactName,
                    designation: 'HR Lead',
                    phone: r.data.contactPhone || '+91 98110 00000',
                    email: r.data.contactEmail || 'hr@client.com',
                  },
                ]
              : [],
            commissionPercent: Number(r.data.commissionPercent) || 8.33,
            paymentTerms: r.data.paymentTerms || '30 days net',
            status: (r.data.status as any) || 'Active',
          }));

        added = bulkImportClients(validClients);
      } else {
        // Jobs
        const validJobs = validatedRows
          .filter((r) => r.isValid)
          .map((r) => ({
            title: r.data.title,
            clientName: r.data.clientName,
            location: r.data.location,
            positions: Number(r.data.positions) || 1,
            minExpYears: Number(r.data.minExpYears) || 2,
            maxExpYears: Number(r.data.maxExpYears) || 6,
            salaryMinLPA: Number(r.data.salaryMinLPA) || 6,
            salaryMaxLPA: Number(r.data.salaryMaxLPA) || 12,
            skillsRequired: r.data.skillsRequired
              ? r.data.skillsRequired.split(';').map((s: string) => s.trim())
              : ['General IT'],
            priority: (r.data.priority as any) || 'Medium',
            status: (r.data.status as any) || 'Open',
            deadline: r.data.deadline,
          }));

        added = bulkImportJobs(validJobs);
      }

      setProgressPercent(100);
      setSummary({ added, updated, skipped, failed });
      logImport(entityType, fileName, { added, updated, skipped, failed });

      if (onImportComplete) {
        onImportComplete(added + updated);
      }

      setIsProcessing(false);
      setStep(4);
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isProcessing && onClose()}
      title={`Excel & CSV Import: ${entityType.toUpperCase()}`}
      maxWidth="3xl"
    >
      <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
        {/* Wizard Steps Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          {[
            { num: 1, label: 'Upload File' },
            { num: 2, label: 'Map Columns' },
            { num: 3, label: 'Validate & Duplicate Check' },
            { num: 4, label: 'Import Complete' },
          ].map((st) => (
            <div key={st.num} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === st.num
                    ? 'bg-[#0B1F4B] text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                    : step > st.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {step > st.num ? '✓' : st.num}
              </span>
              <span
                className={`hidden sm:inline font-bold ${
                  step === st.num
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 font-normal'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: Upload File & Template */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/60 to-amber-50/40 dark:from-blue-950/30 dark:to-amber-950/20 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-extrabold text-[#0B1F4B] dark:text-amber-400 text-sm">
                  Need the standard Excel format?
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Download our official .xlsx template with validation dropdowns, sample row, and guidelines. (No resume column).
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#F5A623]" />
                <span>Download Template (.xlsx)</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center space-y-3 hover:border-[#0B1F4B] dark:hover:border-amber-400 transition-colors bg-white dark:bg-slate-900">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#0B1F4B] dark:text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Upload your Excel (.xlsx) or CSV file
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Drag and drop your spreadsheet here or click to browse
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-[#0B1F4B] file:text-white hover:file:bg-[#163270] cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Maximum 5,000 rows per batch. Auto-detects headers and trims whitespace.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Map Columns */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Map Spreadsheet Headers to CRM Fields
                </p>
                <p className="text-[11px] text-slate-500">
                  File: <span className="font-bold text-slate-800 dark:text-slate-200">{fileName}</span> ({rawRows.length} rows detected)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Change File
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">CRM Field</th>
                    <th className="py-2.5 px-3">Mapped File Header</th>
                    <th className="py-2.5 px-3">Example / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {targetFields.map((field) => {
                    const currentMapped = columnMap[field.key] || '';
                    return (
                      <tr key={field.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {field.label}
                          </span>
                          {field.required && (
                            <span className="text-rose-500 font-black ml-1">*</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={currentMapped}
                            onChange={(e) =>
                              setColumnMap({ ...columnMap, [field.key]: e.target.value })
                            }
                            className={`w-full px-2.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-800 ${
                              field.required && !currentMapped
                                ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <option value="">-- Do Not Import / Leave Blank --</option>
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {field.example ? `e.g. ${field.example}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Continue to Validation Preview</span>
                <ArrowRight className="w-4 h-4 text-[#F5A623]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Validate & Duplicate Handling */}
        {step === 3 && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase text-slate-400">Total Rows</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {counts.total}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                <p className="text-[10px] font-bold uppercase">Ready to Import</p>
                <p className="text-xl font-extrabold mt-0.5">{counts.valid}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300">
                <p className="text-[10px] font-bold uppercase">Duplicates</p>
                <p className="text-xl font-extrabold mt-0.5">{counts.duplicates}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                <p className="text-[10px] font-bold uppercase">Errors / Rejected</p>
                <p className="text-xl font-extrabold mt-0.5">{counts.errors}</p>
              </div>
            </div>

            {/* Duplicate policy selection */}
            {counts.duplicates > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                <p className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Duplicate Records Detected ({counts.duplicates} matches)</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dupPolicy"
                      checked={duplicateHandling === 'skip'}
                      onChange={() => setDuplicateHandling('skip')}
                      className="accent-[#0B1F4B]"
                    />
                    <span>Skip duplicates (leave existing records untouched)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dupPolicy"
                      checked={duplicateHandling === 'update'}
                      onChange={() => setDuplicateHandling('update')}
                      className="accent-[#0B1F4B]"
                    />
                    <span>Update existing records with new values</span>
                  </label>
                </div>

                {duplicateHandling === 'update' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1">
                      Mandatory Edit Reason for Audit History:
                    </label>
                    <input
                      type="text"
                      required
                      value={updateReason}
                      onChange={(e) => setUpdateReason(e.target.value)}
                      placeholder="e.g. Bulk update via Excel import"
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error download alert */}
            {counts.errors > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                <div className="text-[11px] text-rose-950 dark:text-rose-200">
                  <span className="font-bold">{counts.errors} rows contain errors</span> (e.g. invalid phone, missing full name, invalid email). They will be skipped.
                </div>
                <button
                  type="button"
                  onClick={handleDownloadErrors}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shrink-0 text-xs shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Errors (.xlsx)</span>
                </button>
              </div>
            )}

            {/* Data Preview Table (First 8 rows) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Row #</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Name / Primary</th>
                    <th className="py-2 px-3">Contact</th>
                    <th className="py-2 px-3">Validation Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {validatedRows.slice(0, 15).map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={
                        !r.isValid
                          ? 'bg-rose-50/40 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                          : r.isDuplicate
                          ? 'bg-amber-50/40 dark:bg-amber-950/30'
                          : ''
                      }
                    >
                      <td className="py-2 px-3 font-mono text-slate-400">{r.rowNumber}</td>
                      <td className="py-2 px-3">
                        {!r.isValid ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <XCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        ) : r.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" /> Duplicate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {r.data.fullName || r.data.name || r.data.title || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {r.data.phone || r.data.contactPhone || r.data.city || '-'}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        {r.errors.length > 0 ? (
                          <span className="text-rose-600 font-semibold">{r.errors.join('; ')}</span>
                        ) : r.warnings.length > 0 ? (
                          <span className="text-amber-600">{r.warnings.join('; ')}</span>
                        ) : (
                          <span className="text-slate-400">All checks passed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Back to Mapping
              </button>
              <button
                type="button"
                disabled={isProcessing || counts.valid === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Import ({progressPercent}%)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Import ({counts.valid} Records)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Import Complete Summary */}
        {step === 4 && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Import Processed Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Data was validated, trimmed, and added into BJ Bright Enterprises CRM.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-left">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Added New</span>
                <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                  {summary.added}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] font-bold uppercase text-blue-700">Updated</span>
                <p className="text-xl font-extrabold text-blue-800 dark:text-blue-300">
                  {summary.updated}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-bold uppercase text-amber-700">Skipped</span>
                <p className="text-xl font-extrabold text-amber-800 dark:text-amber-300">
                  {summary.skipped}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400">Failed</span>
                <p className="text-xl font-extrabold text-slate-600 dark:text-slate-300">
                  {summary.failed}
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white font-extrabold shadow-md cursor-pointer"
              >
                Done & Return to CRM
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
