"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/documents", label: "Documentos" },
  { href: "/carpetas", label: "Carpetas" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: "13px",
              fontWeight: active ? 700 : 400,
              letterSpacing: "1.17px",
              textTransform: "uppercase",
              textDecoration: "none",
              color: active ? "var(--spectral-white)" : "rgba(240,240,250,0.5)",
              fontFamily: "var(--font-display)",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
