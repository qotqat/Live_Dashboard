import type { ReactNode } from "react";

import { LanguageToggle } from "@/components/LanguageToggle";
import type { Dictionary, Locale } from "@/lib/i18n";

export function AuthShell({
  children,
  dict,
  locale,
}: {
  children: ReactNode;
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <div className="app">
      <header>
        <div className="bar-in">
          <div className="brand">
            <span className="logo-mark" aria-hidden="true">
              <img src="/images/logo.png" alt="" />
            </span>
            <div className="brand-copy">
              <span className="logo">{dict.brand.title}</span>
              <span className="logo-sub">{dict.brand.subtitle}</span>
            </div>
          </div>
          <div className="acts">
            <LanguageToggle
              locale={locale}
              label={dict.language.switchLabel}
              ariaLabel={dict.language.switchAria}
            />
          </div>
        </div>
      </header>

      <main className="auth-page">{children}</main>
    </div>
  );
}
