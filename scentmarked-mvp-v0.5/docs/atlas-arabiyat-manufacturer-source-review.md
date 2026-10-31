# Arabiyat / Arabiyat Prestige — manufacturer source review (2026-10-31)

Status: **Evidence collected; NOT APPROVED for automated retrieval.**

## Strongest manufacturer-identity evidence

- https://myperfumes.ae/pages/how-to-spot-a-fake
  - My Perfumes identifies `myperfumes.ae` as its official site and explains that genuine Arabiyat Prestige packaging and QR codes lead there.
  - This supports `myperfumes.ae` as a candidate first-party manufacturer source, subject to operational and legal review.

## Alternative storefronts (do not automatically trust as manufacturer-owned)

- https://arabiyatprestige.com/pages/terms-conditions
  - The site identifies its operator as MF Manufacturing & Trading Co. and describes ownership of its own content.
- https://arabiyatprestigeus.com/pages/terms-and-condition
  - Describes itself as an official seller; that does not itself establish manufacturer ownership or authorization for automated extraction.

## Approval checklist

- [ ] Confirm manufacturer ownership of the exact `myperfumes.ae` hostname through independent corroboration.
- [ ] Review current terms, robots guidance and permissible access; obtain permission where necessary.
- [ ] Confirm the site has product pages with usable labeled fragrance notes.
- [ ] Review allowed request rate, caching and source attribution requirements.
- [ ] Verify production network runtime and DNS-pinned retrieval on a controlled staging job.
- [ ] Add the exact approved hostname for the correct catalog brand identifiers only after signoff.
- [ ] Test end-to-end extraction and review-only output without publishing.

Do not copy domains from this note into the trusted registry without completing the checklist.

## Terms and permissions check (2026-10-31)

- https://myperfumes.ae/collections/arabiyat explicitly states Arabiyat is an in-house brand developed by My Perfumes. This strengthens manufacturer-domain identity evidence.
- https://myperfumes.ae/pages/terms-conditions identifies My Perfumes Factory LLC as operator and requires users to comply with applicable copyright laws. It does **not** establish a permission grant for automated collection, republishing descriptions, or using product imagery.
- https://myperfumes.ae/pages/legal asks users not to interfere with the site or other visitors.
- A direct robots.txt inspection was inconclusive from the research environment; **do not interpret this as permission**.
- Regional storefronts may have different legal operators and terms; do not treat subdomains as automatically approved.

**Decision:** Keep `ATLAS_REVIEWED_MANUFACTURER_DOMAINS` empty for Arabiyat pending written permission or a documented authorized data feed and a verified robots/access policy. The dry-run workflow must continue to fail closed. Manual review and independently authored factual note summaries can continue without automated retrieval.

**Suggested permission request:** Ask My Perfumes Factory LLC for permission to programmatically access a limited set of public product pages or an official product feed to extract factual note pyramids for Scentmarked, with source links, attribution, agreed rate limits, caching, and no image copying without separate permission.
