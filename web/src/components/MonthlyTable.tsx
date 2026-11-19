import { dayLabel, monthLabel, num } from "@/lib/format";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { METRICS, type MonthSummary, type Totals } from "@/lib/metrics";

export function MonthlyTable({
  months,
  dataTo,
  totals,
  dict,
  locale,
}: {
  months: MonthSummary[];
  dataTo: string | null;
  totals: Totals;
  dict: Dictionary;
  locale: Locale;
}) {
  if (months.length === 0) {
    return <p className="empty">{dict.monthly.empty}</p>;
  }

  const rows = [...months].reverse();

  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>{dict.monthly.month}</th>
            {METRICS.map((metric) => (
              <th className="n" key={metric.key}>
                {dict.metrics[metric.key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((month) => {
            const partial = dataTo !== null && month.monthEnd > dataTo;
            return (
              <tr key={month.key}>
                <td>
                  {monthLabel(`${month.key}-01`, locale)}
                  {partial ? (
                    <small className="muted">
                      {" "}
                      {fill(dict.monthly.toDate, {
                        date: dayLabel(dataTo, locale),
                      })}
                    </small>
                  ) : null}
                </td>
                {METRICS.map((metric) => (
                  <td className="n" key={metric.key}>
                    {num(month[metric.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>{dict.monthly.total}</td>
            {METRICS.map((metric) => (
              <td className="n" key={metric.key}>
                {num(totals[metric.key])}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
