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
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-3 px-6 py-2 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-12">
        <Link
          href="/"
          className="relative block h-14 w-[228px] shrink-0 overflow-hidden sm:h-16 sm:w-[264px]"
          aria-label="Retour a la carte"
        >
          <div className="absolute inset-0">
            <Image
              src="/catography.png"
              alt="Catography"
              fill
              className="origin-left object-contain object-left scale-[2.72] translate-x-[-3%] translate-y-[2%] sm:scale-[2.86] sm:translate-x-[-5%]"
              sizes="(max-width: 640px) 228px, 264px"
              priority
            />
          </div>
        </Link>

        <nav className="w-full overflow-x-auto pb-1 md:w-auto md:overflow-visible md:pb-0">
          <div className="inline-flex min-w-max items-center gap-2 rounded-[2rem] border border-border bg-surface px-2 py-2 shadow-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-muted transition hover:bg-[#ffe7f0] hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
