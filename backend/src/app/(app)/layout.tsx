"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { Nav } from "../components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--t4)", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        {children}
      </main>
    </>
  );
}
