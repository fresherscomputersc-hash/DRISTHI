import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-10 max-w-md text-center">
      <p className="eyebrow">404</p>
      <h2 className="mt-1 text-title font-bold">That view does not exist</h2>
      <p className="mt-1 text-body text-muted-foreground">
        Drishti has four modules: Command Center, Revenue Integrity, Demand and Fleet.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex h-8 items-center rounded bg-primary px-3 text-body font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go to Command Center
      </Link>
    </div>
  );
}
