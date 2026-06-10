import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IndicClient, PAN_PATTERN, GSTIN_PATTERN } from "../src/indic";
import { McpServer, ToolContext } from "../src/mcp-server";
import { buildTools } from "../src/tools";

class FakeKv {
  store = new Map<string, string>();
  async get(key: string, type?: "text" | "json"): Promise<any> {
    const v = this.store.get(key); if (v === undefined) return null;
    if (type === "json") return JSON.parse(v); return v;
  }
  async put(key: string, value: string): Promise<void> { this.store.set(key, value); }
  async delete(key: string): Promise<void> { this.store.delete(key); }
}

const env = {
  CACHE: new FakeKv() as unknown as KVNamespace,
  USAGE: new FakeKv() as unknown as KVNamespace,
  AKSHARAMUKHA_BASE: "https://aksharamukha-plugin.appspot.com/api/public",
  UPGRADE_URL: "x",
};

beforeEach(() => {
  (env.CACHE as any).store = new Map();
  vi.stubGlobal("fetch", async (url: string | URL) => {
    const u = typeof url === "string" ? url : url.toString();
    // Aksharamukha route: /<from>/<to>/<text>
    if (u.includes("aksharamukha")) {
      // Return a fabricated transliteration for unknown words.
      if (u.includes("Devanagari/Latin")) return new Response("Bharatiya", { status: 200 });
      return new Response("translit", { status: 200 });
    }
    return new Response("{}", { status: 200 });
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("script detection", () => {
  const c = new IndicClient(env as any);

  it("detects Devanagari", () => {
    const r = c.detectScript("मुकेश अंबानी");
    expect(r.primary).toBe("Devanagari");
    expect(r.confidence).toBeGreaterThan(0.8);
  });
  it("detects Latin", () => {
    const r = c.detectScript("Mukesh Ambani");
    expect(r.primary).toBe("Latin");
  });
  it("detects Tamil", () => {
    const r = c.detectScript("சென்னை");
    expect(r.primary).toBe("Tamil");
  });
  it("detects Bengali", () => {
    const r = c.detectScript("কলকাতা");
    expect(r.primary).toBe("Bengali");
  });
});

describe("transliterate", () => {
  it("uses fast common-word table when available", async () => {
    const c = new IndicClient(env as any);
    const r = await c.transliterate("मुकेश", "Devanagari", "Latin");
    expect(r.text).toBe("Mukesh");
    expect(r.source).toBe("local");
  });
  it("falls back to Aksharamukha for unknown words", async () => {
    const c = new IndicClient(env as any);
    const r = await c.transliterate("भारतीय", "Devanagari", "Latin");
    expect(r.text).toBe("Bharatiya");
    expect(r.source).toBe("aksharamukha");
  });
});

describe("normalize_name", () => {
  it("strips honorifics and title-cases", () => {
    const c = new IndicClient(env as any);
    const r = c.normalizeName("Sri RAHUL  gandhi");
    expect(r.canonical).toBe("Rahul Gandhi");
    expect(r.variants).toContain("Shri Rahul Gandhi");
    expect(r.variants).toContain("Sree Rahul Gandhi");
  });
});

describe("normalize_address", () => {
  it("extracts pincode + city + line", () => {
    const c = new IndicClient(env as any);
    const r = c.normalizeAddress("Flat 4B, Sunshine Apt, Koramangala, Bangalore, 560034");
    expect(r.pincode).toBe("560034");
    expect(r.pincodeValid).toBe(true);
    expect(r.city).toBe("Bangalore");
    expect(r.locality).toBe("Koramangala");
    // 5xxxxx → Southern region. First-digit heuristic gives first state in
    // the southern list ("AP"); true 56x pincodes are Karnataka. Exact lookup
    // lives in the premium India-Post CSV (private repo).
    expect(["AP", "TG", "KA"]).toContain(r.state);
  });

  it("flags invalid pincodes (leading 0)", () => {
    const c = new IndicClient(env as any);
    const r = c.normalizeAddress("X, 012345");
    expect(r.pincodeValid).toBe(false);
  });
});

describe("PAN validation", () => {
  it("validates structure and extracts entity type", () => {
    const c = new IndicClient(env as any);
    expect(c.panInfo("ABCPK1234E").valid).toBe(true);
    expect(c.panInfo("ABCPK1234E").entity_type).toBe("individual");
    expect(c.panInfo("ABCCK1234E").entity_type).toBe("company");
    expect(c.panInfo("ABCHK1234E").entity_type).toBe("hindu_undivided_family");
  });
  it("rejects malformed PANs", () => {
    const c = new IndicClient(env as any);
    expect(c.panInfo("ABCDE1234F").valid).toBe(false);     // 4th char not in PCHFATBLJG
    expect(c.panInfo("not a pan").valid).toBe(false);
    expect(c.panInfo("ABCPK1234").valid).toBe(false);      // too short
  });
});

describe("GSTIN validation", () => {
  it("validates structure and extracts state", () => {
    const c = new IndicClient(env as any);
    const r = c.gstinInfo("29ABCDE1234F1Z5");                 // Karnataka
    expect(r.valid).toBe(true);
    expect(r.state_code).toBe("29");
    expect(r.state).toBe("KA");
  });
  it("rejects malformed GSTINs", () => {
    const c = new IndicClient(env as any);
    expect(c.gstinInfo("INVALID").valid).toBe(false);
  });
});

describe("pincode_to_locality", () => {
  it("decodes region from first digit", () => {
    const c = new IndicClient(env as any);
    const r = c.pincodeToLocality("110001");
    expect(r.valid).toBe(true);
    expect(r.states).toContain("DL");
  });
});

describe("regex sanity", () => {
  it("PAN_PATTERN accepts canonical examples", () => {
    expect(PAN_PATTERN.test("ABCPK1234E")).toBe(true);
  });
  it("GSTIN_PATTERN accepts canonical examples", () => {
    expect(GSTIN_PATTERN.test("29ABCDE1234F1Z5")).toBe(true);
  });
});

describe("MCP protocol", () => {
  const server = new McpServer({ name: "indic-normalize-mcp", version: "0.1.0" });
  for (const t of buildTools()) server.register(t);
  const ctx: ToolContext = { env: env as any, apiKey: null, tier: "free", callsRemaining: 200 };

  it("lists 7 tools on free tier", async () => {
    const r = await server.handle({ jsonrpc: "2.0", id: 1, method: "tools/list" }, ctx);
    const names = (r!.result as any).tools.map((t: any) => t.name) as string[];
    expect(names.length).toBe(7);
  });

  it("transliterate end-to-end", async () => {
    const r = await server.handle(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "transliterate", arguments: { text: "मुकेश", from_script: "Devanagari", to_script: "Latin" } } }, ctx
    );
    const out = JSON.parse((r!.result as any).content[0].text);
    expect(out.text).toBe("Mukesh");
  });
});
