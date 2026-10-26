/**
 * Shared contract for Atlas retailer research suggestions.
 * Research is evidence, not permission to publish or a claim of affiliation.
 */
export type AtlasRetailerCandidate = {
  perfume_id: string
  merchant_name: string
  product_url: string
  source_url: string
  brand: string
  perfume_name: string
  bottle_size_ml?: number | null
  concentration?: string | null
  evidence_note: string
}

export type CandidateValidation =
  | { ok: true; candidate: AtlasRetailerCandidate }
  | { ok: false; reason: string }

function securePublicUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false
    const host = u.hostname.toLowerCase()
    if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false
    if (/^(?:\\d{1,3}\\.){3}\\d{1,3}$/.test(host) || host.includes(':')) return false
    return true
  } catch { return false }
}

export function validateAtlasRetailerCandidate(input: unknown): CandidateValidation {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, reason: 'Invalid candidate' }
  const x = input as Record<string, unknown>
  if (typeof x.perfume_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x.perfume_id)) return { ok: false, reason: 'Invalid perfume ID' }
  for (const key of ['merchant_name', 'brand', 'perfume_name', 'evidence_note'] as const) {
    if (typeof x[key] !== 'string' || !x[key].trim() || x[key].length > 500) return { ok: false, reason: 'Missing or oversized ' + key }
  }
  if (!securePublicUrl(x.product_url) || !securePublicUrl(x.source_url)) return { ok: false, reason: 'A public HTTPS product and evidence URL are required' }
  if (x.bottle_size_ml != null && (typeof x.bottle_size_ml !== 'number' || !Number.isFinite(x.bottle_size_ml) || x.bottle_size_ml <= 0 || x.bottle_size_ml > 1000)) return { ok: false, reason: 'Invalid bottle size' }
  if (x.concentration != null && (typeof x.concentration !== 'string' || x.concentration.length > 100)) return { ok: false, reason: 'Invalid concentration' }
  return { ok: true, candidate: {
    perfume_id: x.perfume_id as string,
    merchant_name: (x.merchant_name as string).trim(),
    product_url: x.product_url as string,
    source_url: x.source_url as string,
    brand: (x.brand as string).trim(),
    perfume_name: (x.perfume_name as string).trim(),
    bottle_size_ml: x.bottle_size_ml as number | null | undefined,
    concentration: x.concentration as string | null | undefined,
    evidence_note: (x.evidence_note as string).trim()
  } }
}

/** The existing affiliate offer table is the publication destination, not a research inbox. */
export function atlasCandidateToInactiveOffer(candidate: AtlasRetailerCandidate) {
  return {
    perfume_id: candidate.perfume_id,
    merchant_name: candidate.merchant_name,
    affiliate_url: candidate.product_url,
    label: [candidate.bottle_size_ml ? candidate.bottle_size_ml + ' ml' : '', candidate.concentration || ''].filter(Boolean).join(' · ') || null,
    is_active: false as const,
    currency: 'USD',
    priority: 100
  }
}
