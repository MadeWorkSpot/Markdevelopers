import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://markdevelopers.in"),
  title: {
    default: "Mark Developers | Premium Construction Services",
    template: "%s | Mark Developers",
  },
  description:
    "Mark Developers offers premium building construction, renovation, and interior design services. Trusted by hundreds of clients for quality craftsmanship and modern architecture.",
  keywords: [
    "construction company",
    "building contractors",
    "interior design",
    "renovation services",
    "residential construction",
    "commercial construction",
    "premium builders",
    "Mark Developers",
    "real estate development",
    "architectural design",
  ],
  authors: [{ name: "Mark Developers" }],
  creator: "Mark Developers",
  publisher: "Mark Developers",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://markdevelopers.in",
    siteName: "Mark Developers",
    title: "Mark Developers | Premium Construction Services",
    description:
      "Premium building construction, renovation, and interior design services. Trusted quality craftsmanship.",
    images: [
      {
        url: "/markDevelopersLogo.png",
        width: 1200,
        height: 630,
        alt: "Mark Developers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mark Developers | Premium Construction Services",
    description:
      "Premium building construction, renovation, and interior design services.",
    images: ["/markDevelopersLogo.png"],
  },
  icons: {
    icon: "/markDevelopersLogo.png",
    shortcut: "/markDevelopersLogo.png",
    apple: "/markDevelopersLogo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://markdevelopers.in",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
