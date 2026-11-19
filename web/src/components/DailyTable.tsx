import { currency, dayLabel, num } from "@/lib/format";
import type { Dictionary, Locale } from "@/lib/i18n";
import { METRICS, type DailyPoint, type Totals } from "@/lib/metrics";

export function DailyTable({
  days,
  totals,
  dict,
  locale,
}: {
  days: DailyPoint[];
  totals: Totals;
  dict: Dictionary;
  locale: Locale;
}) {
  if (days.length === 0) {
    return <p className="empty">{dict.daily.empty}</p>;
  }

  const rows = [...days].reverse();

  return (
    <>
      <div className="tw daily-table">
        <table>
          <thead>
            <tr>
              <th>{dict.daily.date}</th>
              {METRICS.map((metric) => (
                <th className="n" key={metric.key}>
                  {dict.metrics[metric.key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((day) => (
              <tr key={day.date}>
                <td>{dayLabel(day.date, locale)}</td>
                {METRICS.map((metric) => (
                  <td className="n" key={metric.key}>
                    {num(day[metric.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>{dict.daily.total}</td>
              {METRICS.map((metric) => (
                <td className="n" key={metric.key}>
                  {num(totals[metric.key])}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <ul className="daily-cards">
        {rows.map((day) => (
          <li className="daily-card" key={day.date}>
            <div className="daily-card-head">
              <strong className="daily-card-date">
                {dayLabel(day.date, locale)}
              </strong>
            </div>
            <dl className="daily-card-grid">
              {METRICS.map((metric) => (
                <div key={metric.key}>
                  <dt>{dict.metrics[metric.key]}</dt>
                  <dd>
                    {num(day[metric.key])}
                    {metric.money ? ` ${currency(locale)}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
        <li className="daily-card daily-card-total">
          <div className="daily-card-head">
            <strong className="daily-card-date">{dict.daily.total}</strong>
          </div>
          <dl className="daily-card-grid">
            {METRICS.map((metric) => (
              <div key={metric.key}>
                <dt>{dict.metrics[metric.key]}</dt>
                <dd>
                  {num(totals[metric.key])}
                  {metric.money ? ` ${currency(locale)}` : ""}
                </dd>
              </div>
            ))}
          </dl>
        </li>
      </ul>
    </>
  );
}
