import type { ReportRow } from "./report";
import { addDays, monthEnd } from "./format";

export type MetricKey =
  | "orders"
  | "shipped"
  | "sales"
  | "shippedSales"
  | "earnings";

export type MetricDef = {
  key: MetricKey;
  money: boolean;
};

export const METRICS: MetricDef[] = [
  { key: "orders", money: false },
  { key: "shipped", money: false },
  { key: "sales", money: true },
  { key: "shippedSales", money: true },
  { key: "earnings", money: true },
];

export type Totals = {
  orders: number;
  shipped: number;
  sales: number;
  shippedSales: number;
  earnings: number;
  clicks: number;
  rows: number;
  days: number;
  firstDate: string | null;
  lastDate: string | null;
};

const EMPTY: Totals = {
  orders: 0,
  shipped: 0,
  sales: 0,
  shippedSales: 0,
  earnings: 0,
  clicks: 0,
  rows: 0,
  days: 0,
  firstDate: null,
  lastDate: null,
};

export function totals(rows: ReportRow[]): Totals {
  if (rows.length === 0) return { ...EMPTY };

  const sum = rows.reduce(
    (acc, row) => {
      acc.orders += row.itemsOrdered;
      acc.shipped += row.itemsShipped;
      acc.sales += row.orderedRevenue;
      acc.shippedSales += row.itemsShippedRevenue;
      acc.earnings += row.totalEarnings;
      acc.clicks += row.clicks;
      return acc;
    },
    {
      orders: 0,
      shipped: 0,
      sales: 0,
      shippedSales: 0,
      earnings: 0,
      clicks: 0,
    },
  );

  const dates = [...new Set(rows.map((row) => row.date))].sort();

  return {
    ...sum,
    rows: rows.length,
    days: dates.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  };
}

export type DailyPoint = {
  date: string;
  orders: number;
  shipped: number;
  sales: number;
  shippedSales: number;
  earnings: number;
  clicks: number;
};

