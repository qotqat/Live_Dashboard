"use server";

import { redirect } from "next/navigation";

import {
  clearLoginFailures,
  createSession,
  createUser,
  destroySession,
  emailExists,
  findUserByEmail,
  getClientIp,
  hashPassword,
  isValidEmail,
  isValidPassword,
  isValidTrackingId,
  isValidUsername,
  loginRateAllowed,
  normalizeEmail,
  normalizeTrackingId,
  normalizeUsername,
  recordLoginFailure,
  trackingIdExists,
  usernameExists,
  verifyPassword,
} from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { fetchAccessRows } from "@/lib/report";

export type AuthState = { error?: string } | undefined;

function field(formData: FormData, name: string): string {
  return String(formData.get(name) || "");
}

export async function loginAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getLocale();
  const t = getDictionary(locale).auth;

  const email = normalizeEmail(field(formData, "email"));
  const password = field(formData, "password");

  if (!isValidEmail(email) || !password) {
    return { error: t.invalidCredentials };
  }

  const ip = await getClientIp();
  const rateKey = `${ip}:${email}`;
  if (!loginRateAllowed(rateKey)) {
    return { error: t.tooManyAttempts };
  }

  const user = findUserByEmail(email);
  if (!user) {
    recordLoginFailure(rateKey);
    return { error: t.invalidCredentials };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordLoginFailure(rateKey);
    return { error: t.invalidCredentials };
  }

  clearLoginFailures(rateKey);
  await createSession(user.id);
  redirect("/");
}

export async function signupAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getLocale();
  const t = getDictionary(locale).auth;

  const email = normalizeEmail(field(formData, "email"));
  const password = field(formData, "password");
  const username = normalizeUsername(field(formData, "username"));
  const trackingId = normalizeTrackingId(field(formData, "trackingId"));

  if (!isValidEmail(email)) return { error: t.invalidEmail };
  if (!isValidPassword(password)) return { error: t.shortPassword };
  if (!isValidUsername(username)) return { error: t.invalidUsername };
  if (!isValidTrackingId(trackingId)) {
    return { error: t.invalidTrackingId };
  }

  const accessRows = await fetchAccessRows().catch(() => []);
  const access = accessRows.find((row) => row.email === email);

  if (!access || !access.active) {
    return { error: t.notEligible };
  }

  if (!access.trackingId) {
    return { error: t.trackingUnassigned };
  }

  if (normalizeTrackingId(access.trackingId) !== trackingId) {
    return { error: t.trackingMismatch };
  }

  if (emailExists(email)) return { error: t.emailTaken };
  if (usernameExists(username)) return { error: t.usernameTaken };
  if (trackingIdExists(trackingId)) return { error: t.trackingTaken };

  const passwordHash = await hashPassword(password);

  let created: ReturnType<typeof createUser>;

  try {
    created = createUser({
      email,
      passwordHash,
      username,
      trackingId,
      name: access.name || null,
    });
  } catch {
    if (emailExists(email)) return { error: t.emailTaken };
    if (usernameExists(username)) return { error: t.usernameTaken };
    if (trackingIdExists(trackingId)) return { error: t.trackingTaken };
    return { error: t.genericError };
  }

  await createSession(created.id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
