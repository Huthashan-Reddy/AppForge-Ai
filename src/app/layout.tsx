import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppForge AI — Build Apps From Configuration",
  description: "Transform JSON configurations into fully functional web applications. AI-powered app generator with dynamic UI, APIs, database, and authentication.",
  keywords: ["app generator", "AI", "JSON config", "dynamic apps", "no-code"],
  openGraph: {
    title: "AppForge AI — Build Apps From Configuration",
    description: "Transform JSON configurations into fully functional web applications.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
