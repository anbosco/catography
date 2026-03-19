import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Carte" },
  { href: "/submit", label: "Ajouter un chat" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[rgba(255,248,251,0.82)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10 lg:px-12">
        <Link href="/" className="relative block h-14 w-[210px] shrink-0">
          <Image
            src="/catography.png"
            alt="Catography"
            fill
            className="object-contain object-left"
            sizes="210px"
            priority
          />
        </Link>

        <nav className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-2 shadow-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-[#ffe7f0] hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
