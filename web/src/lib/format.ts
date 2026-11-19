import type { Locale } from "./i18n";

const SHORT_MONTHS: Record<Locale, string[]> = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  ar: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
};

const LONG_MONTHS: Record<Locale, string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ar: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
};

export function currency(locale: Locale): string {
  return locale === "ar" ? "ج.م" : "EGP";
}

export function num(value: number, digits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(safe);
}

export function money(value: number, locale: Locale): string {
  return `${num(value)} ${currency(locale)}`;
}

export function shortNum(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num(value);
}

export function dayLabel(iso: string, locale: Locale): string {
  const [, month, day] = iso.split("-").map(Number);
  if (!month || !day) return iso;
  return `${day} ${SHORT_MONTHS[locale][month - 1]}`;
}

export function dayLabelY(iso: string, locale: Locale): string {
  return `${dayLabel(iso, locale)} ${iso.slice(0, 4)}`;
}

export function monthLabel(iso: string, locale: Locale): string {
  const [year, month] = iso.split("-").map(Number);
  if (!year || !month) return iso;
  return `${LONG_MONTHS[locale][month - 1]} ${year}`;
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const monthPart = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dayPart = String(next.getUTCDate()).padStart(2, "0");
  return `${next.getUTCFullYear()}-${monthPart}-${dayPart}`;
}

export function monthEnd(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export function rangeLabel(
  start: string,
  end: string,
  locale: Locale,
): string {
  if (start === end) return dayLabel(start, locale);
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${Number(start.slice(8, 10))} – ${dayLabel(end, locale)}`;
  }
  return `${dayLabel(start, locale)} – ${dayLabel(end, locale)}`;
}
