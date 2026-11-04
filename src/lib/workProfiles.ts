import { WorkProfileCategory } from '../types/crm';

const SEED_CATEGORIES_RAW: Array<{ category: string; profiles: string[] }> = [
  {
    category: 'Telecalling and Customer Support',
    profiles: [
      'Telecaller (Outbound)',
      'Telecaller (Inbound)',
      'Customer Support Executive',
      'Customer Care Executive',
      'BPO / Voice Process',
      'Non-Voice Process',
      'Chat Support Executive',
      'Email Support Executive',
      'Technical Support Executive',
      'Collection / Recovery Executive',
      'Fundraising Executive',
      'Client Relationship Associate',
      'Tele Sales Executive',
      'Back Office Executive',
      'Data Entry Operator',
      'Receptionist / Front Desk',
      'Office Assistant',
    ],
  },
  {
    category: 'Sales and Marketing',
    profiles: [
      'Sales Executive',
      'Field Sales Executive',
      'Business Development Executive',
      'Inside Sales Executive',
      'Relationship Manager',
      'Area Sales Manager',
      'Sales Manager',
      'Marketing Executive',
      'Digital Marketing Executive',
      'Social Media Executive',
      'Telemarketing Executive',
      'Store Sales Executive',
      'Medical Representative',
    ],
  },
  {
    category: 'HR and Admin',
    profiles: [
      'HR Recruiter',
      'HR Executive',
      'HR Manager',
      'Talent Acquisition Specialist',
      'Payroll Executive',
      'Admin Executive',
      'Office Administrator',
      'Operations Executive',
      'Coordinator',
      'Executive Assistant',
      'Personal Assistant',
    ],
  },
  {
    category: 'Accounts, Finance and Banking',
    profiles: [
      'Accountant',
      'Senior Accountant',
      'Accounts Executive',
      'Tally Operator',
      'GST / Taxation Executive',
      'Auditor',
      'Finance Executive',
      'Banking Executive',
      'Loan / Credit Officer',
      'Insurance Advisor',
      'Claims Executive',
      'Underwriter',
      'Cashier',
    ],
  },
  {
    category: 'IT and Technical',
    profiles: [
      'Software Developer',
      'Web Developer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile App Developer',
      'QA / Software Tester',
      'Data Analyst',
      'Data Scientist',
      'Network Engineer',
      'System Administrator',
      'IT Support Engineer',
      'Cloud / DevOps Engineer',
      'UI / UX Designer',
      'Graphic Designer',
      'Video Editor',
      'Content Writer',
    ],
  },
  {
    category: 'Operations, Logistics and Manufacturing',
    profiles: [
      'Logistics Executive',
      'Warehouse Executive',
      'Supply Chain Executive',
      'Store Keeper',
      'Dispatch Executive',
      'Delivery Executive',
      'Driver',
      'Production Operator',
      'Machine Operator',
      'Quality Inspector',
      'Supervisor',
      'Technician',
      'Electrician',
      'Mechanic',
      'Maintenance Engineer',
      'Civil Engineer',
      'Mechanical Engineer',
      'Site Supervisor',
    ],
  },
  {
    category: 'Education, Healthcare and Services',
    profiles: [
      'Teacher',
      'Trainer',
      'Counsellor',
      'Nurse',
      'Lab Technician',
      'Pharmacist',
      'Medical Assistant',
      'Hotel / Hospitality Executive',
      'Chef / Cook',
      'Waiter / Steward',
      'Retail Executive',
      'Security Guard',
      'Housekeeping Staff',
      'Helper / Peon',
    ],
  },
  {
    category: 'Management',
    profiles: [
      'Team Leader',
      'Assistant Manager',
      'Manager',
      'Branch Manager',
      'Operations Manager',
    ],
  },
  {
    category: 'Fresher / Trainee',
    profiles: ['Fresher (Any Profile)', 'Intern / Trainee'],
  },
  {
    category: 'Other',
    profiles: ['Other'],
  },
];