export function dailySeries(rows: ReportRow[]): DailyPoint[] {
  const days = new Map<string, DailyPoint>();

  for (const row of rows) {
    const point = days.get(row.date) ?? {
      date: row.date,
      orders: 0,
      shipped: 0,
      sales: 0,
      shippedSales: 0,
      earnings: 0,
      clicks: 0,
    };

    point.orders += row.itemsOrdered;
    point.shipped += row.itemsShipped;
    point.sales += row.orderedRevenue;
    point.shippedSales += row.itemsShippedRevenue;
    point.earnings += row.totalEarnings;
    point.clicks += row.clicks;
    days.set(row.date, point);
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function latestDate(rows: ReportRow[]): string | null {
  let latest: string | null = null;
  for (const row of rows) {
    if (!latest || row.date > latest) latest = row.date;
  }
  return latest;
}

export type RangeKey = "mtd" | "7d" | "all";

export function parseRange(value: string | undefined): RangeKey {
  if (value === "7d") return "7d";
  if (value === "all") return "all";
  return "mtd";
}

export type Selection = {
  current: ReportRow[];
  previous: ReportRow[];
  start: string;
  end: string;
};

export function selectRange(rows: ReportRow[], range: RangeKey): Selection {
  const end = latestDate(rows);
  if (!end) {
    return { current: [], previous: [], start: "", end: "" };
  }

  if (range === "all") {
    return { current: rows, previous: [], start: rows[0].date, end };
  }

  if (range === "7d") {
    const start = addDays(end, -6);
    const previousEnd = addDays(start, -1);
    const previousStart = addDays(previousEnd, -6);
    return {
      current: rows.filter((row) => row.date >= start && row.date <= end),
      previous: rows.filter(
        (row) => row.date >= previousStart && row.date <= previousEnd,
      ),
      start,
      end,
    };
  }

  const start = `${end.slice(0, 7)}-01`;
  const previousMonthEnd = addDays(start, -1);
  const previousMonthStart = `${previousMonthEnd.slice(0, 7)}-01`;
  const sameDay = Math.min(
    Number(end.slice(8, 10)),
    Number(previousMonthEnd.slice(8, 10)),
  );
  const previousEnd = `${previousMonthEnd.slice(0, 7)}-${String(
    sameDay,
  ).padStart(2, "0")}`;

  return {
    current: rows.filter((row) => row.date >= start && row.date <= end),
    previous: rows.filter(
      (row) => row.date >= previousMonthStart && row.date <= previousEnd,
    ),
    start,
    end,
  };
}

export function delta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function isoWeekInfo(iso: string): { year: number; week: number } {
  const date = new Date(`${iso}T00:00:00Z`);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(
    ((date.getTime() - yearStart) / 86_400_000 + 1) / 7,
  );
  return { year, week };
}

export type WeekSummary = {
  key: string;
  week: number;
  start: string;
  end: string;
  orders: number;
  shipped: number;
  sales: number;
  shippedSales: number;
  earnings: number;
};

export function weeklySeries(rows: ReportRow[]): WeekSummary[] {
  const weeks = new Map<
    string,
    Omit<WeekSummary, "start" | "end"> & { first: string; last: string }
  >();

  for (const row of rows) {
    const { year, week } = isoWeekInfo(row.date);
    const key = `${year}-${week}`;
    const entry = weeks.get(key) ?? {
      key,
      week,
      first: row.date,
      last: row.date,
      orders: 0,
      shipped: 0,
      sales: 0,
      shippedSales: 0,
      earnings: 0,
    };

    entry.orders += row.itemsOrdered;
    entry.shipped += row.itemsShipped;
    entry.sales += row.orderedRevenue;
    entry.shippedSales += row.itemsShippedRevenue;
    entry.earnings += row.totalEarnings;
    if (row.date < entry.first) entry.first = row.date;
    if (row.date > entry.last) entry.last = row.date;
    weeks.set(key, entry);
  }

  return [...weeks.values()]
    .sort((a, b) => a.first.localeCompare(b.first))
    .map(({ first, last, ...entry }) => ({
      ...entry,
      start: first,
      end: last,
    }));
}

export type MonthSummary = {
  key: string;
  start: string;
  end: string;
  monthEnd: string;
  orders: number;
  shipped: number;
  sales: number;
  shippedSales: number;
  earnings: number;
};

export function monthlySeries(rows: ReportRow[]): MonthSummary[] {
  const months = new Map<
    string,
    Omit<MonthSummary, "start" | "end" | "monthEnd"> & {
      first: string;
      last: string;
    }
  >();

  for (const row of rows) {
    const key = row.date.slice(0, 7);
    const entry = months.get(key) ?? {
      key,
      first: row.date,
      last: row.date,
      orders: 0,
      shipped: 0,
      sales: 0,
      shippedSales: 0,
      earnings: 0,
    };

    entry.orders += row.itemsOrdered;
    entry.shipped += row.itemsShipped;
    entry.sales += row.orderedRevenue;
    entry.shippedSales += row.itemsShippedRevenue;
    entry.earnings += row.totalEarnings;
    if (row.date < entry.first) entry.first = row.date;
    if (row.date > entry.last) entry.last = row.date;
    months.set(key, entry);
  }

  return [...months.values()]
    .sort((a, b) => a.first.localeCompare(b.first))
    .map(({ first, last, ...entry }) => ({
      ...entry,
      start: first,
      end: last,
      monthEnd: monthEnd(`${entry.key}-01`),
    }));
}

export type TrackingSummary = {
  id: string;
  orders: number;
  clicks: number;
  sales: number;
  earnings: number;
};

export function trackingSeries(rows: ReportRow[]): TrackingSummary[] {
  const groups = new Map<string, TrackingSummary>();

  for (const row of rows) {
    const group = groups.get(row.trackingId) ?? {
      id: row.trackingId,
      orders: 0,
      clicks: 0,
      sales: 0,
      earnings: 0,
    };

    group.orders += row.itemsOrdered;
    group.clicks += row.clicks;
    group.sales += row.orderedRevenue;
    group.earnings += row.totalEarnings;
    groups.set(row.trackingId, group);
  }

  return [...groups.values()].sort(
    (a, b) => b.earnings - a.earnings || b.sales - a.sales,
  );
}
