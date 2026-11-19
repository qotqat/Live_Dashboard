import Link from "next/link";
import type { ReactNode } from "react";

import AutoRefresh from "@/components/AutoRefresh";
import { DailyTable } from "@/components/DailyTable";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MonthlyTable } from "@/components/MonthlyTable";
import { PerformanceChart } from "@/components/PerformanceChart";
import { TrackingTable } from "@/components/TrackingTable";
import { WeeklyTable } from "@/components/WeeklyTable";
import { currency, dayLabel, dayLabelY, num } from "@/lib/format";
import { fill, getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import {
  METRICS,
  dailySeries,
  delta,
  latestDate,
  monthlySeries,
  parseRange,
  selectRange,
  totals,
  trackingSeries,
  weeklySeries,
} from "@/lib/metrics";
import { loadReport, type ReportSnapshot } from "@/lib/report";

type PageProps = {
  searchParams: Promise<{ p?: string | string[]; tab?: string | string[] }>;
};

function Header({ checkedAt, dict, locale }: { checkedAt?: string; dict: Dictionary; locale: Locale }) {
  return (
    <header>
      <div className="bar-in">
        <div className="brand">
          {/* Amazon Logo SVG */}
          <span className="logo-mark" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.5C5.5 19 10.5 20 14 19.5C16.5 19 18.5 18 20 16.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13.5 7.5H17.5C18.3 7.5 19 8.2 19 9V12C19 12.8 18.3 13.5 17.5 13.5H13.5V7.5Z" fill="currentColor"/>
              <path d="M13.5 7.5V13.5H10.5L13.5 7.5Z" fill="currentColor"/>
              <path d="M11 13.5L8 7.5H5L2 13.5H4.5L5.5 11H9.5L10.5 13.5H11ZM8 8.5L9 10.5H6L8 8.5Z" fill="currentColor"/>
            </svg>
          </span>
          <div className="brand-copy">
            <span className="logo">{dict.brand.title}</span>
            <span className="logo-sub">أمازون مصر</span>
          </div>
        </div>
        <div className="acts">
          <span className={checkedAt ? "live-pill" : "live-pill offline"}>
            <span className="live-dot" />
            {checkedAt ? dict.live : dict.offline}
          </span>
          <LanguageToggle locale={locale} label={dict.language.switchLabel} ariaLabel={dict.language.switchAria} />
        </div>
      </div>
    </header>
  );
}

function Frame({ children, checkedAt, dict, locale }: { children: ReactNode; checkedAt?: string; dict: Dictionary; locale: Locale }) {
  return (
    <div className="app">
      <Header checkedAt={checkedAt} dict={dict} locale={locale} />
      <main>{children}</main>
    </div>
  );
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params.p) ? params.p[0] : params.p;
  const tabValue = Array.isArray(params.tab) ? params.tab[0] : params.tab || "perf";
  
  const range = parseRange(rangeValue);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  let snapshot: ReportSnapshot | null = null;
  let loadError: string | null = null;

  try {
    snapshot = await loadReport();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unknown loading error.";
  }

  if (!snapshot) {
    return (
      <Frame dict={dict} locale={locale}>
        <AutoRefresh />
        <div className="card error-card">
          <h1>{dict.errors.loadTitle}</h1>
          <p className="sub">{loadError}</p>
          <p className="muted">{dict.errors.sheetUnavailable}</p>
        </div>
      </Frame>
    );
  }

  if (snapshot.rows.length === 0) {
    return (
      <Frame checkedAt={snapshot.fetchedAt} dict={dict} locale={locale}>
        <AutoRefresh />
        <div className="card error-card">
          <h1>{dict.errors.emptyTitle}</h1>
          <p className="sub">{dict.errors.emptyBody}</p>
        </div>
      </Frame>
    );
  }

  const dataTo = latestDate(snapshot.rows);
  const selection = selectRange(snapshot.rows, range);
  const currentTotals = totals(selection.current);
  const previousTotals = totals(selection.previous);
  const daily = dailySeries(selection.current);
  const weeks = weeklySeries(snapshot.rows);
  const months = monthlySeries(snapshot.rows);
  const allTotals = totals(snapshot.rows);
  const tracking = trackingSeries(selection.current);
  const hasPrevious = selection.previous.length > 0;

  const rangeOptions = [
    { key: "mtd", label: dict.ranges.mtd },
    { key: "7d", label: dict.ranges.d7 },
    { key: "all", label: dict.ranges.all },
  ] as const;

  return (
    <Frame checkedAt={snapshot.fetchedAt} dict={dict} locale={locale}>
      <AutoRefresh />

      <div className="hello">
        <div>
          <h1>{dict.hero.title}</h1>
          <p className="sub">{dict.hero.sub}</p>
        </div>
        <span className="asof">
          {dataTo ? fill(dict.hero.asOf, { date: dayLabelY(dataTo, locale) }) : dict.hero.noData}
        </span>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/?tab=perf" style={{ padding: '8px 24px', borderRadius: '999px', backgroundColor: tabValue === "perf" ? 'var(--brand)' : 'var(--card)', color: tabValue === "perf" ? 'var(--brand-ink)' : 'var(--text)', border: '1px solid var(--line)', textDecoration: 'none', fontWeight: tabValue === "perf" ? 'bold' : 'normal' }}>الأداء</Link>
        <Link href="/?tab=pay" style={{ padding: '8px 24px', borderRadius: '999px', backgroundColor: tabValue === "pay" ? 'var(--brand)' : 'var(--card)', color: tabValue === "pay" ? 'var(--brand-ink)' : 'var(--text)', border: '1px solid var(--line)', textDecoration: 'none', fontWeight: tabValue === "pay" ? 'bold' : 'normal' }}>المدفوعات</Link>
        <Link href="/?tab=rates" style={{ padding: '8px 24px', borderRadius: '999px', backgroundColor: tabValue === "rates" ? 'var(--brand)' : 'var(--card)', color: tabValue === "rates" ? 'var(--brand-ink)' : 'var(--text)', border: '1px solid var(--line)', textDecoration: 'none', fontWeight: tabValue === "rates" ? 'bold' : 'normal' }}>العمولة</Link>
      </div>

      {/* PERF TAB */}
      {tabValue === "perf" && (
        <>
          <div className="period-block">
            <nav className="chips" aria-label={dict.ranges.label}>
              {rangeOptions.map((option) => {
                const active = range === option.key;
                return (
                  <Link
                    key={option.key}
                    href={option.key === "mtd" ? "/?tab=perf" : `/?tab=perf&p=${option.key}`}
                    className={active ? "chip active" : "chip"}
                    aria-current={active ? "page" : undefined}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </nav>
            {selection.start && selection.end ? (
              <div className="range">
                {fill(dict.range, { start: dayLabel(selection.start, locale), end: dayLabel(selection.end, locale) })}
              </div>
            ) : null}
          </div>

          <div className="tiles">
            {METRICS.map((metric) => {
              const value = currentTotals[metric.key];
              const change = hasPrevious ? delta(value, previousTotals[metric.key]) : null;
              return (
                <div className="tile" key={metric.key}>
                  <div className="k">{dict.metrics[metric.key]}</div>
                  <div className="v">
                    {num(value)}
                    {metric.money ? <small> {currency(locale)}</small> : null}
                  </div>
                  {change !== null ? (
                    <div className="d">
                      <span className={change >= 0 ? "up" : "down"} dir="ltr">
                        {change >= 0 ? "▲ " : "▼ "}
                        {Math.abs(Math.round(change))}%
                      </span>{" "}
                      {dict.comparedTo}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <PerformanceChart points={daily} start={selection.start} end={selection.end} dict={dict} locale={locale} />
          <section className="card"><h2>{dict.daily.title}</h2><DailyTable days={daily} totals={currentTotals} dict={dict} locale={locale} /></section>
          <section className="card"><h2>{dict.weekly.title}</h2><WeeklyTable weeks={weeks} dict={dict} locale={locale} /></section>
          <section className="card"><h2>{dict.monthly.title}</h2><MonthlyTable months={months} dataTo={dataTo} totals={allTotals} dict={dict} locale={locale} /></section>
          <section className="card"><h2>{dict.tracking.title}</h2><p className="sub card-sub">{dict.tracking.sub}</p><TrackingTable items={tracking} totalEarnings={currentTotals.earnings} dict={dict} /></section>
        </>
      )}

      {/* PAYMENTS TAB */}
      {tabValue === "pay" && <PaymentsView snapshot={snapshot} />}

      {/* RATES TAB */}
      {tabValue === "rates" && <CommissionView snapshot={snapshot} />}

      {/* Footer has been removed as requested! */}
    </Frame>
  );
}

// --- PAYMENTS VIEW COMPONENT ---
function PaymentsView({ snapshot }: { snapshot: ReportSnapshot }) {
  const currencyStr = snapshot.currency || "ج.م";
  const paidList = snapshot.payments || [];
  const last = paidList[paidList.length - 1];

  return (
    <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <h3 className="sub">الدفعة القادمة</h3>
          <div className="v" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>0 {currencyStr}</div>
          <p className="muted">لا توجد مستحقات قادمة حاليًا</p>
        </div>
        <div className="card">
          <h3 className="sub">آخر دفعة</h3>
          {!last ? (
            <p className="muted">لم تتم أي مدفوعات بعد</p>
          ) : (
            <div>
              <div className="v" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{last[2]} {currencyStr}</div>
              <p className="muted">تم الدفع في {last[4] || "غير محدد"}</p>
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <h2>سجل المدفوعات</h2>
        <p className="muted" style={{ marginTop: '1rem' }}>لا توجد بيانات كافية لعرض سجل المدفوعات حاليًا.</p>
      </div>
    </div>
  );
}

// --- COMMISSION VIEW COMPONENT ---
function CommissionView({ snapshot }: { snapshot: ReportSnapshot }) {
  const rates = snapshot.rates || [];
  if (rates.length === 0) return <div className="card">لا توجد بيانات عمولة متاحة.</div>;
  
  return (
    <div className="card">
      <h2>{snapshot.ratesTitle || "نسب العمولة"}</h2>
      <p className="sub" style={{ marginBottom: '1rem' }}>نسبة عمولتك من سعر كل منتج يُباع من خلال رابطك، حسب فئة المنتج.</p>
      <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)' }}>
            <th style={{ padding: '0.5rem' }}>الفئة</th>
            <th style={{ padding: '0.5rem' }}>نسبة عمولتك</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: '0.75rem 0.5rem' }}>{r[0]}</td>
              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold', color: 'var(--brand)' }}>{Math.round(r[1] * 1000) / 10}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}