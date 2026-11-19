export const DEFAULT_SHEET_ID =
  "11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78";
export const DEFAULT_GID = "1651395657";

const SHEET_ID = process.env.SHEET_ID?.trim() || DEFAULT_SHEET_ID;
const SHEET_GID = process.env.SHEET_GID?.trim() || DEFAULT_GID;

export function sheetCsvUrl(): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
}

export type ReportRow = {
  trackingId: string;
  scraperOrder: string;
  date: string; // YYYY-MM-DD
  dateLabel: string; // 17 Nov 2026
  itemsOrdered: number;
  productConversion: number | null; // percent value, e.g. 137.5
  orderedRevenue: number; // EGP
  commissionRate: number | null; // percent value
  itemsShipped: number;
  itemsShippedRevenue: number;
  itemsShippedEarnings: number;
  totalEarnings: number;
  clicks: number;
  returnedRevenue: number;
  returnedEarnings: number;
  returnedItems: number;
};

export type ReportSnapshot = {
  rows: ReportRow[];
  fetchedAt: string;
  rawRowCount: number;
  skippedRowCount: number;
  dedupedRowCount: number;
  source: { sheetId: string; gid: string; url: string };
};

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * The report is an Amazon Associates CSV pasted into a Google Sheets tab, so
 * headers arrive doubled ("datedate", "total_earningstotal_earnings"). Normalise
 * before matching, and keep explicit aliases for the variants we have seen.
 */
const COLUMNS = {
  trackingId: ["trackingid"],
  scraperOrder: ["webscraperorder"],
  date: ["datedate", "date"],
  itemsOrdered: ["itemsorderedtotalitemsordered", "itemsordered"],
  productConversion: [
    "productconversionrateproductlinkconversion",
    "productconversionrate",
  ],
  orderedRevenue: [
    "orderedrevenuerevenuegeneratedthroughproductlinks",
    "orderedrevenue",
  ],
  commissionRate: ["commissionratecommissionrate", "commissionrate"],
  itemsShipped: ["itemsshippeditemsshipped", "itemsshipped"],
  itemsShippedRevenue: [
    "itemsshippedrevenueitemsshippedrevenue",
    "itemsshippedrevenue",
  ],
  itemsShippedEarnings: [
    "itemsshippedearningsitemsshippedearnings",
    "itemsshippedearnings",
  ],
  totalEarnings: ["totalearningstotalearnings", "totalearnings"],
  clicks: [
    "clickstotalnumberofclicksonyouramazonassociateslinks",
    "clickstotal",
    "clicks",
  ],
  returnedRevenue: [
    "itemsreturnedrevenueitemsreturnedrevenue",
    "itemsreturnedrevenue",
  ],
  returnedEarnings: [
    "itemsreturnedearningsitemsreturnedearnings",
    "itemsreturnedearnings",
  ],
  returnedItems: [
    "itemsreturnedtotalnumberofreturneditems",
    "itemsreturned",
  ],
} as const;

type ColumnKey = keyof typeof COLUMNS;

const REQUIRED: ColumnKey[] = [
  "trackingId",
  "date",
  "itemsOrdered",
  "orderedRevenue",
  "totalEarnings",
  "clicks",
];

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function locateColumns(headers: string[]): Partial<Record<ColumnKey, number>> {
  const normalized = headers.map(normalizeHeader);
  const index: Partial<Record<ColumnKey, number>> = {};

  for (const key of Object.keys(COLUMNS) as ColumnKey[]) {
    for (const alias of COLUMNS[key]) {
      const found = normalized.indexOf(alias);
      if (found >= 0) {
        index[key] = found;
        break;
      }
    }
  }

  return index;
}

function readCell(
  row: string[],
  index: Partial<Record<ColumnKey, number>>,
  key: ColumnKey,
): string {
  const at = index[key];
  return at === undefined ? "" : (row[at] ?? "").trim();
}

