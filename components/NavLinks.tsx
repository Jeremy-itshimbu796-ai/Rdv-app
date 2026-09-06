"use client";

import { usePathname } from "next/navigation";

export function NavLinks({ liens }: { liens: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <>
      {liens.map((lien) => {
        const actif = lien.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(lien.href);
        return (
          <a key={lien.href} href={lien.href} aria-current={actif ? "page" : undefined} className={actif ? "dash-nav-active" : ""}>
            {lien.label}
          </a>
        );
      })}
    </>
  );
}
