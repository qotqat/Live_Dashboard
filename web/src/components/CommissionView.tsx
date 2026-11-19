"use client";
import React from "react";

export default function CommissionView({ data }: { data: any }) {
  if (!data || !data.rates || data.rates.length === 0) return null;

  const currency = data.currency || "ج.م";
  
  // Sort by highest rate for the example
  const top = [...data.rates].sort((a, b) => b[1] - a[1])[0];
  const examplePrice = 1000;

  // Format percentage
  const pct = (r: number) => `${(Math.round(r * 1000) / 10)}%`;

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold mb-1">{data.ratesTitle || "نسب العمولة"}</h2>
        <p className="text-sm text-gray-500 mb-4">نسبة عمولتك من سعر كل منتج يُباع من خلال رابطك، حسب فئة المنتج.</p>
        
        <table className="w-full text-sm text-right">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="pb-2">الفئة</th>
              <th className="pb-2">نسبة عمولتك</th>
            </tr>
          </thead>
          <tbody>
            {data.rates.map((r: any, i: number) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2">{r[0]}</td>
                <td className="py-2 font-semibold text-teal-600">{pct(r[1])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold mb-2">مثال</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          عند بيع منتج من فئة <span className="font-bold text-black">"{top[0]}"</span> بسعر {examplePrice} {currency} من خلال رابطك، 
          تكون عمولتك <span className="font-bold text-teal-600">{examplePrice * top[1]} {currency}</span> ({pct(top[1])} من سعر المنتج).
        </p>
      </div>
    </div>
  );
}