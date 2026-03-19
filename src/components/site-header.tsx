import Link from "next/link";

const links = [
  { href: "/", label: "Carte" },
  { href: "/submit", label: "Ajouter un chat" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[rgba(255,248,237,0.78)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#2f241f] text-sm font-semibold uppercase tracking-[0.2em] text-[#f8f1e5]">
            C
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent-deep">
              Catography
            </p>
            <p className="text-xs text-muted">
              Chats de Toulouse, sans se prendre trop au serieux.
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-2 shadow-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-[#f2e6d0] hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
