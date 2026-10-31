import React, { useState, useEffect } from 'react';
import { Client, ClientSection, getClientSection } from '../types/crm';

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

      // Check adjacent transposition (e.g. "infodege" vs "infoedge")
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

  const sortedRemarks = [...remarks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestRemarkText = sortedRemarks[0]?.text || '';

  const contactStrings = contacts
    .map((cp) => `${cp.name || ''} ${cp.phone || ''} ${cp.email || ''} ${cp.designation || ''}`)
    .join(' ');
  const remarkStrings = remarks.map((r) => r.text || '').join(' ');

  const rawFull = [
    client.name || '',
    client.industry || '',
    client.city || '',
    client.address || '',
    client.website || '',
    client.agreementDetails || '',
    contactStrings,
    remarkStrings,
  ].join(' ');

  const lowerName = (client.name || '').toLowerCase();
  const compactName = normalizeCompact(client.name || '');
  const lowerFullText = rawFull.toLowerCase();
  const compactFullText = normalizeCompact(rawFull);

  // Extract words from company name and contact names for 1-typo tolerance
  const rawNames = `${client.name || ''} ${contacts.map((c) => c.name || '').join(' ')}`.toLowerCase();
  const nameWords = rawNames
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

  // Also include compact name so "infoedge" with 1 typo ("infodge") matches "Info Edge"
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
    // Also allow prefix of longer company name word within 1 typo (e.g. "jubilnt" -> "jubilant")
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

    // 1. Check if entire compact query directly matches compact full text (e.g. "info edge" -> "infoedge")
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
} {
  const section = getClientSection(client);
  if (section === 'Green') {
    return {
      section: 'Green',
      label: 'Active',
      dotClass: 'bg-emerald-500',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    };
  }
  if (section === 'Blue') {
    return {
      section: 'Blue',
      label: 'In Discussion',
      dotClass: 'bg-blue-500',
      badgeClass:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    };
  }
  return {
    section: 'Red',
    label: 'New Enquiry',
    dotClass: 'bg-rose-500',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
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
        className="bg-amber-200/90 dark:bg-amber-500/40 text-slate-950 dark:text-amber-100 rounded-xs px-0.5 font-bold"
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
