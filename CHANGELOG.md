# Changelog

## [0.2.0] — 2026-06-10

### Changed
- **Billing migrated to Dodo Payments** (was: planned Stripe). Merchant-of-Record model — Dodo handles VAT/GST/sales-tax remittance worldwide on our behalf, lifting tax compliance off the operator.
- Env vars: `STRIPE_*` → `DODO_API_KEY` / `DODO_WEBHOOK_SECRET`. New `[vars]`: `DODO_PRODUCT_ID_{SOLO,TEAM,PRO}`, `PRODUCT_NAME`, `FROM_EMAIL`.

### Added
- `GET /upgrade?tier=…` — creates a Dodo hosted checkout link, 302s to it.
- `GET /account` — returns the caller's key + tier + Dodo customer-portal link (requires `Authorization: Bearer …`).
- `POST /webhooks/dodo` — verifies Standard-Webhooks signature (HMAC-SHA256 + 5-minute replay window), mints API keys on `subscription.active`, downgrades on cancellation/failure, idempotent on retries.
- `src/dodo.ts`, `src/webhook.ts`, `src/checkout.ts` — vendored shim, identical across all Category-1 products.
- `mintApiKey()`, `updateKeyStatus()`, `getKeyBySubscription()` in `auth.ts`.
- `KeyRecord.status` field — tracks `active` / `cancelled` / `past_due`.
- Optional Resend integration: API key emailed to the customer on subscription start.


## [0.1.0] — 2026-06-01

### Added
- Initial release. Tools: `transliterate`, `detect_script`, `normalize_name`, `normalize_address`, `pincode_to_locality`, `state_from_pan`.
- Script detection covers Devanagari, Tamil, Telugu, Kannada, Bengali, Gujarati, Malayalam, Punjabi (Gurmukhi), Odia, and Latin.
- PAN state-extraction uses 4th character (AABCS prefix logic varies by PAN holder type, not state — historically true; documented in TOOLS.md).
- PIN-code → state derivation via first digit + second digit (India Post 9-region scheme).
