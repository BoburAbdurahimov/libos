"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";

export function Nav() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const path = usePathname();

  const links = [
    { href: "/wardrobe", label: "Wardrobe" },
    { href: "/outfits", label: "Outfits" },
    { href: "/market", label: "Market" },
    ...(user?.role === "INFLUENCER" || user?.role === "ADMIN"
      ? [{ href: "/bundles", label: "Bundles" }]
      : []),
    ...(user?.role === "SELLER" || user?.role === "ADMIN"
      ? [{ href: "/shop", label: "My Shop" }]
      : []),
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav style={{ borderBottom: "1px solid var(--br)", background: "var(--card)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", height: 56, gap: 8 }}>
        <Link href="/wardrobe" style={{ fontWeight: 800, fontSize: 17, color: "var(--ac)", textDecoration: "none", letterSpacing: 1.5, marginRight: 16 }}>
          LIBOS
        </Link>

        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: "6px 14px", borderRadius: 8, textDecoration: "none",
              fontSize: 14, fontWeight: path === l.href ? 600 : 400,
              color: path === l.href ? "var(--ac)" : "var(--t3)",
              background: path === l.href ? "var(--amber)" : "transparent",
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        <button
          onClick={toggle}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          style={{ background: "none", border: "1px solid var(--br)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 15, lineHeight: 1, color: "var(--t3)" }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--t4)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.handle ? (user.handle.startsWith("@") ? user.handle : `@${user.handle}`) : user.name}
            </span>
            <button onClick={logout} style={{ fontSize: 13, color: "var(--t3)", background: "none", border: "1px solid var(--br)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
