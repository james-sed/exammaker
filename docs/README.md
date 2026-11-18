# ExamMaker

Turn study material into a quiz with an LLM, edit the result, publish it behind a share link, and review attempts.

There is exactly **one user type** (no teachers/students/admins). The person who creates a quiz owns it and can see its attempts; anyone with the share link can take it.

This is an early build. Auth, quiz management, question schemas, the grading core, and source upload/extraction are in place; LLM generation is next. [`spec.md`](spec.md) is the single source of truth for behavior and build steps — read it before changing product logic.

## Stack

- Next.js 14 (App Router) + TypeScript (strict)
- PostgreSQL + Prisma
- Auth.js v5 (email/password + optional Google)
- Vercel Blob (private store) for direct browser uploads
- `unpdf`, `jszip`, `fast-xml-parser`, and `file-type` for text extraction
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Vitest

## Requirements

- **Node.js 24.x** (`package.json` pins `engines.node`; Next.js 14 itself needs 18.17+)
- npm
- PostgreSQL 14+ locally, or a hosted database such as [Neon](https://neon.tech)
- A Vercel Blob store with **private** access (required for uploads, not for tests)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your env file:

   ```bash
   cp .env.example .env
   ```

   PowerShell: `Copy-Item .env.example .env`

   You can put machine-specific or deployment values in `.env.local` instead; Next.js loads it after `.env` and both are gitignored.

3. Fill in the environment. Never commit these files.

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | **Pooled** Postgres connection (used by the app) |
   | `DIRECT_URL` | **Direct, non-pooled** connection (used by Prisma migrations) |
   | `AUTH_SECRET` | Random secret for Auth.js (`npx auth secret` can generate one) |
   | `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
   | `NEXT_PUBLIC_APP_URL` | Public app URL used in share links |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional; omit both to hide Google sign-in |
   | `BLOB_READ_WRITE_TOKEN` | Read/write token for the private Blob store |
   | `CRON_SECRET` | Shared secret that protects `/api/jobs/janitor` |

   With Neon, `DATABASE_URL` is the `-pooler` host and `DIRECT_URL` is the same connection without `-pooler`. Both should keep `?sslmode=require`. `neon init` writes `DATABASE_URL` and `DATABASE_URL_UNPOOLED`; set `DIRECT_URL` from the unpooled value.

   Upload routes return **503** with a setup message while `BLOB_READ_WRITE_TOKEN` is missing, and the janitor returns **503** while `CRON_SECRET` is missing.

4. Prepare the database:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   ```

   Use `npm run prisma:migrate` instead when you are creating a new migration during development.

5. Optional — create a demo account:

   ```bash
   npm run prisma:seed
   ```

   Defaults to `demo@exammaker.app` / `password123`. Override with `SEED_EMAIL` and `SEED_PASSWORD`.

6. Start the app:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Blob storage setup

Uploads go straight from the browser to Vercel Blob; the file binary never passes through an API route.

1. In the Vercel dashboard, open **Storage → Create → Blob**.
2. Choose **Private** access and connect the store to this project.
3. Copy the store's `BLOB_READ_WRITE_TOKEN` into `.env` (or `.env.local`).
4. Pull deployment values with `vercel env pull .env.local` if you use the CLI. Do **not** overwrite `.env`, which holds your local Neon URLs.

The app only accepts blobs stored on the private host. The browser picks `access: "private"` during `upload()`, and `POST /api/uploads/finalize` independently verifies the resulting blob URL, owner, pathname, and size before extraction starts.

## Uploads and extraction

`/quizzes/new` is the upload workspace. Manual quiz creation lives at `/quizzes/new/manual`.

- Accepted types: PDF, DOCX, PPTX, TXT.
- Limits: **20 MB** per file, **150 pages**, and **200,000** extracted characters.
- Each upload gets `sources/<userId>/<uuid>` as its pathname, and a `SourceFile` row is created *before* the binary moves.
- The browser calls `POST /api/uploads/finalize` itself after the upload resolves. Blob's `onUploadCompleted` callback is deliberately not used.
- Extraction verifies magic bytes, extension, page count, password protection, corruption, and readable text. Spoofed, scanned, encrypted, corrupt, and oversized files fail with a user-safe message.
- Sanitized text is saved first, then the binary is deleted. If deletion fails, the row keeps `blobKey`, sets `blobDeleteFailedAt`, and the janitor retries.
- A failed extraction can be retried while its binary still exists.
- Raw binaries are deleted immediately after extraction. Sanitized text is kept until the quiz is deleted.

## Janitor

`vercel.json` schedules `/api/jobs/janitor` once a day. Hobby plans only allow daily crons, so the job never depends on frequency for correctness: a source counts as active only while it is running and was updated in the last **10 minutes**.

The janitor:

1. Retries blob deletes that previously failed.
2. Fails `UPLOADED`/`EXTRACTING` rows with a stale heartbeat.
3. Deletes sources that never became part of a quiz after **7 days**, including their extracted text.
4. Scans the `sources/` prefix and deletes blobs no row references.

Run it manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/jobs/janitor
```

Vercel Cron sends the same `Authorization: Bearer $CRON_SECRET` header. Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage thresholds |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply a migration in development |
| `npm run prisma:seed` | Seed the demo user |
| `npm run prisma:studio` | Open Prisma Studio |

## Question types

All four types share a Zod-validated JSON payload. Grading lives in one pure server-side module (`src/features/grading/`), with no database or network access.

| Type | Submission | Grading |
| --- | --- | --- |
| `MULTIPLE_CHOICE` | Option index (`number`) | Exact index match |
| `TRUE_FALSE` | `boolean` | Exact match |
| `IDENTIFICATION` | `string` | Normalized match against accepted answers |
| `ENUMERATION` | `string[]` | Normalized match, partial credit, order only when required |

Invalid, missing, or wrong-shaped submissions score zero and never throw. Adding a question type means adding a schema, a grader, a public mapper, and an editor, then registering it once in `src/features/questions/registry.ts`.

## Security notes

- Before submission, takers may only receive questions that went through `toPublicQuestion` (`src/features/questions/mappers/toPublicQuestion.ts`). It strips correct indexes, answers, accepted answers, expected items, and explanations.
- Answer keys and grading stay on the server.
- Upload ownership is checked on token issuance, finalize, retry, listing, and detail reads.
- Only private blob URLs pass finalize, regardless of what the browser requested.
- Uploaded material is treated strictly as data, never as instructions.

## Project structure

```text
src/app/                 App Router pages and route handlers
src/app/api/uploads/     Token, finalize, retry, list/detail handlers
src/app/api/jobs/        CRON_SECRET-protected janitor
src/features/auth/       Auth.js config, sessions, signup/login
src/features/quizzes/    Quiz CRUD, publishing, share links
src/features/questions/  Schemas, public mapper, registry, editors
src/features/grading/    Normalization, graders, attempt grading
src/features/uploads/    Limits, extraction, finalize, janitor, upload UI
src/features/attempts/   Attempt types and taking flow
src/features/analytics/  Owner-facing quiz statistics
prisma/                  Schema, migrations, seed
tests/unit/              Vitest unit tests
tests/fixtures/uploads/  Committed PDF/DOCX/PPTX/TXT fixtures
docs/spec.md             Product and behavior spec
```

## Testing

```bash
npm test
npm run test:coverage
```

Upload tests use committed fixtures in `tests/fixtures/uploads/` and cover every supported format plus password-protected, scanned, corrupt, spoofed, empty, oversized, and too-many-pages files. The Blob network calls are mocked, so the suite runs without a token. Regenerate the fixtures with:

```bash
node tests/fixtures/generate-fixtures.mjs
```

`npm run test:coverage` enforces 100% statements, branches, functions, and lines for the grading module and the public-question mapper.
