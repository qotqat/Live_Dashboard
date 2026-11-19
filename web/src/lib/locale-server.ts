import { cookies } from "next/headers";

import { normalizeLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get("lang")?.value);
}
