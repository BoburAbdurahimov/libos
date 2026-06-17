"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
interface ThemeCtx { theme: Theme; toggle: () => void; }

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("libos_theme") as Theme | null;
    const pref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    apply(saved ?? pref);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("libos_theme", t);
  }

  return (
    <Ctx.Provider value={{ theme, toggle: () => apply(theme === "light" ? "dark" : "light") }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() { return useContext(Ctx); }
