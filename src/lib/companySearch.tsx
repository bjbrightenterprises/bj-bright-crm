import React, { useState, useEffect } from 'react';
import {
  Client,
  ClientSection,
  CLIENT_SECTION_LABELS,
  CompanyHiringRequirement,
  JobOpening,
  getClientSection,
} from '../types/crm';
import { Phone, MessageCircle, Copy, Check } from 'lucide-react';

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Formats an integer amount in Indian number system without currency symbol (e.g. 15100 -> "15,100").
 */
export function formatRsDigits(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num <= 0) return '0';
  const rounded = Math.round(Math.abs(num)).toString();
  let lastThree = rounded.substring(rounded.length - 3);
  const otherNumbers = rounded.substring(0, rounded.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
}

/**
 * Formats monthly salary (Rs per month), LPA equivalent, and extras note.
 */
export function formatMonthlySalaryParts(
  salaryMin?: number,
  salaryMax?: number,
  extras?: string
): {
  monthlyText: string;
  lpaText: string;
  extrasText: string;
  combinedExportSalary: string;
} {
  const minVal = Number(salaryMin) || 0;
  const maxVal = Number(salaryMax) || minVal;

  if (minVal <= 0 && maxVal <= 0) {
    const cleanExt = (extras || '').trim();
    const formattedExt = cleanExt
      ? cleanExt.startsWith('+')
        ? cleanExt
        : `+ ${cleanExt}`
      : '';
    return {
      monthlyText: 'As per company norms',
      lpaText: '',
      extrasText: formattedExt,
      combinedExportSalary: formattedExt
        ? `As per company norms ${formattedExt}`
        : 'As per company norms',
    };
  }

  const effectiveMin = minVal > 0 ? minVal : maxVal;
  const effectiveMax = maxVal >= effectiveMin ? maxVal : effectiveMin;

  const monthlyText =
    effectiveMin === effectiveMax
      ? `Rs ${formatRsDigits(effectiveMin)} per month`
      : `Rs ${formatRsDigits(effectiveMin)} - ${formatRsDigits(effectiveMax)} per month`;

  const minLpa = ((effectiveMin * 12) / 100000).toFixed(2).replace(/\.00$/, '');
  const maxLpa = ((effectiveMax * 12) / 100000).toFixed(2).replace(/\.00$/, '');
  const lpaText =
    effectiveMin === effectiveMax ? `(${minLpa} LPA)` : `(${minLpa} - ${maxLpa} LPA)`;

  const cleanExtras = (extras || '').trim().replace(/^\+\s*/, '');
  const extrasText = cleanExtras ? `+ ${cleanExtras}` : '';

  const combinedExportSalary = [monthlyText, lpaText, extrasText]
    .filter(Boolean)
    .join(' ');

  return {
    monthlyText,
    lpaText,
    extrasText,
    combinedExportSalary,
  };
}

/**
 * Pre-filled structured hiring requirements for the starter companies,
 * especially Smile India Trust and BJ Bright Enterprises (Internal).
 */
