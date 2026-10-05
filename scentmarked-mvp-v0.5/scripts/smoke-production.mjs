const CHECKS = [
  { path: '/' },
  { path: '/discover' },
  { path: '/compare' },
  { path: '/login' },
  { path: '/robots.txt', contentType: 'text/plain' },
  { path: '/sitemap.xml', contentType: 'xml' },
]

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
  const ok = statusOk && contentTypeOk
  const detail = contentTypeOk ? '' : ` (expected content-type containing ${check.contentType}, got ${contentType || 'none'})`
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${check.path} -> ${response.url}${detail}`)
  return ok
}

async function main() {
  const baseUrl = resolveBaseUrl()
  console.log(`Smoke testing ${baseUrl.origin}`)

  const results = await Promise.all(CHECKS.map((check) => checkPath(baseUrl, check)))
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
