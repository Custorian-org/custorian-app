/**
 * Have I Been Pwned API — Data Breach Detection
 *
 * Checks if a child's email has been exposed in known data breaches.
 * Uses the k-anonymity model (only sends first 5 chars of SHA-1 hash).
 * Free for non-commercial use.
 * Docs: https://haveibeenpwned.com/API/v3
 */

const HIBP_API_KEY = process.env.HIBP_API_KEY || '';
const HIBP_ENDPOINT = 'https://haveibeenpwned.com/api/v3';

export interface BreachResult {
  email: string;
  breached: boolean;
  breachCount: number;
  breaches: BreachDetail[];
  mostRecent: string | null;    // date of most recent breach
  dataExposed: string[];        // types: passwords, emails, phone numbers, etc.
}

export interface BreachDetail {
  name: string;           // e.g. "Adobe", "LinkedIn"
  domain: string;         // e.g. "adobe.com"
  date: string;           // breach date
  pwnCount: number;       // number of accounts affected
  dataClasses: string[];  // what was exposed
  description: string;
}

/**
 * Check if an email has been in any known data breaches.
 * Uses the breachedaccount API endpoint.
 */
export async function checkEmailBreach(email: string): Promise<BreachResult | null> {
  if (!HIBP_API_KEY) {
    console.log('[Custorian:HIBP] No API key — skipping breach check');
    return null;
  }

  if (!email || !email.includes('@')) return null;

  try {
    const res = await fetch(
      `${HIBP_ENDPOINT}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        method: 'GET',
        headers: {
          'hibp-api-key': HIBP_API_KEY,
          'User-Agent': 'Custorian-Child-Safety-App',
        },
      }
    );

    // 404 = no breaches found (this is good!)
    if (res.status === 404) {
      console.log(`[Custorian:HIBP] ${email} — no breaches found`);
      return {
        email,
        breached: false,
        breachCount: 0,
        breaches: [],
        mostRecent: null,
        dataExposed: [],
      };
    }

    if (!res.ok) {
      console.warn(`[Custorian:HIBP] API error ${res.status}`);
      return null;
    }

    const data = await res.json();
    const breaches: BreachDetail[] = data.map((b: any) => ({
      name: b.Name,
      domain: b.Domain,
      date: b.BreachDate,
      pwnCount: b.PwnCount,
      dataClasses: b.DataClasses || [],
      description: b.Description?.replace(/<[^>]+>/g, '') || '',
    }));

    // Collect all exposed data types
    const allDataClasses = new Set<string>();
    breaches.forEach(b => b.dataClasses.forEach(dc => allDataClasses.add(dc)));

    // Sort by date to find most recent
    const sorted = [...breaches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`[Custorian:HIBP] ${email} — found in ${breaches.length} breaches`);

    return {
      email,
      breached: true,
      breachCount: breaches.length,
      breaches,
      mostRecent: sorted[0]?.date || null,
      dataExposed: Array.from(allDataClasses),
    };
  } catch (error) {
    console.error('[Custorian:HIBP] Breach check failed:', error);
    return null;
  }
}

/**
 * Check if a password has been exposed (using k-anonymity — only sends first 5 chars of SHA-1)
 * Returns the number of times the password has been seen in breaches.
 * Does NOT require an API key.
 */
export async function checkPasswordExposed(password: string): Promise<number> {
  try {
    // Create SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'Custorian-Child-Safety-App' },
    });

    if (!res.ok) return 0;

    const text = await res.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        const exposureCount = parseInt(count.trim(), 10);
        console.log(`[Custorian:HIBP] Password found in ${exposureCount} breaches`);
        return exposureCount;
      }
    }

    return 0;
  } catch {
    return 0;
  }
}
