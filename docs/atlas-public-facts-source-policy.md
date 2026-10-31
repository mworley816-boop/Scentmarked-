# Atlas public-facts research source policy

This operational checklist is not legal advice. Review each source individually before enabling automated retrieval.

## Principles
- Perfume names, brand identifiers, and factual fragrance-note lists may be researched and recorded as facts. Do not copy creative marketing descriptions or product photography without appropriate rights or an applicable exception.
- Manufacturer permission is **not a universal prerequisite** for collecting public facts. Permission, licensing, contractual restrictions, technical access rules, and jurisdiction-specific law must be assessed per source and collection method.
- Do not access accounts, paywalls, restricted endpoints, or evade blocks, CAPTCHAs, rate limits, or other access controls.
- Treat robots.txt and published terms as review inputs, not blanket authorization or a complete statement of law.
- Record the page URL, retrieval date, source operator, access/terms review, and extracted factual claims. Attribute sources in the research record.
- Use conservative request rates, bounded response sizes, vetted HTTPS/DNS connections, and human approval before catalog publication.
- Keep image generation and publication rights checks separate from factual data collection.

## Before adding a source to the reviewed registry
1. Verify the operator and the exact brand/hostname relationship.
2. Inspect publicly posted access conditions and terms, including automated-access restrictions.
3. Determine whether proposed collection is permitted or requires legal review or consent; escalate ambiguous or restrictive cases.
4. Document the decision, reviewer, date, URLs, permitted scope, and re-review date in the issue or review record.
5. Add only the reviewed exact hostname to the code-maintained registry and test the full transport pipeline.
6. Keep the source disabled if any material review question remains unresolved.

## Current Arabiyat status
Candidate manufacturer domain: `myperfumes.ae`. Operator relationship has been researched, but automated collection conditions remain unresolved. **Do not add this hostname to the trusted registry yet.** The existing empty allowlist is intentional.

## Automation boundaries
Atlas may prepare offline draft research from supplied text without network retrieval. Live automated retrieval remains gated on source review. No automatic publishing, protected image reuse, or bypass of access restrictions is authorized by this policy.
