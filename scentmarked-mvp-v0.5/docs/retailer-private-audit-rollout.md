# Private retailer evidence audit: connection and rollout

## Current state
- Scentmarked production has `atlas_private.retailer_evidence_audit` with RLS enabled, no `anon` or `authenticated` grants.
- Schema is versioned in `supabase/migrations/20261028113000_private_retailer_evidence_audit.sql`.
- `lib/atlas-retailer-private-audit.ts` defines an injected writer contract but is **not** connected to the intake route.
- The existing Strawberry Tres Leches offer is inactive; its initial audit entry was inserted directly by a privileged database operation, not by the intake API.

## Implementation gate
1. Choose a privileged **server-only** transport with the ability to insert into the private schema. The current Supabase JS Data API client cannot access an unexposed private schema. Do not expose `atlas_private` in Data API settings or add a public security-definer RPC.
2. Prefer a reviewed direct PostgreSQL connection compatible with the Cloudflare runtime, using a secret connection string and bounded connection/timeouts; verify driver compatibility and network access before adding dependencies.
3. The writer must insert the validated `RetailerAuditInput` with a server-generated observation timestamp, no browser credentials, and no sensitive logging. Preserve the database CHECK constraints.
4. Decide the consistency model: a successful inactive offer insert followed by audit failure must not return a misleading success. Prefer an atomic transaction or durable outbox; do not silently lose audit evidence. Duplicate requests should be audited without creating a second offer.
5. Add tests for missing transport, audit write failures, duplicate detection, and safe redaction. Validate the full CI pipeline.
6. Only after a successful private write and an authorized, nonpublishing staging test, enable the live intake integration.

## Non-goals
- No change to the deployed Atlas Worker.
- No automatic activation of affiliate offers.
- No public schema grants or client-side database secrets.
- No claims of an authenticated end-to-end test until one actually runs.

## Production verification checklist
- `anon` and `authenticated` cannot use or select from `atlas_private.retailer_evidence_audit`.
- `service_role` can insert; the server-side transport can insert using its own restricted credentials.
- A duplicate candidate returns 409 without creating another offer.
- The original offer remains `is_active = false`.
- Every successful intake outcome has a corresponding durable audit entry, or a documented recoverable outbox event.
