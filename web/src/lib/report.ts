import Papa from "papaparse";

import { phonesMatch } from "./phone";

export interface ReportRow {
  date: string;
  trackingId: string;
  itemsOrdered: number;
  itemsShipped: number;
  orderedRevenue: number;
  itemsShippedRevenue: number;
  totalEarnings: number;
  clicks: number;
  [key: string]: any; 
}

export type PaymentRow = {
  trackingId: string;
  month: string;
  status: string;
  amount: number | null;
  expected: string;
  paid: string;
  note: string;
};

export type AccessRow = {
  name: string;
  email: string;
  trackingId: string;
  active: boolean;
};

export interface ReportSnapshot {
  rows: ReportRow[];
  fetchedAt: string;
  currency: string;
  rates: any[];
  payments: PaymentRow[];
  ratesTitle?: string;
}

const DEFAULT_SHEET_ID = "11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78";
const DEFAULT_GID = "1651395657";

const COL_DATE = ['datedate', 'date', 'report date'];
const COL_ORDERS = ['items_orderedtotal_items_ordered', 'items ordered', 'items_ordered'];
const COL_SALES = ['ordered_revenue', 'ordered revenue', 'ordered_revenuerevenue_generated_through_product_links'];
const COL_EARNINGS = ['total_earnings', 'total earnings', 'total_earningstotal_earnings'];
const COL_SHIPPED = ['items_shippeditems_shipped', 'items shipped', 'items_shipped'];
const COL_SHIPPED_SALES = ['items_shipped_revenueitems_shipped_revenue', 'items shipped revenue', 'items_shipped_revenue'];
const COL_CLICKS = ['clickstotal_number_of_clicks_on_your_amazon_associates_links', 'clicks'];

