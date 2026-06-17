import type { Metadata } from "next";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Libos — outfits from local markets",
  description: "AI stylist + local market fashion bundles",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* prevent flash of wrong theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('libos_theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body style={{ background: "var(--bg)", color: "var(--t1)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
