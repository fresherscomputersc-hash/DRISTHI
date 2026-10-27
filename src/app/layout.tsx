import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { PERSONAS } from "@/components/shell/nav-config";

/**
 * Fonts are bundled, not fetched: the console must boot on a laptop with no
 * network. Atkinson Hyperlegible is chosen for legibility at small sizes and
 * for its low-vision design provenance.
 */
const sans = localFont({
  src: [
    { path: "./fonts/AtkinsonHyperlegible-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/AtkinsonHyperlegible-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Drishti — OSRTC Operations Intelligence",
    template: "%s · Drishti",
  },
  description:
    "Decision support for OSRTC: demand forecasting, fleet deployment, maintenance risk and revenue integrity, with evidence behind every alert.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

// Every view reads the local SQLite ledger at request time; there is nothing
// meaningful to prerender, and rendering at build time would only mask a
// missing dataset until the first request.
export const dynamic = "force-dynamic";

async function readPersona(): Promise<string> {
  const jar = await cookies();
  const value = jar.get("drishti_persona")?.value ?? "exec";
  return PERSONAS.some((p) => p.id === value) ? value : "exec";
}

async function readWindowEnd(): Promise<string> {
  try {
    const { dataWindowEnd } = await import("@/server/queries/shared");
    return dataWindowEnd();
  } catch {
    return "—";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [persona, windowEnd] = await Promise.all([readPersona(), readWindowEnd()]);

  return (
    <html lang="en-IN" className={sans.variable}>
      <body className="min-h-dvh bg-background font-sans text-body">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh">
          <Sidebar persona={persona} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar windowEnd={windowEnd} persona={persona} />
            <main id="main" className="flex-1 px-4 pb-12 pt-5 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
