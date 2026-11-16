This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment variables

For local development, copy `.env.example` to `.env.local` from the `frontend` directory. The template documents all frontend-configurable environment variables:

| Variable | Purpose |
| --- | --- |
| `API_BASE_URL` | Server-only backend URL used by the BFF. Defaults to `http://127.0.0.1:8000/api/v1`; Docker Compose sets it to `http://app:8000/api/v1`. |
| `NEXT_PUBLIC_API_BASE_URL` | Legacy fallback if `API_BASE_URL` is unset. `NEXT_PUBLIC_` values are exposed to browser code; prefer `API_BASE_URL` and never put credentials here. |
| `NEXT_PUBLIC_APP_URL` | Public origin used to build page metadata. Defaults to `http://localhost:3000`. |

`NODE_ENV` is managed by Next.js (`development` for `next dev`, `production` for builds and production runtime); do not set it manually.

| Environment | Configuration source |
| --- | --- |
| Local development | `frontend/.env.local`, copied from `.env.example`. |
| CI | `API_BASE_URL` is scoped to the `frontend-build` job in `.github/workflows/ci.yml`. |
| Docker Compose | `NODE_ENV` and the internal `API_BASE_URL` are set by the frontend service in `compose.yaml`. |

## Testing

Run unit and integration tests with mocked HTTP responses through MSW:

```bash
npm test
```

Measure line coverage for frontend libraries and API route handlers. The overall threshold is 60%; the session API route has an 80% critical-path threshold:

```bash
npm run test:coverage
```

Run the end-to-end login flow against a production build. Playwright starts the app on port `3100`, and the test verifies the dashboard redirect and HttpOnly session cookie:

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
