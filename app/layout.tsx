import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://markdevelopers.in"),
  title: {
    default: "Mark Developers | Premium Construction & Interior Design Services",
    template: "%s | Mark Developers",
  },
  description:
    "Mark Developers is a leading construction company offering premium building construction, renovation, interior design, and real estate development services. Trusted by hundreds of clients for quality craftsmanship, modern architecture, and on-time project delivery.",
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
    "home renovation",
    "office interior design",
    "building construction",
    "house construction cost",
    "best builders in India",
  ],
  authors: [{ name: "Mark Developers", url: "https://markdevelopers.in" }],
  creator: "Mark Developers",
  publisher: "Mark Developers",
  applicationName: "Mark Developers",
  referrer: "origin-when-cross-origin",
  category: "construction",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://markdevelopers.in",
    siteName: "Mark Developers",
    title: "Mark Developers | Premium Construction & Interior Design Services",
    description:
      "Premium building construction, renovation, and interior design services. Trusted quality craftsmanship and modern architecture by Mark Developers.",
    images: [
      {
        url: "/markDevelopersLogo.png",
        width: 1200,
        height: 630,
        alt: "Mark Developers - Premium Construction Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mark Developers | Premium Construction & Interior Design Services",
    description:
      "Premium building construction, renovation, and interior design services. Trusted quality craftsmanship.",
    images: ["/markDevelopersLogo.png"],
    creator: "@markdevelopers",
    site: "@markdevelopers",
  },
  icons: {
    icon: [
      { url: "/markDevelopersLogo.png", sizes: "any" },
      { url: "/markDevelopersLogo.png", type: "image/png", sizes: "192x192" },
      { url: "/markDevelopersLogo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/markDevelopersLogo.png",
    apple: [
      { url: "/markDevelopersLogo.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/markDevelopersLogo.png",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
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
    <html lang="en" dir="ltr">
      <head>
        <meta name="application-name" content="Mark Developers" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mark Developers" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>{children}</body>
    </html>
  );
}
