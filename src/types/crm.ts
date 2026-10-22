/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager' | 'recruiter' | 'hr_executive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar: string;
  designation: string;
  active: boolean;
  password?: string;
}

export type CandidateStatus =
  | 'New'
  | 'Screened'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Offered'
  | 'Joined'
  | 'Rejected'
  | 'On Hold';

export interface CandidateNote {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  currentCompany: string;
  currentSalaryLPA: number;
  expectedSalaryLPA: number;
  experienceYears: number;
  skills: string[];
  education: string;
  source: 'Naukri' | 'LinkedIn' | 'Referral' | 'Walk-in' | 'Foundit' | 'Direct' | 'Internal Database';
  notes: CandidateNote[];
  assignedRecruiterId: string;
  assignedRecruiterName: string;
  status: CandidateStatus;
  jobId?: string;
  jobTitle?: string;
  isCustomPosition?: boolean;
  remarks?: string;
  statusRemark?: string;
  statusRemarkAt?: string;
  statusRemarkBy?: string;
  clientId?: string;
  clientName?: string;
  expectedJoiningDate?: string; // Shown when status is Selected or Offered
  deletedAt?: string; // For 30-day trash
  createdAt: string;
  updatedAt: string;
}

export interface ClientContactPerson {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
}

export type ClientStatus = 'Active' | 'Inactive' | 'Prospect';

export interface Client {
  id: string;
  name: string;
  industry: string;
  address: string;
  city: string;
  website: string;
  contactPersons: ClientContactPerson[];
  agreementDetails: string;
  commissionPercent: number;
  paymentTerms: string;
  status: ClientStatus;
  createdAt: string;
  assignedAccountManagerId: string;
  assignedAccountManagerName: string;
  activeJobsCount?: number;
  placedCandidatesCount?: number;
  deletedAt?: string; // For 30-day trash
}

export type JobPriority = 'High' | 'Medium' | 'Low';
export type JobStatus = 'Open' | 'On Hold' | 'Closed';

export interface JobOpening {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  location: string;
  positions: number;
  salaryMinLPA: number;
  salaryMaxLPA: number;
  minExpYears: number;
  maxExpYears: number;
  skillsRequired: string[];
  description: string;
  deadline: string;
  priority: JobPriority;
  status: JobStatus;
  assignedRecruiterIds: string[];
  assignedRecruiterNames: string[];
  createdAt: string;
  applicationsCount?: number;
  deletedAt?: string; // For 30-day trash
}

export type PipelineStage =
  | 'Sourced'
  | 'Screened'
  | 'Submitted to Client'
  | 'Interview'
  | 'Offer'
  | 'Joined'
  | 'Rejected';

export interface PipelineItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateExp: number;
  candidateSalary: number;
  candidateSkills: string[];
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  stage: PipelineStage;
  assignedRecruiterId: string;
  updatedAt: string;
  lastMovedBy: string;
}

export type InterviewMode = 'Google Meet' | 'In-Person (Noida Office)' | 'Telephonic';
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  clientId: string;
  clientName: string;
  jobId: string;
  jobTitle: string;
  roundName: string;
  dateTime: string;
  mode: InterviewMode;
  venueOrLink: string;
  interviewerName: string;
  status: InterviewStatus;
  feedback?: string;
  assignedToRecruiterId: string;
  isFollowUp?: boolean;
  notes?: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  body: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  currencySymbol: string;
  availableSkills: string[];
  availableSources: string[];
  availableIndustries: string[];
  whatsappTemplates?: WhatsAppTemplate[];
}

export type ReminderPriority = 'High' | 'Medium' | 'Low';
export type ReminderCategory = 'Follow-up' | 'Interview' | 'Client Follow-up' | 'Client Payment' | 'Candidate Task' | 'General';

export interface ReminderTask {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: ReminderPriority;
  status: 'Pending' | 'Completed';
  category: ReminderCategory;
  relatedType?: 'candidate' | 'client' | 'job' | 'invoice';
  relatedId?: string;
  relatedName?: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedByUserId?: string;
  assignedByUserName?: string;
  createdAt: string;
  snoozedUntil?: string;
  completedAt?: string;
}

export interface EditHistoryItem {
  id: string;
  entityId: string;
  entityType: 'candidate' | 'client' | 'job';
  editedByUserId: string;
  editedByUserName: string;
  editedByUserRole: string;
  timestamp: string;
  reason: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface CRMNotification {
  id: string;
  title: string;
  message: string;
  type: 'interview' | 'overdue' | 'candidate' | 'job' | 'stage';
  targetTab?: 'dashboard' | 'candidates' | 'clients' | 'jobs' | 'pipeline' | 'interviews' | 'tasks' | 'reports';
  targetId?: string;
  isRead: boolean;
  timestamp: string;
}

export interface ExportLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string;
  rowCount: number;
  scope: 'filtered' | 'all';
  filtersApplied?: string;
  timestamp: string;
}

export interface ImportLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string;
  fileName: string;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  timestamp: string;
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  module?: string;
  action: string;
  details: string;
  timestamp: string;
  category?: 'candidate' | 'client' | 'job' | 'interview' | 'user' | 'system';
}

export function formatIndianCurrency(num: number | undefined | null, includeDecimals = false): string {
  if (num === undefined || num === null || isNaN(num)) return '₹0';
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const rounded = includeDecimals ? absNum.toFixed(2) : Math.round(absNum).toString();
  const parts = rounded.split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const decimalPart = parts[1] ? `.${parts[1]}` : '';
  return `${isNegative ? '-' : ''}₹${res}${decimalPart}`;
}

export function formatIndianDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
