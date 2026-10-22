import ExcelJS from 'exceljs';
import {
  Candidate,
  Client,
  JobOpening,
  Interview,
  PipelineItem,
} from '../types/crm';
import {
  ExportColumnDef,
  getDateAnalysisHelpers,
} from './excelExport';


/**
 * CANDIDATE EXPORT CONFIGURATION
 */
export const CANDIDATE_EXPORT_COLUMNS: ExportColumnDef[] = [
  {
    key: 'id',
    header: 'Candidate ID',
    description: 'Unique persistent database identifier for the candidate',
    allowedValues: 'Alpha-numeric ID (e.g. cand_12345)',
    dataType: 'Text',
    width: 20,
    getValue: (c: Candidate) => c.id,
  },
  {
    key: 'fullName',
    header: 'Candidate Full Name',
    description: 'Legal full name of candidate',
    allowedValues: 'Letters, spaces and dots only',
    dataType: 'Text',
    width: 25,
    getValue: (c: Candidate) => c.fullName,
  },
  {
    key: 'phone',
    header: 'Mobile Number',
    description: 'Primary mobile number preserved with +91 country prefix',
    allowedValues: '10-digit Indian mobile (+91)',
    dataType: 'Text',
    width: 18,
    getValue: (c: Candidate) => c.phone,
  },
  {
    key: 'email',
    header: 'Email Address',
    description: 'Verified communication email ID',
    allowedValues: 'Valid lowercase RFC 5322 email',
    dataType: 'Text',
    width: 28,
    getValue: (c: Candidate) => c.email,
  },
  {
    key: 'city',
    header: 'Current City',
    description: 'Candidate current residential/work location',
    allowedValues: 'Metro/Tier 1/2 Cities (Noida, Delhi, Gurgaon, etc.)',
    dataType: 'Text',
    width: 16,
    getValue: (c: Candidate) => c.city,
  },
  {
    key: 'currentCompany',
    header: 'Current Organization',
    description: 'Present employer name',
    allowedValues: 'Company name or Confidential',
    dataType: 'Text',
    width: 25,
    getValue: (c: Candidate) => c.currentCompany || 'Confidential',
  },
  {
    key: 'experienceYears',
    header: 'Experience (Years)',
    description: 'Total professional experience in years',
    allowedValues: '0.0 to 40.0 years',
    dataType: 'Number',
    format: '0.0',
    width: 18,
    getValue: (c: Candidate) => Number(c.experienceYears) || 0,
  },
  {
    key: 'currentSalaryLPA',
    header: 'Current Salary (LPA)',
    description: 'Current fixed annual CTC in Lakhs Per Annum',
    allowedValues: '0.0 to 150.0 LPA',
    dataType: 'Number',
    format: '#,##0.00',
    width: 20,
    getValue: (c: Candidate) => Number(c.currentSalaryLPA) || 0,
  },
  {
    key: 'expectedSalaryLPA',
    header: 'Expected Salary (LPA)',
    description: 'Target annual compensation CTC in Lakhs Per Annum',
    allowedValues: '0.0 to 200.0 LPA',
    dataType: 'Number',
    format: '#,##0.00',
    width: 20,
    getValue: (c: Candidate) => Number(c.expectedSalaryLPA) || 0,
  },
  {
    key: 'skills',
    header: 'Key Skills',
    description: 'Primary technical and domain competencies',
    allowedValues: 'Semicolon-separated tags',
    dataType: 'Text',
    width: 32,
    getValue: (c: Candidate) => (Array.isArray(c.skills) ? c.skills.join('; ') : c.skills || ''),
  },
  {
    key: 'education',
    header: 'Highest Qualification',
    description: 'Highest academic degree obtained',
    allowedValues: 'B.Tech, MBA, MCA, Graduate, Post Graduate',
    dataType: 'Text',
    width: 20,
    getValue: (c: Candidate) => c.education || 'Graduate',
  },
  {
    key: 'source',
    header: 'Source Channel',
    description: 'Talent sourcing channel',
    allowedValues: 'Naukri, LinkedIn, Referral, Walk-in, Foundit, Direct, Internal Database',
    dataType: 'Text',
    width: 18,
    validationList: ['Naukri', 'LinkedIn', 'Referral', 'Walk-in', 'Foundit', 'Direct', 'Internal Database'],
    getValue: (c: Candidate) => c.source,
  },
  {
    key: 'status',
    header: 'Hiring Status',
    description: 'Current stage in talent recruitment lifecycle',
    allowedValues: 'New, Screened, Shortlisted, Interview Scheduled, Selected, Offered, Joined, Rejected, On Hold',
    dataType: 'Text',
    width: 20,
    validationList: [
      'New',
      'Screened',
      'Shortlisted',
      'Interview Scheduled',
      'Selected',
      'Offered',
      'Joined',
      'Rejected',
      'On Hold',
    ],
    getValue: (c: Candidate) => c.status,
  },
  {
    key: 'jobTitle',
    header: 'Position Applied',
    description: 'Job opening title or custom applied role',
    allowedValues: 'Active job title or typed custom role',
    dataType: 'Text',
    width: 25,
    getValue: (c: Candidate) => c.jobTitle || 'General Pool',
  },
  {
    key: 'isCustomPosition',
    header: 'Applied Position (custom)',
    description: 'Whether the applied role was entered as a custom position',
    allowedValues: 'Yes / No',
    dataType: 'Text',
    width: 24,
    getValue: (c: Candidate) => (c.isCustomPosition ? 'Yes' : 'No'),
  },
  {
    key: 'remarks',
    header: 'Remarks',
    description: 'Candidate remarks and recruiter observations',
    allowedValues: 'Text up to 500 characters',
    dataType: 'Text',
    width: 30,
    getValue: (c: Candidate) => c.remarks || '',
  },
  {
    key: 'statusRemark',
    header: 'Status Remark',
    description: 'Latest status change remark and reason note',
    allowedValues: 'Text up to 300 characters',
    dataType: 'Text',
    width: 30,
    getValue: (c: Candidate) => c.statusRemark || '',
  },
  {
    key: 'clientName',
    header: 'Target Client',
    description: 'Corporate client mapped to candidate application',
    allowedValues: 'Client company name',
    dataType: 'Text',
    width: 25,
    getValue: (c: Candidate) => c.clientName || 'General',
  },
  {
    key: 'assignedRecruiterName',
    header: 'Assigned Recruiter',
    description: 'Recruiter or HR Executive managing candidate file',
    allowedValues: 'Active user name',
    dataType: 'Text',
    width: 22,
    getValue: (c: Candidate) => c.assignedRecruiterName,
  },
  {
    key: 'expectedJoiningDate',
    header: 'Expected Joining Date',
    description: 'Agreed tentative onboarding date',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 20,
    getValue: (c: Candidate) => (c.expectedJoiningDate ? new Date(c.expectedJoiningDate) : ''),
  },
  // Extra helper columns for data analysts
  {
    key: 'createdDate',
    header: 'Created Date',
    description: 'Date record was first entered into CRM',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 18,
    getValue: (c: Candidate) => getDateAnalysisHelpers(c.createdAt, c.updatedAt).createdDate,
  },
  {
    key: 'createdMonth',
    header: 'Created Month (YYYY-MM)',
    description: 'Year-Month grouping for cohort analysis',
    allowedValues: 'e.g. 2026-10',
    dataType: 'Text',
    width: 20,
    getValue: (c: Candidate) => getDateAnalysisHelpers(c.createdAt, c.updatedAt).createdMonth,
  },
  {
    key: 'createdWeek',
    header: 'Created Week',
    description: 'ISO Week number for weekly pacing reports',
    allowedValues: 'e.g. 2026-W42',
    dataType: 'Text',
    width: 16,
    getValue: (c: Candidate) => getDateAnalysisHelpers(c.createdAt, c.updatedAt).createdWeek,
  },
  {
    key: 'lastUpdatedDate',
    header: 'Last Updated Date',
    description: 'Timestamp of most recent profile modification',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 18,
    getValue: (c: Candidate) => getDateAnalysisHelpers(c.createdAt, c.updatedAt).updatedDate,
  },
  {
    key: 'daysSinceUpdate',
    header: 'Days Since Last Update',
    description: 'Elapsed days since profile was last updated',
    allowedValues: 'Positive integer (0 to 365+)',
    dataType: 'Number',
    format: '#,##0',
    width: 20,
    getValue: (c: Candidate) => getDateAnalysisHelpers(c.createdAt, c.updatedAt).daysSinceUpdate,
  },
  {
    key: 'daysInStatus',
    header: 'Days In Current Status',
    description: 'Ageing in current workflow phase',
    allowedValues: 'Positive integer',
    dataType: 'Number',
    format: '#,##0',
    width: 20,
    getValue: (c: Candidate) => getDateAnalysisHelpers(c.createdAt, c.updatedAt).daysInStatus,
  },
  {
    key: 'duplicateFlag',
    header: 'Duplicate Flag',
    description: 'Indicates whether candidate shares contact details',
    allowedValues: 'Unique / Potential Duplicate',
    dataType: 'Text',
    width: 18,
    getValue: () => 'Unique',
  },
];

