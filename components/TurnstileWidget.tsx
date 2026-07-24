"use client";

import { useRef, useCallback, useId, useEffect } from "react";

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
          execution?: "render" | "execute";
          action?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    if (existing) {
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

const MAX_RETRIES = 3;

export default function TurnstileWidget({
  siteKey,
  onTokenChange,
}: {
  siteKey: string;
  onTokenChange: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");
  const retriesRef = useRef(0);
  const id = useId();

  const handleToken = useCallback(
    (token: string) => {
      retriesRef.current = 0;
      onTokenChange(token);
    },
    [onTokenChange]
  );

  const handleError = useCallback(() => {
    onTokenChange("");
    if (retriesRef.current < MAX_RETRIES && widgetIdRef.current && window.turnstile) {
      retriesRef.current++;
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        rebuildWidget(siteKey, onTokenChange, widgetIdRef);
      }
    }
  }, [siteKey, onTokenChange]);

  const handleExpired = useCallback(() => {
    onTokenChange("");
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        rebuildWidget(siteKey, onTokenChange, widgetIdRef);
      }
    }
  }, [siteKey, onTokenChange]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let cancelled = false;

    loadTurnstileScript().then(() => {
      if (cancelled || !window.turnstile || !node) return;
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

function rebuildWidget(
  siteKey: string,
  onTokenChange: (token: string) => void,
  widgetIdRef: React.MutableRefObject<string>
) {
  const container = document.querySelector<HTMLElement>(".cf-turnstile");
  if (!container || !window.turnstile) return;

  try {
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }
  } catch {}

  widgetIdRef.current = window.turnstile.render(container, {
    sitekey: siteKey,
    callback: (token: string) => {
      onTokenChange(token);
    },
    "error-callback": () => {
      onTokenChange("");
    },
    "expired-callback": () => {
      onTokenChange("");
    },
    theme: "dark",
    size: "normal",
  });
}
