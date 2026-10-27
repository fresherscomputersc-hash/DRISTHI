import type { LucideIcon } from "lucide-react";
import {
  BusFront,
  DatabaseZap,
  LayoutDashboard,
  ReceiptIndianRupee,
  TrendingUp,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  persona: string[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Command Center",
    icon: LayoutDashboard,
    description: "Fleet, revenue, demand and alerts in one read",
    persona: ["exec", "ops", "maint", "finance"],
  },
  {
    href: "/revenue",
    label: "Revenue Integrity",
    icon: ReceiptIndianRupee,
    description: "Detect, explain and close leakage",
    persona: ["finance", "exec"],
  },
  {
    href: "/demand",
    label: "Demand",
    icon: TrendingUp,
    description: "Forecast boardings and capacity gaps",
    persona: ["ops", "exec"],
  },
  {
    href: "/fleet",
    label: "Fleet & Maintenance",
    icon: BusFront,
    description: "Utilisation, risk and service queue",
    persona: ["maint", "ops"],
  },
  {
    href: "/data-quality",
    label: "Data Quality",
    icon: DatabaseZap,
    description: "Provenance, freshness and import health",
    persona: ["exec", "ops", "maint", "finance"],
  },
];

export const PERSONAS = [
  { id: "exec", label: "Executive leadership", short: "Executive" },
  { id: "ops", label: "Operations planning", short: "Operations" },
  { id: "maint", label: "Maintenance engineering", short: "Maintenance" },
  { id: "finance", label: "Financial control", short: "Finance" },
] as const;

export type PersonaId = (typeof PERSONAS)[number]["id"];

export function personaLabel(id: string): string {
  return PERSONAS.find((p) => p.id === id)?.short ?? "Executive";
}
