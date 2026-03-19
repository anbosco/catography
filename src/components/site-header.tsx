import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Carte" },
  { href: "/cats", label: "Tous les chats" },
  { href: "/classement", label: "Classement" },
  { href: "/submit", label: "Ajouter un chat" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[rgba(255,248,251,0.82)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-6 px-6 py-2 sm:px-10 lg:px-12">
        <Link
          href="/"
          className="relative block h-14 w-[210px] shrink-0 overflow-hidden sm:h-16 sm:w-[248px]"
          aria-label="Retour a la carte"
        >
          <div className="absolute inset-0">
            <Image
              src="/catography.png"
              alt="Catography"
              fill
              className="origin-left object-contain object-left scale-[2.78] translate-x-[-7%] translate-y-[2%] sm:scale-[2.92] sm:translate-x-[-8%]"
              sizes="(max-width: 640px) 210px, 248px"
              priority
            />
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 rounded-[2rem] border border-border bg-surface px-2 py-2 shadow-sm">
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
