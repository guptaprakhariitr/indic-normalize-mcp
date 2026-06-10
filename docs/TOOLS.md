# Tools Reference — indic-normalize-mcp

Per-tool reference for AI agents. The descriptions below are what the LLM reads to decide whether to call your tool — verbatim from `src/tools.ts`.

## `transliterate`

Transliterate text between Indic scripts and Latin. Source/target script names: Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati, Oriya, Latin (also accepts ISO 15919 / IAST as Latin variants in the private extended build). Fast common-word path; falls back to Aksharamukha for full coverage.

See `src/tools.ts` for the JSON Schema input.

## `detect_script`

Detect the dominant script of input text. Returns primary script + per-script character counts + a confidence score.

See `src/tools.ts` for the JSON Schema input.

## `normalize_name`

Normalize an Indian personal name: strip honorifics, title-case, return canonical form and common spelling variants ('Sri'/'Shri'/'Sree'/'Shree').

See `src/tools.ts` for the JSON Schema input.

## `normalize_address`

Parse an Indian postal address into structured fields: line, locality, city, state (from PIN), pincode. Validates PIN.

See `src/tools.ts` for the JSON Schema input.

## `pincode_to_locality`

Decode a 6-digit Indian PIN code: region + likely state(s). For exact city lookup, use the bundled India-Post lookup table (premium, private repo).

See `src/tools.ts` for the JSON Schema input.

## `state_from_pan`

Validate a PAN (Permanent Account Number) and extract the entity type (individual / company / HUF / firm / trust / etc.) from the 4th character. NOTE: PAN's 4th character encodes *entity type*, not state — this tool surfaces the entity type and validates structure.

See `src/tools.ts` for the JSON Schema input.

## `gstin_info`

Validate a GSTIN and return the state code (first 2 digits) + state name.

See `src/tools.ts` for the JSON Schema input.

## Client setup

### Cursor / Claude Desktop / Cline
```json
{
  "mcpServers": {
    "indic-normalize-mcp": {
      "url": "https://indic-normalize-mcp.prakhar-cognizance.workers.dev/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

Anonymous requests get the free tier (100 calls/month, 10/min). Upgrade at `/upgrade?tier=solo|team|pro`.