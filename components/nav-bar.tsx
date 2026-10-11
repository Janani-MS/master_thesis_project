/**
 * Top-level navigation shell for the Sprint Planning Assistant.
 *
 * Kept intentionally minimal for the MVP: additional links (Projects,
 * Planning History) will be added as those routes are implemented.
 */
export function NavBar() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="px-7">
          <h1 className="text-3xl font-bold text-zinc-900">
            Sprint Planning Assistant
          </h1>
        </div>
      </div>
    </header>
  );
}
