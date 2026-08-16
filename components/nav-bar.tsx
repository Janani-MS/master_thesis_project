import Link from "next/link";

/**
 * Top-level navigation shell for the Sprint Planning Assistant.
 *
 * Kept intentionally minimal for the MVP: additional links (Projects,
 * Planning History) will be added as those routes are implemented.
 */
export function NavBar() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          Sprint Planning Assistant
        </Link>
        <nav className="text-sm text-zinc-500">Dashboard</nav>
      </div>
    </header>
  );
}
