import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.auth.signupTitle} | ${dict.brand.title}` };
}

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <AuthShell dict={dict} locale={locale}>
      <section className="auth-card">
        <h1>{dict.auth.signupTitle}</h1>
        <p className="sub">{dict.auth.signupSub}</p>
        <SignupForm dict={dict} />
      </section>
    </AuthShell>
  );
}