function sheetCsvUrl() {
  const id = process.env.SHEET_ID || DEFAULT_SHEET_ID;
  const gid = process.env.SHEET_GID || DEFAULT_GID;
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

async function fetchTab(
  tabName: string,
  options: { fresh?: boolean } = {},
): Promise<any[]> {
  const id = process.env.SHEET_ID || DEFAULT_SHEET_ID;
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(
    url,
    options.fresh
      ? { redirect: "follow", cache: "no-store" }
      : { redirect: "follow", next: { revalidate: 300 } },
  );

  if (!res.ok) {
    console.error(`Failed to fetch tab ${tabName}. HTTP: ${res.status}`);
    return [];
  }

  const text = await res.text();
  if (text.trim().startsWith("<!DOCTYPE")) {
    console.error(`Tab ${tabName} returned HTML (login page).`);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = (Papa as any).parse(text, {
    header: true,
    skipEmptyLines: true,
    bom: true,
  }) as { data: any[] };

  return parsed.data || [];
}

function pickValue(row: any, names: string[]): any {
  const keys = Object.keys(row);
  const key = keys.find((candidate) =>
    names.some((name) => candidate.toLowerCase().includes(name.toLowerCase())),
  );
  return key ? row[key] : "";
}

export async function fetchAccessRows(): Promise<AccessRow[]> {
  const rows = await fetchTab("Access", { fresh: true });

  return rows
    .map((row) => ({
      name: String(pickValue(row, ["Name", "الاسم"]) || "").trim(),
      email: String(pickValue(row, ["Email", "البريد"]) || "")
        .trim()
        .toLowerCase(),
      trackingId: String(
        pickValue(row, ["Tracking Id", "Tracking ID", "معرف التتبع"]) || "",
      ).trim(),
      active: /^(yes|true|1|active|نعم|نشط|فعال)$/i.test(
        String(pickValue(row, ["Active", "نشط"]) || "").trim(),
      ),
    }))
    .filter((row) => row.email);
}

function findCol(headers: string[], names: string[]): string | null {
  const lowerHeaders = headers.map(h => String(h || '').trim().toLowerCase());
  for (const name of names) {
    const idx = lowerHeaders.indexOf(name.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  for (const name of names) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (lowerHeaders[i].startsWith(name.toLowerCase())) return headers[i];
    }
  }
  return null;
}

function parseDateStr(dateStr: string): string {
  const s = String(dateStr || '').trim();
  const MON: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;

  m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;

  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})$/);
  if (m && MON[m[2].toLowerCase()]) {
    return `${m[3]}-${MON[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;
  }

  m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m && MON[m[1].toLowerCase()]) {
    return `${m[3]}-${MON[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}`;
  }

  return ''; 
}

export type LoginRow = {
  email: string;
  mobile: string;
  username: string;
  submittedAt: string;
};

const LOGIN_SHEET_ID =
  process.env.LOGIN_SHEET_ID || "19mcpmB9GmarXFNS9M0VtWpidrFh24DTA6EczCgH_lX4";
const LOGIN_SHEET_TAB = process.env.LOGIN_SHEET_TAB || "Submissions";

async function fetchLoginRows(): Promise<LoginRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${LOGIN_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(LOGIN_SHEET_TAB)}`;
  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Login sheet returned HTTP ${res.status}`);
  }

  const text = await res.text();
  if (text.trim().startsWith("<!DOCTYPE")) {
    throw new Error("Login sheet is not public.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = (Papa as any).parse(text, {
    header: true,
    skipEmptyLines: true,
    bom: true,
  }) as { data: any[] };

  return (parsed.data as any[]).map((row: any) => ({
    email: String(pickValue(row, ["Email", "البريد الإلكتروني"]) || "")
      .trim()
      .toLowerCase(),
    mobile: String(pickValue(row, ["Mobile", "رقم الهاتف", "Phone"]) || "")
      .trim(),
    username: String(
      pickValue(row, ["Full Name (EN)", "Full Name", "اسم"]) || "",
    )
      .trim(),
    submittedAt: String(pickValue(row, ["Submitted At", "Submitted"]) || "")
      .trim(),
  }));
}

function parseSubmittedAt(value: string): number {
  const s = value.trim();
  if (!s) return 0;
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return iso;

  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (m) {
    return Date.UTC(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0),
    );
  }
  return 0;
}

export async function findLoginRow(
  email: string,
  mobile: string,
): Promise<LoginRow | null> {
  const rows = await fetchLoginRows();
  const matches = rows
    .filter((row) => row.email === email && phonesMatch(row.mobile, mobile))
    .sort(
      (a, b) =>
        parseSubmittedAt(b.submittedAt) - parseSubmittedAt(a.submittedAt),
    );
  return matches[0] || null;
}

export async function loadReport(): Promise<ReportSnapshot> {
  const url = sheetCsvUrl();
  
  try {
    const [dataRes, paymentsData, commissionData] = await Promise.all([
      fetch(url, {
        redirect: "follow",
        next: { revalidate: 300 },
      }),
      fetchTab("Payments").catch(() => []),
      fetchTab("Commission").catch(() => []),
    ]);

    if (!dataRes.ok) throw new Error(`Google Sheets returned HTTP ${dataRes.status}`);

    const csvText = await dataRes.text();
    if (csvText.trim().startsWith('<!DOCTYPE')) throw new Error("Sheet is not public.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (Papa as any).parse(csvText, { header: true, skipEmptyLines: true, bom: true }) as { data: any[] };
    if (!parsed.data || parsed.data.length === 0) throw new Error("CSV is empty.");

    const headers = Object.keys(parsed.data[0]);
    
    const idKey = headers.find(h => h.trim().toLowerCase() === 'tracking id') || null;
    const dateKey = findCol(headers, COL_DATE);
    const ordersKey = findCol(headers, COL_ORDERS);
    const salesKey = findCol(headers, COL_SALES);
    const earningsKey = findCol(headers, COL_EARNINGS);
    const shippedKey = findCol(headers, COL_SHIPPED);
    const shippedSalesKey = findCol(headers, COL_SHIPPED_SALES);
    const clicksKey = findCol(headers, COL_CLICKS);

    if (!dateKey) throw new Error("Missing Date column");
    if (!earningsKey) throw new Error("Missing Earnings column");

    const INFLUENCER_SHARE = 0.5;
    const rows: ReportRow[] = [];

    parsed.data.forEach((row: any) => {
      const trackingId = idKey && row[idKey] ? String(row[idKey]).trim() : "unknown";
      const date = parseDateStr(row[dateKey]);
      if (!date) return; 

      const parseNum = (val: any) => {
        if (!val) return 0;
        const clean = String(val).replace(/[^0-9.-]/g, '');
        return Number(clean) || 0;
      };

      rows.push({
        date,
        trackingId,
        itemsOrdered: ordersKey ? parseNum(row[ordersKey]) : 0,
        itemsShipped: shippedKey ? parseNum(row[shippedKey]) : 0,
        orderedRevenue: salesKey ? parseNum(row[salesKey]) : 0,
        itemsShippedRevenue: shippedSalesKey ? parseNum(row[shippedSalesKey]) : 0,
        totalEarnings: parseNum(row[earningsKey]) * INFLUENCER_SHARE,
        clicks: clicksKey ? parseNum(row[clicksKey]) : 0,
      });
    });

    const payments: PaymentRow[] = paymentsData
      .map((row: any) => {
        const amountRaw = pickValue(row, ["Validated Amount", "المبلغ"]);

        return {
          trackingId: String(
            pickValue(row, ["Tracking Id", "Tracking ID"]) || "",
          )
            .trim()
            .toLowerCase(),
          month: String(
            pickValue(row, ["Month (YYYY-MM)", "Month", "الشهر"]) || "",
          ).trim(),
          status: String(pickValue(row, ["Status", "حالة"]) || "").trim(),
          amount: amountRaw
            ? Number(String(amountRaw).replace(/[^0-9.-]/g, ""))
            : null,
          expected: String(
            pickValue(row, ["Expected Payment Date", "موعد الدفع"]) || "",
          ).trim(),
          paid: String(
            pickValue(row, ["Paid Date", "تاريخ الدفع"]) || "",
          ).trim(),
          note: String(pickValue(row, ["Note", "ملاحظة"]) || "").trim(),
        };
      })
      .filter((payment) => payment.month); 

    const rates = commissionData.map((row: any) => {
      const keys = Object.keys(row);
      const getVal = (possibleNames: string[]) => {
        const k = keys.find(key => possibleNames.some(pn => key.toLowerCase().includes(pn.toLowerCase())));
        return k ? row[k] : '';
      };
      const cat = getVal(['Category (Arabic)', 'الفئة']);
      const rateStr = getVal(['Amazon Rate (used)', 'النسبة']);
      
      let rate = 0;
      if (rateStr) {
        rate = Number(String(rateStr).replace(/[^0-9.-]/g, ''));
        if (rate > 1) rate = rate / 100;
      }

      return [cat, rate * INFLUENCER_SHARE];
    }).filter(r => r[0] && r[1] > 0);

    return {
      rows,
      fetchedAt: new Date().toISOString(),
      currency: 'ج.م',
      rates: rates.length > 0 ? rates : [['أثاث', 0.14], ['ساعات', 0.128], ['الجمال', 0.08]], 
      payments: payments,
      ratesTitle: 'نسب العمولة',
    };
  } catch (error: any) {
    console.error("❌ FATAL ERROR IN LOAD REPORT:", error.message);
    throw error; 
  }
}