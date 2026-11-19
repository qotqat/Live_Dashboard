import { NextResponse } from 'next/server';
import { loadReport } from '@/lib/report'; // or '../../../lib/report' if alias fails

export async function GET() {
  try {
    const data = await loadReport();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}