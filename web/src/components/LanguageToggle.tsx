"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { dirFor, type Locale } from "@/lib/i18n";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageToggle({
  locale,
  label,
  ariaLabel,
}: {
  locale: Locale;
  label: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const target = useRef<Locale | null>(null);
  const next: Locale = locale === "ar" ? "en" : "ar";

  function changeLanguage() {
    const secure =
      window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `lang=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
    target.current = next;
    startTransition(() => router.refresh());
  }

  useEffect(() => {
    if (pending || !target.current) return;
    document.documentElement.lang = target.current;
    document.documentElement.dir = dirFor(target.current);
    target.current = null;
  }, [pending]);

  return (
    <button
      type="button"
      className="lang-btn"
      onClick={changeLanguage}
      disabled={pending}
      aria-label={ariaLabel}
      lang={next}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
      </svg>
      {label}
    </button>
  );
}
