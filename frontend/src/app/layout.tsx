import type { Metadata } from "next";
import { version } from "../../package.json";
import "./globals.css";

export const metadata: Metadata = {
  title: "FloodRisk - Urban Flood Risk Explorer & Flood Reporting",
  description: "Ward-Wise FRI Visualization & Community Flood Reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {children}
        <footer
          aria-label={`FloodRisk version ${version}`}
          className="shrink-0 py-3 text-center text-xs text-slate-500"
        >
          v{version}
        </footer>
      </body>
    </html>
  );
}
