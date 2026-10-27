import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-[1px] text-micro font-medium leading-4",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted/60 text-muted-foreground",
        outline: "border-border bg-transparent text-muted-foreground",
        info: "border-info/25 bg-info-subtle text-info",
        success: "border-success/25 bg-success-subtle text-success",
        warning: "border-warning/30 bg-warning-subtle text-warning",
        danger: "border-danger/25 bg-danger-subtle text-danger",
        primary: "border-primary/15 bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
