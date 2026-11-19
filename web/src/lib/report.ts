import Papa from "papaparse";

export interface ReportRow {
  d: string;
  orders: number;
  sales: number;
  earnings: number;
  [key: string]: any; 
}

export interface ReportSnapshot {
  rows: ReportRow[];
  fetchedAt: string;
  currency: string;
  rates: any[];
  payments: any[];
  ratesTitle?: string;
}

const DEFAULT_SHEET_ID = "11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78";
const DEFAULT_GID = "1651395657";

const COL_DATE = ['datedate', 'date', 'report date'];
const COL_ORDERS = ['items_orderedtotal_items_ordered', 'items ordered', 'items_ordered'];
const COL_SALES = ['ordered_revenue', 'ordered revenue'];
const COL_EARNINGS = ['total_earnings', 'total earnings'];

function sheetCsvUrl() {
  const id = process.env.SHEET_ID || DEFAULT_SHEET_ID;
  const gid = process.env.SHEET_GID || DEFAULT_GID;
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
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
  let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  
  m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`; 
  
  return ''; 
}

export async function loadReport(): Promise<ReportSnapshot> {
  const url = sheetCsvUrl();
  
  try {
    const res = await fetch(url, { redirect: 'follow', cache: 'no-store' });
    if (!res.ok) throw new Error(`Google Sheets returned HTTP ${res.status}`);

    const csvText = await res.text();
    if (csvText.trim().startsWith('<!DOCTYPE')) throw new Error("Sheet is not public.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (Papa as any).parse(csvText, { header: true, skipEmptyLines: true, bom: true }) as { data: any[] };
    if (!parsed.data || parsed.data.length === 0) throw new Error("CSV is empty.");

    const headers = Object.keys(parsed.data[0]);
    const dateKey = findCol(headers, COL_DATE);
    const ordersKey = findCol(headers, COL_ORDERS);
    const salesKey = findCol(headers, COL_SALES);
    const earningsKey = findCol(headers, COL_EARNINGS);

    if (!dateKey || !earningsKey) throw new Error(`Missing columns.`);

    const INFLUENCER_SHARE = 0.5;
    const byDate: Record<string, ReportRow> = {};

    parsed.data.forEach((row: any) => {
      if (!row[dateKey]) return;
      const d = parseDateStr(row[dateKey]);
      if (!d) return; 

      if (!byDate[d]) byDate[d] = { d, orders: 0, sales: 0, earnings: 0 };
      const parseNum = (val: any) => Number(String(val || '0').replace(/[^0-9.-]/g, '')) || 0;

      if (ordersKey) byDate[d].orders += parseNum(row[ordersKey]);
      if (salesKey) byDate[d].sales += parseNum(row[salesKey]);
      if (earningsKey) byDate[d].earnings += parseNum(row[earningsKey]);
    });

    const rows = Object.values(byDate)
      .sort((a, b) => a.d.localeCompare(b.d))
      .map(day => ({ ...day, earnings: day.earnings * INFLUENCER_SHARE }));

    return {
      rows,
      fetchedAt: new Date().toISOString(),
      currency: 'ج.م',
      rates: [['أثاث', 0.14], ['ساعات', 0.128], ['الجمال', 0.08]], 
      payments: [],
      ratesTitle: 'نسب العمولة',
    };
  } catch (error: any) {
    console.error("❌ FATAL ERROR IN LOAD REPORT:", error.message);
    throw error; 
  }
}