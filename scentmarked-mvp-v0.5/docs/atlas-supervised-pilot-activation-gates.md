# Atlas supervised research pilot: activation gates

**Status: NOT AUTHORIZED for paid calls, automatic scheduling, or publishing.**

## Confirmed on 2026-11-17
- Production Scentmarked Supabase project `qnlqdkctfmfagsvbwiis` has the private budget ledger migration applied and recorded.
- Both budget tables have RLS enabled. Anonymous and authenticated SELECT are denied; service-role access is present.
- Reservation and settlement functions use SECURITY INVOKER; anonymous and authenticated EXECUTE are denied.
- PR #365 merged with successful validation and Workers build. Its test exercises the budget adapter through a fully mocked counted research pipeline.
- A read-only database check found one queued Atlas task, zero private evidence drafts, and zero budget reservations. These counts are a snapshot, not a guarantee of future state.

## Still required before any paid pilot
1. **No automatic activation:** no public route, cron, scheduled worker, or production invocation until separate explicit operator approval.
2. **Provider configuration:** verify a server-only OpenAI API key with a non-billable credential check, approved exact model, approved source allowlist, network restrictions, and request timeouts. Never print keys or send them to browser code.
3. **Current pricing:** independently verify official model input, cached input, and output rates and translate them to USD micros per million tokens. No placeholder/test rates in production.
4. **Cost ceilings:** explicitly approve daily budget, per-request reserve, maximum input tokens, maximum output tokens, maximum request bytes, and single-task limit. Confirm worst-case reserved cost covers the chosen model and limits.
5. **Operational safety:** verify source URLs, task type, task lease and retry behavior, error reporting, and ability to disable the runner immediately. Ensure failed billable calls consume reserved budget conservatively until reviewed.
6. **Test evidence:** keep GitHub validation and disposable PostgreSQL ledger tests green. Do not run destructive or concurrent stress tests on production.
7. **Explicit paid-pilot approval:** obtain separate authorization for exactly one supervised task and a stated maximum spend before invoking the provider. Keep all output as private drafts pending human review.
8. **Post-pilot inspection:** verify reservation, settlement, task status, citations, private draft, and recorded actual usage. Do not auto-publish or generate graphics.

## Stop conditions
Missing/invalid credentials, unverified model pricing, inadequate worst-case reserve, public privileges on budget objects, failed tests, absent operator approval, unexpected task type, or inability to stop execution.

**This document is a checklist only. It does not change production configuration or authorize spending.**
