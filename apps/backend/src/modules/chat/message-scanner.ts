/**
 * Scans an outgoing message for attempts to take the deal off KasaHouse —
 * phone numbers, bank/account-number patterns, and mobile-money / cash keywords.
 * Matching messages are soft-blocked (never stored, never delivered) and the
 * sender gets an explanation rather than a bare rejection.
 *
 * The keyword list is data, not logic — tune it here.
 */
const KEYWORDS: string[] = [
  'momo',
  'mobile money',
  'mtn money',
  'mtn momo',
  'vodafone cash',
  'telecel cash',
  'airteltigo money',
  'send cash',
  'pay cash',
  'in cash',
  'cash only',
  'pay me directly',
  'pay directly',
  'pay outside',
  'off the app',
  'off app',
  'outside the app',
  'outside kasahouse',
  'off platform',
  'off-platform',
  'western union',
  'bank transfer',
  'bank account',
  'account number',
  'acc number',
  'acc no',
  'whatsapp',
  'télégram',
  'telegram',
  'call me on',
  'text me on',
  'reach me on',
  'my number is',
  'here is my number',
];

// +233XXXXXXXXX / 0XXXXXXXXX, tolerant of spaces, dots and dashes between groups.
const PHONE_RE =
  /(?:\+?233|0)[\s.\-]?\d{2}[\s.\-]?\d{3}[\s.\-]?\d{3,4}/;

export interface MessageScanResult {
  blocked: boolean;
  matched: string[];
}

export function scanForOffPlatform(content: string): MessageScanResult {
  const matched = new Set<string>();
  const lower = content.toLowerCase();

  if (PHONE_RE.test(content)) matched.add('phone_number');

  for (const kw of KEYWORDS) {
    if (lower.includes(kw)) matched.add(`keyword:${kw}`);
  }

  // A long unbroken digit run (>= 10) that isn't already caught as a phone
  // number looks like an account or card number.
  const digits = content.replace(/\D/g, '');
  if (digits.length >= 10 && !matched.has('phone_number')) {
    matched.add('number_sequence');
  }

  return { blocked: matched.size > 0, matched: [...matched] };
}

export const OFF_PLATFORM_EXPLAINER =
  'Let’s keep this on KasaHouse. Sharing phone numbers or arranging payment ' +
  'outside the app isn’t allowed — staying on-platform gives you a payment ' +
  'record and dispute protection if anything goes wrong.';
