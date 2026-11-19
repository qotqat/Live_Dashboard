import { num } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { TrackingSummary } from "@/lib/metrics";

export function TrackingTable({
  items,
  totalEarnings,
  dict,
}: {
  items: TrackingSummary[];
  totalEarnings: number;
  dict: Dictionary;
}) {
  if (items.length === 0) {
    return <p className="empty">{dict.tracking.empty}</p>;
  }

  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>{dict.tracking.id}</th>
            <th className="n">{dict.tracking.orders}</th>
            <th className="n">{dict.tracking.clicks}</th>
            <th className="n">{dict.tracking.sales}</th>
            <th className="n">{dict.tracking.earnings}</th>
            <th className="n">{dict.tracking.share}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const share =
              totalEarnings > 0 ? (item.earnings / totalEarnings) * 100 : 0;
            return (
              <tr key={item.id}>
                <td>
                  <span dir="ltr">{item.id}</span>
                </td>
                <td className="n">{num(item.orders)}</td>
                <td className="n">{num(item.clicks)}</td>
                <td className="n">{num(item.sales)}</td>
                <td className="n">{num(item.earnings)}</td>
                <td className="n">{share.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