export const DEFAULT_WORK_PROFILE_CATEGORIES: WorkProfileCategory[] =
  SEED_CATEGORIES_RAW.map((cat, cIdx) => ({
    id: `wpcat_${cIdx + 1}`,
    name: cat.category,
    active: true,
    order: cIdx + 1,
    profiles: cat.profiles.map((pName, pIdx) => ({
      id: `wp_${cIdx + 1}_${pIdx + 1}`,
      name: pName,
      active: true,
      order: pIdx + 1,
    })),
  }));

/**
 * Ensures categories are sorted by order, profiles inside each category are sorted by order,
 * and "Other" is always present as the very last option.
 */
export function ensureWorkProfileCategories(
  categories?: WorkProfileCategory[]
): WorkProfileCategory[] {
  const source =
    Array.isArray(categories) && categories.length > 0
      ? categories
      : DEFAULT_WORK_PROFILE_CATEGORIES;

  const sorted = [...source]
    .map((cat) => ({
      ...cat,
      profiles: Array.isArray(cat.profiles)
        ? [...cat.profiles].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [],
    }))
    .sort((a, b) => {
      if (a.name.toLowerCase() === 'other') return 1;
      if (b.name.toLowerCase() === 'other') return -1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const hasOther = sorted.some((c) => c.name.toLowerCase() === 'other');
  if (!hasOther) {
    sorted.push({
      id: 'wpcat_other',
      name: 'Other',
      active: true,
      order: 999,
      profiles: [{ id: 'wp_other_1', name: 'Other', active: true, order: 1 }],
    });
  }
  return sorted;
}

export function getAllFlatWorkProfiles(
  categories?: WorkProfileCategory[],
  includeInactive = false
): Array<{ name: string; category: string; active: boolean }> {
  const cats = ensureWorkProfileCategories(categories);
  const result: Array<{ name: string; category: string; active: boolean }> = [];
  cats.forEach((cat) => {
    if (!includeInactive && !cat.active) return;
    cat.profiles.forEach((p) => {
      if (!includeInactive && !p.active) return;
      result.push({
        name: p.name,
        category: cat.name,
        active: cat.active && p.active,
      });
    });
  });
  return result;
}

const UPPERCASE_ACRONYMS = new Set([
  'BPO',
  'HR',
  'IT',
  'QA',
  'UI',
  'UX',
  'GST',
  'MIS',
  'CRA',
  'LAP',
  'B2B',
  'B2C',
  'SEO',
  'SEM',
  'CRM',
  'CA',
  'CS',
]);

/**
 * Converts a custom work profile string to clean Title Case,
 * preserving acronyms and symbols like - / & ( ).
 */
export function toTitleCaseWorkProfile(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  return trimmed
    .split(' ')
    .map((token) => {
      // Handle tokens with slashes, hyphens, or parentheses
      return token
        .split(/([-\/()])/)
        .map((sub) => {
          if (!sub || /^[-\/()&]$/.test(sub)) return sub;
          const upper = sub.toUpperCase();
          if (UPPERCASE_ACRONYMS.has(upper)) return upper;
          if (sub.toLowerCase() === 'and') return 'and';
          return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
        })
        .join('');
    })
    .join(' ');
}

/**
 * Validates custom work profile when "Other" is chosen:
 * - Required
 * - 2 to 60 characters (after trim)
 * - Letters, numbers, spaces and - / & ( ) only
 */
export function validateCustomWorkProfile(input: string): {
  valid: boolean;
  error?: string;
  formatted: string;
} {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please type the work profile (2 to 60 characters).',
      formatted: '',
    };
  }
  if (trimmed.length < 2 || trimmed.length > 60) {
    return {
      valid: false,
      error: 'Work profile must be between 2 and 60 characters.',
      formatted: toTitleCaseWorkProfile(trimmed),
    };
  }
  const allowedRegex = /^[A-Za-z0-9\s\-\/&()]+$/;
  if (!allowedRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Only letters, numbers, spaces, and - / & ( ) are allowed.',
      formatted: toTitleCaseWorkProfile(trimmed),
    };
  }
  return {
    valid: true,
    formatted: toTitleCaseWorkProfile(trimmed),
  };
}

