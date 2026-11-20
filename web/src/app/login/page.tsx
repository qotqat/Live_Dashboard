import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.auth.loginTitle} | ${dict.brand.title}` };
}

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <AuthShell dict={dict} locale={locale}>
      <section className="auth-card">
        <h1>{dict.auth.loginTitle}</h1>
        <p className="sub">{dict.auth.loginSub}</p>
        <LoginForm dict={dict} />
      </section>
    </AuthShell>
  );
}
