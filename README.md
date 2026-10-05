# ScentMarked

ScentMarked is a Next.js fragrance discovery, comparison, recommendation, collection, CRM, and email-marketing application deployed to Cloudflare with OpenNext and backed by Supabase.

## Application

The deployable application lives in `scentmarked-mvp-v0.5/`.

Requirements:
- Node.js 22
- npm 10

From the application directory:

```bash
npm install
npm run check
```

`npm run check` runs application typechecking, test typechecking, the Node test suite, and a full OpenNext Cloudflare build. The same check runs in GitHub Actions for pushes and pull requests to `main`.

## Production configuration

Public configuration is documented in `scentmarked-mvp-v0.5/.env.example`. The Supabase URL and publishable key are intentionally public client configuration. Server secrets must be stored in the deployment environment and must never use the `NEXT_PUBLIC_` prefix.

Required server-side production values for the full application include:
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `EMAIL_WORKER_SECRET`
- `RESEND_FROM_EMAIL` using a provider-verified sender/domain

Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS site origin when the custom domain is connected. Until then, the application uses its configured workers.dev fallback origin.

## Cloudflare

Cloudflare Worker configuration is in `scentmarked-mvp-v0.5/wrangler.jsonc`. OpenNext configuration is in `scentmarked-mvp-v0.5/open-next.config.ts`.

Useful commands from `scentmarked-mvp-v0.5/`:

```bash
npm run build:cloudflare
npm run preview
npm run deploy
```

Before a production deploy, confirm the required server secrets exist in the Cloudflare environment and set `NEXT_PUBLIC_SITE_URL` when the final custom domain is ready.

## Secret safety

The repository-level `.gitignore` excludes local environment files, `.dev.vars`, Next/OpenNext build output, Wrangler local state, dependencies, logs, and common editor files. Keep real credentials out of source control.
