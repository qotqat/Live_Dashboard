/**
 * Egyptian mobile number matching.
 *
 * Numbers are accepted with or without the international trunk:
 * - A leading `20` is treated as the Egyptian `+20` prefix: when the digits
 *   start with `20`, the normalized form is `0` + the rest, so
 *   `+201147241732` matches the trunk form `01147241732`.
 * - Otherwise the digits are compared directly, with a last-9-digits
 *   fallback so trailing forms still match.
 */

export function normalizePhone(value: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20") && digits.length >= 10) {
    return "0" + digits.slice(2);
  }
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 9 && nb.length >= 9) {
    return na.slice(-9) === nb.slice(-9);
  }
  return false;
}
