/**
 * Global Crisis Lines — jurisdiction-aware helplines for children.
 * Used by emergencyAlert.ts and InterventionModal.tsx.
 *
 * Framework reference: CS-MR.2 Incident Response
 * The app must surface appropriate crisis resources based on the user's location.
 */

export interface CrisisLine {
  name: string;
  number: string;
  type: 'phone' | 'text' | 'chat' | 'web';
  url?: string;
  hours: string;
  languages: string[];
  notes: string;
}

export interface JurisdictionCrisis {
  country: string;
  countryCode: string;
  emergency: string; // 112, 911, etc.
  lines: CrisisLine[];
}

const CRISIS_LINES: Record<string, JurisdictionCrisis> = {
  DK: {
    country: 'Denmark', countryCode: 'DK', emergency: '112',
    lines: [
      { name: 'Børnetelefonen', number: '116 111', type: 'phone', url: 'https://bornetelefonen.dk', hours: '24/7', languages: ['da', 'en'], notes: 'Free, anonymous. Also chat at bornetelefonen.dk' },
      { name: 'BørneChatten', number: '', type: 'chat', url: 'https://bornetelefonen.dk/chat', hours: '11:00-23:00', languages: ['da'], notes: 'Online chat for children' },
      { name: 'Livslinien', number: '70 201 201', type: 'phone', url: 'https://livslinien.dk', hours: '24/7', languages: ['da'], notes: 'Suicide prevention' },
    ],
  },
  GB: {
    country: 'United Kingdom', countryCode: 'GB', emergency: '999',
    lines: [
      { name: 'Childline', number: '0800 1111', type: 'phone', url: 'https://www.childline.org.uk', hours: '24/7', languages: ['en'], notes: 'Free, confidential. Also online chat.' },
      { name: 'CEOP', number: '', type: 'web', url: 'https://www.ceop.police.uk/ceop-reporting/', hours: '24/7', languages: ['en'], notes: 'Report online sexual exploitation to police' },
      { name: 'Papyrus (HOPELINEUK)', number: '0800 068 4141', type: 'phone', hours: '9am-midnight', languages: ['en'], notes: 'Suicide prevention for under 35s. Text 07786 209697' },
    ],
  },
  US: {
    country: 'United States', countryCode: 'US', emergency: '911',
    lines: [
      { name: 'Crisis Text Line', number: '741741', type: 'text', url: 'https://www.crisistextline.org', hours: '24/7', languages: ['en', 'es'], notes: 'Text HOME to 741741' },
      { name: 'Childhelp National Child Abuse Hotline', number: '1-800-422-4453', type: 'phone', hours: '24/7', languages: ['en', 'es'], notes: 'Also text/chat' },
      { name: '988 Suicide & Crisis Lifeline', number: '988', type: 'phone', hours: '24/7', languages: ['en', 'es'], notes: 'Call or text 988' },
      { name: 'NCMEC', number: '1-800-843-5678', type: 'phone', url: 'https://www.missingkids.org', hours: '24/7', languages: ['en', 'es'], notes: 'Missing & exploited children' },
    ],
  },
  CA: {
    country: 'Canada', countryCode: 'CA', emergency: '911',
    lines: [
      { name: 'Kids Help Phone', number: '1-800-668-6868', type: 'phone', url: 'https://kidshelpphone.ca', hours: '24/7', languages: ['en', 'fr'], notes: 'Text CONNECT to 686868' },
      { name: 'Cybertip.ca', number: '', type: 'web', url: 'https://www.cybertip.ca', hours: '24/7', languages: ['en', 'fr'], notes: 'Report online child exploitation' },
    ],
  },
  DE: {
    country: 'Germany', countryCode: 'DE', emergency: '112',
    lines: [
      { name: 'Nummer gegen Kummer', number: '116 111', type: 'phone', url: 'https://www.nummergegenkummer.de', hours: 'Mon-Sat 14-20', languages: ['de'], notes: 'Children\'s helpline. Also online chat.' },
      { name: 'Telefonseelsorge', number: '0800 111 0 111', type: 'phone', hours: '24/7', languages: ['de'], notes: 'Crisis/suicide prevention. Free, anonymous.' },
    ],
  },
  SE: {
    country: 'Sweden', countryCode: 'SE', emergency: '112',
    lines: [
      { name: 'BRIS', number: '116 111', type: 'phone', url: 'https://www.bris.se', hours: '24/7', languages: ['sv'], notes: 'Children\'s Rights in Society. Chat at bris.se' },
    ],
  },
  NO: {
    country: 'Norway', countryCode: 'NO', emergency: '112',
    lines: [
      { name: 'Alarmtelefonen for barn og unge', number: '116 111', type: 'phone', hours: '24/7', languages: ['no'], notes: 'Free helpline for children' },
    ],
  },
  AU: {
    country: 'Australia', countryCode: 'AU', emergency: '000',
    lines: [
      { name: 'Kids Helpline', number: '1800 55 1800', type: 'phone', url: 'https://kidshelpline.com.au', hours: '24/7', languages: ['en'], notes: 'Free, confidential. Also webchat.' },
      { name: 'eSafety Commissioner', number: '', type: 'web', url: 'https://www.esafety.gov.au/report', hours: '24/7', languages: ['en'], notes: 'Report online harm' },
    ],
  },
  NZ: {
    country: 'New Zealand', countryCode: 'NZ', emergency: '111',
    lines: [
      { name: 'Youthline', number: '0800 376 633', type: 'phone', url: 'https://www.youthline.co.nz', hours: '24/7', languages: ['en'], notes: 'Text 234. Free.' },
      { name: 'Netsafe', number: '0508 638 723', type: 'phone', url: 'https://netsafe.org.nz', hours: 'Mon-Fri 9-17', languages: ['en'], notes: 'Online safety support' },
    ],
  },
  IE: {
    country: 'Ireland', countryCode: 'IE', emergency: '112',
    lines: [
      { name: 'Childline Ireland', number: '1800 66 66 66', type: 'phone', url: 'https://www.childline.ie', hours: '24/7', languages: ['en', 'ga'], notes: 'Free, confidential. Also online chat.' },
    ],
  },
  ZA: {
    country: 'South Africa', countryCode: 'ZA', emergency: '10111',
    lines: [
      { name: 'Childline South Africa', number: '116', type: 'phone', url: 'https://www.childlinesa.org.za', hours: '24/7', languages: ['en', 'af', 'zu'], notes: 'Free from any phone' },
    ],
  },
  IN: {
    country: 'India', countryCode: 'IN', emergency: '112',
    lines: [
      { name: 'Childline India', number: '1098', type: 'phone', url: 'https://www.childlineindia.org', hours: '24/7', languages: ['en', 'hi'], notes: 'Free, 24/7 emergency outreach for children' },
    ],
  },
  BR: {
    country: 'Brazil', countryCode: 'BR', emergency: '190',
    lines: [
      { name: 'Disque 100', number: '100', type: 'phone', hours: '24/7', languages: ['pt'], notes: 'Human rights violations including child abuse' },
      { name: 'CVV', number: '188', type: 'phone', url: 'https://www.cvv.org.br', hours: '24/7', languages: ['pt'], notes: 'Crisis/suicide prevention' },
    ],
  },
  JP: {
    country: 'Japan', countryCode: 'JP', emergency: '110',
    lines: [
      { name: 'Childline Japan', number: '0120-99-7777', type: 'phone', hours: '16:00-21:00', languages: ['ja'], notes: 'Free for children 18 and under' },
    ],
  },
  KR: {
    country: 'South Korea', countryCode: 'KR', emergency: '112',
    lines: [
      { name: 'Child Abuse Reporting', number: '112', type: 'phone', hours: '24/7', languages: ['ko', 'en'], notes: 'Police emergency — also handles child abuse' },
      { name: 'Korea Youth Counseling', number: '1388', type: 'phone', hours: '24/7', languages: ['ko'], notes: 'Youth crisis counseling' },
    ],
  },
};

