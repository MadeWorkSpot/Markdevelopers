import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mark Developers | Coming Soon",
  description: "Premium building construction services — launching soon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
