# Registry Submission Checklist — indic-normalize-mcp

Pre-filled values for every MCP registry. Each submission takes 1–3 minutes in a browser.

## ✅ Already automatic

### Glama — `glama.ai`
Auto-crawls GitHub by repo topic `mcp-server`. Already tagged. Indexes within 24 hours.
- https://glama.ai/mcp/servers?q=indic-normalize-mcp

### Official MCP Registry
- The `server.json` at this repo's root is the registry manifest.
- Submit via: `mcp-publisher publish server.json` (after `make publisher` and `mcp-publisher login github` in the registry repo).
- Downstream registries (PulseMCP, mcp.so) ingest from here weekly.

## 🌐 Manual browser submission

### PulseMCP — single URL field
- https://www.pulsemcp.com/submit
- **Paste:** `https://github.com/guptaprakhariitr/indic-normalize-mcp`

### mcp.so — multi-field form
- https://mcp.so/submit
- **Name:** `indic-normalize-mcp`
- **Display name:** `Indic Normalize`
- **Description:** `Indic-language transliteration + Indian name/address/PIN normalization. Wraps Aksharamukha + Wikidata + India Post.`
- **GitHub URL:** `https://github.com/guptaprakhariitr/indic-normalize-mcp`
- **Endpoint URL:** `https://indic-normalize-mcp.prakhar-cognizance.workers.dev/mcp`
- **Tags:** indic, devanagari, tamil, transliteration, aksharamukha, india, pincode, pan, gstin
- **License:** MIT
- **Transport:** HTTP (remote)

### mcp.directory
- https://mcp.directory/submit
- Same values as mcp.so. Include a demo GIF if you can.

### Smithery (paid — $30/mo)
- https://smithery.ai/new
- Worth it if you have ≥6 paid subscribers.

### Cursor Marketplace
- Submit from Cursor → Settings → Marketplace → Submit. Curated; 1–2 weeks for approval.

## Social

### Show HN
- Title: `Show HN: indic-normalize-mcp — Indic Normalize as an MCP for Claude / Cursor`
- URL: `https://github.com/guptaprakhariitr/indic-normalize-mcp`

### Twitter / X thread template
> Just shipped indic-normalize-mcp — Model Context Protocol server: indic-language transliteration + indian name/address/pin normalization.
>
> Endpoint: https://indic-normalize-mcp.prakhar-cognizance.workers.dev/mcp
> GitHub: https://github.com/guptaprakhariitr/indic-normalize-mcp
>
> Free tier available. Paid from $9/mo.
