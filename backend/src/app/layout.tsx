import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Libos — outfits from local markets",
  description: "AI stylist + local market fashion bundles",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#faf8f5", color: "#1c1917" }}>
        {children}
      </body>
    </html>
  );
}
