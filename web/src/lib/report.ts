import Papa from "papaparse";

export interface ReportRow {
  d: string;
  from: string;
  exact: boolean;
  w: number;
  trackingId: string;
  tracking: string;
  store: string;
  orders: number;
  shipped: number;
  sales: number;
  shippedSales: number;
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
const COL_SALES = ['ordered_revenue', 'ordered revenue', 'ordered_revenuerevenue_generated_through_product_links'];
const COL_EARNINGS = ['total_earnings', 'total earnings', 'total_earningstotal_earnings'];
const COL_SHIPPED = ['items_shippeditems_shipped', 'items shipped', 'items_shipped'];
const COL_SHIPPED_SALES = ['items_shipped_revenueitems_shipped_revenue', 'items shipped revenue', 'items_shipped_revenue'];

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

// Helper to get week number like Apps Script
function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
    
    const idKey = headers.find(h => h.trim().toLowerCase() === 'tracking id') || null;
    const dateKey = findCol(headers, COL_DATE);
    const ordersKey = findCol(headers, COL_ORDERS);
    const salesKey = findCol(headers, COL_SALES);
    const earningsKey = findCol(headers, COL_EARNINGS);
    const shippedKey = findCol(headers, COL_SHIPPED);
    const shippedSalesKey = findCol(headers, COL_SHIPPED_SALES);

    if (!dateKey) throw new Error("Missing Date column");
    if (!earningsKey) throw new Error("Missing Earnings column");

    const INFLUENCER_SHARE = 0.5;
    const rows: ReportRow[] = [];

    parsed.data.forEach((row: any) => {
      const trackingId = idKey && row[idKey] ? String(row[idKey]).trim() : "unknown";
      const d = parseDateStr(row[dateKey]);
      if (!d) return; 

      const parseNum = (val: any) => {
        if (!val) return 0;
        const clean = String(val).replace(/[^0-9.-]/g, '');
        return Number(clean) || 0;
      };

      const dateObj = new Date(d + "T12:00:00Z");

      rows.push({
        d,
        from: d, // Required by metrics.ts
        exact: true,
        w: getWeekNumber(dateObj),
        trackingId,
        tracking: trackingId, // Alias in case metrics.ts uses this name
        store: trackingId,    // Alias in case metrics.ts uses this name
        orders: ordersKey ? parseNum(row[ordersKey]) : 0,
        shipped: shippedKey ? parseNum(row[shippedKey]) : 0,
        sales: salesKey ? parseNum(row[salesKey]) : 0,
        shippedSales: shippedSalesKey ? parseNum(row[shippedSalesKey]) : 0,
        earnings: parseNum(row[earningsKey]) * INFLUENCER_SHARE,
      });
    });

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