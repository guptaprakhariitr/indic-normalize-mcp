import { Tool } from "./mcp-server";
import { IndicClient, IndicEnv } from "./indic";

export function buildTools(): Tool[] {
  return [
    {
      name: "transliterate",
      description:
        "Transliterate text between Indic scripts and Latin. Source/target script names: Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati, Oriya, Latin (also accepts ISO 15919 / IAST as Latin variants in the private extended build). Fast common-word path; falls back to Aksharamukha for full coverage.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string" },
          from_script: { type: "string", description: "Source script name." },
          to_script: { type: "string", description: "Target script name." },
        },
        required: ["text", "from_script", "to_script"],
      },
      handler: async (args, ctx) => {
        const c = new IndicClient(ctx.env as unknown as IndicEnv);
        return await c.transliterate(args.text, args.from_script, args.to_script);
      },
    },

    {
      name: "detect_script",
      description: "Detect the dominant script of input text. Returns primary script + per-script character counts + a confidence score.",
      inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
      handler: async (args, ctx) => {
        const c = new IndicClient(ctx.env as unknown as IndicEnv);
        return c.detectScript(args.text);
      },
    },

    {
      name: "normalize_name",
      description: "Normalize an Indian personal name: strip honorifics, title-case, return canonical form and common spelling variants ('Sri'/'Shri'/'Sree'/'Shree').",
      inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
      handler: async (args, ctx) => {
        const c = new IndicClient(ctx.env as unknown as IndicEnv);
        return c.normalizeName(args.name);
      },
    },

    {
      name: "normalize_address",
      description: "Parse an Indian postal address into structured fields: line, locality, city, state (from PIN), pincode. Validates PIN.",
      inputSchema: { type: "object", properties: { address: { type: "string" } }, required: ["address"] },
      handler: async (args, ctx) => {
        const c = new IndicClient(ctx.env as unknown as IndicEnv);
        return c.normalizeAddress(args.address);
      },
    },

    {
      name: "pincode_to_locality",
      description: "Decode a 6-digit Indian PIN code: region + likely state(s). For exact city lookup, use the bundled India-Post lookup table (premium, private repo).",
      inputSchema: { type: "object", properties: { pincode: { type: "string" } }, required: ["pincode"] },
      handler: async (args, ctx) => {
        const c = new IndicClient(ctx.env as unknown as IndicEnv);
        return c.pincodeToLocality(args.pincode);
      },
    },

    {
      name: "state_from_pan",
      description: "Validate a PAN (Permanent Account Number) and extract the entity type (individual / company / HUF / firm / trust / etc.) from the 4th character. NOTE: PAN's 4th character encodes *entity type*, not state — this tool surfaces the entity type and validates structure.",
      inputSchema: { type: "object", properties: { pan: { type: "string" } }, required: ["pan"] },
      handler: async (args, ctx) => {
        const c = new IndicClient(ctx.env as unknown as IndicEnv);
        return c.panInfo(args.pan);
      },
    },

    {
      name: "gstin_info",
      description: "Validate a GSTIN and return the state code (first 2 digits) + state name.",
      inputSchema: { type: "object", properties: { gstin: { type: "string" } }, required: ["gstin"] },
      handler: async (args, ctx) => {
        const c = new IndicClient(ctx.env as unknown as IndicEnv);
        return c.gstinInfo(args.gstin);
      },
    },
  ];
}
