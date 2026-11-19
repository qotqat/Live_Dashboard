"use client";
import React from "react";

// Status styling map from the reference code
const ST = {
  running: { class: "bg-gray-100 text-gray-700", label: "الشهر جارٍ" },
  pending: { class: "bg-yellow-50 text-yellow-800", label: "بانتظار تأكيد المعلن" },
  validated: { class: "bg-blue-50 text-blue-700", label: "تم التأكيد، بانتظار الدفع" },
  paid: { class: "bg-green-50 text-green-700", label: "تم الدفع" },
};

export default function PaymentView({ data }: { data: any }) {
  if (!data || !data.days) return null;

  const currency = data.currency || "ج.م";

  // 1. Calculate months (Ported from payMonths() in code.md)
  const payMonths = () => {
    // FIX: Explicitly type `by` as a Record so we can index it with a string
    const by: Record<string, any> = {};
    const list: any[] = [];
    
    // Add estimated earnings from days
    data.days.forEach((x: any) => {
      const m = String(x.d).slice(0, 7); // YYYY-MM
      if (!by[m]) { by[m] = { m, est: 0, row: null }; list.push(by[m]); }
      by[m].est += Number(x.earnings || 0);
    });

    // Add actual payment rows from API
    (data.payments || []).forEach((r: any) => {
      const m = String(r[0]); // month
      if (!by[m]) { by[m] = { m, est: 0, row: null }; list.push(by[m]); }
      by[m].row = r;
    });

    list.sort((a, b) => (a.m < b.m ? -1 : 1));

    return list.map((p) => {
      const st = p.row ? String(p.row[1]).toLowerCase() : "";
      const isRunning = !p.row && (!data.dataTo || new Date(p.m + "-01") > new Date(data.dataTo));
      
      return {
        ...p,
        status: st === "paid" ? "paid" : st === "validated" ? "validated" : isRunning ? "running" : "pending",
        validated: p.row && p.row[2] !== null && p.status !== "pending" ? p.row[2] : null,
        expected: p.row && p.row[3] ? p.row[3] : "",
        paidOn: p.row && p.row[4] ? p.row[4] : "",
        note: p.row ? p.row[5] : "",
        est: Math.round(p.est * 100) / 100,
      };
    });
  };

  const list = payMonths();
  const paidList = list.filter((p) => p.status === "paid");
  const next = list.filter((p) => p.status !== "paid")[0];
  const last = paidList[paidList.length - 1];

  // Helper to format dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Payment Card */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">الدفعة القادمة</h3>
          {!next ? (
            <p className="mt-2 text-lg font-bold">لا توجد مستحقات قادمة حاليًا</p>
          ) : (
            <>
              <div className="mt-1 text-lg font-bold flex items-center gap-2">
                {next.m} <span className={`text-xs px-2 py-1 rounded-full ${ST[next.status as keyof typeof ST].class}`}>{ST[next.status as keyof typeof ST].label}</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-teal-600">
                {next.validated !== null ? `${next.validated} ${currency} (المبلغ المؤكد)` : `${next.est} ${currency} (تقديري)`}
              </div>
              <dl className="mt-4 text-sm grid grid-cols-2 gap-2">
                <dt className="text-gray-500">موعد الدفع</dt>
                <dd className="font-semibold">{next.expected ? formatDate(next.expected) : `ابتداءً من ${formatDate(next.m + "-01")}`}</dd>
              </dl>
            </>
          )}
        </div>

        {/* Last Payment Card */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">آخر دفعة</h3>
          {!last ? (
            <p className="mt-2 text-lg font-bold">لم تتم أي مدفوعات بعد</p>
          ) : (
            <>
              <div className="mt-1 text-lg font-bold flex items-center gap-2">
                {last.m} <span className={`text-xs px-2 py-1 rounded-full ${ST.paid.class}`}>{ST.paid.label}</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-teal-600">
                {last.validated !== null ? `${last.validated} ${currency}` : ""}
              </div>
              <dl className="mt-4 text-sm grid grid-cols-2 gap-2">
                <dt className="text-gray-500">تاريخ الدفع</dt>
                <dd className="font-semibold">{formatDate(last.paidOn)}</dd>
              </dl>
            </>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">سجل المدفوعات</h3>
        <table className="w-full text-sm text-right">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="pb-2">الشهر</th>
              <th className="pb-2">العمولة التقديرية</th>
              <th className="pb-2">المبلغ المؤكد</th>
              <th className="pb-2">الحالة</th>
              <th className="pb-2">موعد الدفع</th>
            </tr>
          </thead>
          <tbody>
            {list.slice().reverse().map((p, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3">{p.m}</td>
                <td className="py-3">{p.est} {currency}</td>
                <td className="py-3">{p.validated !== null ? `${p.validated} ${currency}` : "-"}</td>
                <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs ${ST[p.status as keyof typeof ST].class}`}>{ST[p.status as keyof typeof ST].label}</span></td>
                <td className="py-3">{formatDate(p.paidOn || p.expected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}