export function generateCandidatesSummarySheet(
  wb: ExcelJS.Workbook,
  dataSheetName: string,
  tableName: string,
  rowCount: number
) {
  const ws = wb.addWorksheet('Summary', { views: [{ showGridLines: true }] });

  // Title Banner
  ws.mergeCells('A1:D1');
  const title = ws.getCell('A1');
  title.value = 'BJ BRIGHT ENTERPRISES — RECRUITMENT PERFORMANCE SUMMARY';
  title.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 32;

  // Key KPI Cards (Formula driven)
  const kpiRow = 3;
  ws.getCell(`A${kpiRow}`).value = 'Total Talent Pool';
  ws.getCell(`B${kpiRow}`).value = { formula: `COUNTA(${dataSheetName}!A2:A${rowCount + 1})` };
  ws.getCell(`C${kpiRow}`).value = 'Total Placements (Joined)';
  ws.getCell(`D${kpiRow}`).value = { formula: `COUNTIF(${dataSheetName}!M2:M${rowCount + 1}, "Joined")` };

  ws.getCell(`A${kpiRow + 1}`).value = 'Active Offers Pending';
  ws.getCell(`B${kpiRow + 1}`).value = { formula: `COUNTIF(${dataSheetName}!M2:M${rowCount + 1}, "Offered")` };
  ws.getCell(`C${kpiRow + 1}`).value = 'Average Experience';
  ws.getCell(`D${kpiRow + 1}`).value = { formula: `AVERAGE(${dataSheetName}!G2:G${rowCount + 1})` };
  ws.getCell(`D${kpiRow + 1}`).numFmt = '0.0 "yrs"';

  ws.getCell(`A${kpiRow + 2}`).value = 'Average Expected CTC';
  ws.getCell(`B${kpiRow + 2}`).value = { formula: `AVERAGE(${dataSheetName}!I2:I${rowCount + 1})` };
  ws.getCell(`B${kpiRow + 2}`).numFmt = '₹#,##0.00 "LPA"';
  ws.getCell(`C${kpiRow + 2}`).value = 'Interviews Scheduled';
  ws.getCell(`D${kpiRow + 2}`).value = { formula: `COUNTIF(${dataSheetName}!M2:M${rowCount + 1}, "Interview Scheduled")` };

  for (let r = kpiRow; r <= kpiRow + 2; r++) {
    const row = ws.getRow(r);
    row.getCell(1).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    row.getCell(2).font = { bold: true, color: { argb: 'FF1E293B' } };
    row.getCell(3).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    row.getCell(4).font = { bold: true, color: { argb: 'FF1E293B' } };
    row.height = 22;
  }

  // Section 1: Distribution by Hiring Status
  const statusHeaderRow = 8;
  ws.mergeCells(`A${statusHeaderRow}:B${statusHeaderRow}`);
  const sHead = ws.getCell(`A${statusHeaderRow}`);
  sHead.value = 'TALENT DISTRIBUTION BY STATUS';
  sHead.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  ws.getRow(statusHeaderRow).height = 24;

  const statuses = [
    'New',
    'Screened',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Offered',
    'Joined',
    'Rejected',
    'On Hold',
  ];

  statuses.forEach((st, idx) => {
    const rIdx = statusHeaderRow + 1 + idx;
    ws.getCell(`A${rIdx}`).value = st;
    ws.getCell(`B${rIdx}`).value = { formula: `COUNTIF(${dataSheetName}!M2:M${rowCount + 1}, "${st}")` };
    ws.getCell(`A${rIdx}`).font = { bold: true, color: { argb: 'FF334155' } };
    ws.getCell(`B${rIdx}`).font = { bold: true, color: { argb: 'FF0F766E' } };
  });

  // Section 2: Distribution by Sourcing Channel
  ws.mergeCells(`C${statusHeaderRow}:D${statusHeaderRow}`);
  const srcHead = ws.getCell(`C${statusHeaderRow}`);
  srcHead.value = 'TALENT SOURCING CHANNEL METRICS';
  srcHead.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  srcHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5A623' } };

  const sources = [
    'Naukri',
    'LinkedIn',
    'Referral',
    'Walk-in',
    'Foundit',
    'Direct',
    'Internal Database',
  ];

  sources.forEach((src, idx) => {
    const rIdx = statusHeaderRow + 1 + idx;
    ws.getCell(`C${rIdx}`).value = src;
    ws.getCell(`D${rIdx}`).value = { formula: `COUNTIF(${dataSheetName}!L2:L${rowCount + 1}, "${src}")` };
    ws.getCell(`C${rIdx}`).font = { bold: true, color: { argb: 'FF334155' } };
    ws.getCell(`D${rIdx}`).font = { bold: true, color: { argb: 'FF0F766E' } };
  });

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 28;
  ws.getColumn(4).width = 20;
}

