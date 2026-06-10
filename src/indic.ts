// Indic transliteration + Indian name/address/PIN/PAN normalization.
//
// Transliteration via Aksharamukha (free, hosted). For offline / hot-path
// we keep a small mapping table for the most common requests (Devanagari ↔ Latin).
// Full coverage of 16+ scripts lives in the private repo (using Aksharamukha
// as the source of truth).

import { KvCache } from "./cache";

export interface IndicEnv {
  CACHE: KVNamespace;
  AKSHARAMUKHA_BASE: string;
}

// Unicode ranges by script — used for detection.
const SCRIPT_RANGES: Array<{ name: string; ranges: Array<[number, number]> }> = [
  { name: "Devanagari",     ranges: [[0x0900, 0x097F]] },
  { name: "Bengali",        ranges: [[0x0980, 0x09FF]] },
  { name: "Gurmukhi",       ranges: [[0x0A00, 0x0A7F]] },
  { name: "Gujarati",       ranges: [[0x0A80, 0x0AFF]] },
  { name: "Oriya",          ranges: [[0x0B00, 0x0B7F]] },
  { name: "Tamil",          ranges: [[0x0B80, 0x0BFF]] },
  { name: "Telugu",         ranges: [[0x0C00, 0x0C7F]] },
  { name: "Kannada",        ranges: [[0x0C80, 0x0CFF]] },
  { name: "Malayalam",      ranges: [[0x0D00, 0x0D7F]] },
  { name: "Latin",          ranges: [[0x0020, 0x007E], [0x00A0, 0x017F]] },
];

// PIN-code first-digit → region (India Post). Second digit further narrows.
const PIN_REGIONS: Record<string, { region: string; states: string[] }> = {
  "1": { region: "Northern (Delhi, Haryana, Punjab, HP, J&K)", states: ["DL", "HR", "PB", "HP", "JK"] },
  "2": { region: "Northern (UP, Uttarakhand)", states: ["UP", "UK"] },
  "3": { region: "Western (Rajasthan, Gujarat, Dadra & Nagar Haveli, Daman & Diu)", states: ["RJ", "GJ", "DN", "DD"] },
  "4": { region: "Maharashtra, Goa, Madhya Pradesh, Chhattisgarh", states: ["MH", "GA", "MP", "CG"] },
  "5": { region: "Southern (Andhra Pradesh, Telangana, Karnataka)", states: ["AP", "TG", "KA"] },
  "6": { region: "Southern (Kerala, Tamil Nadu, Puducherry, Lakshadweep)", states: ["KL", "TN", "PY", "LD"] },
  "7": { region: "Eastern (West Bengal, Odisha, NE states, A&N Islands)", states: ["WB", "OR", "NE", "AN"] },
  "8": { region: "Bihar, Jharkhand", states: ["BR", "JH"] },
  "9": { region: "APS (Army Postal Service)", states: ["APS"] },
};

// PAN structure: AAAAA9999A
//   1-3: alphabetic series code
//   4:   entity type (P=individual, C=company, H=HUF, F=firm, A=AOP, T=trust, B=BOI, L=LA, J=AJP, G=government)
//   5:   first letter of surname (or entity name)
//   6-9: digits
//   10:  check letter
const PAN_PATTERN = /^[A-Z]{3}([PCHFATBLJG])[A-Z]\d{4}[A-Z]$/;
const PAN_ENTITY_TYPE: Record<string, string> = {
  P: "individual",
  C: "company",
  H: "hindu_undivided_family",
  F: "firm",
  A: "association_of_persons",
  T: "trust",
  B: "body_of_individuals",
  L: "local_authority",
  J: "artificial_juridical_person",
  G: "government",
};

const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const STATE_GST_CODES: Record<string, string> = {
  "01": "JK", "02": "HP", "03": "PB", "04": "CH", "05": "UK", "06": "HR",
  "07": "DL", "08": "RJ", "09": "UP", "10": "BR", "11": "SK", "12": "AR",
  "13": "NL", "14": "MN", "15": "MZ", "16": "TR", "17": "ML", "18": "AS",
  "19": "WB", "20": "JH", "21": "OR", "22": "CG", "23": "MP", "24": "GJ",
  "25": "DD", "26": "DN", "27": "MH", "28": "AP", "29": "KA", "30": "GA",
  "31": "LD", "32": "KL", "33": "TN", "34": "PY", "35": "AN", "36": "TG",
  "37": "AP-NEW", "38": "LA", "97": "OTHER",
};

// Tiny common-word transliteration table for offline path. Real coverage uses
// Aksharamukha (network call) for accurate mappings.
const COMMON_TRANSLIT: Record<string, string> = {
  "मुकेश": "Mukesh",
  "अंबानी": "Ambani",
  "नरेन्द्र": "Narendra",
  "मोदी": "Modi",
  "गांधी": "Gandhi",
  "राहुल": "Rahul",
  "महात्मा": "Mahatma",
  "भारत": "Bharat",
  "दिल्ली": "Delhi",
  "मुंबई": "Mumbai",
  "बैंगलोर": "Bengaluru",
};

export interface DetectionResult {
  primary: string;
  scriptCounts: Record<string, number>;
  confidence: number;
}

