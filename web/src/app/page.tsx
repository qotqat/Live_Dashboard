"use client";

import { useState, useEffect } from "react";

// --- Helper Types ---
type Tab = "perf" | "pay" | "rates";

// --- Main Page Component ---
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("perf");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from your API (Update this URL if your API route is different)
  useEffect(() => {
    async function fetchData() {
      try {
        // Replace this with your actual API fetch logic
        const res = await fetch("https://docs.google.com/spreadsheets/d/11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78/edit?gid=1651395657#gid=1651395657");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center">جارٍ التحميل...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">تعذر تحميل البيانات.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
      {/* 1. Header: Amazon Icon + New Subtitle */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Amazon Icon */}
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.5C5.5 19 10.5 20 14 19.5C16.5 19 18.5 18 20 16.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13.5 7.5H17.5C18.3 7.5 19 8.2 19 9V12C19 12.8 18.3 13.5 17.5 13.5H13.5V7.5Z" fill="#111"/>
              <path d="M13.5 7.5V13.5H10.5L13.5 7.5Z" fill="#111"/>
              <path d="M11 13.5L8 7.5H5L2 13.5H4.5L5.5 11H9.5L10.5 13.5H11ZM8 8.5L9 10.5H6L8 8.5Z" fill="#111"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">أرباح المؤثرين</h1>
            <p className="text-sm text-gray-500 font-medium">أمازون مصر</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* 2. Main Tabs */}
        <div className="flex gap-2 bg-gray-200/50 p-1 rounded-full w-fit mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab("perf")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === "perf" ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            الأداء
          </button>
          <button
            onClick={() => setActiveTab("pay")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === "pay" ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            المدفوعات
          </button>
          <button
            onClick={() => setActiveTab("rates")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === "rates" ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            العمولة
          </button>
        </div>

        {/* 3. View Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === "perf" && <PerformanceView data={data} />}
          {activeTab === "pay" && <PaymentsView data={data} />}
          {activeTab === "rates" && <CommissionView data={data} />}
        </div>
      </main>

      {/* Footer text has been completely removed as requested */}
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

// --- 1. Performance View (Placeholder for your existing charts) ---
function PerformanceView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4">ملخص الأداء</h2>
        <p className="text-gray-500 text-sm">
          (هنا تضع الرسوم البيانية والمخططات الخاصة بك من الكود السابق)
        </p>
        {/* Example Tile */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">إجمالي العمولة</div>
          <div className="text-2xl font-bold text-teal-600">
            {data.days?.reduce((acc: number, day: any) => acc + (day.earnings || 0), 0).toLocaleString()} {data.currency}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. Payments View (Ported from code.md) ---
function PaymentsView({ data }: { data: any }) {
  const rules = data.payRules || { vFrom: 30, vTo: 60, payMin: 60 };
  const currency = data.currency || "ج.م";

  // Ported logic from payMonths() in Index.html
  const getPaymentMonths = () => {
    const by: Record<string, any> = {};
    const list: any[] = [];

    // Est earnings from days
    (data.days || []).forEach((x: any) => {
      const m = x.d.slice(0, 7);
      if (!by[m]) { by[m] = { m, est: 0, row: null }; list.push(by[m]); }
      by[m].est += Number(x.earnings || 0);
    });

    // Actual payments
    (data.payments || []).forEach((r: any) => {
      const m = r[0];
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

  const list = getPaymentMonths();
  const paidList = list.filter((p) => p.status === "paid");
  const next = list.filter((p) => p.status !== "paid")[0];
  const last = paidList[paidList.length - 1];

  const ST_MAP: any = {
    running: { class: "bg-gray-100 text-gray-700", label: "الشهر جارٍ" },
    pending: { class: "bg-yellow-50 text-yellow-800", label: "بانتظار تأكيد المعلن" },
    validated: { class: "bg-blue-50 text-blue-700", label: "تم التأكيد، بانتظار الدفع" },
    paid: { class: "bg-green-50 text-green-700", label: "تم الدفع" },
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Payment */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">الدفعة القادمة</h3>
          {!next ? (
            <p className="text-lg font-bold">لا توجد مستحقات قادمة حاليًا</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold">{next.m}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${ST_MAP[next.status].class}`}>
                  {ST_MAP[next.status].label}
                </span>
              </div>
              <div className="text-2xl font-bold text-teal-600 mb-4">
                {next.validated !== null ? `${next.validated} ${currency}` : `${next.est} ${currency}`}
                <span className="text-sm text-gray-500 font-normal mr-1">({next.validated !== null ? "المبلغ المؤكد" : "تقديري"})</span>
              </div>
              <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                {next.status === "running" && (
                  <>
                    <dt className="text-gray-500">نهاية الشهر</dt>
                    <dd className="font-semibold">{formatDate(next.m + "-01")}</dd>
                  </>
                )}
                {(next.status === "running" || next.status === "pending") && (
                  <>
                    <dt className="text-gray-500">تأكيد المبلغ</dt>
                    <dd className="font-semibold">بين {formatDate(next.m + "-01")} و {formatDate(next.m + "-28")}</dd>
                  </>
                )}
                <dt className="text-gray-500">موعد الدفع</dt>
                <dd className="font-semibold">{next.expected ? formatDate(next.expected) : `ابتداءً من ${formatDate(next.m + "-01")}`}</dd>
              </dl>
            </>
          )}
        </div>

        {/* Last Payment */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">آخر دفعة</h3>
          {!last ? (
            <p className="text-lg font-bold">لم تتم أي مدفوعات بعد</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold">{last.m}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${ST_MAP.paid.class}`}>
                  {ST_MAP.paid.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-teal-600 mb-4">
                {last.validated !== null ? `${last.validated} ${currency}` : ""}
              </div>
              <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-gray-500">تاريخ الدفع</dt>
                <dd className="font-semibold">{formatDate(last.paidOn)}</dd>
              </dl>
            </>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold">سجل المدفوعات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">الشهر</th>
                <th className="px-6 py-3 font-medium">العمولة التقديرية</th>
                <th className="px-6 py-3 font-medium">المبلغ المؤكد</th>
                <th className="px-6 py-3 font-medium">الحالة</th>
                <th className="px-6 py-3 font-medium">موعد الدفع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.slice().reverse().map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium">{p.m}</td>
                  <td className="px-6 py-4">{p.est} {currency}</td>
                  <td className="px-6 py-4">{p.validated !== null ? `${p.validated} ${currency}` : <span className="text-gray-400">-</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ST_MAP[p.status].class}`}>
                      {ST_MAP[p.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(p.paidOn || p.expected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- 3. Commission View (Ported from code.md) ---
function CommissionView({ data }: { data: any }) {
  if (!data.rates || data.rates.length === 0) {
    return <div className="text-center text-gray-500 py-10">لا توجد بيانات عمولة متاحة.</div>;
  }

  const currency = data.currency || "ج.م";
  const top = [...data.rates].sort((a: any, b: any) => b[1] - a[1])[0];
  const examplePrice = 1000;
  const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold mb-1">{data.ratesTitle || "نسب العمولة"}</h2>
          <p className="text-sm text-gray-500">نسبة عمولتك من سعر كل منتج يُباع من خلال رابطك، حسب فئة المنتج.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">الفئة</th>
                <th className="px-6 py-3 font-medium">نسبة عمولتك</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rates.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">{r[0]}</td>
                  <td className="px-6 py-4 font-bold text-teal-600">{pct(r[1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold mb-2">مثال</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          عند بيع منتج من فئة <span className="font-bold text-black">"{top[0]}"</span> بسعر {examplePrice} {currency} من خلال رابطك،
          تكون عمولتك <span className="font-bold text-teal-600">{examplePrice * top[1]} {currency}</span> ({pct(top[1])} من سعر المنتج).
        </p>
      </div>
    </div>
  );
}