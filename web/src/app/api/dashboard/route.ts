import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to read Google Sheet:", error);
    return NextResponse.json({ error: "Failed to load data from Google Sheets" }, { status: 500 });
  }
}