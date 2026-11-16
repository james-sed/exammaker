# ExamMaker

Turn study material into a quiz with an LLM, edit the result, publish it behind a share link, and review attempts.

There is exactly **one user type** (no teachers/students/admins). The person who creates a quiz owns it and can see its attempts; anyone with the share link can take it.

This is an early build. Auth, quiz management, question schemas, and the grading core are in place; file upload and LLM generation are next. [`docs/spec.md`](docs/spec.md) is the single source of truth for behavior and build steps — read it before changing product logic.

## Stack

- Next.js 14 (App Router) + TypeScript (strict)
- PostgreSQL + Prisma
- Auth.js v5 (email/password + optional Google)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Vitest

## Requirements

- Node.js 20 LTS or newer (Next.js 14 requires 18.17+)
- npm
- PostgreSQL 14+ locally, or a hosted database such as [Neon](https://neon.tech)

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

3. Fill in `.env`. Never commit this file.

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | **Pooled** Postgres connection (used by the app) |
   | `DIRECT_URL` | **Direct, non-pooled** connection (used by Prisma migrations) |
   | `AUTH_SECRET` | Random secret for Auth.js (`npx auth secret` can generate one) |
   | `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
   | `NEXT_PUBLIC_APP_URL` | Public app URL used in share links |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional; omit both to hide Google sign-in |

   With Neon, `DATABASE_URL` is the `-pooler` host and `DIRECT_URL` is the same connection without `-pooler`. Both should keep `?sslmode=require`. `neon init` writes `DATABASE_URL` and `DATABASE_URL_UNPOOLED`; set `DIRECT_URL` from the unpooled value.

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
- Uploaded material will be treated strictly as data, never as instructions.

## Project structure

```text
src/app/                 App Router pages and route handlers
src/features/auth/       Auth.js config, sessions, signup/login
src/features/quizzes/    Quiz CRUD, publishing, share links
src/features/questions/  Schemas, public mapper, registry, editors
src/features/grading/    Normalization, graders, attempt grading
src/features/attempts/   Attempt types and taking flow
src/features/analytics/  Owner-facing quiz statistics
prisma/                  Schema, migrations, seed
tests/unit/              Vitest unit tests and fixtures
docs/spec.md             Product and behavior spec
```

## Testing

```bash
npm test
npm run test:coverage
```

`npm run test:coverage` enforces 100% statements, branches, functions, and lines for the grading module and the public-question mapper.