export function getDefaultHiringRequirementsForCompany(
  client: Partial<Client>
): CompanyHiringRequirement[] {
  const lowerName = (client.name || '').trim().toLowerCase();
  const id = client.id || '';

  if (id === 'cli_1' || lowerName.includes('smile india trust')) {
    return [
      {
        id: 'req_smile_1',
        profile: 'Client Relationship Associate (CRA) - Outbound Telecalling',
        profileIsCustom: false,
        location: 'A-100, Sector 4, near Sector 16 Metro Station, Noida',
        salaryMin: 15100,
        salaryMax: 15100,
        extras: 'Rs 500 attendance bonus + unlimited incentives + ESI as applicable',
        openings: 15,
        gender: 'Female candidates only',
        ageRange: '18 to below 30',
        qualification: '12th pass / graduation pursuing / graduate',
        experience: 'Freshers can apply',
        communication: 'Basic communication (Fund Collection / Fundraising process)',
        esi: 'ESI as applicable',
        attendanceBonus: 'Rs 500 attendance bonus',
        incentives: 'Unlimited incentives',
        weeklyOff: 'Sunday fixed weekly off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '9:30 AM to 5:30 PM',
      },
    ];
  }

  if (id === 'cli_2' || lowerName.includes('bj bright enterprises')) {
    return [
      {
        id: 'req_bjbright_1',
        profile: 'HR Recruiter',
        profileIsCustom: false,
        location: 'H-213, Lohia Road, Sector 63, Noida',
        salaryMin: 13000,
        salaryMax: 18000,
        extras: 'incentives and growth opportunities',
        openings: 10,
        gender: 'Male / Female',
        ageRange: '18 to 32 years',
        qualification: '12th pass / Graduate',
        experience: 'Freshers and experienced can apply',
        communication:
          'Good communication and convincing skills, basic recruitment knowledge, sourcing and initial screening, target oriented',
        esi: 'As per policy',
        attendanceBonus: 'Performance based',
        incentives: 'Incentives and growth opportunities',
        weeklyOff: 'Sunday fixed off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '11:00 AM to 4:30 PM',
      },
    ];
  }

  if (id === 'cli_3' || lowerName.includes('mymoneymantra fintech')) {
    return [
      {
        id: 'req_mmm_1',
        profile: 'Tele Sales Executive',
        profileIsCustom: false,
        location: 'C-89, 3rd Floor, Sector-2, Noida, near Sector-15 Metro Station',
        salaryMin: 15000,
        salaryMax: 22000,
        extras: 'ESI + attractive incentives + cash rewards',
        openings: 12,
        gender: 'Male / Female',
        ageRange: '18 to 35 years',
        qualification: '12th pass / Graduate',
        experience: 'Experience in Tele Sales / Sales / Business Development (Finance background preferred)',
        communication: 'Good communication and convincing skills, basic knowledge of banking, loans, or financial products',
        esi: 'ESI applicable',
        attendanceBonus: 'Cash rewards',
        incentives: 'Attractive incentives + cash rewards',
        weeklyOff: 'Sunday off',
        workingHours: '9:30 AM to 6:30 PM (Day Shift)',
        interviewTiming: '10:00 AM to 5:00 PM',
      },
    ];
  }

  if (id === 'cli_4' || lowerName.includes('tyariexamki')) {
    return [
      {
        id: 'req_tyari_1',
        profile: 'Tele Sales Executive',
        profileIsCustom: false,
        location: 'A-16, 1st Floor, Rajouri Garden, New Delhi - 110059 (Near Blue Line Metro Gate No. 5)',
        salaryMin: 15000,
        salaryMax: 25000,
        extras: 'performance incentives (bring hardcopy print of resume)',
        openings: 6,
        gender: 'Male / Female',
        ageRange: '18 to 32 years',
        qualification: '12th pass / Graduate',
        experience: 'Minimum 6 months - 3 years (Sales / Telecalling / Education sector preferred)',
        communication: 'Excellent communication & persuasion skills, CRM tools & WhatsApp automation',
        esi: 'As per norms',
        attendanceBonus: '-',
        incentives: 'Performance-based incentives',
        weeklyOff: 'Weekly off as per roster',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '10:30 AM to 5:00 PM (Bring hardcopy resume)',
      },
      {
        id: 'req_tyari_2',
        profile: 'Counsellor',
        profileIsCustom: false,
        location: 'A-16, 1st Floor, Rajouri Garden, New Delhi - 110059 (Near Blue Line Metro Gate No. 5)',
        salaryMin: 15000,
        salaryMax: 25000,
        extras: 'performance incentives (Tele Counselor - Full-Time)',
        openings: 6,
        gender: 'Male / Female',
        ageRange: '18 to 32 years',
        qualification: 'Graduate preferred',
        experience: 'Minimum 6 months - 3 years (Education / Telecalling / Sales preferred)',
        communication: 'Excellent communication, objection-handling & persuasion skills',
        esi: 'As per norms',
        attendanceBonus: '-',
        incentives: 'Performance-based incentives',
        weeklyOff: 'Weekly off as per roster',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '10:30 AM to 5:00 PM (Bring hardcopy resume)',
      },
    ];
  }

  if (id === 'cli_5' || lowerName.includes('perfect capital')) {
    return [
      {
        id: 'req_pcs_1',
        profile: 'Telecaller (Outbound)',
        profileIsCustom: false,
        location: 'Sector-7, Rohini, Delhi',
        salaryMin: 15000,
        salaryMax: 22000,
        extras: 'incentives on Secured & Unsecured Loans (Car, Home, Business, LAP, Personal Loans)',
        openings: 8,
        gender: 'Male / Female',
        ageRange: '19 to 35 years',
        qualification: '12th pass / Graduate',
        experience: 'Experienced callers in secured and unsecured loans (No Gold Loans)',
        communication: 'Good loan telecalling and convincing skills',
        esi: '-',
        attendanceBonus: '-',
        incentives: 'Attractive loan disbursal incentives',
        weeklyOff: 'Sunday fixed off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '11:00 AM to 5:00 PM',
      },
      {
        id: 'req_pcs_2',
        profile: 'Team Leader',
        profileIsCustom: false,
        location: 'Sector-7, Rohini, Delhi',
        salaryMin: 20000,
        salaryMax: 30000,
        extras: 'team incentives (Secured & Unsecured Loan processes)',
        openings: 2,
        gender: 'Male / Female',
        ageRange: '22 to 38 years',
        qualification: 'Graduate',
        experience: '2 to 6 years as Team Leader in secured and unsecured loan processes',
        communication: 'Strong team management and loan product expertise',
        esi: '-',
        attendanceBonus: '-',
        incentives: 'Team target incentives',
        weeklyOff: 'Sunday fixed off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '11:00 AM to 5:00 PM',
      },
    ];
  }

  if (id === 'cli_6' || lowerName.includes('raaj khosla')) {
    return [
      {
        id: 'req_rkc_1',
        profile: 'Business Development Executive',
        profileIsCustom: false,
        location: 'Sector-2, Noida & Connaught Place, New Delhi',
        salaryMin: 15000,
        salaryMax: 21000,
        extras: 'ESI + attractive incentives & cash rewards',
        openings: 15,
        gender: 'Male / Female',
        ageRange: '19 to 35 years',
        qualification: '12th pass / Graduate',
        experience: 'Experienced candidates (finance or sales background preferred)',
        communication: 'Good communication, sales, and convincing skills (PL, HL, LAP, BL & Credit Cards)',
        esi: 'ESI applicable',
        attendanceBonus: 'Cash rewards',
        incentives: 'Attractive incentives & cash rewards',
        weeklyOff: 'Sunday off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '10:00 AM to 5:00 PM',
      },
    ];
  }

  if (id === 'cli_7' || lowerName.includes('debt & dues')) {
    return [
      {
        id: 'req_ddr_1',
        profile: 'Collection / Recovery Executive',
        profileIsCustom: false,
        location: 'Sector-1, Vaishali, Ghaziabad (Delhi NCR)',
        salaryMin: 18000,
        salaryMax: 22000,
        extras: 'recovery incentives (4 Telecallers, min 2 yrs exp; 1 with credit card collection + bike)',
        openings: 4,
        gender: 'Male / Female',
        ageRange: '20 to 36 years',
        qualification: '12th pass / Graduate',
        experience: 'Minimum 2 years experience in collections',
        communication: 'Strong debt recovery & negotiation communication',
        esi: '-',
        attendanceBonus: '-',
        incentives: 'Collection performance incentives',
        weeklyOff: 'Sunday off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '10:30 AM to 5:00 PM',
      },
      {
        id: 'req_ddr_2',
        profile: 'Field Sales Executive',
        profileIsCustom: false,
        location: 'Sector-1, Vaishali, Ghaziabad (Delhi NCR Field)',
        salaryMin: 18000,
        salaryMax: 22000,
        extras: 'field allowances + incentives (2 Experienced Male Field Executives for Collections)',
        openings: 2,
        gender: 'Male candidates only',
        ageRange: '21 to 38 years',
        qualification: '12th pass / Graduate',
        experience: 'Minimum 2 years experience in Delhi NCR field collections',
        communication: 'Good field recovery & customer handling skills',
        esi: '-',
        attendanceBonus: '-',
        incentives: 'Field collection incentives',
        weeklyOff: 'Sunday off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '10:30 AM to 5:00 PM',
      },
      {
        id: 'req_ddr_3',
        profile: 'MIS Executive & Customer Reports Management',
        profileIsCustom: true,
        location: 'Sector-1, Vaishali, Ghaziabad',
        salaryMin: 25000,
        salaryMax: 25000,
        extras: 'fixed salary (Female candidate only)',
        openings: 1,
        gender: 'Female candidate only',
        ageRange: '20 to 35 years',
        qualification: 'Graduate',
        experience: '1 to 5 years in MIS Reporting & Customer Reports Management',
        communication: 'Good communication & advanced MS Excel / MIS skills',
        esi: '-',
        attendanceBonus: '-',
        incentives: 'Fixed Rs 25,000 per month',
        weeklyOff: 'Sunday off',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '10:30 AM to 5:00 PM',
      },
    ];
  }

  if (id === 'cli_8' || lowerName.includes('nn pure herbs')) {
    return [
      {
        id: 'req_nn_1',
        profile: 'Sales Executive',
        profileIsCustom: false,
        location: 'H-20, H-Block, Parbhat 63 Building, Sector 63, Noida, near Electronic City Metro Station',
        salaryMin: 15000,
        salaryMax: 25000,
        extras: 'incentives (Ayurvedic Medicine Sales - Immediate Joiners Preferred)',
        openings: 12,
        gender: 'Male / Female',
        ageRange: '18 to 35 years',
        qualification: '12th pass / Graduate',
        experience: 'Sales experience preferred (Immediate joiners preferred)',
        communication: 'Good communication and convincing skills',
        esi: '-',
        attendanceBonus: '-',
        incentives: 'Sales performance incentives',
        weeklyOff: 'Weekly off as per roster',
        workingHours: '9:30 AM to 6:30 PM',
        interviewTiming: '10:30 AM to 5:00 PM',
      },
    ];
  }

  if (id === 'cli_9' || lowerName.includes('loan process consultancy')) {
    return [
      {
        id: 'req_lpc_1',
        profile: 'Tele Sales Executive',
        profileIsCustom: false,
        location: 'C-112, Sector-2, Noida',
        salaryMin: 13000,
        salaryMax: 18000,
        extras: 'incentives (Fresher Rs 13,000/month + Incentive; Experienced Rs 18,000/month + Incentive)',
        openings: 10,
        gender: 'Male / Female',
        ageRange: '18 to 32 years',
        qualification: '12th pass / Graduate',
        experience: 'Freshers (Rs 13,000) & Experienced (Rs 18,000)',
        communication: 'Good customer convincing skills (Loan Process)',
        esi: '-',
        attendanceBonus: '-',
        incentives: 'Loan process incentives',
        weeklyOff: 'Sunday fixed off (6 days working)',
        workingHours: '10:00 AM to 6:30 PM',
        interviewTiming: '10:30 AM to 5:00 PM',
      },
    ];
  }

  return [];
}

