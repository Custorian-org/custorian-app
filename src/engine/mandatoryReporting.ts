/**
 * Mandatory Reporting — CS-MR.2.1, CS-CD.3.2
 * Jurisdiction-aware reporting for CSAM and imminent danger.
 *
 * CSAM must be reported to law enforcement within 1 hour (CS-MR.2.1).
 * Different jurisdictions have different reporting destinations.
 *
 * This module does NOT transmit images — only metadata:
 * hash, timestamp, jurisdiction, platform, action taken.
 */

export interface MandatoryReport {
  id: string;
  timestamp: string;
  type: 'csam' | 'imminent_danger' | 'exploitation';
  jurisdiction: string; // ISO 3166-1 alpha-2
  destination: string;
  destinationUrl: string;
  evidenceHash: string; // PhotoDNA hash only, never the image
  platformActionTaken: string;
  status: 'pending' | 'submitted' | 'confirmed';
}

interface ReportingDestination {
  name: string;
  url: string;
  apiAvailable: boolean;
  phone?: string;
  notes: string;
}

/**
 * Global reporting destinations by jurisdiction.
 * Sources: INHOPE, ECPAT, NCMEC
 */
const REPORTING_DESTINATIONS: Record<string, ReportingDestination> = {
  // North America
  US: { name: 'NCMEC CyberTipline', url: 'https://report.cybertip.org/', apiAvailable: true, phone: '1-800-843-5678', notes: 'US federal mandatory reporting. API available for Electronic Service Providers.' },
  CA: { name: 'Canadian Centre for Child Protection', url: 'https://www.cybertip.ca/app/en/report', apiAvailable: false, phone: '1-866-658-9022', notes: 'Cybertip.ca — bilingual reporting.' },

  // Europe — EU
  DK: { name: 'Red Barnet / Rigspolitiet NC3', url: 'https://LBtip.dk/', apiAvailable: false, phone: '114', notes: 'Denmark. Report to Red Barnet (Save the Children DK) or police NC3 unit.' },
  DE: { name: 'jugendschutz.net / BKA', url: 'https://www.jugendschutz.net/en/online-reporting', apiAvailable: false, notes: 'Germany. jugendschutz.net or Bundeskriminalamt.' },
  FR: { name: 'PHAROS / Point de Contact', url: 'https://www.internet-signalement.gouv.fr/', apiAvailable: false, phone: '0 800 200 000', notes: 'France. Government reporting portal.' },
  NL: { name: 'Meldpunt Kinderporno', url: 'https://www.meldpunt-kinderporno.nl/', apiAvailable: false, notes: 'Netherlands. EOKM hotline.' },
  SE: { name: 'ECPAT Sweden', url: 'https://www.ecpat.se/tipsa', apiAvailable: false, notes: 'Sweden.' },
  NO: { name: 'Kripos / Redd Barna', url: 'https://tips.telefonselskapet.no/', apiAvailable: false, notes: 'Norway.' },
  AT: { name: 'Stopline.at', url: 'https://www.stopline.at/en/', apiAvailable: false, notes: 'Austria. INHOPE member.' },
  BE: { name: 'Child Focus', url: 'https://www.childfocus.be/', apiAvailable: false, phone: '116 000', notes: 'Belgium.' },
  ES: { name: 'Protégeles', url: 'https://www.protegeles.com/', apiAvailable: false, notes: 'Spain. INHOPE member.' },
  IT: { name: 'Telefono Azzurro / Polizia Postale', url: 'https://www.commissariatodips.it/', apiAvailable: false, phone: '19696', notes: 'Italy.' },
  PT: { name: 'Linha Alerta', url: 'https://linhaalerta.internetsegura.pt/', apiAvailable: false, notes: 'Portugal.' },
  IE: { name: 'Hotline.ie', url: 'https://www.hotline.ie/', apiAvailable: false, notes: 'Ireland. INHOPE member.' },
  FI: { name: 'Save the Children Finland', url: 'https://www.pelastakaalapset.fi/', apiAvailable: false, notes: 'Finland.' },
  PL: { name: 'Dyżurnet.pl', url: 'https://dyzurnet.pl/', apiAvailable: false, notes: 'Poland. INHOPE member.' },
  GR: { name: 'SafeLine.gr', url: 'https://www.safeline.gr/', apiAvailable: false, notes: 'Greece.' },

  // UK
  GB: { name: 'Internet Watch Foundation (IWF)', url: 'https://report.iwf.org.uk/', apiAvailable: false, phone: '0800 1111', notes: 'UK. IWF for CSAM, CEOP for exploitation.' },

  // Asia-Pacific
  AU: { name: 'Australian Federal Police / eSafety', url: 'https://www.esafety.gov.au/report', apiAvailable: false, notes: 'Australia. eSafety Commissioner.' },
  NZ: { name: 'Netsafe', url: 'https://report.netsafe.org.nz/', apiAvailable: false, notes: 'New Zealand.' },
  JP: { name: 'Internet Hotline Center (IHC)', url: 'https://www.internethotline.jp/', apiAvailable: false, notes: 'Japan. INHOPE member.' },
  KR: { name: 'KOCSC', url: 'https://www.kocsc.or.kr/', apiAvailable: false, notes: 'South Korea. Korea Communications Standards Commission.' },
  IN: { name: 'NCPCR / Cyber Crime Portal', url: 'https://cybercrime.gov.in/', apiAvailable: false, phone: '1098', notes: 'India. National Commission for Protection of Child Rights.' },
  SG: { name: 'Singapore Police Force', url: 'https://www.police.gov.sg/iwitness', apiAvailable: false, phone: '999', notes: 'Singapore.' },

  // Africa
  ZA: { name: 'Film & Publication Board', url: 'https://www.fpb.org.za/', apiAvailable: false, phone: '0800 148 148', notes: 'South Africa.' },
  KE: { name: 'NCRC Kenya', url: 'https://reportchildsexualabuse.go.ke/', apiAvailable: false, notes: 'Kenya. National Council for Children\'s Services.' },
  NG: { name: 'NAPTIP', url: 'https://www.naptip.gov.ng/', apiAvailable: false, notes: 'Nigeria. National Agency for Prohibition of Trafficking in Persons.' },

  // Middle East
  AE: { name: 'UAE Cybercrime', url: 'https://www.ecrime.ae/', apiAvailable: false, phone: '999', notes: 'United Arab Emirates.' },

  // Latin America
  BR: { name: 'SaferNet Brasil', url: 'https://denuncie.safernet.org.br/', apiAvailable: false, notes: 'Brazil. INHOPE member.' },
  MX: { name: 'Policía Cibernética', url: 'https://www.gob.mx/policia-cibernetica', apiAvailable: false, phone: '088', notes: 'Mexico.' },
};

