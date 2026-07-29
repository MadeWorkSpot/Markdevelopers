import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.PUBLIC_HOST) {
  throw new Error("PUBLIC_HOST environment variable is required in production");
}

/**
 * SECURITY HARDENED — Next.js Configuration
 *
 * Changes from baseline:
 * - CSP switched to Content-Security-Policy-Report-Only so violations are logged
 *   without breaking the app. To enforce, rename the header key below.
 * - Added X-DNS-Prefetch-Control, X-Download-Options, X-Permitted-Cross-Domain-Policies.
 * - Added immutable cache headers for Next.js static assets.
 * - Added security headers for API routes separately.
 *
 * ── HOW TO ENFORCE CSP ──────────────────────────────────────────────────────
 * After validating report-only logs show no false positives:
 *   1. Change header key from "Content-Security-Policy-Report-Only"
 *      to "Content-Security-Policy".
 *   2. Remove the "-Report-Only" header entry entirely.
 *   3. Optionally add a report-uri directive for automated monitoring.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  // Prevents the X-Powered-By: Next.js header (OWASP A06:2021)
  poweredByHeader: false,

  async headers() {
    return [
      // ───────────────────────────────────────────────────────────────────────
      // Global headers — applied to every route
      // ───────────────────────────────────────────────────────────────────────
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking — blocks ALL framing including same-origin.
          // frame-ancestors in CSP provides a modern fallback, but X-Frame-Options
          // is kept for older browsers (IE/Edge legacy).
          { key: "X-Frame-Options", value: "DENY" },

          // Prevent MIME-type sniffing — browsers must not guess content types.
          // OWASP A05:2021 (Security Misconfiguration)
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Control referrer information leakage. "strict-origin-when-cross-origin"
          // sends full URL for same-origin, only origin for cross-origin, and
          // nothing for downgrade (HTTP→HTTPS). Balances security with analytics.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Restrict browser features. Only disable what this app does NOT need.
          // camera, microphone, geolocation, payment are all unused on this site.
          // "interest-cohort=()" disables FLoC/Topics API tracking.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
          },

          // HSTS — force HTTPS for 1 year including subdomains.
          // After confirming HTTPS works, consider adding includeSubDomains
          // and preload, then submit to hstspreload.org.
          // NOTE: Cloudflare Workers may override this header. Verify in production.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },

          // Prevent DNS prefetching to reduce information leakage to third parties.
          // Next.js does not need DNS prefetch for its own assets.
          { key: "X-DNS-Prefetch-Control", value: "off" },

          // Prevent IE/Edge from downloading HTML as a file (legacy but harmless).
          { key: "X-Download-Options", value: "noopen" },

          // Prevent Flash/PDF from loading cross-origin resources.
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },

          // ─────────────────────────────────────────────────────────────────────
          // Content Security Policy — ENFORCEMENT MODE
          //
          // This policy blocks resources that violate the policy.
          // If the site breaks, switch the header key back to
          // "Content-Security-Policy-Report-Only" to debug without blocking.
          // ─────────────────────────────────────────────────────────────────────
          {
            key: "Content-Security-Policy",
            value: [
              // Fallback for any unset directives — only allow same-origin.
              "default-src 'self'",

              // Scripts: same-origin + inline (required by Next.js hydration/RSC).
              // Cloudflare Web Analytics beacon (beacon.min.js).
              // Cloudflare Turnstile CAPTCHA widget (challenges.cloudflare.com).
              // NOTE: No 'unsafe-eval' — Next.js App Router does not need it.
              "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://challenges.cloudflare.com",

              // Styles: same-origin + inline (required by Tailwind + Next.js CSS injection).
              "style-src 'self' 'unsafe-inline'",

              // Media (video/audio): same-origin, Cloudinary (video hosting).
              "media-src 'self' https:",

              // Images: same-origin, Cloudinary (image hosting), data: URIs (Next.js inline SVGs),
              // blob: (client-side image creation), https: (broad fallback for og:image etc.).
              // Using 'https:' instead of listing every image domain prevents breakage
              // when new image sources are added. Images are low-risk for CSP bypass.
              "img-src 'self' https: data: blob:",

              // Fonts: Google Fonts (used via next/font or CSS import).
              "font-src 'self' https://fonts.gstatic.com",

              // Connections: Firebase Auth, Firestore, Google OAuth, Cloudflare Analytics.
              // Cloudflare Turnstile verification endpoint.
              // 'self' covers Next.js API routes and server actions.
              // Do NOT use 'connect-src none' — it would break Firebase, revalidation,
              // and any client-side data fetching.
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.google.com https://oauth2.googleapis.com https://www.googleapis.com https://static.cloudflareinsights.com https://challenges.cloudflare.com",

              // Frame: Cloudflare Turnstile renders its widget inside an iframe.
              // Restricted to the Turnstile origin only — no other framing allowed.
              "frame-src https://challenges.cloudflare.com",

              // Block all plugins (Flash, Java, etc.) — OWASP A03:2021.
              "object-src 'none'",

              // Prevent <base href> tag injection which could redirect all links.
              "base-uri 'self'",

              // Restrict form submissions to same-origin only.
              "form-action 'self'",

              // Prevent framing — supersedes X-Frame-Options for modern browsers.
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },

      // ───────────────────────────────────────────────────────────────────────
      // Next.js static assets — immutable cache
      //
      // Next.js generates content-hashed filenames for _next/static/* assets,
      // so they can be cached indefinitely. This improves performance and
      // reduces bandwidth costs on Cloudflare Workers.
      // ───────────────────────────────────────────────────────────────────────
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ───────────────────────────────────────────────────────────────────────
      // Public static assets (images, fonts, etc.)
      //
      // These are served from /public and don't have content hashing,
      // so use a shorter cache with revalidation.
      // ───────────────────────────────────────────────────────────────────────
      {
        source: "/:all(svg|ico|jpg|jpeg|png|gif|webp|avif|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },

      // ───────────────────────────────────────────────────────────────────────
      // Admin routes — no caching of authenticated pages
      //
      // Prevents browsers and CDNs from caching admin dashboard content.
      // The Cache-Control and Pragma headers are kept for legacy browser support.
      // ───────────────────────────────────────────────────────────────────────
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },

      // ───────────────────────────────────────────────────────────────────────
      // API routes — no caching of sensitive responses
      //
      // Prevents browsers, proxies, and CDNs from caching API responses
      // which may contain authentication tokens, user data, or CSRF tokens.
      // ───────────────────────────────────────────────────────────────────────
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

export default nextConfig;
