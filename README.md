# indic-normalize-mcp — SCAFFOLD

> Indic-language transliteration + Indian name/address normalization. Wraps Wikidata + Aksharamukha + OpenStreetMap. Tiny niche, sticky usage — every India-targeted agent product needs it.

**Status:** scaffolded. Idea #32 in [`../../../ai-as-customer-ideas.md`](../../../ai-as-customer-ideas.md).

---

## Planned tools

| Tool | What it returns |
|---|---|
| `transliterate(text, from_script, to_script)` | "मुकेश अंबानी" → "Mukesh Ambani" (or vice-versa). Supports Devanagari, Tamil, Telugu, Kannada, Bengali, Gujarati, Malayalam, Punjabi, Odia, Marathi, plus IAST and ISO 15919 Latin. |
| `detect_script(text)` | Script + language probability. |
| `normalize_name(name)` | Canonical form + variants ("Sri", "Shri", "Sree", "Shree"). |
| `normalize_address(address)` | Parse Indian address → {line, locality, city, state, pincode}. PIN-code derives state. |
| `pincode_to_locality(pincode)` | Pincode → city/state via India Post + OSM. |
| `state_from_pan(pan)` | Validates PAN format + extracts state code. |

## Audience

- Every agent product targeting India.
- Pairs naturally with `indian-regulatory-mcp` — same audience.
- Indian e-commerce, fintech, gov-tech agents.

## Pricing

Lower-traffic but indispensable for the audience. Free tier 200/mo to drive adoption.

## Open / closed split

- **Open**: Aksharamukha wrapper, regex-based detection, basic transliteration.
- **Closed**: name-variant database (hand-curated), pincode → locality fast lookup (precomputed from India Post + OSM), address parser ML model.

## Notes

- Aksharamukha is open-source — full credit + sponsorship. Don't try to compete with it; *use* it via their hosted API or self-host.
- This is a "boring infrastructure" play — never hits viral growth, but installs once and stays installed.

## See also

- [`../indian-regulatory-mcp/`](../indian-regulatory-mcp/) — pair with this.
- [`../README.md`](../README.md) — Category 1 pipeline.


---

## Sister MCPs

All from the same operator, all live on `<product>.prakhar-cognizance.workers.dev`, all free-tier friendly:

| Group | Products |
|---|---|
| **Research** | [sec-edgar](https://github.com/guptaprakhariitr/sec-edgar-mcp) · [arxiv](https://github.com/guptaprakhariitr/arxiv-mcp) · [world-bank-economic](https://github.com/guptaprakhariitr/world-bank-economic-mcp) · [uspto-patents](https://github.com/guptaprakhariitr/uspto-patents-mcp) · [fda-approvals](https://github.com/guptaprakhariitr/fda-approvals-mcp) |
| **Verification + Utility** | [verification](https://github.com/guptaprakhariitr/verification-mcp) ⭐ · [unit-converter](https://github.com/guptaprakhariitr/unit-converter-mcp) |
| **India** | [indic-normalize](https://github.com/guptaprakhariitr/indic-normalize-mcp) · [indian-regulatory](https://github.com/guptaprakhariitr/indian-regulatory-mcp) |
| **Real-time** | [hn-trending](https://github.com/guptaprakhariitr/hn-trending-mcp) · [wikipedia-recent-changes](https://github.com/guptaprakhariitr/wikipedia-recent-changes-mcp) · [gdelt-events](https://github.com/guptaprakhariitr/gdelt-events-mcp) · [crypto-prices](https://github.com/guptaprakhariitr/crypto-prices-mcp) |
| **Healthcare** | [drug-interaction](https://github.com/guptaprakhariitr/drug-interaction-mcp) |
| **Logistics** | [multi-carrier-tracking](https://github.com/guptaprakhariitr/multi-carrier-tracking-mcp) |

Full catalog: https://github.com/guptaprakhariitr · ⭐ = empty-quadrant / highest-conviction pick.

