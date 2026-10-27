import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      <span className="rounded-full bg-muted p-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-body font-semibold">{title}</p>
      <p className="max-w-md text-label text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
