const DEFAULT_PATHS = ['/', '/discover', '/compare', '/login', '/robots.txt', '/sitemap.xml']

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

async function checkPath(baseUrl, path) {
  const url = new URL(path, baseUrl)
  const response = await fetch(url, { redirect: 'follow' })
  const ok = response.status >= 200 && response.status < 400
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${path} -> ${response.url}`)
  return ok
}

async function main() {
  const baseUrl = resolveBaseUrl()
  console.log(`Smoke testing ${baseUrl.origin}`)

  const results = await Promise.all(DEFAULT_PATHS.map((path) => checkPath(baseUrl, path)))
  if (results.some((ok) => !ok)) {
    process.exitCode = 1
    return
  }

  console.log(`Production smoke test passed for ${DEFAULT_PATHS.length} public routes.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