/**
 * CLIENT EXPORT CONFIGURATION
 */
export const CLIENT_EXPORT_COLUMNS: ExportColumnDef[] = [
  {
    key: 'id',
    header: 'Client ID',
    description: 'Unique corporate account identifier',
    allowedValues: 'cli_xxxx',
    dataType: 'Text',
    width: 18,
    getValue: (c: Client) => c.id,
  },
  {
    key: 'name',
    header: 'Company Name',
    description: 'Registered corporate enterprise name',
    allowedValues: 'Company Legal Name',
    dataType: 'Text',
    width: 30,
    getValue: (c: Client) => c.name,
  },
  {
    key: 'industry',
    header: 'Industry Sector',
    description: 'Primary corporate business vertical',
    allowedValues: 'Information Technology, Telecom, Banking, etc.',
    dataType: 'Text',
    width: 26,
    getValue: (c: Client) => c.industry,
  },
  {
    key: 'city',
    header: 'Location / City',
    description: 'Corporate office location',
    allowedValues: 'Noida, Gurgaon, Bangalore, etc.',
    dataType: 'Text',
    width: 18,
    getValue: (c: Client) => c.city,
  },
  {
    key: 'address',
    header: 'Corporate Address',
    description: 'Complete office physical address',
    allowedValues: 'Full address',
    dataType: 'Text',
    width: 32,
    getValue: (c: Client) => c.address,
  },
  {
    key: 'website',
    header: 'Website URL',
    description: 'Corporate portal URL',
    allowedValues: 'Valid URL',
    dataType: 'Text',
    width: 25,
    getValue: (c: Client) => c.website,
  },
  {
    key: 'primaryContact',
    header: 'Primary Contact Person',
    description: 'Key point of contact name',
    allowedValues: 'Full name',
    dataType: 'Text',
    width: 22,
    getValue: (c: Client) => (c.contactPersons && c.contactPersons[0] ? c.contactPersons[0].name : '-'),
  },
  {
    key: 'contactPhone',
    header: 'Contact Phone',
    description: 'Direct phone number of client contact',
    allowedValues: 'Mobile / Landline with country code',
    dataType: 'Text',
    width: 18,
    getValue: (c: Client) => (c.contactPersons && c.contactPersons[0] ? c.contactPersons[0].phone : '-'),
  },
  {
    key: 'contactEmail',
    header: 'Contact Email',
    description: 'Official corporate email of point of contact',
    allowedValues: 'Corporate email ID',
    dataType: 'Text',
    width: 26,
    getValue: (c: Client) => (c.contactPersons && c.contactPersons[0] ? c.contactPersons[0].email : '-'),
  },
  {
    key: 'commissionPercent',
    header: 'Commission %',
    description: 'Placement fee percentage on candidate annual CTC',
    allowedValues: '5.0% to 25.0%',
    dataType: 'Number',
    format: '0.00"%"',
    width: 16,
    getValue: (c: Client) => Number(c.commissionPercent) || 8.33,
  },
  {
    key: 'paymentTerms',
    header: 'Payment Terms',
    description: 'Invoicing credit terms and SLA',
    allowedValues: '30 days, 45 days, 60 days net',
    dataType: 'Text',
    width: 20,
    getValue: (c: Client) => c.paymentTerms,
  },
  {
    key: 'status',
    header: 'Account Status',
    description: 'Engagement status with BJ Bright Enterprises',
    allowedValues: 'Active, Inactive, Prospect',
    dataType: 'Text',
    width: 18,
    validationList: ['Active', 'Inactive', 'Prospect'],
    getValue: (c: Client) => c.status,
  },
  {
    key: 'assignedAccountManagerName',
    header: 'Account Manager',
    description: 'Assigned senior client relationship manager',
    allowedValues: 'Active user name',
    dataType: 'Text',
    width: 22,
    getValue: (c: Client) => c.assignedAccountManagerName,
  },
  {
    key: 'activeJobsCount',
    header: 'Active Mandates',
    description: 'Number of active job openings open for client',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (c: Client) => Number(c.activeJobsCount) || 0,
  },
  {
    key: 'placedCandidatesCount',
    header: 'Total Placements',
    description: 'Cumulative successful candidate joinings',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (c: Client) => Number(c.placedCandidatesCount) || 0,
  },
  {
    key: 'createdDate',
    header: 'Onboarded Date',
    description: 'Date client agreement signed / onboarded',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 18,
    getValue: (c: Client) => getDateAnalysisHelpers(c.createdAt, c.createdAt).createdDate,
  },
];