// International fallback
const INTERNATIONAL_FALLBACK: JurisdictionCrisis = {
  country: 'International', countryCode: 'XX', emergency: '112',
  lines: [
    { name: 'Child Helpline International', number: '', type: 'web', url: 'https://www.childhelplineinternational.org/child-helplines/child-helpline-network/', hours: 'Varies', languages: ['en'], notes: 'Find your local child helpline at childhelplineinternational.org' },
    { name: 'INHOPE', number: '', type: 'web', url: 'https://www.inhope.org/', hours: '24/7', languages: ['en'], notes: 'Report child sexual abuse material — routes to your national hotline' },
  ],
};

/**
 * Get crisis lines for a country code.
 */
export function getCrisisLines(countryCode: string): JurisdictionCrisis {
  return CRISIS_LINES[countryCode.toUpperCase()] || INTERNATIONAL_FALLBACK;
}

/**
 * Get all supported countries.
 */
export function getSupportedCountries(): { code: string; name: string }[] {
  return Object.entries(CRISIS_LINES).map(([code, data]) => ({
    code,
    name: data.country,
  }));
}

/**
 * Get the primary child helpline number for a jurisdiction (for quick display).
 */
export function getPrimaryHelpline(countryCode: string): { name: string; number: string } {
  const crisis = getCrisisLines(countryCode);
  const phoneLine = crisis.lines.find(l => l.type === 'phone' && l.number);
  return phoneLine
    ? { name: phoneLine.name, number: phoneLine.number }
    : { name: 'Emergency', number: crisis.emergency };
}
