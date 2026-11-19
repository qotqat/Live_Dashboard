import { num, rangeLabel } from "@/lib/format";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { METRICS, type WeekSummary } from "@/lib/metrics";

export function WeeklyTable({
  weeks,
  dict,
  locale,
}: {
  weeks: WeekSummary[];
  dict: Dictionary;
  locale: Locale;
}) {
  if (weeks.length === 0) {
    return <p className="empty">{dict.weekly.empty}</p>;
  }

  const rows = [...weeks].reverse().slice(0, 12);

  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>{dict.weekly.column}</th>
            {METRICS.map((metric) => (
              <th className="n" key={metric.key}>
                {dict.metrics[metric.key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((week) => (
            <tr key={week.key}>
              <td>
                {fill(dict.weekly.week, { week: week.week })}{" "}
                <small className="muted">
                  ({rangeLabel(week.start, week.end, locale)})
                </small>
              </td>
              {METRICS.map((metric) => (
                <td className="n" key={metric.key}>
                  {num(week[metric.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {weeks.length > 12 ? (
        <p className="table-note">{dict.weekly.last12}</p>
      ) : null}
    </div>
  );
}
