import ExcelJS from 'exceljs';
import { Candidate, Client, JobOpening, User } from '../types/crm';
import { sanitizeCellValue, triggerFileDownload } from './excelExport';

export interface RowValidationResult {
  rowNumber: number;
  data: Record<string, any>;
  rawRow: any[];
  isValid: boolean;
  isDuplicate: boolean;
  duplicateCandidate?: Candidate;
  errors: string[];
  warnings: string[];
}

/**
 * Generate official analyst-grade Import Template (.xlsx)
 */
export async function generateImportTemplate(entityType: 'candidates' | 'clients' | 'jobs'): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BJ Bright Enterprises CRM';

  // 1. INSTRUCTIONS SHEET
  const instSheet = wb.addWorksheet('Instructions');
  instSheet.columns = [
    { header: 'Section', key: 'sec', width: 25 },
    { header: 'Guidelines & Validation Rules', key: 'guide', width: 65 },
  ];

  instSheet.mergeCells('A1:B1');
  const instTitle = instSheet.getCell('A1');
  instTitle.value = `BJ BRIGHT ENTERPRISES — ${entityType.toUpperCase()} DATA IMPORT GUIDE`;
  instTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  instTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  instTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  instSheet.getRow(1).height = 32;

  instSheet.addRow({});
  instSheet.addRow({ sec: '1. Format & Extension', guide: 'Upload genuine .xlsx or .csv files up to 5,000 rows per batch.' });
  instSheet.addRow({ sec: '2. Mandatory Fields (*)', guide: 'Headers marked with an asterisk (*) are strictly required. Rows missing mandatory fields will be rejected.' });
  instSheet.addRow({ sec: '3. Mobile Number', guide: 'Must be a 10-digit Indian phone number starting with 6, 7, 8, or 9. Formatted as Text.' });
  instSheet.addRow({ sec: '4. Email Address', guide: 'Must be a valid, active email address (e.g. name@domain.com).' });
  instSheet.addRow({ sec: '5. Numeric Fields', guide: 'Experience and Salary should be numbers without currency symbols (e.g. 5.5 for 5.5 years, 14.5 for ₹14.5 LPA).' });
  instSheet.addRow({ sec: '6. Dropdown Lists', guide: 'Use the dropdown selectors in the Data sheet for Status, Source, Industry, etc., or copy values from the Lists sheet.' });
  instSheet.addRow({ sec: '7. Duplicate Handling', guide: 'Existing duplicates by phone or email can either be skipped or updated with an audit reason in Edit History.' });
  instSheet.addRow({ sec: '8. Role Access', guide: 'Recruiters and HR can only import candidates assigned to themselves. Admin and Manager can also import clients and jobs.' });

  for (let r = 3; r <= 10; r++) {
    instSheet.getRow(r).getCell(1).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    instSheet.getRow(r).getCell(2).font = { color: { argb: 'FF334155' } };
  }

  // 2. LISTS SHEET (holding master dropdown choices)
  const listsSheet = wb.addWorksheet('Lists');
  listsSheet.columns = [
    { header: 'Status Options', key: 'status', width: 22 },
    { header: 'Source Channels', key: 'sources', width: 22 },
    { header: 'Metro Cities', key: 'cities', width: 20 },
    { header: 'Industries', key: 'industries', width: 28 },
  ];
  listsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  listsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };

  const candidateStatuses = ['New', 'Screened', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Offered', 'Joined', 'Rejected', 'On Hold'];
  const sources = ['Naukri', 'LinkedIn', 'Referral', 'Walk-in', 'Foundit', 'Direct', 'Internal Database'];
  const cities = ['Noida', 'Delhi NCR', 'Gurgaon', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai', 'Remote'];
  const industries = ['Information Technology & Services', 'Fintech & Payments', 'E-Commerce & Retail', 'Banking & Financial Services', 'Healthcare & Pharma'];

  const maxRows = Math.max(candidateStatuses.length, sources.length, cities.length, industries.length);
  for (let i = 0; i < maxRows; i++) {
    listsSheet.addRow([
      candidateStatuses[i] || '',
      sources[i] || '',
      cities[i] || '',
      industries[i] || '',
    ]);
  }

  // 3. DATA SHEET (With headers, mandatory asterisks, 1 example row, dropdown validation, NO resume column)
  const dataSheet = wb.addWorksheet('Data', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  if (entityType === 'candidates') {
    dataSheet.columns = [
      { header: 'Full Name *', key: 'fullName', width: 26 },
      { header: 'Mobile Number *', key: 'phone', width: 20 },
      { header: 'Email Address *', key: 'email', width: 28 },
      { header: 'Current City', key: 'city', width: 18 },
      { header: 'Current Company', key: 'currentCompany', width: 24 },
      { header: 'Experience Years', key: 'experienceYears', width: 18 },
      { header: 'Current Salary LPA', key: 'currentSalaryLPA', width: 18 },
      { header: 'Expected Salary LPA', key: 'expectedSalaryLPA', width: 18 },
      { header: 'Key Skills', key: 'skills', width: 30 },
      { header: 'Highest Education', key: 'education', width: 20 },
      { header: 'Source Channel', key: 'source', width: 20 },
      { header: 'Hiring Status', key: 'status', width: 20 },
      { header: 'Position Applied For', key: 'jobTitle', width: 24 },
      { header: 'Target Client', key: 'clientName', width: 24 },
      { header: 'Assigned Recruiter', key: 'assignedRecruiterName', width: 22 },
      { header: 'Expected Joining Date', key: 'expectedJoiningDate', width: 22 },
      { header: 'Remarks', key: 'remarks', width: 30 },
      { header: 'Status Remark', key: 'statusRemark', width: 30 },
    ];

    // Example Row 1
    dataSheet.addRow([
      'Rohit Saxena',
      '+91 98110 54321',
      'rohit.saxena@example.com',
      'Noida',
      'Cognizant',
      5.5,
      12.0,
      16.5,
      'React.js; TypeScript; Node.js',
      'B.Tech CS',
      'Naukri',
      'Screened',
      'Lead Full Stack Engineer',
      'Tata Consultancy Services (TCS)',
      'Vikas Saxena',
      '2026-11-15',
      'Speaks fluent English, immediate joiner',
      'Cleared round 1 technical screening',
    ]);

    // Format phone column as text explicitly
    dataSheet.getColumn(2).numFmt = '@';

    // Dropdown validations
    for (let r = 2; r <= 50; r++) {
      dataSheet.getCell(`K${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['Lists!$B$2:$B$8'],
      };
      dataSheet.getCell(`L${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['Lists!$A$2:$A$10'],
      };
      dataSheet.getCell(`D${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['Lists!$C$2:$C$10'],
      };
    }
  } else if (entityType === 'clients') {
    dataSheet.columns = [
      { header: 'Company Name *', key: 'name', width: 30 },
      { header: 'Industry Sector', key: 'industry', width: 26 },
      { header: 'City *', key: 'city', width: 20 },
      { header: 'Corporate Address', key: 'address', width: 32 },
      { header: 'Website URL', key: 'website', width: 26 },
      { header: 'Primary Contact Person', key: 'contactName', width: 24 },
      { header: 'Contact Phone', key: 'contactPhone', width: 20 },
      { header: 'Contact Email', key: 'contactEmail', width: 26 },
      { header: 'Commission Fee %', key: 'commissionPercent', width: 18 },
      { header: 'Payment Terms', key: 'paymentTerms', width: 20 },
      { header: 'Account Status', key: 'status', width: 18 },
    ];

    dataSheet.addRow([
      'Infosys Limited',
      'Information Technology & Services',
      'Noida',
      'Plot 44, Electronic City, Sector 62',
      'https://www.infosys.com',
      'Deepak Chopra',
      '+91 98112 00000',
      'deepak.c@infosys.com',
      8.33,
      '30 days net',
      'Active',
    ]);

    for (let r = 2; r <= 50; r++) {
      dataSheet.getCell(`B${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['Lists!$D$2:$D$6'],
      };
      dataSheet.getCell(`K${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Active,Inactive,Prospect"'],
      };
    }
  } else {
    // Jobs
    dataSheet.columns = [
      { header: 'Job Requisition Title *', key: 'title', width: 30 },
      { header: 'Client Company Name *', key: 'clientName', width: 28 },
      { header: 'Work Location *', key: 'location', width: 20 },
      { header: 'Open Positions', key: 'positions', width: 16 },
      { header: 'Min Experience (Years)', key: 'minExpYears', width: 20 },
      { header: 'Max Experience (Years)', key: 'maxExpYears', width: 20 },
      { header: 'Min Salary LPA', key: 'salaryMinLPA', width: 18 },
      { header: 'Max Salary LPA', key: 'salaryMaxLPA', width: 18 },
      { header: 'Required Skills', key: 'skillsRequired', width: 32 },
      { header: 'Priority Level', key: 'priority', width: 16 },
      { header: 'Requisition Status', key: 'status', width: 18 },
      { header: 'Target Deadline', key: 'deadline', width: 20 },
    ];

    dataSheet.addRow([
      'Senior Java Spring Boot Developer',
      'Tata Consultancy Services (TCS)',
      'Noida',
      3,
      4.0,
      8.0,
      14.0,
      22.0,
      'Java; Spring Boot; Microservices; Docker',
      'High',
      'Open',
      '2026-11-30',
    ]);

    for (let r = 2; r <= 50; r++) {
      dataSheet.getCell(`J${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"High,Medium,Low"'],
      };
      dataSheet.getCell(`K${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Open,On Hold,Closed"'],
      };
    }
  }

  // Header row formatting (Navy #0B1F4B, White bold, Gold accent)
  const headerRow = dataSheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFF5A623' } },
    };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generate "Import Errors" (.xlsx) file containing original rows + Error Reason column
 */
export async function generateImportErrorsWorkbook(
  headers: string[],
  errorRows: Array<{ rawRow: any[]; error: string }>
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BJ Bright Enterprises CRM';

  const ws = wb.addWorksheet('Import Errors', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  const allHeaders = ['Row #', ...headers, 'Error Reason & Action Required'];
  ws.columns = allHeaders.map((h, idx) => ({
    header: h,
    key: `col_${idx}`,
    width: idx === allHeaders.length - 1 ? 40 : 20,
  }));

  const hRow = ws.getRow(1);
  hRow.height = 30;
  hRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } }; // Red header for error file
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  errorRows.forEach((item, rIdx) => {
    const rowValues = [rIdx + 2, ...item.rawRow, item.error];
    const r = ws.addRow(rowValues);
    r.getCell(allHeaders.length).font = { bold: true, color: { argb: 'FFDC2626' } };
    r.alignment = { vertical: 'middle', wrapText: true };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Parses either an .xlsx ArrayBuffer or a .csv text into 2D string grid
 */
export async function parseSpreadsheetData(
  file: File
): Promise<{ headers: string[]; rows: string[][] }> {
  const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (isXlsx) {
    const buffer = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);

    // Prefer worksheet named 'Data', otherwise use the first sheet
    const ws = wb.getWorksheet('Data') || wb.worksheets[0];
    if (!ws) throw new Error('No valid worksheet found in uploaded workbook.');

    const grid: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        let val = cell.value;
        if (val !== null && val !== undefined) {
          if (typeof val === 'object' && 'text' in val) {
            val = (val as any).text;
          } else if (val instanceof Date) {
            val = val.toISOString().split('T')[0];
          }
          values.push(String(val).trim());
        } else {
          values.push('');
        }
      });
      grid.push(values);
    });

    if (grid.length === 0) throw new Error('Spreadsheet appears to be completely empty.');

    const headers = grid[0].map((h) => h.replace(/\*/g, '').trim());
    const rows = grid.slice(1).filter((r) => r.some((cell) => cell.length > 0));

    return { headers, rows };
  } else {
    // CSV parsing fallback
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) throw new Error('CSV file is empty.');

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseCsvLine(lines[0]).map((h) => h.replace(/\*/g, '').trim());
    const rows = lines.slice(1).map(parseCsvLine).filter((r) => r.some((cell) => cell.length > 0));

    return { headers, rows };
  }
}

/**
 * Validate a candidate row using strict CRM validation rules
 */
export function validateCandidateRow(
  data: Record<string, any>,
  existingCandidates: Candidate[],
  seenPhones: Set<string>,
  seenEmails: Set<string>
): { isValid: boolean; isDuplicate: boolean; duplicateCandidate?: Candidate; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  const name = String(data.fullName || '').trim();
  if (!name) {
    errors.push('Full Name is required');
  } else if (name.length < 2) {
    errors.push('Full Name must be at least 2 characters');
  } else if (!/^[a-zA-Z\s.]+$/.test(name)) {
    warnings.push('Full Name contains non-standard characters');
  }

  // Mobile validation: 10 digits starting with 6,7,8,9
  const rawPhone = String(data.phone || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
  if (!rawPhone) {
    errors.push('Mobile number is required');
  } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    errors.push(`Mobile "${rawPhone}" is invalid (must be 10 digits starting with 6-9)`);
  }

  // Email validation
  const email = String(data.email || '').trim().toLowerCase();
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(`Email "${email}" has an invalid format`);
  }

  // Numeric fields
  if (data.experienceYears !== undefined && data.experienceYears !== '') {
    const exp = Number(data.experienceYears);
    if (isNaN(exp) || exp < 0 || exp > 45) {
      errors.push('Experience must be a positive number between 0 and 45');
    }
  }

  const curSal = Number(data.currentSalaryLPA);
  const expSal = Number(data.expectedSalaryLPA);
  if (data.currentSalaryLPA && (isNaN(curSal) || curSal < 0)) {
    errors.push('Current Salary must be a positive number');
  }
  if (data.expectedSalaryLPA && (isNaN(expSal) || expSal < 0)) {
    errors.push('Expected Salary must be a positive number');
  }
  if (!isNaN(curSal) && !isNaN(expSal) && curSal > 0 && expSal > 0 && expSal < curSal) {
    warnings.push(`Expected CTC (₹${expSal}L) is lower than current CTC (₹${curSal}L)`);
  }

  // Duplicate Check against CRM and inside file
  let isDuplicate = false;
  let duplicateCandidate: Candidate | undefined;

  if (cleanPhone) {
    if (seenPhones.has(cleanPhone)) {
      isDuplicate = true;
      warnings.push(`Duplicate mobile within this import file (${cleanPhone})`);
    } else {
      seenPhones.add(cleanPhone);
    }
  }

  if (email) {
    if (seenEmails.has(email)) {
      isDuplicate = true;
      warnings.push(`Duplicate email within this import file (${email})`);
    } else {
      seenEmails.add(email);
    }
  }

  // Existing database duplicate check
  const matchedExisting = existingCandidates.find((c) => {
    const cPhone = c.phone.replace(/\D/g, '').slice(-10);
    const cEmail = c.email.trim().toLowerCase();
    return (cleanPhone && cPhone === cleanPhone) || (email && cEmail === email);
  });

  if (matchedExisting) {
    isDuplicate = true;
    duplicateCandidate = matchedExisting;
    warnings.push(`Matches existing candidate: ${matchedExisting.fullName} (${matchedExisting.id})`);
  }

  return {
    isValid: errors.length === 0,
    isDuplicate,
    duplicateCandidate,
    errors,
    warnings,
  };
}