/**
 * Resolves the Call Summary rows for a company.
 * When a company has linked Job Openings, shows those rows in the Call Summary
 * (enriched with structured fields from client.hiringRequirements so there is no duplication).
 * When a company has no linked Job Openings (or has additional direct requirements), shows client.hiringRequirements.
 */
export function getCompanyCallSummaryRows(
  client: Client,
  allJobs?: JobOpening[]
): CompanyHiringRequirement[] {
  const directReqs =
    Array.isArray(client.hiringRequirements) && client.hiringRequirements.length > 0
      ? client.hiringRequirements
      : getDefaultHiringRequirementsForCompany(client);

  const linkedJobs = Array.isArray(allJobs)
    ? allJobs.filter(
        (j) => j.clientId === client.id && !j.deletedAt && j.status !== 'Closed'
      )
    : [];

  if (linkedJobs.length === 0) {
    if (directReqs.length > 0) return directReqs;
    const fallbackLoc = [client.address, client.city].filter(Boolean).join(', ') || client.city || 'Noida';
    return [
      {
        id: `fallback_${client.id}`,
        profile: 'Open Hiring Requirement',
        location: fallbackLoc,
        salaryMin: 0,
        salaryMax: 0,
        extras: '',
      },
    ];
  }

  // Merge linkedJobs with directReqs without duplicating rows
  const usedDirectReqIndices = new Set<number>();
  const rowsFromJobs: CompanyHiringRequirement[] = linkedJobs.map((job, idx) => {
    const jobTitleNorm = (job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedIdx = directReqs.findIndex((r, rIdx) => {
      if (usedDirectReqIndices.has(rIdx)) return false;
      const rNorm = (r.profile || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        rNorm.length >= 3 &&
        (jobTitleNorm.includes(rNorm) || rNorm.includes(jobTitleNorm))
      );
    });

    if (matchedIdx === -1 && idx < directReqs.length && !usedDirectReqIndices.has(idx)) {
      matchedIdx = idx;
    }

    const matchedReq = matchedIdx !== -1 ? directReqs[matchedIdx] : undefined;
    if (matchedIdx !== -1) {
      usedDirectReqIndices.add(matchedIdx);
    }

    const jobMinMonthly = Math.round(((Number(job.salaryMinLPA) || 0) * 100000) / 12 / 100) * 100;
    const jobMaxMonthly = Math.round(((Number(job.salaryMaxLPA) || 0) * 100000) / 12 / 100) * 100;

    return {
      id: matchedReq?.id || job.id,
      profile: matchedReq?.profile || job.title,
      profileIsCustom: matchedReq?.profileIsCustom,
      location:
        matchedReq?.location ||
        job.location ||
        [client.address, client.city].filter(Boolean).join(', '),
      salaryMin: matchedReq?.salaryMin && matchedReq.salaryMin > 0 ? matchedReq.salaryMin : jobMinMonthly,
      salaryMax: matchedReq?.salaryMax && matchedReq.salaryMax > 0 ? matchedReq.salaryMax : jobMaxMonthly,
      extras: matchedReq?.extras || '',
      openings: matchedReq?.openings ?? job.positions,
      gender: matchedReq?.gender,
      ageRange: matchedReq?.ageRange,
      qualification: matchedReq?.qualification,
      experience:
        matchedReq?.experience ||
        (job.minExpYears === 0
          ? `Freshers & up to ${job.maxExpYears} yrs can apply`
          : `${job.minExpYears} - ${job.maxExpYears} years`),
      communication:
        matchedReq?.communication ||
        (Array.isArray(job.skillsRequired) ? job.skillsRequired.join(', ') : ''),
      esi: matchedReq?.esi,
      attendanceBonus: matchedReq?.attendanceBonus,
      incentives: matchedReq?.incentives,
      weeklyOff: matchedReq?.weeklyOff,
      workingHours: matchedReq?.workingHours,
      interviewTiming: matchedReq?.interviewTiming,
    };
  });

  // Also include any additional direct requirements added on the company that weren't matched to a job
  directReqs.forEach((req, idx) => {
    if (!usedDirectReqIndices.has(idx)) {
      rowsFromJobs.push(req);
    }
  });

  return rowsFromJobs;
}

/**
 * Builds ready-to-read call details text for clipboard copy (WhatsApp / phone script).
 */
export function buildCopyCallDetailsText(client: Client, allJobs?: JobOpening[]): string {
  const rows = getCompanyCallSummaryRows(client, allJobs);
  const lines: string[] = [];

  lines.push(`Company: ${client.name}`);

  rows.forEach((row, idx) => {
    const sal = formatMonthlySalaryParts(row.salaryMin, row.salaryMax, row.extras);
    const prefix = rows.length > 1 ? `[Requirement ${idx + 1}] ` : '';
    lines.push(`${prefix}Profile: ${row.profile}`);
    lines.push(`Location: ${row.location || `${client.address}, ${client.city}`}`);
    lines.push(
      `Salary: ${sal.monthlyText}${sal.lpaText ? ` ${sal.lpaText}` : ''}${
        sal.extrasText ? ` ${sal.extrasText}` : ''
      }`
    );

    const eligParts = [
      row.gender ? `Gender: ${row.gender}` : '',
      row.ageRange ? `Age: ${row.ageRange}` : '',
      row.qualification ? `Qualification: ${row.qualification}` : '',
      row.experience ? `Experience: ${row.experience}` : '',
      row.communication ? `Skills/Comm: ${row.communication}` : '',
    ].filter(Boolean);
    if (eligParts.length > 0) {
      lines.push(`Eligibility: ${eligParts.join(' | ')}`);
    }

    const timingParts = [
      row.workingHours ? `Timing: ${row.workingHours}` : '',
      row.weeklyOff ? `Weekly Off: ${row.weeklyOff}` : '',
      row.interviewTiming ? `Interview Timing: ${row.interviewTiming}` : '',
    ].filter(Boolean);
    if (timingParts.length > 0) {
      lines.push(timingParts.join(' | '));
    }
  });

  const contacts = (client.contactPersons || [])
    .filter((cp) => cp.phone)
    .map((cp) => `${cp.name ? `${cp.name}: ` : ''}${cp.phone}`);
  if (contacts.length > 0) {
    lines.push(`Contact: ${contacts.join(' / ')}`);
  }

  return lines.join('\n');
}

/**
 * Formats a phone string for wa.me link (digits only, with 91 country code).
 */
export function formatWhatsAppPhone(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Strips spaces, dots, dashes, and common punctuation for forgiving comparison.
 * e.g. "Info Edge (India) Ltd." -> "infoedgeindialtd"
 */
export function normalizeCompact(str: string): string {
  return (str || '').toLowerCase().replace(/[\s.\-_(),/\\+'":;]+/g, '');
}

/**
 * Computes Damerau-Levenshtein distance bounded at maxDist = 1 (or 2).
 * Fast O(N) early-exit check for distance <= 1.
 */
export function isEditDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < lenA && j < lenB) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      edits++;
      if (edits > 1) return false;

      if (
        i + 1 < lenA &&
        j + 1 < lenB &&
        a[i] === b[j + 1] &&
        a[i + 1] === b[j]
      ) {
        i += 2;
        j += 2;
      } else if (lenA > lenB) {
        i++;
      } else if (lenB > lenA) {
        j++;
      } else {
        i++;
        j++;
      }
    }
  }

  if (i < lenA || j < lenB) {
    edits++;
  }

  return edits <= 1;
}

