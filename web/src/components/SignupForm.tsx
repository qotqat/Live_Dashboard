"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";

export function SignupForm({ dict }: { dict: Dictionary }) {
  const [state, action, pending] = useActionState(signupAction, undefined);
  const t = dict.auth;

  return (
    <form action={action} className="auth-form">
      {state?.error ? (
        <p className="auth-error" role="alert">
          {state.error}
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
        <span>{t.password}</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <small>{t.passwordHint}</small>
      </label>

      <label className="field">
        <span>{t.username}</span>
        <input
          name="username"
          autoComplete="username"
          minLength={2}
          maxLength={32}
          required
        />
      </label>

      <label className="field">
        <span>{t.trackingId}</span>
        <input
          name="trackingId"
          autoComplete="off"
          dir="ltr"
          spellCheck={false}
          autoCapitalize="none"
          required
        />
        <small>{t.trackingHint}</small>
      </label>

      <button className="auth-submit" type="submit" disabled={pending}>
        {t.signupSubmit}
      </button>

      <p className="auth-switch">
        <Link href="/login">{t.haveAccount}</Link>
      </p>
    </form>
  );
}
