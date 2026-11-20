"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";

export function LoginForm({ dict }: { dict: Dictionary }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
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
          autoComplete="current-password"
          minLength={8}
          required
        />
      </label>

      <button className="auth-submit" type="submit" disabled={pending}>
        {t.loginSubmit}
      </button>

      <p className="auth-switch">
        <Link href="/signup">{t.firstTime}</Link>
      </p>
    </form>
  );
}
