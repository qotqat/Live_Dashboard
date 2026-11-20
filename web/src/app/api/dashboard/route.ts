import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { loadReport } from "@/lib/report";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const snapshot = await loadReport();
    const trackingId = user.trackingId.trim().toLowerCase();

    const rows = snapshot.rows.filter(
      (row) => row.trackingId.trim().toLowerCase() === trackingId,
    );
    const payments = snapshot.payments.filter(
      (payment) => payment.trackingId.trim().toLowerCase() === trackingId,
    );

    return NextResponse.json({ ...snapshot, rows, payments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown loading error.";
    console.error("API Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
