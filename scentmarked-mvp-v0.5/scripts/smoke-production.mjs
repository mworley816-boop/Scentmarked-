const REQUEST_TIMEOUT_MS = 15000

const CHECKS = [
  { path: '/', contentType: 'text/html' },
  { path: '/discover', contentType: 'text/html' },
  { path: '/compare', contentType: 'text/html', requiredText: ['Compare Scents', 'First fragrance', 'Second fragrance'] },
  { path: '/matches', contentType: 'text/html', requiredText: ['Find Your Scent Match', 'Find My Matches'] },
  { path: '/login', contentType: 'text/html', requiredText: ['Sign In', 'Start My Scent Profile', 'Forgot password?'] },
  { path: '/login?signup=finish', contentType: 'text/html', requiredText: ['Create Account &amp; See My Matches', 'name="email"', 'name="password"'] },
  { path: '/reset-password', contentType: 'text/html', requiredText: ['Reset password', 'This recovery session is missing or has expired.', 'Request another link'] },
  { path: '/onboarding', contentType: 'text/html', requiredText: ['What smells like you?', 'Which scent families'] },
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
  const response = await fetch(new URL('/discover', baseUrl), { redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) {
    console.log('FAIL catalog minimum: Discover returned ' + response.status)
    return false
  }
  const finalUrl = new URL(response.url)
  if (finalUrl.origin !== baseUrl.origin || finalUrl.pathname !== '/discover') {
    console.log('FAIL catalog minimum: Discover redirected to ' + response.url)
    return false
  }
  const html = await response.text()
  const match = html.match(/Showing\s+[\d,]+[–-][\d,]+\s+of\s+([\d,]+)\s+scents/i)
  const count = match ? Number(match[1].replaceAll(',', '')) : null
  const unavailable = /The scent library is temporarily unavailable/i.test(html)
  const ok = !unavailable && count !== null && count >= minimum
  console.log((ok ? 'PASS' : 'FAIL') + ' catalog minimum: ' + (count ?? 'not found') + ' / ' + minimum + (unavailable ? ' (catalog error shown)' : ''))
  if (!ok) return false

  // Verify that the last page is actually reachable and agrees with the first-page total.
  const pageSize = 24
  const lastPage = Math.ceil(count / pageSize)
  const lastResponse = await fetch(new URL('/discover?page=' + lastPage, baseUrl), { redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!lastResponse.ok) {
    console.log('FAIL last catalog page: HTTP ' + lastResponse.status)
    return false
  }
  const lastUrl = new URL(lastResponse.url)
  if (lastUrl.origin !== baseUrl.origin || lastUrl.pathname !== '/discover') {
    console.log('FAIL last catalog page: Discover redirected to ' + lastResponse.url)
    return false
  }
  const lastHtml = await lastResponse.text()
  const lastMatch = lastHtml.match(/Showing\s+([\d,]+)[–-]([\d,]+)\s+of\s+([\d,]+)\s+scents/i)
  const lastStart = lastMatch ? Number(lastMatch[1].replaceAll(',', '')) : null
  const lastEnd = lastMatch ? Number(lastMatch[2].replaceAll(',', '')) : null
  const lastTotal = lastMatch ? Number(lastMatch[3].replaceAll(',', '')) : null
  const lastOk = !/The scent library is temporarily unavailable/i.test(lastHtml) &&
    lastStart === (lastPage - 1) * pageSize + 1 &&
    lastEnd === count && lastTotal === count
  console.log((lastOk ? 'PASS' : 'FAIL') + ' last catalog page: page ' + lastPage +
    ', showing ' + (lastStart ?? '?') + '-' + (lastEnd ?? '?') + ' of ' + (lastTotal ?? '?'))
  return lastOk
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
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  const statusOk = response.status >= 200 && response.status < 400
  const finalUrl = new URL(response.url)
  const redirectedToAuth = check.path !== '/login' && (/^\/(?:login|signup|sign-up)(?:\/|$)/.test(finalUrl.pathname) || finalUrl.pathname === '/auth')
  const sameOrigin = finalUrl.origin === baseUrl.origin
  const expectedPath = new URL(check.path, baseUrl).pathname
  const samePath = finalUrl.pathname.replace(/\/$/, '') === expectedPath.replace(/\/$/, '')
  const expectedSearch = new URL(check.path, baseUrl).searchParams
  const sameQuery = [...expectedSearch].every(([key, value]) => finalUrl.searchParams.get(key) === value)
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

  let pageContentOk = true
  // Read HTML once so multiple independent checks can inspect the same response.
  const html = statusOk && contentTypeOk && (check.path === '/discover' || check.path === '/compare' || check.path === '/matches' || check.requiredText)
    ? await response.text() : ''
  if (check.path === '/discover' && statusOk && contentTypeOk) {
    if (/The scent library is temporarily unavailable/i.test(html)) {
      pageContentOk = false
      payloadDetail += ' (catalog unavailable message displayed)'
    }
    // Even without an optional catalog minimum, an empty public library is a launch blocker.
    if (!/Showing\s+[\d,]+[–-][\d,]+\s+of\s+[1-9][\d,]*\s+scents/i.test(html)) {
      pageContentOk = false
      payloadDetail += ' (no nonempty catalog count displayed)'
    }
  }
  if (check.path === '/matches' && statusOk && contentTypeOk && /Matches are temporarily unavailable/i.test(html)) {
    pageContentOk = false
    payloadDetail += ' (match catalog unavailable)'
  }
  if (check.path === '/compare' && statusOk && contentTypeOk && /Comparison data is temporarily unavailable|More fragrances are needed to compare/i.test(html)) {
    pageContentOk = false
    payloadDetail += ' (comparison catalog unavailable or too small)'
  }
  if (check.requiredText && statusOk && contentTypeOk) {
    const missing = check.requiredText.filter((marker) => !html.includes(marker))
    pageContentOk = pageContentOk && missing.length === 0
    if (!pageContentOk) payloadDetail += ' (missing expected page content: ' + missing.join(', ') + ')'
  }

  const ok = statusOk && contentTypeOk && payloadOk && pageContentOk && !redirectedToAuth && sameOrigin && samePath && sameQuery
  const typeDetail = contentTypeOk ? '' : ` (expected content-type containing ${check.contentType}, got ${contentType || 'none'})`
  const redirectDetail = redirectedToAuth ? ' (unexpected authentication redirect)' : !sameOrigin ? ' (unexpected cross-origin redirect)' : !samePath ? ' (unexpected route redirect)' : !sameQuery ? ' (missing expected query parameters)' : ''
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${check.path} -> ${response.url}${typeDetail}${payloadDetail}${redirectDetail}`)
  return ok
}

async function checkPrivateRoute(baseUrl, path) {
  const url = new URL(path, baseUrl)
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  const location = response.headers.get('location')
  const destination = location ? new URL(location, url) : null
  const expectedNext = path
  const ok = response.status >= 300 && response.status < 400 &&
    destination?.origin === baseUrl.origin &&
    destination.pathname === '/login' &&
    destination.searchParams.get('next') === expectedNext
  console.log((ok ? 'PASS' : 'FAIL') + ' anonymous ' + path + ': HTTP ' + response.status +
    ' -> ' + (destination?.toString() || 'no redirect'))
  return ok
}

async function main() {
  const baseUrl = resolveBaseUrl()
  console.log(`Smoke testing ${baseUrl.origin}`)

  const tasks = [
    ...CHECKS.map((check) => ({ label: check.path, run: () => checkPath(baseUrl, check) })),
    { label: 'catalog minimum and last page', run: () => checkCatalogMinimum(baseUrl) },
    { label: 'anonymous /collection', run: () => checkPrivateRoute(baseUrl, '/collection') },
    { label: 'anonymous /account', run: () => checkPrivateRoute(baseUrl, '/account') },
  ]
  // A timeout or network failure in one check must not hide the results of the others.
  const results = await Promise.allSettled(tasks.map((task) => task.run()))
  const failures = results.flatMap((result, index) => {
    if (result.status === 'rejected') {
      console.error('FAIL ' + tasks[index].label + ': ' + (result.reason instanceof Error ? result.reason.message : String(result.reason)))
      return [tasks[index].label]
    }
    return result.value ? [] : [tasks[index].label]
  })
  if (failures.length > 0) {
    console.error('Production smoke failures: ' + failures.join(', '))
    process.exitCode = 1
    return
  }

  console.log(`Production smoke test passed for ${CHECKS.length} public routes.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