export function generateClientsSummarySheet(
  wb: ExcelJS.Workbook,
  dataSheetName: string,
  _tableName: string,
  rowCount: number
) {
  const ws = wb.addWorksheet('Summary', { views: [{ showGridLines: true }] });

  ws.mergeCells('A1:C1');
  const title = ws.getCell('A1');
  title.value = 'BJ BRIGHT ENTERPRISES — CLIENT ACCOUNTS OVERVIEW';
  title.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  ws.getCell('A3').value = 'Total Client Portfolio';
  ws.getCell('B3').value = { formula: `COUNTA(${dataSheetName}!A2:A${rowCount + 1})` };
  ws.getCell('A4').value = 'Active Hiring Partners';
  ws.getCell('B4').value = { formula: `COUNTIF(${dataSheetName}!L2:L${rowCount + 1}, "Active")` };
  ws.getCell('A5').value = 'Prospect Clients';
  ws.getCell('B5').value = { formula: `COUNTIF(${dataSheetName}!L2:L${rowCount + 1}, "Prospect")` };
  ws.getCell('A6').value = 'Total Active Requisitions';
  ws.getCell('B6').value = { formula: `SUM(${dataSheetName}!N2:N${rowCount + 1})` };
  ws.getCell('A7').value = 'Cumulative Placements Made';
  ws.getCell('B7').value = { formula: `SUM(${dataSheetName}!O2:O${rowCount + 1})` };
  ws.getCell('A8').value = 'Average Placement Fee %';
  ws.getCell('B8').value = { formula: `AVERAGE(${dataSheetName}!J2:J${rowCount + 1})` };
  ws.getCell('B8').numFmt = '0.00"%"';

  for (let r = 3; r <= 8; r++) {
    const row = ws.getRow(r);
    row.getCell(1).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    row.getCell(2).font = { bold: true, color: { argb: 'FF0F766E' } };
  }

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 22;
}

