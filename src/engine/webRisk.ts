/**
 * Google Web Risk API — URL Safety Checking
 *
 * Checks URLs against Google's threat database.
 * Detects: malware, social engineering (phishing), unwanted software
 * Free: 100,000 lookups/day
 * Docs: https://cloud.google.com/web-risk/docs
 * Uses same API key as other Google Cloud services
 */

const WEB_RISK_KEY = process.env.GOOGLE_VISION_API_KEY || '';  // Same Google Cloud key
const WEB_RISK_ENDPOINT = 'https://webrisk.googleapis.com/v1/uris:search';

export type ThreatType = 'MALWARE' | 'SOCIAL_ENGINEERING' | 'UNWANTED_SOFTWARE' | 'SOCIAL_ENGINEERING_EXTENDED_COVERAGE';

export interface WebRiskResult {
  url: string;
  isSafe: boolean;
  threats: ThreatType[];
  riskLevel: 'safe' | 'caution' | 'dangerous';
}

/**
 * Check a single URL against Google's Web Risk database.
 * Returns threat types if URL is known to be dangerous.
 */
export async function checkUrlSafety(url: string): Promise<WebRiskResult | null> {
  if (!WEB_RISK_KEY) {
    console.log('[Custorian:WebRisk] No API key — skipping URL check');
    return null;
  }

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null;
  }

  try {
    const threatTypes = [
      'MALWARE',
      'SOCIAL_ENGINEERING',
      'UNWANTED_SOFTWARE',
      'SOCIAL_ENGINEERING_EXTENDED_COVERAGE',
    ];

    const params = new URLSearchParams({ key: WEB_RISK_KEY, uri: url });
    threatTypes.forEach(t => params.append('threatTypes', t));

    const res = await fetch(`${WEB_RISK_ENDPOINT}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[Custorian:WebRisk] API error ${res.status}`);
      return null;
    }

    const data = await res.json();
    const threat = data.threat;

    if (!threat) {
      console.log(`[Custorian:WebRisk] ${url} — safe`);
      return { url, isSafe: true, threats: [], riskLevel: 'safe' };
    }

    const threats = (threat.threatTypes || []) as ThreatType[];
    const hasSocialEngineering = threats.some(t => t.includes('SOCIAL_ENGINEERING'));
    const hasMalware = threats.includes('MALWARE');

    console.log(`[Custorian:WebRisk] ${url} — DANGEROUS: ${threats.join(', ')}`);

    return {
      url,
      isSafe: false,
      threats,
      riskLevel: hasMalware || hasSocialEngineering ? 'dangerous' : 'caution',
    };
  } catch (error) {
    console.error('[Custorian:WebRisk] Check failed:', error);
    return null;
  }
}

/**
 * Batch check multiple URLs. Returns only unsafe ones.
 * Useful for scanning chat messages that contain links.
 */
export async function checkUrlsBatch(urls: string[]): Promise<WebRiskResult[]> {
  const results: WebRiskResult[] = [];

  for (const url of urls) {
    const result = await checkUrlSafety(url);
    if (result && !result.isSafe) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Extract URLs from text and check them all.
 */
export async function scanTextForDangerousUrls(text: string): Promise<WebRiskResult[]> {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const urls = text.match(urlRegex) || [];

  if (urls.length === 0) return [];

  console.log(`[Custorian:WebRisk] Found ${urls.length} URLs in text — checking...`);
  return checkUrlsBatch(urls);
}
