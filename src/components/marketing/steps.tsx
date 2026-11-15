import { cn } from "@/lib/utils";

export interface Step {
  title: string;
  description: string;
}

export interface StepsProps {
  steps: Step[];
  className?: string;
}

/**
 * Three numbered steps joined by a hairline connector on desktop. On mobile
 * the numbers stack and the connector is dropped rather than squeezed.
 */
export function Steps({ steps, className }: StepsProps) {
  return (
    <ol className={cn("grid gap-10 md:grid-cols-3 md:gap-6", className)}>
      {steps.map((step, index) => (
        <li key={step.title} className="relative">
          <div className="relative">
            <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-primary/20 bg-primary-tint font-display text-lg font-bold text-primary-tint-foreground">
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-16 right-0 top-6 hidden h-px bg-primary/20 md:block md:-right-6"
              />
            ) : null}
          </div>
          <h3 className="mt-5 text-lg font-semibold leading-heading">
            {step.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