/**
 * JOB OPENINGS EXPORT CONFIGURATION
 */
export const JOB_EXPORT_COLUMNS: ExportColumnDef[] = [
  {
    key: 'id',
    header: 'Job ID',
    description: 'Unique requisition identifier',
    allowedValues: 'job_xxxx',
    dataType: 'Text',
    width: 18,
    getValue: (j: JobOpening) => j.id,
  },
  {
    key: 'title',
    header: 'Requisition Title',
    description: 'Designation / job role name',
    allowedValues: 'Job Title',
    dataType: 'Text',
    width: 28,
    getValue: (j: JobOpening) => j.title,
  },
  {
    key: 'clientName',
    header: 'Client Company',
    description: 'Hiring enterprise organization',
    allowedValues: 'Client company name',
    dataType: 'Text',
    width: 28,
    getValue: (j: JobOpening) => j.clientName,
  },
  {
    key: 'location',
    header: 'Work Location',
    description: 'Office city or Remote/Hybrid model',
    allowedValues: 'Noida, Delhi, Remote, etc.',
    dataType: 'Text',
    width: 18,
    getValue: (j: JobOpening) => j.location,
  },
  {
    key: 'positions',
    header: 'Open Positions',
    description: 'Total number of vacancies for requisition',
    allowedValues: 'Integer >= 1',
    dataType: 'Number',
    format: '#,##0',
    width: 16,
    getValue: (j: JobOpening) => Number(j.positions) || 1,
  },
  {
    key: 'minExpYears',
    header: 'Min Exp (Years)',
    description: 'Minimum required years of experience',
    allowedValues: '0 to 30',
    dataType: 'Number',
    format: '0.0',
    width: 16,
    getValue: (j: JobOpening) => Number(j.minExpYears) || 0,
  },
  {
    key: 'maxExpYears',
    header: 'Max Exp (Years)',
    description: 'Maximum experience threshold',
    allowedValues: '0 to 35',
    dataType: 'Number',
    format: '0.0',
    width: 16,
    getValue: (j: JobOpening) => Number(j.maxExpYears) || 0,
  },
  {
    key: 'salaryMinLPA',
    header: 'Min Salary (LPA)',
    description: 'Lower salary budget boundary in Lakhs Per Annum',
    allowedValues: 'Numeric LPA',
    dataType: 'Number',
    format: '#,##0.00',
    width: 18,
    getValue: (j: JobOpening) => Number(j.salaryMinLPA) || 0,
  },
  {
    key: 'salaryMaxLPA',
    header: 'Max Salary (LPA)',
    description: 'Upper salary budget boundary in Lakhs Per Annum',
    allowedValues: 'Numeric LPA',
    dataType: 'Number',
    format: '#,##0.00',
    width: 18,
    getValue: (j: JobOpening) => Number(j.salaryMaxLPA) || 0,
  },
  {
    key: 'skillsRequired',
    header: 'Skills Required',
    description: 'Required technical and core skills',
    allowedValues: 'Semicolon-separated skills',
    dataType: 'Text',
    width: 32,
    getValue: (j: JobOpening) => (Array.isArray(j.skillsRequired) ? j.skillsRequired.join('; ') : ''),
  },
  {
    key: 'priority',
    header: 'Priority Tier',
    description: 'Recruitment urgency level',
    allowedValues: 'High, Medium, Low',
    dataType: 'Text',
    width: 16,
    validationList: ['High', 'Medium', 'Low'],
    getValue: (j: JobOpening) => j.priority,
  },
  {
    key: 'status',
    header: 'Requisition Status',
    description: 'Hiring lifecycle status',
    allowedValues: 'Open, On Hold, Closed',
    dataType: 'Text',
    width: 18,
    validationList: ['Open', 'On Hold', 'Closed'],
    getValue: (j: JobOpening) => j.status,
  },
  {
    key: 'deadline',
    header: 'Target Deadline',
    description: 'Expected requisition closure date',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 18,
    getValue: (j: JobOpening) => (j.deadline ? new Date(j.deadline) : ''),
  },
  {
    key: 'assignedRecruiterNames',
    header: 'Assigned Recruiters',
    description: 'Recruitment team members on the mandate',
    allowedValues: 'Team members list',
    dataType: 'Text',
    width: 25,
    getValue: (j: JobOpening) =>
      Array.isArray(j.assignedRecruiterNames) ? j.assignedRecruiterNames.join(', ') : '',
  },
  {
    key: 'createdDate',
    header: 'Created Date',
    description: 'Date mandate was activated',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 18,
    getValue: (j: JobOpening) => getDateAnalysisHelpers(j.createdAt, j.createdAt).createdDate,
  },
];