/**
 * Checks if typed text matches an existing profile in the master list (ignoring case and spaces).
 */
export function findMatchingExistingProfile(
  typed: string,
  categories?: WorkProfileCategory[]
): { name: string; category: string; active: boolean } | null {
  const normalizedInput = typed.toLowerCase().replace(/\s+/g, '');
  if (!normalizedInput || normalizedInput === 'other') return null;

  const allProfiles = getAllFlatWorkProfiles(categories, true);
  const found = allProfiles.find(
    (p) =>
      p.name.toLowerCase() !== 'other' &&
      p.name.toLowerCase().replace(/\s+/g, '') === normalizedInput
  );
  return found || null;
}

/**
 * Formats any date / ISO string / Firestore timestamp in IST as:
 * "DD/MM/YYYY, hh:mm AM/PM (IST)"
 */
export function formatISTDateTime(dateInput?: any): string {
  if (!dateInput) return '-';
  let dateObj: Date;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput?.toDate === 'function') {
    dateObj = dateInput.toDate();
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    // Handle YYYY-MM-DD strings without time
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      dateObj = new Date(`${dateInput.trim()}T10:00:00+05:30`);
    } else {
      dateObj = new Date(dateInput);
    }
  } else {
    return '-';
  }

  if (isNaN(dateObj.getTime())) return '-';

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(dateObj);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const dayPeriod = getPart('dayPeriod').toUpperCase();

  return `${day}/${month}/${year}, ${hour}:${minute} ${dayPeriod} (IST)`;
}

/**
 * Returns YYYY-MM-DD in Asia/Kolkata (IST) timezone for a given date/timestamp.
 */
export function getISTDateKey(dateInput?: any): string {
  if (!dateInput) return '';
  let dateObj: Date;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput?.toDate === 'function') {
    dateObj = dateInput.toDate();
  } else if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  } else {
    dateObj = new Date(dateInput);
  }
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export type EntryDateFilterOption =
  | 'All'
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'This Month'
  | 'Custom';

/**
 * Checks whether a candidate's entryDate (or fallback createdAt) matches the selected IST date filter.
 */
export function matchesEntryDateFilter(
  entryDate: string | undefined,
  createdAt: string | undefined,
  filterOption: EntryDateFilterOption,
  customFrom?: string,
  customTo?: string
): boolean {
  if (filterOption === 'All') return true;
  const recordDateKey = getISTDateKey(entryDate || createdAt);
  if (!recordDateKey) return false;

  const now = new Date();
  const todayKey = getISTDateKey(now);

  if (filterOption === 'Today') {
    return recordDateKey === todayKey;
  }

  if (filterOption === 'Yesterday') {
    const yest = new Date(now.getTime() - 86400000);
    const yesterdayKey = getISTDateKey(yest);
    return recordDateKey === yesterdayKey;
  }

  if (filterOption === 'This Week') {
    // Compute Monday of current week in IST
    const [y, m, d] = todayKey.split('-').map(Number);
    const istTodayDate = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = istTodayDate.getUTCDay(); // 0=Sun, 1=Mon...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayDate = new Date(istTodayDate.getTime() - diffToMonday * 86400000);
    const mondayKey = mondayDate.toISOString().slice(0, 10);
    return recordDateKey >= mondayKey && recordDateKey <= todayKey;
  }

  if (filterOption === 'This Month') {
    const currentMonthPrefix = todayKey.slice(0, 7); // YYYY-MM
    return recordDateKey.startsWith(currentMonthPrefix);
  }

  if (filterOption === 'Custom') {
    if (customFrom && recordDateKey < customFrom) return false;
    if (customTo && recordDateKey > customTo) return false;
    return true;
  }

  return true;
}