// Default fallback
const DEFAULT_DESTINATION: ReportingDestination = {
  name: 'INHOPE International',
  url: 'https://www.inhope.org/EN#hotlineReferral',
  apiAvailable: false,
  notes: 'INHOPE network — routes to the appropriate national hotline.',
};

/**
 * Get the correct reporting destination for a jurisdiction.
 */
export function getReportingDestination(countryCode: string): ReportingDestination {
  return REPORTING_DESTINATIONS[countryCode.toUpperCase()] || DEFAULT_DESTINATION;
}

/**
 * Get all supported jurisdictions.
 */
export function getSupportedJurisdictions(): { code: string; name: string }[] {
  return Object.entries(REPORTING_DESTINATIONS).map(([code, dest]) => ({
    code,
    name: dest.name,
  }));
}

/**
 * Create a mandatory report record.
 * NOTE: This creates the LOCAL record. Actual submission to NCMEC etc.
 * requires ESP registration and is handled server-side in production.
 */
export function createMandatoryReport(params: {
  type: MandatoryReport['type'];
  jurisdiction: string;
  evidenceHash: string;
  platformActionTaken: string;
}): MandatoryReport {
  const dest = getReportingDestination(params.jurisdiction);
  return {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    type: params.type,
    jurisdiction: params.jurisdiction,
    destination: dest.name,
    destinationUrl: dest.url,
    evidenceHash: params.evidenceHash,
    platformActionTaken: params.platformActionTaken,
    status: 'pending',
  };
}
