"use client";

import { useActionState, useId, useCallback, useState } from "react";
import { submitContact } from "@/actions";
import TurnstileWidget from "@/components/TurnstileWidget";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function ContactForm({
  nameLabel = "Name",
  namePlaceholder = "Your name",
  emailLabel = "Email",
  emailPlaceholder = "Your email",
  messageLabel = "Message",
  messagePlaceholder = "Your message",
  sendMessageLabel = "Send Message",
}: {
  nameLabel?: string;
  namePlaceholder?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  sendMessageLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(submitContact, null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [failureGeneration, setFailureGeneration] = useState(0);
  const [tokenGeneration, setTokenGeneration] = useState(0);
  const id = useId();

  const securityFailed = state?.error?.includes("Security verification failed") ?? false;

  if (securityFailed && failureGeneration === 0) {
    setFailureGeneration(tokenGeneration);
  }
  if (!securityFailed && failureGeneration !== 0) {
    setFailureGeneration(0);
  }

  const tokenIsStale = securityFailed && tokenGeneration <= failureGeneration;
  const effectiveToken = tokenIsStale ? "" : turnstileToken;
  const effectiveKey = tokenIsStale ? turnstileKey + 1 : turnstileKey;

  const handleTokenChange = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileKey((k) => k + 1);
    setTokenGeneration((g) => g + 1);
  }, []);

  return (
    <form key={state?.success ? `${id}-sent` : id} action={formAction} className="grid gap-6 sm:grid-cols-2">
      {state?.error && (
        <p className="sm:col-span-2 text-sm text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="sm:col-span-2 text-sm text-green-400">Message sent successfully!</p>
      )}
      <div>
        <label htmlFor={`${id}-name`} className="block text-sm font-medium text-white/60">{nameLabel}</label>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder={namePlaceholder}
          className="mt-2 w-full border border-white/20 bg-transparent px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white"
        />
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-medium text-white/60">{emailLabel}</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder={emailPlaceholder}
          className="mt-2 w-full border border-white/20 bg-transparent px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-message`} className="block text-sm font-medium text-white/60">{messageLabel}</label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          required
          maxLength={5000}
          placeholder={messagePlaceholder}
          className="mt-2 w-full resize-none border border-white/20 bg-transparent px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white"
        />
      </div>
      {TURNSTILE_SITE_KEY && (
        <div className="sm:col-span-2">
          <TurnstileWidget
            key={effectiveKey}
            siteKey={TURNSTILE_SITE_KEY}
            onTokenChange={handleTokenChange}
          />
        </div>
      )}
      {TURNSTILE_SITE_KEY && (
        <input type="hidden" name="cf-turnstile-response" value={effectiveToken} />
      )}
      <div className="sm:col-span-2">
        {TURNSTILE_SITE_KEY && !effectiveToken && (
          <p className="mb-3 text-xs text-white/40">Verifying you are human...</p>
        )}
        <button
          type="submit"
          disabled={pending || (TURNSTILE_SITE_KEY !== "" && !effectiveToken)}
          className="rounded-full border border-white px-6 py-3 text-xs md:text-md font-medium uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black disabled:opacity-50"
        >
          {pending ? "Sending..." : sendMessageLabel}
        </button>
      </div>
    </form>
  );
}
