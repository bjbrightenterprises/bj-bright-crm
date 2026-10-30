import { Candidate, Client, JobOpening, PipelineItem, Interview, ActivityLogItem, User, CompanySettings, ReminderTask } from '../types/crm';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Praveen Verma',
    email: 'praveenverma1420@gmail.com',
    role: 'admin',
    phone: '+91 98180 12345',
    avatar: '/assets/aistudio/BJ-Bright-logo-circle_cb142036.png',
    designation: 'Managing Director & Principal Consultant',
    active: true,
  },
];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'BJ Bright Enterprises',
  tagline: 'Premier HR Consultancy, Executive Search & Skill Training',
  address: 'Suite 408, Tower B, Logix Cyber Park, Sector 62',
  city: 'Noida, Uttar Pradesh',
  pincode: '201309',
  phone: '+91 120 488 9200',
  email: 'contact@bjbrightenterprises.in',
  website: 'https://bjbrightenterprises.in',
  gstin: '09AAACB1234F1Z8',
  currencySymbol: '₹',
  availableSkills: [
    'React.js',
    'TypeScript',
    'Node.js',
    'Java Spring Boot',
    'Python',
    'AWS Cloud',
    'DevOps & Docker',
    'PostgreSQL / SQL',
    'Angular',
    'Talent Acquisition',
    'HR Compliance & Payroll',
    'B2B Corporate Sales',
    'Financial Modeling',
    'UI/UX Figma',
    'Machine Learning',
    'Customer Success',
  ],
  availableSources: [
    'Naukri',
    'LinkedIn',
    'Referral',
    'Walk-in',
    'Foundit',
    'Direct',
    'Internal Database',
  ],
  availableIndustries: [
    'Information Technology & Services',
    'Fintech & Payments',
    'E-Commerce & Retail',
    'Banking & Financial Services',
    'Telecom & Infrastructure',
    'FMCG & Food Tech',
    'Healthcare & Pharma',
    'Manufacturing & Auto',
  ],
};

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_JOBS: JobOpening[] = [];

export const INITIAL_CANDIDATES: Candidate[] = [];

export const INITIAL_PIPELINE: PipelineItem[] = [];

export const INITIAL_INTERVIEWS: Interview[] = [];

export const INITIAL_REMINDERS: ReminderTask[] = [];

export const INITIAL_ACTIVITIES: ActivityLogItem[] = [];
