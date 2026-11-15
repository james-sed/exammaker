import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <Card className={cn("h-full p-6", className)}>
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-tint text-primary-tint-foreground">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold leading-heading">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Card>
  );
}
