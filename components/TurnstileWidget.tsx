"use client";

import { useRef, useCallback, useId, useEffect } from "react";

// Cloudflare Turnstile widget — renders a non-intrusive CAPTCHA challenge.
// The widget auto-solves for most users (no interaction needed).
// For suspicious traffic, it presents a visual challenge.
//
// The Turnstile script is loaded dynamically when this component mounts.
// See: https://developers.cloudflare.com/turnstile/

const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    // Already loaded.
    if (window.turnstile) {
      resolve();
      return;
    }
    // Check if the script tag already exists.
    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    if (existing) {
      // Script tag exists but widget not yet available — wait for it.
      const check = () => {
        if (window.turnstile) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
      return;
    }
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      // Script loaded but turnstile object may take a frame to initialize.
      const check = () => {
        if (window.turnstile) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    };
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({
  siteKey,
  onTokenChange,
}: {
  siteKey: string;
  onTokenChange: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");
  const id = useId();

  const handleToken = useCallback(
    (token: string) => {
      onTokenChange(token);
    },
    [onTokenChange]
  );

  const handleError = useCallback(() => {
    onTokenChange("");
  }, [onTokenChange]);

  const handleExpired = useCallback(() => {
    onTokenChange("");
    // Auto-reset the widget when the token expires.
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onTokenChange]);

  // Load the Turnstile script and initialize the widget after mount.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let cancelled = false;

    loadTurnstileScript().then(() => {
      if (cancelled || !window.turnstile || !node) return;
      // Remove any existing widget first.
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
      widgetIdRef.current = window.turnstile.render(node, {
        sitekey: siteKey,
        callback: handleToken,
        "error-callback": handleError,
        "expired-callback": handleExpired,
        theme: "dark",
        size: "normal",
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [siteKey, handleToken, handleError, handleExpired]);

  return (
    <div id={`turnstile-${id}`} ref={containerRef} className="cf-turnstile" />
  );
}