export function isEditDistanceAtMostTwo(a: string, b: string): boolean {
  if (isEditDistanceAtMostOne(a, b)) return true;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 2) return false;

  const dp: number[] = Array.from({ length: lenB + 1 }, (_, idx) => idx);
  for (let i = 1; i <= lenA; i++) {
    let prev = dp[0];
    dp[0] = i;
    let minRow = dp[0];
    for (let j = 1; j <= lenB; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
      if (dp[j] < minRow) minRow = dp[j];
    }
    if (minRow > 2) return false;
  }
  return dp[lenB] <= 2;
}

interface IndexedClient {
  lowerName: string;
  compactName: string;
  lowerFullText: string;
  compactFullText: string;
  nameWords: string[];
  latestRemarkText: string;
}

const clientIndexCache = new WeakMap<Client, IndexedClient>();

function getIndexedClient(client: Client): IndexedClient {
  const cached = clientIndexCache.get(client);
  if (cached) return cached;

  const contacts = Array.isArray(client.contactPersons) ? client.contactPersons : [];
  const remarks = Array.isArray(client.remarks) ? client.remarks : [];
  const reqs =
    Array.isArray(client.hiringRequirements) && client.hiringRequirements.length > 0
      ? client.hiringRequirements
      : getDefaultHiringRequirementsForCompany(client);

  const sortedRemarks = [...remarks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestRemarkText = sortedRemarks[0]?.text || '';

  const contactStrings = contacts
    .map((cp) => `${cp.name || ''} ${cp.phone || ''} ${cp.email || ''} ${cp.designation || ''}`)
    .join(' ');
  const remarkStrings = remarks.map((r) => r.text || '').join(' ');
  const reqStrings = reqs
    .map(
      (r) =>
        `${r.profile || ''} ${r.location || ''} ${r.salaryMin || ''} ${r.salaryMax || ''} ${
          r.extras || ''
        }`
    )
    .join(' ');

  const rawFull = [
    client.name || '',
    client.industry || '',
    client.city || '',
    client.address || '',
    client.website || '',
    client.agreementDetails || '',
    contactStrings,
    remarkStrings,
    reqStrings,
  ].join(' ');

  const lowerName = (client.name || '').toLowerCase();
  const compactName = normalizeCompact(client.name || '');
  const lowerFullText = rawFull.toLowerCase();
  const compactFullText = normalizeCompact(rawFull);

  const rawNames = `${client.name || ''} ${contacts.map((c) => c.name || '').join(' ')}`.toLowerCase();
  const nameWords = rawNames
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

  if (compactName.length >= 3) {
    nameWords.push(compactName);
  }

  const indexed: IndexedClient = {
    lowerName,
    compactName,
    lowerFullText,
    compactFullText,
    nameWords,
    latestRemarkText,
  };

  clientIndexCache.set(client, indexed);
  return indexed;
}

function tokenMatchesNameWithOneTypo(qToken: string, nameWords: string[]): boolean {
  if (qToken.length < 3) return false;
  for (let i = 0; i < nameWords.length; i++) {
    const word = nameWords[i];
    if (isEditDistanceAtMostOne(qToken, word)) {
      return true;
    }
    if (qToken.length >= 4 && word.length > qToken.length) {
      const prefixSameLen = word.slice(0, qToken.length);
      if (isEditDistanceAtMostOne(qToken, prefixSameLen)) {
        return true;
      }
    }
  }
  return false;
}

export function searchCompanies(clients: Client[], rawQuery: string): Client[] {
  const trimmed = (rawQuery || '').trim().toLowerCase();
  if (!trimmed) return clients;

  const compactQuery = normalizeCompact(trimmed);
  const tokens = trimmed
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const scored: Array<{ client: Client; score: number }> = [];

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const idx = getIndexedClient(client);

    const fullCompactMatch = compactQuery.length > 0 && idx.compactFullText.includes(compactQuery);
    const nameCompactMatch = compactQuery.length > 0 && idx.compactName.includes(compactQuery);
    const nameTypoMatch =
      compactQuery.length >= 3 && tokenMatchesNameWithOneTypo(compactQuery, idx.nameWords);

    let allTokensMatch = true;
    let typoUsed = false;

    if (!fullCompactMatch && !nameTypoMatch) {
      for (let t = 0; t < tokens.length; t++) {
        const token = tokens[t];
        const compactToken = normalizeCompact(token);

        if (idx.lowerFullText.includes(token)) {
          continue;
        }
        if (compactToken.length > 0 && idx.compactFullText.includes(compactToken)) {
          continue;
        }
        if (
          compactToken.length >= 3 &&
          tokenMatchesNameWithOneTypo(compactToken, idx.nameWords)
        ) {
          typoUsed = true;
          continue;
        }

        allTokensMatch = false;
        break;
      }
    }

    if (fullCompactMatch || nameTypoMatch || allTokensMatch) {
      let score = 50;
      if (idx.lowerName === trimmed || idx.compactName === compactQuery) {
        score = 100;
      } else if (idx.lowerName.startsWith(trimmed) || idx.compactName.startsWith(compactQuery)) {
        score = 90;
      } else if (nameCompactMatch) {
        score = 80;
      } else if (idx.lowerFullText.includes(trimmed)) {
        score = 70;
      } else if (fullCompactMatch) {
        score = 65;
      } else if (!typoUsed && !nameTypoMatch) {
        score = 60;
      } else {
        score = 45;
      }
      scored.push({ client, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.client);
}

export function getLatestClientRemark(client: Client): string {
  return getIndexedClient(client).latestRemarkText;
}

export function getSectionBadgeMeta(client: Client): {
  section: ClientSection;
  label: string;
  dotClass: string;
  badgeClass: string;
  blockClass: string;
  labelTextClass: string;
  rowDividerClass: string;
} {
  const section = getClientSection(client);
  if (section === 'Green') {
    return {
      section: 'Green',
      label: CLIENT_SECTION_LABELS.Green,
      dotClass: 'bg-emerald-600',
      badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      blockClass: 'bg-emerald-50/90 border-2 border-emerald-400 text-slate-900',
      labelTextClass: 'text-emerald-950',
      rowDividerClass: 'border-emerald-200',
    };
  }
  if (section === 'Blue') {
    return {
      section: 'Blue',
      label: CLIENT_SECTION_LABELS.Blue,
      dotClass: 'bg-blue-600',
      badgeClass: 'bg-blue-100 text-blue-950 border-blue-300',
      blockClass: 'bg-blue-50/90 border-2 border-blue-400 text-slate-900',
      labelTextClass: 'text-blue-950',
      rowDividerClass: 'border-blue-200',
    };
  }
  return {
    section: 'Red',
    label: CLIENT_SECTION_LABELS.Red,
    dotClass: 'bg-rose-600',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-300',
    blockClass: 'bg-rose-50/90 border-2 border-rose-400 text-slate-900',
    labelTextClass: 'text-rose-950',
    rowDividerClass: 'border-rose-200',
  };
}

/**
 * Finds character ranges [start, end) in `text` that match `query`
 * (including space/dot/dash-insensitive matches and 1-typo word matches).
 */
function computeHighlightRanges(text: string, rawQuery: string): Array<[number, number]> {
  if (!text || !rawQuery || !rawQuery.trim()) return [];

  const lowerText = text.toLowerCase();
  const tokens = rawQuery
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const ranges: Array<[number, number]> = [];

  // Map each compact character index back to its original index in `text`
  const compactChars: string[] = [];
  const compactToOrig: number[] = [];
  for (let i = 0; i < lowerText.length; i++) {
    const ch = lowerText[i];
    if (!/[\s.\-_(),/\\+'":;]/.test(ch)) {
      compactChars.push(ch);
      compactToOrig.push(i);
    }
  }
  const compactText = compactChars.join('');

  const addCompactMatches = (cToken: string) => {
    if (!cToken) return;
    let startIdx = 0;
    while (startIdx < compactText.length) {
      const found = compactText.indexOf(cToken, startIdx);
      if (found === -1) break;
      const origStart = compactToOrig[found];
      const origEnd = compactToOrig[found + cToken.length - 1] + 1;
      ranges.push([origStart, origEnd]);
      startIdx = found + cToken.length;
    }
  };

  // Full compact query match (e.g. "infoedge" matching "Info Edge")
  const fullCompact = normalizeCompact(rawQuery);
  if (fullCompact.length >= 2) {
    addCompactMatches(fullCompact);
  }

  for (const token of tokens) {
    // Direct substring match
    let idx = 0;
    while (idx < lowerText.length) {
      const found = lowerText.indexOf(token, idx);
      if (found === -1) break;
      ranges.push([found, found + token.length]);
      idx = found + token.length;
    }

    // Compact token match
    const cToken = normalizeCompact(token);
    if (cToken.length >= 2) {
      addCompactMatches(cToken);
    }

    // 1-typo word match in text
    if (cToken.length >= 3 && ranges.length === 0) {
      const wordRegex = /[a-z0-9]+/gi;
      let match: RegExpExecArray | null;
      while ((match = wordRegex.exec(text)) !== null) {
        const w = match[0].toLowerCase();
        if (
          isEditDistanceAtMostOne(cToken, w) ||
          (cToken.length >= 4 && w.length > cToken.length && isEditDistanceAtMostOne(cToken, w.slice(0, cToken.length)))
        ) {
          ranges.push([match.index, match.index + match[0].length]);
        }
      }
    }
  }

  if (ranges.length === 0) return [];

  // Sort and merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: Array<[number, number]> = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

export const HighlightMatch: React.FC<{
  text?: string | null;
  query: string;
  className?: string;
}> = ({ text, query, className }) => {
  const safeText = text || '';
  if (!safeText || !query || !query.trim()) {
    return <span className={className}>{safeText}</span>;
  }

  const ranges = computeHighlightRanges(safeText, query);
  if (ranges.length === 0) {
    return <span className={className}>{safeText}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  ranges.forEach(([start, end], i) => {
    if (start > cursor) {
      parts.push(safeText.slice(cursor, start));
    }
    parts.push(
      <mark
        key={`${start}-${end}-${i}`}
        className="bg-amber-200 text-slate-950 rounded-xs px-0.5 font-bold"
      >
        {safeText.slice(start, end)}
      </mark>
    );
    cursor = end;
  });

  if (cursor < safeText.length) {
    parts.push(safeText.slice(cursor));
  }

  return <span className={className}>{parts}</span>;
};

const CORPORATE_STOP_WORDS = new Set([
  'pvt',
  'ltd',
  'private',
  'limited',
  'inc',
  'llp',
  'corp',
  'corporation',
  'company',
  'co',
  'india',
  'global',
  'technologies',
  'technology',
  'tech',
  'solutions',
  'services',
  'enterprises',
  'enterprise',
  'group',
  'systems',
  'consulting',
]);

function getCoreCompanyName(name: string): string {
  const words = (name || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !CORPORATE_STOP_WORDS.has(w));
  if (words.length === 0) {
    return normalizeCompact(name);
  }
  return words.join('');
}

export interface SimilarCompanyMatch {
  client: Client;
  reasons: string[];
}

/**
 * Checks live whether any existing company has the same or a very similar
 * company name, contact phone, or contact email.
 */
export function findSimilarCompanies(
  clients: Client[],
  input: {
    name: string;
    phones: string[];
    emails: string[];
  },
  excludeClientId?: string
): SimilarCompanyMatch[] {
  const inputCompactName = normalizeCompact(input.name);
  const inputCoreName = getCoreCompanyName(input.name);

  const normalizedPhones = input.phones
    .map((p) => {
      const digits = (p || '').replace(/\D/g, '');
      return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    })
    .filter((d) => d.length >= 8);

  const normalizedEmails = input.emails
    .map((e) => (e || '').trim().toLowerCase())
    .filter((e) => e.length >= 5 && e.includes('@'));

  const matches: SimilarCompanyMatch[] = [];

  for (const client of clients) {
    if (excludeClientId && client.id === excludeClientId) continue;

    const reasons: string[] = [];
    const targetCompactName = normalizeCompact(client.name);
    const targetCoreName = getCoreCompanyName(client.name);

    // 1. Name similarity check
    if (inputCompactName.length >= 3 && targetCompactName.length >= 3) {
      if (inputCompactName === targetCompactName) {
        reasons.push(`Same company name ("${client.name}")`);
      } else if (
        inputCoreName.length >= 3 &&
        targetCoreName.length >= 3 &&
        inputCoreName === targetCoreName
      ) {
        reasons.push(`Similar company name ("${client.name}")`);
      } else if (
        inputCompactName.length >= 4 &&
        targetCompactName.length >= 4 &&
        (targetCompactName.includes(inputCompactName) ||
          inputCompactName.includes(targetCompactName))
      ) {
        reasons.push(`Similar company name ("${client.name}")`);
      } else if (
        inputCoreName.length >= 4 &&
        targetCoreName.length >= 4 &&
        isEditDistanceAtMostTwo(inputCoreName, targetCoreName)
      ) {
        reasons.push(`Very similar company name ("${client.name}")`);
      } else if (
        inputCompactName.length >= 4 &&
        isEditDistanceAtMostOne(inputCompactName, targetCompactName)
      ) {
        reasons.push(`Very similar company name ("${client.name}")`);
      }
    }

    const contacts = Array.isArray(client.contactPersons) ? client.contactPersons : [];

    // 2. Contact Phone similarity check
    if (normalizedPhones.length > 0) {
      for (const cp of contacts) {
        const cpDigitsRaw = (cp.phone || '').replace(/\D/g, '');
        const cpDigits =
          cpDigitsRaw.length === 12 && cpDigitsRaw.startsWith('91')
            ? cpDigitsRaw.slice(2)
            : cpDigitsRaw;
        if (!cpDigits) continue;

        for (const inPhone of normalizedPhones) {
          if (inPhone === cpDigits) {
            reasons.push(`Same phone number (${cp.phone} — ${cp.name || 'Contact'})`);
            break;
          } else if (
            inPhone.length === 10 &&
            cpDigits.length === 10 &&
            isEditDistanceAtMostOne(inPhone, cpDigits)
          ) {
            reasons.push(`Very similar phone number (${cp.phone} — ${cp.name || 'Contact'})`);
            break;
          }
        }
      }
    }

    // 3. Contact Email similarity check
    if (normalizedEmails.length > 0) {
      for (const cp of contacts) {
        const cpEmail = (cp.email || '').trim().toLowerCase();
        if (!cpEmail) continue;

        for (const inEmail of normalizedEmails) {
          if (inEmail === cpEmail) {
            reasons.push(`Same contact email (${cp.email})`);
            break;
          } else if (isEditDistanceAtMostOne(inEmail, cpEmail)) {
            reasons.push(`Very similar contact email (${cp.email})`);
            break;
          }
        }
      }
    }

    if (reasons.length > 0) {
      matches.push({ client, reasons: Array.from(new Set(reasons)) });
    }
  }

  return matches;
}

export interface CallSummaryBlockProps {
  client: Client;
  jobs?: JobOpening[];
  searchQuery?: string;
  onCompanyClick?: () => void;
  variant?: 'card' | 'profile';
}

export const CallSummaryBlock: React.FC<CallSummaryBlockProps> = ({
  client,
  jobs,
  searchQuery = '',
  onCompanyClick,
  variant = 'card',
}) => {
  const [copied, setCopied] = useState(false);
  const badge = getSectionBadgeMeta(client);
  const rows = getCompanyCallSummaryRows(client, jobs);
  const primaryRow = rows[0];
  const extraRows = rows.slice(1);
  const primarySalary = formatMonthlySalaryParts(
    primaryRow?.salaryMin,
    primaryRow?.salaryMax,
    primaryRow?.extras
  );

  const mainContact = client.contactPersons?.[0];
  const rawPhone = mainContact?.phone || '';
  const dialPhone = rawPhone.replace(/[^\d+]/g, '');
  const waPhone = formatWhatsAppPhone(rawPhone);

  const handleCopyCallDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildCopyCallDetailsText(client, jobs);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProfile = variant === 'profile';

  return (
    <div className="space-y-2">
      {/* Coloured Call Summary Block — Exact 4 Lines in Order, Nothing Above Them */}
      <div
        className={`rounded-xl ${
          isProfile ? 'p-4 sm:p-5 space-y-2.5' : 'p-3 sm:p-3.5 space-y-1.5'
        } ${badge.blockClass}`}
      >
        {/* Line 1: Profile */}
        <div
          className={`${
            isProfile ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          } leading-snug text-slate-900`}
        >
          <span className={`font-extrabold ${badge.labelTextClass} mr-1.5`}>Profile:</span>
          <span className="font-extrabold text-slate-900">
            <HighlightMatch
              text={primaryRow?.profile || 'Open Hiring Requirement'}
              query={searchQuery}
            />
          </span>
        </div>

        {/* Line 2: Company (with section colour dot and label) */}
        <div
          className={`${
            isProfile ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          } leading-snug flex items-center gap-2 flex-wrap text-slate-900`}
        >
          <span className={`font-extrabold ${badge.labelTextClass}`}>Company:</span>
          {onCompanyClick ? (
            <button
              type="button"
              onClick={onCompanyClick}
              className="font-extrabold text-[#0B1F4B] hover:underline text-left cursor-pointer"
            >
              <HighlightMatch text={client.name} query={searchQuery} />
            </button>
          ) : (
            <span className="font-extrabold text-slate-900">
              <HighlightMatch text={client.name} query={searchQuery} />
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dotClass}`} />
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Line 3: Location */}
        <div
          className={`${
            isProfile ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          } leading-snug text-slate-900`}
        >
          <span className={`font-extrabold ${badge.labelTextClass} mr-1.5`}>Location:</span>
          <span className="font-bold text-slate-800">
            <HighlightMatch
              text={
                primaryRow?.location ||
                [client.address, client.city].filter(Boolean).join(', ')
              }
              query={searchQuery}
            />
          </span>
        </div>

        {/* Line 4: Salary (Rs per month + LPA equivalent in small text + extras note) */}
        <div
          className={`${
            isProfile ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          } leading-snug text-slate-900`}
        >
          <span className={`font-extrabold ${badge.labelTextClass} mr-1.5`}>Salary:</span>
          <span className="font-extrabold text-slate-900">
            <HighlightMatch text={primarySalary.monthlyText} query={searchQuery} />
          </span>
          {primarySalary.lpaText && (
            <span className="text-[11px] font-semibold text-slate-600 ml-1.5">
              {primarySalary.lpaText}
            </span>
          )}
          {primarySalary.extrasText && (
            <span className="font-bold text-slate-800 ml-1.5">
              <HighlightMatch text={primarySalary.extrasText} query={searchQuery} />
            </span>
          )}
        </div>

        {/* If the company has several open requirements, list each additional one as its own row with Profile, Location and Salary */}
        {extraRows.length > 0 && (
          <div className={`pt-2 mt-1.5 border-t ${badge.rowDividerClass} space-y-2`}>
            {extraRows.map((row, idx) => {
              const sal = formatMonthlySalaryParts(row.salaryMin, row.salaryMax, row.extras);
              return (
                <div
                  key={row.id || idx}
                  className="p-2 rounded-lg bg-white/85 border border-slate-200 space-y-0.5 text-xs text-slate-900"
                >
                  <div className="leading-snug">
                    <span className={`font-extrabold ${badge.labelTextClass} mr-1`}>
                      Profile #{idx + 2}:
                    </span>
                    <span className="font-extrabold text-slate-900">
                      <HighlightMatch text={row.profile} query={searchQuery} />
                    </span>
                  </div>
                  <div className="leading-snug">
                    <span className={`font-bold ${badge.labelTextClass} mr-1`}>Location:</span>
                    <span className="font-semibold text-slate-800">
                      <HighlightMatch text={row.location} query={searchQuery} />
                    </span>
                  </div>
                  <div className="leading-snug">
                    <span className={`font-bold ${badge.labelTextClass} mr-1`}>Salary:</span>
                    <span className="font-extrabold text-slate-900">
                      <HighlightMatch text={sal.monthlyText} query={searchQuery} />
                    </span>
                    {sal.lpaText && (
                      <span className="text-[11px] font-semibold text-slate-600 ml-1">
                        {sal.lpaText}
                      </span>
                    )}
                    {sal.extrasText && (
                      <span className="font-bold text-slate-800 ml-1">
                        <HighlightMatch text={sal.extrasText} query={searchQuery} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Three Small Action Buttons Under the Block: Call, WhatsApp, Copy call details */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {dialPhone ? (
          <a
            href={`tel:${dialPhone}`}
            onClick={(e) => e.stopPropagation()}
            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Call</span>
          </a>
        ) : (
          <span className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold inline-flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </span>
        )}

        {waPhone ? (
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <span className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold inline-flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </span>
        )}

        <button
          type="button"
          onClick={handleCopyCallDetails}
          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#0B1F4B]" />
              <span>Copy call details</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

