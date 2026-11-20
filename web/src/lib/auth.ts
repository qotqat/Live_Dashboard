import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

import { cookies, headers } from "next/headers";

import { db } from "./db";

const SESSION_COOKIE = "trendire_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SCRYPT = { N: 16384, r: 8, p: 1 };
const SCRYPT_KEYLEN = 64;

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  trackingId: string;
  name: string | null;
};

type UserWithPassword = AuthUser & { passwordHash: string };

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeTrackingId(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isValidTrackingId(value: string): boolean {
  return /^[a-z0-9_-]{2,64}$/i.test(value);
}

export function isValidUsername(value: string): boolean {
  if (value.length < 2 || value.length > 32) return false;
  return /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(value);
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 200;
}

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, SCRYPT_KEYLEN, SCRYPT);
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, salt, expected] = parts;
  const expectedBuffer = Buffer.from(expected, "base64");

  try {
    const derived = await scryptAsync(
      password,
      Buffer.from(salt, "base64"),
      expectedBuffer.length,
      { N: Number(n), r: Number(r), p: Number(p) },
    );
    return (
      derived.length === expectedBuffer.length &&
      timingSafeEqual(derived, expectedBuffer)
    );
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function findUserByEmail(email: string): UserWithPassword | undefined {
  const row = db
    .prepare(
      `SELECT id, email, password_hash AS passwordHash, username,
              tracking_id AS trackingId, name
         FROM users
        WHERE email = ?`,
    )
    .get(email) as UserWithPassword | undefined;

  return row;
}

export function emailExists(email: string): boolean {
  return Boolean(
    db.prepare("SELECT 1 FROM users WHERE email = ?").get(email),
  );
}

export function usernameExists(username: string): boolean {
  return Boolean(
    db.prepare("SELECT 1 FROM users WHERE username = ?").get(username),
  );
}

export function trackingIdExists(trackingId: string): boolean {
  return Boolean(
    db.prepare("SELECT 1 FROM users WHERE tracking_id = ?").get(trackingId),
  );
}

export function createUser(input: {
  email: string;
  passwordHash: string;
  username: string;
  trackingId: string;
  name: string | null;
}): AuthUser {
  const now = Date.now();
  const result = db
    .prepare(
      `INSERT INTO users
        (email, password_hash, username, tracking_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.email,
      input.passwordHash,
      input.username,
      input.trackingId,
      input.name,
      now,
      now,
    );

  return {
    id: Number(result.lastInsertRowid),
    email: input.email,
    username: input.username,
    trackingId: input.trackingId,
    name: input.name,
  };
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();

  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(hashToken(token), userId, now + SESSION_TTL_MS, now);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
      hashToken(token),
    );
  }

  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.email, u.username, u.tracking_id AS trackingId,
              u.name, s.expires_at AS expiresAt
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as
    | (AuthUser & { expiresAt: number })
    | undefined;

  if (!row) return null;

  if (row.expiresAt <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
      hashToken(token),
    );
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    trackingId: row.trackingId,
    name: row.name,
  };
}

export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return store.get("x-real-ip") || "local";
}

export function loginRateAllowed(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
    if (loginAttempts.size > 500) {
      for (const [storedKey, value] of loginAttempts) {
        if (value.resetAt <= now) loginAttempts.delete(storedKey);
      }
    }
    return true;
  }

  return entry.count < LOGIN_MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string): void {
  const entry = loginAttempts.get(key);
  if (!entry) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: Date.now() + LOGIN_WINDOW_MS,
    });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}