export function generateJobsSummarySheet(
  wb: ExcelJS.Workbook,
  dataSheetName: string,
  _tableName: string,
  rowCount: number
) {
  const ws = wb.addWorksheet('Summary', { views: [{ showGridLines: true }] });

  ws.mergeCells('A1:C1');
  const title = ws.getCell('A1');
  title.value = 'BJ BRIGHT ENTERPRISES — JOB MANDATES PERFORMANCE SUMMARY';
  title.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  ws.getCell('A3').value = 'Total Active Requisitions';
  ws.getCell('B3').value = { formula: `COUNTIF(${dataSheetName}!L2:L${rowCount + 1}, "Open")` };
  ws.getCell('A4').value = 'Total Vacancies / Positions';
  ws.getCell('B4').value = { formula: `SUM(${dataSheetName}!E2:E${rowCount + 1})` };
  ws.getCell('A5').value = 'High Priority Mandates';
  ws.getCell('B5').value = { formula: `COUNTIF(${dataSheetName}!K2:K${rowCount + 1}, "High")` };
  ws.getCell('A6').value = 'Requisitions On Hold';
  ws.getCell('B6').value = { formula: `COUNTIF(${dataSheetName}!L2:L${rowCount + 1}, "On Hold")` };
  ws.getCell('A7').value = 'Average Max Budget (LPA)';
  ws.getCell('B7').value = { formula: `AVERAGE(${dataSheetName}!I2:I${rowCount + 1})` };
  ws.getCell('B7').numFmt = '₹#,##0.00 "LPA"';

  for (let r = 3; r <= 7; r++) {
    const row = ws.getRow(r);
    row.getCell(1).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    row.getCell(2).font = { bold: true, color: { argb: 'FF0F766E' } };
  }

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 22;
}

/**
 * INTERVIEWS EXPORT CONFIGURATION
 */
export const INTERVIEW_EXPORT_COLUMNS: ExportColumnDef[] = [
  {
    key: 'id',
    header: 'Interview ID',
    description: 'Unique interview schedule ID',
    allowedValues: 'int_xxxx',
    dataType: 'Text',
    width: 18,
    getValue: (i: Interview) => i.id,
  },
  {
    key: 'candidateName',
    header: 'Candidate Name',
    description: 'Candidate appearing for round',
    allowedValues: 'Candidate full name',
    dataType: 'Text',
    width: 25,
    getValue: (i: Interview) => i.candidateName,
  },
  {
    key: 'clientName',
    header: 'Client Company',
    description: 'Client holding the evaluation',
    allowedValues: 'Client company name',
    dataType: 'Text',
    width: 26,
    getValue: (i: Interview) => i.clientName,
  },
  {
    key: 'jobTitle',
    header: 'Requisition Title',
    description: 'Position under evaluation',
    allowedValues: 'Job Title',
    dataType: 'Text',
    width: 25,
    getValue: (i: Interview) => i.jobTitle,
  },
  {
    key: 'roundName',
    header: 'Evaluation Round',
    description: 'Name of the assessment round',
    allowedValues: 'L1 Technical, Managerial, HR Fitment, Final Round',
    dataType: 'Text',
    width: 22,
    getValue: (i: Interview) => i.roundName,
  },
  {
    key: 'dateTime',
    header: 'Interview Date & Time',
    description: 'Scheduled timestamp in IST',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 22,
    getValue: (i: Interview) => (i.dateTime ? new Date(i.dateTime) : ''),
  },
  {
    key: 'mode',
    header: 'Interview Mode',
    description: 'Logistics medium of round',
    allowedValues: 'Google Meet, In-Person (Noida Office), Telephonic',
    dataType: 'Text',
    width: 22,
    validationList: ['Google Meet', 'In-Person (Noida Office)', 'Telephonic'],
    getValue: (i: Interview) => i.mode,
  },
  {
    key: 'venueOrLink',
    header: 'Meeting Link / Venue',
    description: 'Google Meet link or conference room address',
    allowedValues: 'URL or physical room location',
    dataType: 'Text',
    width: 32,
    getValue: (i: Interview) => i.venueOrLink,
  },
  {
    key: 'interviewerName',
    header: 'Interviewer Name',
    description: 'Lead panel interviewer',
    allowedValues: 'Interviewer designation / name',
    dataType: 'Text',
    width: 22,
    getValue: (i: Interview) => i.interviewerName,
  },
  {
    key: 'status',
    header: 'Outcome / Status',
    description: 'Current status of the round',
    allowedValues: 'Scheduled, Completed, Cancelled, Rescheduled',
    dataType: 'Text',
    width: 20,
    validationList: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    getValue: (i: Interview) => i.status,
  },
  {
    key: 'feedback',
    header: 'Panel Feedback',
    description: 'Evaluation notes and remarks',
    allowedValues: 'Detailed feedback',
    dataType: 'Text',
    width: 35,
    getValue: (i: Interview) => i.feedback || '-',
  },
];

