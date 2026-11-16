import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Link2,
  ListChecks,
  Sparkles,
  Timer,
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
    icon: FileText,
    title: "Quizzes from your files",
    description:
      "Upload a PDF, DOCX, PPTX, or TXT file. The app extracts the text and drafts questions from it.",
  },
  {
    icon: ListChecks,
    title: "Four question types",
    description:
      "Multiple choice, true or false, identification, and enumeration, with points set per question.",
  },
  {
    icon: Timer,
    title: "Server-enforced timer",
    description:
      "The deadline is checked when an attempt is submitted, not by a countdown running in the browser.",
  },
  {
    icon: Link2,
    title: "Shareable links",
    description:
      "Publish a quiz to get one link. Anyone with the link can take it, with no account needed.",
  },
] as const;

const STEPS = [
  {
    title: "Upload",
    description:
      "Add your study material and choose how many questions you want, which types, and the difficulty.",
  },
  {
    title: "Review",
    description:
      "Edit the generated draft, fix wording, reorder questions, and check every source excerpt.",
  },
  {
    title: "Share",
    description:
      "Publish to get a link. Results and score summaries appear as attempts come in.",
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
    variant: "identification",
    title: "Identification",
    description: "A short answer matched against accepted answers and aliases.",
  },
  {
    variant: "enumeration",
    title: "Enumeration",
    description: "A list of expected items with partial credit per correct item.",
  },
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
                <Badge variant="primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Generated from your study material
                </Badge>

                <h1 className="mt-6 text-balance text-4xl font-bold sm:text-5xl lg:text-6xl">
                  Turn your files into quizzes in minutes.
                </h1>

                <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Upload a document, review the generated questions, and share one
                  link. ExamMaker keeps the clock on the server and scores every
                  response when it is submitted.
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
                    <a href="#question-types">See question types</a>
                  </Button>
                </div>

                <p className="mt-6 text-sm text-subtle-foreground">
                  File-to-quiz generation · Server-enforced timing · Shareable links
                </p>
              </div>

              <QuizPreview className="mx-auto w-full max-w-lg lg:max-w-none" />
            </div>
          </Container>
        </section>

        <Section id="features" aria-labelledby="features-heading">
          <SectionHeading
            id="features-heading"
            eyebrow="Features"
            title="From document to marked attempt"
            description="The upload, the questions, the clock, and the link are handled in one place."
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

        <Section
          id="how-it-works"
          tone="muted"
          aria-labelledby="how-heading"
        >
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="Upload, review, share"
            description="A draft is ready to edit before anything is published."
          />
          <Steps steps={[...STEPS]} className="mt-12" />
        </Section>

        <Section id="question-types" aria-labelledby="types-heading">
          <SectionHeading
            id="types-heading"
            eyebrow="Question types"
            title="Four formats, one grading engine"
            description="Mix formats in one quiz. Every answer is checked against the key you set."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
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

        <Section aria-labelledby="cta-heading">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 shadow-lg ring-1 ring-inset ring-primary-foreground/10 sm:px-10 lg:px-16 lg:py-16">
            <div className="relative max-w-2xl">
              <h2
                id="cta-heading"
                className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl"
              >
                Your next quiz can build itself.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary-foreground/85">
                Create an account, upload a file, and review the draft. Scoring runs
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
