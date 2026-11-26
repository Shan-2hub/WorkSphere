
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkSphere | Project Management",
  description: "Multi-tenant project management and workflow automation platform.",
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
