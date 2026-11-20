"use client";

import { useActionState } from "react";

import { loginWithEmailPhone } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";

export function LoginForm({ dict }: { dict: Dictionary }) {
  const [state, action, pending] = useActionState(
    loginWithEmailPhone,
    undefined,
  );
  const t = dict.auth;
  const error = state?.error;

  return (
    <form action={action} className="auth-form">
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <label className="field">
        <span>{t.email}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          required
        />
      </label>

      <label className="field">
        <span>{t.mobile}</span>
        <input
          name="mobile"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          dir="ltr"
          spellCheck={false}
          autoCapitalize="none"
          required
        />
      </label>

      <button className="auth-submit" type="submit" disabled={pending}>
        {t.loginSubmit}
      </button>
    </form>
  );
}
