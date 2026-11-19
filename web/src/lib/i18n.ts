import type { MetricKey } from "./metrics";

export type Locale = "en" | "ar";

export const DEFAULT_LOCALE: Locale = "ar";

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "ar";
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Replace {placeholders} in a translated string. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  brand: {
    title: string;
    subtitle: string;
  };
  live: string;
  offline: string;
  language: {
    switchLabel: string;
    switchAria: string;
  };
  hero: {
    title: string;
    sub: string;
    asOf: string;
    noData: string;
  };
  ranges: {
    label: string;
    mtd: string;
    d7: string;
    all: string;
  };
  range: string;
  metrics: Record<MetricKey, string>;
  comparedTo: string;
  chart: {
    title: string;
    metricAria: string;
    empty: string;
    tooltip: string;
  };
  daily: {
    title: string;
    empty: string;
    date: string;
    total: string;
  };
  weekly: {
    title: string;
    empty: string;
    column: string;
    week: string;
    last12: string;
  };
  monthly: {
    title: string;
    empty: string;
    month: string;
    total: string;
    toDate: string;
  };
  tracking: {
    title: string;
    sub: string;
    empty: string;
    id: string;
    orders: string;
    clicks: string;
    sales: string;
    earnings: string;
    share: string;
  };
  footer: {
    source: string;
    basis: string;
  };
  errors: {
    loadTitle: string;
    sheetUnavailable: string;
    emptyTitle: string;
    emptyBody: string;
  };
};

const en: Dictionary = {
  meta: {
    title: "Influencer Earnings | Amazon Egypt",
    description:
      "Live Amazon Egypt earnings, sales and orders for Trendire Group tracking IDs.",
  },
  brand: {
    title: "Influencer Earnings",
    subtitle: "Amazon Egypt",
  },
  live: "Live",
  offline: "Offline",
  language: {
    switchLabel: "العربية",
    switchAria: "Switch to Arabic",
  },
  hero: {
    title: "Earnings and sales at a glance",
    sub: "Combined view across every tracking ID in the data tab.",
    asOf: "Data updated to {date}",
    noData: "No data yet",
  },
  ranges: {
    label: "Period",
    mtd: "This month",
    d7: "Last 7 days",
    all: "All time",
  },
  range: "From {start} to {end}",
  metrics: {
    orders: "Orders",
    shipped: "Shipped orders",
    sales: "Sales",
    shippedSales: "Shipped sales",
    earnings: "Earnings",
  },
  comparedTo: "vs previous period",
  chart: {
    title: "Daily performance",
    metricAria: "Metric",
    empty: "No data for this period.",
    tooltip: "{date}: {value}",
  },
  daily: {
    title: "Daily detail",
    empty: "No data for this period.",
    date: "Date",
    total: "Total",
  },
  weekly: {
    title: "Weekly summary",
    empty: "No weekly data yet.",
    column: "Week",
    week: "Week {week}",
    last12: "Showing the last 12 weeks.",
  },
  monthly: {
    title: "Monthly summary",
    empty: "No monthly data yet.",
    month: "Month",
    total: "Total",
    toDate: "(to {date})",
  },
  tracking: {
    title: "By tracking ID",
    sub: "Distribution for the selected period.",
    empty: "No tracking IDs in this period.",
    id: "Tracking ID",
    orders: "Orders",
    clicks: "Clicks",
    sales: "Sales",
    earnings: "Earnings",
    share: "Share",
  },
  footer: {
    source:
      "Source: the data tab in Google Sheets · checked every 5 minutes · amounts in Egyptian pounds (EGP)",
    basis: "Earnings shown are Amazon's total commission as reported.",
  },
  errors: {
    loadTitle: "Could not load data",
    sheetUnavailable:
      "Make sure the data tab is still readable by anyone with the link, then reload the page.",
    emptyTitle: "No data yet",
    emptyBody:
      "The data tab was read, but no row had a tracking ID and a valid date.",
  },
};

const ar: Dictionary = {
  meta: {
    title: "أرباح المؤثرين | أمازون مصر",
    description:
      "لوحة مباشرة لأرباح ومبيعات وطلبات حملات أمازون مصر لمعرّفات تتبع Trendire Group.",
  },
  brand: {
    title: "أرباح المؤثرين",
    subtitle: "أمازون مصر",
  },
  live: "مباشر",
  offline: "غير متصل",
  language: {
    switchLabel: "English",
    switchAria: "التبديل إلى الإنجليزية",
  },
  hero: {
    title: "متابعة الأرباح والمبيعات",
    sub: "عرض مجمّع لكل معرّفات التتبع في تبويب البيانات.",
    asOf: "البيانات محدّثة حتى {date}",
    noData: "لا توجد بيانات بعد",
  },
  ranges: {
    label: "الفترة",
    mtd: "الشهر الحالي",
    d7: "آخر 7 أيام",
    all: "كل الفترة",
  },
  range: "من {start} إلى {end}",
  metrics: {
    orders: "الطلبات",
    shipped: "الطلبات المشحونة",
    sales: "المبيعات",
    shippedSales: "مبيعات المشحونة",
    earnings: "العمولة",
  },
  comparedTo: "مقارنة بالفترة السابقة",
  chart: {
    title: "الأداء اليومي",
    metricAria: "المؤشر",
    empty: "لا توجد بيانات في هذه الفترة.",
    tooltip: "{date}: {value}",
  },
  daily: {
    title: "التفاصيل اليومية",
    empty: "لا توجد بيانات في هذه الفترة.",
    date: "التاريخ",
    total: "الإجمالي",
  },
  weekly: {
    title: "الملخص الأسبوعي",
    empty: "لا توجد بيانات أسبوعية بعد.",
    column: "الأسبوع",
    week: "الأسبوع {week}",
    last12: "آخر 12 أسبوعًا.",
  },
  monthly: {
    title: "الملخص الشهري",
    empty: "لا توجد بيانات شهرية بعد.",
    month: "الشهر",
    total: "الإجمالي",
    toDate: "(حتى {date})",
  },
  tracking: {
    title: "حسب معرّف التتبع",
    sub: "توزيع الفترة المحددة.",
    empty: "لا توجد معرّفات تتبع في هذه الفترة.",
    id: "معرّف التتبع",
    orders: "الطلبات",
    clicks: "النقرات",
    sales: "المبيعات",
    earnings: "العمولة",
    share: "الحصة",
  },
  footer: {
    source:
      "",
    basis: "",
  },
  errors: {
    loadTitle: "تعذر تحميل البيانات",
    sheetUnavailable:
      "تأكد أن تبويب data ما زال متاحًا للقراءة، ثم أعد تحميل الصفحة.",
    emptyTitle: "لا توجد بيانات بعد",
    emptyBody:
      "تم قراءة تبويب data لكن لم نجد صفًا يحتوي على معرّف تتبع وتاريخ صحيح.",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
