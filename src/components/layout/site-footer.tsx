import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Question types", href: "#question-types" },
] as const;

const ACCOUNT_LINKS = [
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/register" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr] md:gap-8 lg:py-16">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Timed quizzes with server-enforced deadlines, automatic grading,
              and results you can read at a glance.
            </p>
          </div>

          <nav aria-label="Product">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-subtle-foreground">
              Product
            </h2>
            <ul className="mt-2 flex flex-col">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="focus-ring inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-subtle-foreground">
              Account
            </h2>
            <ul className="mt-2 flex flex-col">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-6 text-sm text-subtle-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p>Built for teachers and students.</p>
        </div>
      </Container>
    </footer>
  );
}
