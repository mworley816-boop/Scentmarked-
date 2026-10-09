const CHECKS = [
  { path: '/' },
  { path: '/discover' },
  { path: '/compare' },
  { path: '/matches' },
  { path: '/login' },
  { path: '/api/health', contentType: 'application/json', json: { status: 'ok', service: 'scentmarked' } },
  { path: '/robots.txt', contentType: 'text/plain' },
  { path: '/sitemap.xml', contentType: 'xml' },
]

async function checkCatalogMinimum(baseUrl) {
  const raw = process.env.SCENTMARKED_MIN_PUBLISHED_PERFUMES
  if (!raw) {
    console.log('SKIP catalog minimum (SCENTMARKED_MIN_PUBLISHED_PERFUMES not set)')
    return true
  }
  const minimum = Number(raw)
  if (!Number.isSafeInteger(minimum) || minimum < 1) {
    console.log('FAIL catalog minimum must be a positive integer')
    return false
  }
  const response = await fetch(new URL('/discover', baseUrl), { redirect: 'follow' })
  if (!response.ok) {
    console.log('FAIL catalog minimum: Discover returned ' + response.status)
    return false
  }
  const html = await response.text()
  const match = html.match(/Showing\\s+[\\d,]+[–-][\\d,]+\\s+of\\s+([\\d,]+)\\s+scents/i)
  const count = match ? Number(match[1].replaceAll(',', '')) : null
  const ok = count !== null && count >= minimum
  console.log((ok ? 'PASS' : 'FAIL') + ' catalog minimum: ' + (count ?? 'not found') + ' / ' + minimum)
  return ok
}

function resolveBaseUrl() {
  const input = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL
  if (!input) {
    throw new Error('Provide a production URL as the first argument or set NEXT_PUBLIC_SITE_URL.')
  }

  const url = new URL(input)
  if (url.protocol !== 'https:') {
    throw new Error('Production smoke tests require an HTTPS URL.')
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Production URL must be an origin only, with no path, query, or fragment.')
  }
  return url
}

async function checkPath(baseUrl, check) {
  const url = new URL(check.path, baseUrl)
  const response = await fetch(url, { redirect: 'follow' })
  const statusOk = response.status >= 200 && response.status < 400
  const contentType = response.headers.get('content-type') || ''
  const contentTypeOk = !check.contentType || contentType.includes(check.contentType)
  let payloadOk = true
  let payloadDetail = ''

  if (check.json && statusOk && contentTypeOk) {
    try {
      const payload = await response.json()
      payloadOk = Object.entries(check.json).every(([key, value]) => payload?.[key] === value)
      if (!payloadOk) payloadDetail = ' (unexpected JSON payload)'
    } catch {
      payloadOk = false
      payloadDetail = ' (invalid JSON payload)'
    }
  }

  const ok = statusOk && contentTypeOk && payloadOk
  const typeDetail = contentTypeOk ? '' : ` (expected content-type containing ${check.contentType}, got ${contentType || 'none'})`
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${check.path} -> ${response.url}${typeDetail}${payloadDetail}`)
  return ok
}

async function main() {
  const baseUrl = resolveBaseUrl()
  console.log(`Smoke testing ${baseUrl.origin}`)

  const results = await Promise.all([...CHECKS.map((check) => checkPath(baseUrl, check)), checkCatalogMinimum(baseUrl)])
  if (results.some((ok) => !ok)) {
    process.exitCode = 1
    return
  }

  console.log(`Production smoke test passed for ${CHECKS.length} public routes.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
