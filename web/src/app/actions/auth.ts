"use server";

import { redirect } from "next/navigation";

import {
  clearLoginFailures,
  createSession,
  createUser,
  destroySession,
  emailExists,
  emailLocalPart,
  findUserByEmail,
  getClientIp,
  isValidEmail,
  loginRateAllowed,
  normalizeEmail,
  normalizeUsername,
  recordLoginFailure,
  uniqueUsername,
  usernameExists,
} from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { fetchAccessRows, findLoginRow } from "@/lib/report";

export type AuthState = { error?: string } | undefined;

function field(formData: FormData, name: string): string {
  return String(formData.get(name) || "");
}

export async function loginWithEmailPhone(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getLocale();
  const t = getDictionary(locale).auth;
  const email = normalizeEmail(field(formData, "email"));
  const mobile = field(formData, "mobile");

  if (!isValidEmail(email) || !mobile.trim()) {
    return { error: t.invalidPhone };
  }

  const ip = await getClientIp();
  const rateKey = `${ip}:${email}`;
  if (!loginRateAllowed(rateKey)) {
    return { error: t.tooManyAttempts };
  }

  const row = await findLoginRow(email, mobile);
  if (!row) {
    recordLoginFailure(rateKey);
    return { error: t.noAccount };
  }

  const user = findUserByEmail(email);
  if (user) {
    clearLoginFailures(rateKey);
    await createSession(user.id);
    redirect("/");
  }

  const accessRows = await fetchAccessRows().catch(() => []);
  const access = accessRows.find((r) => r.email === email);
  if (!access || !access.trackingId) {
    recordLoginFailure(rateKey);
    return { error: t.trackingUnassigned };
  }

  const username = uniqueUsername(
    normalizeUsername(row.username || emailLocalPart(email)),
  );
  try {
    const created = createUser({
      email,
      passwordHash: "",
      username,
      trackingId: access.trackingId,
      name: null,
    });
    clearLoginFailures(rateKey);
    await createSession(created.id);
    redirect("/");
  } catch {
    recordLoginFailure(rateKey);
    if (emailExists(email)) return { error: t.emailTaken };
    if (usernameExists(username)) return { error: t.usernameTaken };
    return { error: t.genericError };
  }
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
