import Papa from 'papaparse';

const SHEET_ID = '11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78'; // Replace with your ID

// Helper to fetch a specific tab as CSV and parse it
async function fetchTab(tabName: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url, { next: { revalidate: 60 } }); // Cache for 60 seconds
  if (!res.ok) throw new Error(`Failed to fetch ${tabName}`);
  const csvText = await res.text();
  
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return parsed.data as any[];
}

export async function getDashboardData() {
  // 1. Fetch all 3 tabs in parallel
  const [dataRows, commissionRows, paymentRows] = await Promise.all([
    fetchTab('Data'),
    fetchTab('Commission'),
    fetchTab('Payments')
  ]);

  // --- MIMICKING THE APPS SCRIPT LOGIC ---
  const INFLUENCER_SHARE = 0.5; 

  // We need to map the raw CSV data into the format your UI expects.
  // This mimics the readData() and periods() functions from code.md.
  const byDate: Record<string, any> = {};
  let dataTo = '';

  dataRows.forEach((row) => {
    // Find the exact column names (since headers in CSV might have slight variations)
    const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('datedate') || k.toLowerCase() === 'date');
    const earningsKey = Object.keys(row).find(k => k.toLowerCase().includes('total_earnings'));
    const ordersKey = Object.keys(row).find(k => k.toLowerCase().includes('items_ordered'));
    const salesKey = Object.keys(row).find(k => k.toLowerCase().includes('ordered_revenue'));

    if (!dateKey || !row[dateKey]) return;
    
    const dateStr = row[dateKey]; // e.g., "11-15-2026"
    // Parse date to YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length !== 3) return; // Skip "Total" or invalid rows
    const d = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    
    if (d > dataTo) dataTo = d;

    if (!byDate[d]) {
      byDate[d] = { d, orders: 0, sales: 0, earnings: 0 };
    }

    // Sum up the values
    byDate[d].orders += Number(row[ordersKey!]?.replace(/,/g, '') || 0);
    byDate[d].sales += Number(row[salesKey!]?.replace(/,/g, '') || 0);
    byDate[d].earnings += Number(row[earningsKey!]?.replace(/,/g, '') || 0);
  });

  // Convert to sorted array and apply influencer share
  const days = Object.values(byDate)
    .sort((a, b) => a.d.localeCompare(b.d))
    .map(day => ({
      ...day,
      earnings: day.earnings * INFLUENCER_SHARE // 50% share
    }));

  // 2. Process Commission Tab
  const rates = commissionRows.map(row => {
    const cat = row['Category (Arabic)'];
    const rate = Number(row['Amazon Rate (used)'] || 0) * INFLUENCER_SHARE;
    return [cat, rate];
  }).filter(r => r[0]);

  // 3. Process Payments Tab (mimicking paymentRows())
  const payments = paymentRows.map(row => {
    return [
      row['Month (YYYY-MM)'],
      row['Status'],
      row['Validated Amount'] ? Number(row['Validated Amount']) : null,
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
    ratesTitle: 'نسب العمولة', // Can be hardcoded or pulled from a cell
    payments,
    payRules: { vFrom: 30, vTo: 60, payMin: 60 }
  };
}