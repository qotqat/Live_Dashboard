import Papa from 'papaparse';

const SHEET_ID = '11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78'; // Replace with your ID

// Helper to fetch a specific tab as CSV and parse it
async function fetchTab(tabName: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  
  // Removed caching so we see fresh errors immediately
  const res = await fetch(url, { cache: 'no-store' }); 
  
  if (!res.ok) {
    throw new Error(`Failed to fetch tab "${tabName}". Status: ${res.status}`);
  }
  
  const csvText = await res.text();
  
  // If Google returns an HTML login page instead of CSV, it will start with <!DOCTYPE
  if (csvText.trim().startsWith('<!DOCTYPE')) {
    throw new Error(`Tab "${tabName}" is not public. Google returned an HTML login page.`);
  }

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  
  if (parsed.errors && parsed.errors.length > 0) {
    console.error(`Parse errors in ${tabName}:`, parsed.errors);
  }

  return parsed.data as any[];
}

export async function getDashboardData() {
  try {
    const [dataRows, commissionRows, paymentRows] = await Promise.all([
      fetchTab('Data'),
      fetchTab('Commission'),
      fetchTab('Payments')
    ]);

    if (dataRows.length === 0) throw new Error("Data tab is empty");

    // Log the headers so we can see exactly what Google is sending
    console.log("DATA TAB HEADERS:", Object.keys(dataRows[0]));

    const INFLUENCER_SHARE = 0.5; 
    const byDate: Record<string, any> = {};
    let dataTo = '';

    dataRows.forEach((row) => {
      // Find headers safely
      const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('datedate') || k.toLowerCase() === 'date');
      const earningsKey = Object.keys(row).find(k => k.toLowerCase().includes('total_earnings'));
      const ordersKey = Object.keys(row).find(k => k.toLowerCase().includes('items_ordered'));
      const salesKey = Object.keys(row).find(k => k.toLowerCase().includes('ordered_revenue'));

      // Skip if no date or date is invalid (like "Total")
      if (!dateKey || !row[dateKey]) return;
      const dateStr = String(row[dateKey]).trim();
      if (!dateStr.includes('-') && !dateStr.includes('/')) return; 

      const parts = dateStr.split(/[-/]/);
      if (parts.length !== 3) return; 
      
      // Handle MDY format
      const d = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      if (d > dataTo) dataTo = d;

      if (!byDate[d]) {
        byDate[d] = { d, orders: 0, sales: 0, earnings: 0 };
      }

      // Safely parse numbers. If column is missing, use '0'
      const parseNum = (val: any) => Number(String(val || '0').replace(/,/g, '')) || 0;

      byDate[d].orders += parseNum(row[ordersKey!]);
      byDate[d].sales += parseNum(row[salesKey!]);
      byDate[d].earnings += parseNum(row[earningsKey!]);
    });

    const days = Object.values(byDate)
      .sort((a, b) => a.d.localeCompare(b.d))
      .map(day => ({
        ...day,
        earnings: day.earnings * INFLUENCER_SHARE 
      }));

    // Process Commission
    const rates = commissionRows.map(row => {
      const cat = row['Category (Arabic)'];
      const rate = Number(String(row['Amazon Rate (used)'] || '0').replace('%', '')) / 100 * INFLUENCER_SHARE;
      return [cat, rate];
    }).filter(r => r[0]);

    // Process Payments
    const payments = paymentRows.map(row => {
      return [
        row['Month (YYYY-MM)'],
        row['Status'],
        row['Validated Amount'] ? Number(String(row['Validated Amount']).replace(/,/g, '')) : null,
        row['Expected Payment Date'],
        row['Paid Date'],
        row['Note']
      ];
    });

    return {
      ok: true,
      currency: 'ج.م',
      dataTo: dataTo || new Date().toISOString().slice(0, 10),
      days,
      rates,
      ratesTitle: 'نسب العمولة',
      payments,
      payRules: { vFrom: 30, vTo: 60, payMin: 60 }
    };
  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error.message);
    throw error; // Re-throw so the API route can catch it
  }
}