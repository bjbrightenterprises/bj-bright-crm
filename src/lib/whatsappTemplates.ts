import { Candidate, CandidateStatus, WhatsAppTemplate } from '../types/crm';

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'intro',
    title: 'Introduction / Job opportunity',
    body: 'Hi {name}, this is {recruiter} from BJ Bright Enterprises, Noida. We came across your profile and have an exciting opportunity for {position}{company} matching your experience. Are you currently exploring new roles? Looking forward to connecting!',
  },
  {
    id: 'interview_invitation',
    title: 'Interview invitation',
    body: 'Dear {name}, we are pleased to invite you for an interview for the {position} role{company}. Date: {date}, Time: {time}, Mode/Location: {location}. Please confirm your availability.',
  },
  {
    id: 'interview_reminder',
    title: 'Interview reminder',
    body: 'Hi {name}, this is a gentle reminder regarding your interview for {position}{company} scheduled on {date} at {time} ({location}). Please ensure you are available 5 minutes prior. Best of luck!',
  },
  {
    id: 'documents_request',
    title: 'Documents request',
    body: 'Dear {name}, to proceed with your application for {position}{company}, please share your updated resume, latest 3 months payslips, and educational certificates at your earliest convenience. Regards, {recruiter} (BJ Bright Enterprises).',
  },
  {
    id: 'selected_offer',
    title: 'Selected / Offer',
    body: 'Heartiest Congratulations {name}! You have been selected for the {position} role{company}. We are currently processing your official offer letter and onboarding schedule. Feel free to reach out if you have any questions.',
  },
  {
    id: 'joining_details',
    title: 'Joining details',
    body: 'Dear {name}, welcome aboard! Your joining date for {position}{company} is confirmed for {date} at {time}. Reporting location: {location}. We wish you a successful journey ahead!',
  },
  {
    id: 'rejected_polite',
    title: 'Rejected (polite)',
    body: 'Dear {name}, thank you for your time and interest in the {position} role{company}. While we were impressed with your background, we have decided to proceed with another profile whose experience more closely matches this specific requirement. We will retain your profile for future opportunities.',
  },
  {
    id: 'on_hold_update',
    title: 'On hold update',
    body: 'Hi {name}, this is a quick update regarding your application for {position}{company}. The hiring team has placed the position on temporary hold. We will reach back out as soon as hiring resumes. Thank you for your patience.',
  },
  {
    id: 'follow_up',
    title: 'Follow-up',
    body: 'Hi {name}, following up regarding our discussion on the {position} opportunity{company}. Please let us know your current availability for a brief call.',
  },
  {
    id: 'custom_message',
    title: 'Custom message',
    body: 'Hi {name}, hope you are doing well.',
  },
];

/**
 * Normalises phone number for WhatsApp wa.me links:
 * - Removes spaces, "+", "-", brackets
 * - If 10 digits, prepends country code 91
 * - Validates 11-15 digits
 */
export function normalizeWhatsAppNumber(phone: string | undefined | null): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (!phone || !phone.trim()) {
    return { valid: false, normalized: '', error: 'Phone number is missing.' };
  }

  // Remove spaces, +, -, (, )
  let cleaned = phone.replace(/[\s+\-()]/g, '').trim();

  // Strip leading zero if 11 digits (e.g. 09811012345 -> 9811012345)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits (standard Indian mobile), prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  // Validate length: 11-15 digits
  if (/^\d{11,15}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    normalized: cleaned,
    error: 'Invalid WhatsApp number (must be 10-15 digits).',
  };
}

/**
 * Replaces placeholders: {name}, {position}, {company}, {recruiter}, {date}, {time}, {location}.
 * Unknown placeholders stay empty and never show "undefined".
 */
export function replaceTemplatePlaceholders(
  templateBody: string,
  candidate: Candidate,
  recruiterName: string,
  extra?: { date?: string; time?: string; location?: string }
): string {
  const companyStr = candidate.clientName ? ` with ${candidate.clientName}` : '';
  const replacements: Record<string, string> = {
    name: candidate.fullName || '',
    position: candidate.jobTitle || 'the applied role',
    company: companyStr,
    recruiter: recruiterName || 'BJ Bright HR Team',
    date: extra?.date || candidate.expectedJoiningDate || '',
    time: extra?.time || '',
    location: extra?.location || candidate.city || 'Noida Office',
  };

  return templateBody.replace(/\{(\w+)\}/g, (_, key) => {
    return replacements[key] ?? '';
  });
}

/**
 * Auto-suggests template based on candidate's status
 */
export function suggestTemplateForStatus(status: CandidateStatus): string {
  switch (status) {
    case 'Interview Scheduled':
      return 'interview_invitation';
    case 'Selected':
    case 'Offered':
      return 'selected_offer';
    case 'Joined':
      return 'joining_details';
    case 'Rejected':
      return 'rejected_polite';
    case 'On Hold':
      return 'on_hold_update';
    case 'Shortlisted':
      return 'documents_request';
    case 'Screened':
    case 'New':
    default:
      return 'intro';
  }
}
