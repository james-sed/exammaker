import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  GraduationCap,
  Link2,
  ListChecks,
  Timer,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { FeatureCard } from "@/components/marketing/feature-card";
import { QuizPreview } from "@/components/marketing/quiz-preview";
import { Steps } from "@/components/marketing/steps";

const FEATURES = [
  {
    icon: Timer,
    title: "Server-enforced timer",
    description:
      "The deadline is checked when an attempt is submitted, not by a countdown running in the browser.",
  },
  {
    icon: ListChecks,
    title: "Flexible question types",
    description:
      "Multiple choice, true or false, and short answer, with points set per question.",
  },
  {
    icon: CheckCircle2,
    title: "Instant auto-grading",
    description:
      "Every attempt is scored on submission. Short answers match the accepted answers you list.",
  },
  {
    icon: Link2,
    title: "Shareable links",
    description:
      "Publish a quiz to get one link. Students sign in and see only their own attempt.",
  },
] as const;

const STEPS = [
  {
    title: "Create",
    description:
      "Add questions, set points and a time limit. Keep the quiz as a draft while you finish the wording.",
  },
  {
    title: "Share",
    description:
      "Publish to generate a share link, then send it to your class wherever you already post links.",
  },
  {
    title: "Get results",
    description:
      "Scores and per-question breakdowns are ready as soon as students submit.",
  },
] as const;

const QUESTION_TYPES = [
  {
    variant: "multiple-choice",
    title: "Multiple choice",
    description: "One correct option, worth the points you assign to it.",
  },
  {
    variant: "true-false",
    title: "True or false",
    description: "A single statement, two choices, graded on submission.",
  },
  {
    variant: "short-answer",
    title: "Short answer",
    description:
      "Typed responses matched against the accepted answers you list.",
  },
] as const;

const TEACHER_POINTS = [
  "Set a duration and an attempt limit for each quiz.",
  "Write a question once and reuse it from the question bank.",
  "See scores and the questions your students miss most.",
] as const;

const STUDENT_POINTS = [
  "Open the share link, sign in, and start when you are ready.",
  "Work through questions in order with the time remaining in view.",
  "Review your score and past attempts from your dashboard.",
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <SiteNav />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-dot-grid mask-radial-fade"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 h-[36rem] bg-hero-glow"
          />

          <Container className="relative">
            <div className="grid items-center gap-14 pb-16 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 lg:pb-24 lg:pt-20">
              <div className="max-w-xl">
                <Badge variant="primary">Timers enforced on the server</Badge>

                <h1 className="mt-6 text-balance text-4xl font-bold sm:text-5xl lg:text-6xl">
                  Build a quiz in minutes. Grade it automatically.
                </h1>

                <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  ExamMaker keeps the clock on the server, scores every response
                  when it is submitted, and shows you which questions your class
                  found hardest.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link href="/register">
                      Create free account
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <a href="#question-types">Try a sample quiz</a>
                  </Button>
                </div>

                <p className="mt-6 text-sm text-subtle-foreground">
                  Server-enforced timing · Instant grading · Shareable links
                </p>
              </div>

              <QuizPreview className="mx-auto w-full max-w-lg lg:max-w-none" />
            </div>
          </Container>
        </section>

        {/* Features */}
        <Section id="features" aria-labelledby="features-heading">
          <SectionHeading
            id="features-heading"
            eyebrow="Features"
            title="The clock, the marking, and the link — handled"
            description="Timing, scoring, and sharing are built in — not bolted on."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-6">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </Section>

        {/* How it works */}
        <Section
          id="how-it-works"
          tone="muted"
          aria-labelledby="how-heading"
        >
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="Create, share, review — in that order"
            description="From a blank quiz to a marked attempt in three steps. No exports, no manual tallying."
          />
          <Steps steps={[...STEPS]} className="mt-12" />
        </Section>

        {/* Question types */}
        <Section id="question-types" aria-labelledby="types-heading">
          <SectionHeading
            id="types-heading"
            eyebrow="Question types"
            title="Three formats, one grading engine"
            description="Mix formats in one quiz. Every answer is checked against the key you set."
          />

          <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-6">
            {QUESTION_TYPES.map((type) => (
              <Card key={type.title} className="flex h-full flex-col p-5">
                <h3 className="text-base font-semibold leading-heading">
                  {type.title}
                </h3>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {type.description}
                </p>
                <div className="mt-4 flex flex-1">
                  <QuizPreview variant={type.variant} className="h-full" />
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* Teachers and students */}
        <Section tone="muted" aria-labelledby="audience-heading">
          <SectionHeading
            id="audience-heading"
            eyebrow="Who it is for"
            title="Two views, one quiz"
            description="Teachers set the rules; students get a quiet screen with the clock in view."
          />

          <div className="mt-12 grid gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="h-full rounded-2xl border border-border bg-card p-6 lg:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-tint text-primary-tint-foreground">
                  <Users aria-hidden="true" className="h-6 w-6" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-text">
                  For teachers
                </p>
              </div>
              <h3 className="mt-5 text-2xl leading-heading">Set the rules once</h3>
              <ul className="mt-4 space-y-3">
                {TEACHER_POINTS.map((point) => (
                  <li key={point} className="flex gap-3 text-base leading-relaxed text-muted-foreground">
                    <Check
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-primary-tint-foreground"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-full rounded-2xl border border-border bg-card p-6 lg:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-tint text-primary-tint-foreground">
                  <GraduationCap aria-hidden="true" className="h-6 w-6" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-text">
                  For students
                </p>
              </div>
              <h3 className="mt-5 text-2xl leading-heading">
                One link, one clear screen
              </h3>
              <ul className="mt-4 space-y-3">
                {STUDENT_POINTS.map((point) => (
                  <li key={point} className="flex gap-3 text-base leading-relaxed text-muted-foreground">
                    <Check
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-primary-tint-foreground"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Final call to action */}
        <Section aria-labelledby="cta-heading">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 shadow-lg ring-1 ring-inset ring-primary-foreground/10 sm:px-10 lg:px-16 lg:py-16">
            <div className="relative max-w-2xl">
              <h2
                id="cta-heading"
                className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl"
              >
                Your next quiz can grade itself.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary-foreground/85">
                Create an account, build a quiz, and share the link. Scoring runs
                on submit.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">
                    Create free account
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Link
                  href="/login"
                  className="focus-ring inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-primary-foreground underline-offset-4 hover:underline"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