export function parseNumber(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseReportDate(
  value: string,
): { iso: string; label: string } | null {
  const trimmed = value.trim();

  const dayFirst = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = MONTHS[dayFirst[2].slice(0, 3).toLowerCase()];
    const year = Number(dayFirst[3]);
    if (month === undefined || day < 1 || day > 31) return null;
    return {
      iso: `${year}-${pad(month + 1)}-${pad(day)}`,
      label: `${day} ${MONTH_LABELS[month]} ${year}`,
    };
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return {
      iso: `${year}-${pad(month)}-${pad(day)}`,
      label: `${day} ${MONTH_LABELS[month - 1]} ${year}`,
    };
  }

  return null;
}

function orderRank(order: string): [number, number] {
  const match = order.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  if (!match) return [-1, -1];
  return [Number(match[1]), Number(match[2])];
}

function compareOrder(a: string, b: string): number {
  const [aRun, aStep] = orderRank(a);
  const [bRun, bStep] = orderRank(b);
  if (aRun !== bRun) return aRun - bRun;
  return aStep - bStep;
}

/** RFC 4180-ish parser: handles quoted fields, embedded commas, and "" escapes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((cell) => cell.trim() !== ""));
}

function toRow(
  cells: string[],
  index: Partial<Record<ColumnKey, number>>,
): ReportRow | null {
  const trackingId = readCell(cells, index, "trackingId");
  const parsedDate = parseReportDate(readCell(cells, index, "date"));
  if (!trackingId || !parsedDate) return null;

  const number = (key: ColumnKey) =>
    parseNumber(readCell(cells, index, key)) ?? 0;

  return {
    trackingId,
    scraperOrder: readCell(cells, index, "scraperOrder"),
    date: parsedDate.iso,
    dateLabel: parsedDate.label,
    itemsOrdered: number("itemsOrdered"),
    productConversion: parseNumber(readCell(cells, index, "productConversion")),
    orderedRevenue: number("orderedRevenue"),
    commissionRate: parseNumber(readCell(cells, index, "commissionRate")),
    itemsShipped: number("itemsShipped"),
    itemsShippedRevenue: number("itemsShippedRevenue"),
    itemsShippedEarnings: number("itemsShippedEarnings"),
    totalEarnings: number("totalEarnings"),
    clicks: number("clicks"),
    returnedRevenue: number("returnedRevenue"),
    returnedEarnings: number("returnedEarnings"),
    returnedItems: number("returnedItems"),
  };
}

export async function loadReport(): Promise<ReportSnapshot> {
  const url = sheetCsvUrl();

  const response = await fetch(url, {
    next: { revalidate: 300 },
    headers: { "user-agent": "TrendireDashboard/0.1 (local prototype)" },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets returned HTTP ${response.status}.`);
  }

  const text = await response.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      "Google Sheets returned a sign-in or error page instead of CSV. The data tab must be readable by anyone with the link.",
    );
  }

  const dateHeader = response.headers.get("date");
  const fetchedAt = dateHeader
    ? new Date(dateHeader).toISOString()
    : new Date().toISOString();

  const table = parseCsv(text);
  if (table.length === 0) {
    throw new Error("The data tab is empty.");
  }

  const [header, ...body] = table;
  const index = locateColumns(header);
  const missing = REQUIRED.filter((key) => index[key] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `The data tab is missing required columns: ${missing.join(", ")}. Found headers: ${header.join(" | ")}`,
    );
  }

  const skipped = body.filter(
    (cells) => toRow(cells, index) === null,
  ).length;

  const parsedRows = body
    .map((cells) => toRow(cells, index))
    .filter((row): row is ReportRow => row !== null);

  /**
   * If the scraper appends the same (date, tracking ID) repeatedly, keep the
   * newest run rather than summing duplicates. Order comes from
   * web_scraper_order ("1795013468-5"); when absent, later rows win.
   */
  const deduped = new Map<string, ReportRow>();
  for (const row of parsedRows) {
    const key = `${row.date}|${row.trackingId}`;
    const existing = deduped.get(key);
    if (!existing || compareOrder(row.scraperOrder, existing.scraperOrder) >= 0) {
      deduped.set(key, row);
    }
  }

  const rows = [...deduped.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.trackingId.localeCompare(b.trackingId);
  });

  return {
    rows,
    fetchedAt,
    rawRowCount: body.length,
    skippedRowCount: skipped,
    dedupedRowCount: parsedRows.length - rows.length,
    source: { sheetId: SHEET_ID, gid: SHEET_GID, url },
  };
}