export interface NormalizedAddress {
  raw: string;
  line: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pincodeValid: boolean;
}

export interface PanInfo {
  pan: string;
  valid: boolean;
  entity_type?: string;
}

export class IndicClient {
  private cache: KvCache;
  constructor(private env: IndicEnv) { this.cache = new KvCache(env.CACHE, "indic"); }

  detectScript(text: string): DetectionResult {
    const counts: Record<string, number> = {};
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (!cp) continue;
      if (cp < 0x20) continue;
      for (const s of SCRIPT_RANGES) {
        for (const [lo, hi] of s.ranges) {
          if (cp >= lo && cp <= hi) {
            counts[s.name] = (counts[s.name] ?? 0) + 1;
            break;
          }
        }
      }
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, n]) => sum + n, 0) || 1;
    return {
      primary: entries[0]?.[0] ?? "Unknown",
      scriptCounts: counts,
      confidence: (entries[0]?.[1] ?? 0) / total,
    };
  }

  async transliterate(text: string, from: string, to: string): Promise<{ text: string; from: string; to: string; source: "local" | "aksharamukha" }> {
    // Fast path: common-word table for Devanagari → Latin.
    if (from === "Devanagari" && to === "Latin" && COMMON_TRANSLIT[text]) {
      return { text: COMMON_TRANSLIT[text], from, to, source: "local" };
    }
    // Otherwise, call Aksharamukha.
    const key = `tl:${from}:${to}:${text}`;
    const out = await this.cache.memoize(key, 60 * 60 * 24 * 30, async () => {
      const url = `${this.env.AKSHARAMUKHA_BASE}/${encodeURIComponent(from)}/${encodeURIComponent(to)}/${encodeURIComponent(text)}`;
      const r = await fetch(url);
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`Aksharamukha ${r.status}: ${body.slice(0, 100)}`);
      }
      return await r.text();
    });
    return { text: out, from, to, source: "aksharamukha" };
  }

  normalizeName(name: string): { canonical: string; variants: string[] } {
    let n = name.trim().replace(/\s+/g, " ");
    // Strip common honorifics.
    n = n.replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Smt\.?|Shri\.?|Sri\.?|Sree\.?|Shree\.?|Sh\.?)\s+/i, "");
    // Title-case while preserving Indic.
    const canonical = n.split(" ").map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "").join(" ");

    // Generate variants (Sri / Shri / Sree / Shree etc.).
    const variants = [
      canonical,
      `Sri ${canonical}`,
      `Shri ${canonical}`,
      `Sree ${canonical}`,
      `Shree ${canonical}`,
    ];
    return { canonical, variants };
  }

  normalizeAddress(address: string): NormalizedAddress {
    const raw = address.trim();
    const pinMatch = raw.match(/\b(\d{6})\b/);
    const pincode = pinMatch?.[1];
    // Strip pincode + state from the line.
    let stripped = raw;
    if (pincode) stripped = stripped.replace(pinMatch![0], "").trim().replace(/[,.]\s*$/, "");
    // Split by commas; last token usually city/locality.
    const parts = stripped.split(",").map((s) => s.trim()).filter(Boolean);
    const city = parts.length > 1 ? parts[parts.length - 1] : undefined;
    const locality = parts.length > 2 ? parts[parts.length - 2] : undefined;
    const line = parts.slice(0, Math.max(0, parts.length - 2)).join(", ");
    let state: string | undefined;
    if (pincode) {
      const firstDigit = pincode[0];
      const region = PIN_REGIONS[firstDigit];
      // For now we return the most-likely state (the first in the region's list).
      // A more accurate lookup against the full India Post pincode CSV lives in
      // the private repo.
      state = region?.states?.[0];
    }
    return {
      raw, line: line || raw, locality, city, state, pincode,
      pincodeValid: !!pincode && /^\d{6}$/.test(pincode) && pincode[0] !== "0",
    };
  }

  pincodeToLocality(pincode: string): { pincode: string; valid: boolean; region?: string; states?: string[] } {
    const valid = /^\d{6}$/.test(pincode) && pincode[0] !== "0";
    if (!valid) return { pincode, valid: false };
    const r = PIN_REGIONS[pincode[0]];
    return { pincode, valid: true, region: r?.region, states: r?.states };
  }

  panInfo(pan: string): PanInfo {
    const p = pan.toUpperCase();
    const m = p.match(PAN_PATTERN);
    if (!m) return { pan: p, valid: false };
    return { pan: p, valid: true, entity_type: PAN_ENTITY_TYPE[m[1]] };
  }

  gstinInfo(gstin: string): { gstin: string; valid: boolean; state_code?: string; state?: string } {
    const g = gstin.toUpperCase();
    if (!GSTIN_PATTERN.test(g)) return { gstin: g, valid: false };
    const stateCode = g.slice(0, 2);
    return { gstin: g, valid: true, state_code: stateCode, state: STATE_GST_CODES[stateCode] };
  }
}

export { PIN_REGIONS, PAN_ENTITY_TYPE, PAN_PATTERN, GSTIN_PATTERN, STATE_GST_CODES };