/**
 * PIPELINE EXPORT CONFIGURATION
 */
export const PIPELINE_EXPORT_COLUMNS: ExportColumnDef[] = [
  {
    key: 'id',
    header: 'Pipeline Item ID',
    description: 'Stage transition tracking ID',
    allowedValues: 'pipe_xxxx',
    dataType: 'Text',
    width: 18,
    getValue: (p: PipelineItem) => p.id,
  },
  {
    key: 'candidateName',
    header: 'Candidate Name',
    description: 'Applicant name',
    allowedValues: 'Candidate full name',
    dataType: 'Text',
    width: 25,
    getValue: (p: PipelineItem) => p.candidateName,
  },
  {
    key: 'candidatePhone',
    header: 'Candidate Mobile',
    description: 'Mobile phone preserved as text',
    allowedValues: 'Phone number',
    dataType: 'Text',
    width: 18,
    getValue: (p: PipelineItem) => p.candidatePhone,
  },
  {
    key: 'candidateEmail',
    header: 'Candidate Email',
    description: 'Candidate email address',
    allowedValues: 'Email ID',
    dataType: 'Text',
    width: 26,
    getValue: (p: PipelineItem) => p.candidateEmail,
  },
  {
    key: 'candidateExp',
    header: 'Experience (Years)',
    description: 'Total experience in years',
    allowedValues: 'Numeric',
    dataType: 'Number',
    format: '0.0',
    width: 18,
    getValue: (p: PipelineItem) => Number(p.candidateExp) || 0,
  },
  {
    key: 'candidateSalary',
    header: 'Expected CTC (LPA)',
    description: 'Expected annual package',
    allowedValues: 'Numeric LPA',
    dataType: 'Number',
    format: '#,##0.00',
    width: 18,
    getValue: (p: PipelineItem) => Number(p.candidateSalary) || 0,
  },
  {
    key: 'jobTitle',
    header: 'Applied Position',
    description: 'Target opening title',
    allowedValues: 'Job title',
    dataType: 'Text',
    width: 26,
    getValue: (p: PipelineItem) => p.jobTitle,
  },
  {
    key: 'clientName',
    header: 'Client Company',
    description: 'Client evaluating profile',
    allowedValues: 'Client company name',
    dataType: 'Text',
    width: 26,
    getValue: (p: PipelineItem) => p.clientName,
  },
  {
    key: 'stage',
    header: 'Hiring Stage',
    description: 'Current stage in talent funnel',
    allowedValues: 'Sourced, Screened, Submitted to Client, Interview, Offer, Joined, Rejected',
    dataType: 'Text',
    width: 22,
    validationList: [
      'Sourced',
      'Screened',
      'Submitted to Client',
      'Interview',
      'Offer',
      'Joined',
      'Rejected',
    ],
    getValue: (p: PipelineItem) => p.stage,
  },
  {
    key: 'lastMovedBy',
    header: 'Last Stage Transition By',
    description: 'Recruiter who logged last transition',
    allowedValues: 'User name',
    dataType: 'Text',
    width: 22,
    getValue: (p: PipelineItem) => p.lastMovedBy,
  },
  {
    key: 'updatedDate',
    header: 'Last Moved Timestamp',
    description: 'Timestamp of stage change',
    allowedValues: 'Real Excel Date (DD/MM/YYYY)',
    dataType: 'Date',
    width: 20,
    getValue: (p: PipelineItem) => (p.updatedAt ? new Date(p.updatedAt) : new Date()),
  },
];

/**
 * PERFORMANCE REPORT EXPORT CONFIGURATION
 */
