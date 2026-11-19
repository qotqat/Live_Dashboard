import Papa from "papaparse";

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
const COL_CLICKS = ['clickstotal_number_of_clicks_on_your_amazon_associates_links', 'clicks'];

function sheetCsvUrl() {
  const id = process.env.SHEET_ID || DEFAULT_SHEET_ID;
  const gid = process.env.SHEET_GID || DEFAULT_GID;
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

async function fetchTab(tabName: string): Promise<any[]> {
  const id = process.env.SHEET_ID || DEFAULT_SHEET_ID;
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url, { redirect: 'follow', cache: 'no-store' });
  
  if (!res.ok) {
    console.error(`Failed to fetch tab ${tabName}. HTTP: ${res.status}`);
    return [];
  }
  
  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE')) {
    console.error(`Tab ${tabName} returned HTML (login page).`);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = (Papa as any).parse(text, { header: true, skipEmptyLines: true, bom: true }) as { data: any[] };
  
  // LOG WHAT WE FOUND
  if (tabName === 'Payments') {
    console.log("=== RAW PAYMENTS TAB DATA ===", parsed.data);
  }

  return parsed.data || [];
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

export async function loadReport(): Promise<ReportSnapshot> {
  const url = sheetCsvUrl();
  
  try {
    const [dataRes, paymentsData, commissionData] = await Promise.all([
      fetch(url, { redirect: 'follow', cache: 'no-store' }),
      fetchTab('Payments').catch(() => []),
      fetchTab('Commission').catch(() => [])
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

    const payments = paymentsData.map((row: any) => {
      const keys = Object.keys(row);
      const getVal = (possibleNames: string[]) => {
        const k = keys.find(key => possibleNames.some(pn => key.toLowerCase().includes(pn.toLowerCase())));
        return k ? row[k] : '';
      };
      
      const monthStr = getVal(['Month (YYYY-MM)', 'month']);
      const status = getVal(['Status', 'حالة']);
      const valAmtStr = getVal(['Validated Amount', 'المبلغ']);
      const expDate = getVal(['Expected Payment Date', 'موعد الدفع']);
      const paidDate = getVal(['Paid Date', 'تاريخ الدفع']);
      const note = getVal(['Note', 'ملاحظة']);

      return [
        monthStr,
        status,
        valAmtStr ? Number(String(valAmtStr).replace(/[^0-9.-]/g, '')) : null,
        expDate,
        paidDate,
        note
      ];
    }).filter(p => p[0]); 

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