export const PERFORMANCE_REPORT_EXPORT_COLUMNS: ExportColumnDef[] = [
  {
    key: 'userId',
    header: 'Team Member ID',
    description: 'User ID of consultant/recruiter',
    allowedValues: 'usr_xxxx',
    dataType: 'Text',
    width: 18,
    getValue: (r: any) => r.userId,
  },
  {
    key: 'userName',
    header: 'Team Member Name',
    description: 'Name of the consultant',
    allowedValues: 'Full user name',
    dataType: 'Text',
    width: 25,
    getValue: (r: any) => r.userName,
  },
  {
    key: 'userRole',
    header: 'Designation / Role',
    description: 'Role access tier in organization',
    allowedValues: 'Admin, Manager, Recruiter, HR Executive',
    dataType: 'Text',
    width: 22,
    getValue: (r: any) => r.userRole,
  },
  {
    key: 'candidatesSourced',
    header: 'Candidates Sourced',
    description: 'Count of candidates added/sourced',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.candidatesSourced) || 0,
  },
  {
    key: 'candidatesScreened',
    header: 'Candidates Screened',
    description: 'Count of candidates screened',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.candidatesScreened) || 0,
  },
  {
    key: 'interviewsScheduled',
    header: 'Interviews Scheduled',
    description: 'Client assessment interviews set up',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.interviewsScheduled) || 0,
  },
  {
    key: 'interviewsCompleted',
    header: 'Interviews Completed',
    description: 'Rounds conducted and concluded',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.interviewsCompleted) || 0,
  },
  {
    key: 'offersExtended',
    header: 'Offers Extended',
    description: 'Job offers rolled out to candidates',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.offersExtended) || 0,
  },
  {
    key: 'joiningsPlaced',
    header: 'Joinings Placed',
    description: 'Successful joins / revenue placements',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.joiningsPlaced) || 0,
  },
  {
    key: 'tasksCompleted',
    header: 'Tasks Completed',
    description: 'Archived reminder tasks marked Done',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.tasksCompleted) || 0,
  },
  {
    key: 'pendingOverdueTasks',
    header: 'Overdue Tasks',
    description: 'Pending tasks past deadline',
    allowedValues: 'Integer >= 0',
    dataType: 'Number',
    format: '#,##0',
    width: 18,
    getValue: (r: any) => Number(r.pendingOverdueTasks) || 0,
  },
  {
    key: 'conversionRatePercent',
    header: 'Conversion Rate %',
    description: 'Sourced-to-Joining ratio %',
    allowedValues: '0.0% to 100.0%',
    dataType: 'Number',
    format: '0.0"%"',
    width: 18,
    getValue: (r: any) => Number(r.conversionRatePercent) || 0,
  },
];

export function generatePerformanceSummarySheet(
  wb: ExcelJS.Workbook,
  dataSheetName: string,
  _tableName: string,
  rowCount: number
) {
  const ws = wb.addWorksheet('Summary', { views: [{ showGridLines: true }] });

  // Title Banner
  ws.mergeCells('A1:D1');
  const title = ws.getCell('A1');
  title.value = 'BJ BRIGHT ENTERPRISES — RECRUITMENT PERFORMANCE KPI SUMMARY';
  title.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F4B' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 32;

  // Key KPI Cards (Formula driven)
  const kpiRow = 3;
  ws.getCell(`A${kpiRow}`).value = 'Total Team Members';
  ws.getCell(`B${kpiRow}`).value = { formula: `COUNTA(${dataSheetName}!A2:A${rowCount + 1})` };
  ws.getCell(`C${kpiRow}`).value = 'Total Joinings Placed';
  ws.getCell(`D${kpiRow}`).value = { formula: `SUM(${dataSheetName}!H2:H${rowCount + 1})` };

  ws.getCell(`A${kpiRow + 1}`).value = 'Total Candidates Sourced';
  ws.getCell(`B${kpiRow + 1}`).value = { formula: `SUM(${dataSheetName}!C2:C${rowCount + 1})` };
  ws.getCell(`C${kpiRow + 1}`).value = 'Total Interviews Scheduled';
  ws.getCell(`D${kpiRow + 1}`).value = { formula: `SUM(${dataSheetName}!E2:E${rowCount + 1})` };

  ws.getCell(`A${kpiRow + 2}`).value = 'Total Job Offers Extended';
  ws.getCell(`B${kpiRow + 2}`).value = { formula: `SUM(${dataSheetName}!G2:G${rowCount + 1})` };
  ws.getCell(`C${kpiRow + 2}`).value = 'Total Tasks Completed';
  ws.getCell(`D${kpiRow + 2}`).value = { formula: `SUM(${dataSheetName}!I2:I${rowCount + 1})` };

  for (let r = kpiRow; r <= kpiRow + 2; r++) {
    const row = ws.getRow(r);
    row.getCell(1).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    row.getCell(2).font = { bold: true, color: { argb: 'FF1E293B' } };
    row.getCell(3).font = { bold: true, color: { argb: 'FF0B1F4B' } };
    row.getCell(4).font = { bold: true, color: { argb: 'FF1E293B' } };
    row.height = 22;
  }

  ws.columns = [
    { width: 28 },
    { width: 22 },
    { width: 28 },
    { width: 22 },
  ];
}

