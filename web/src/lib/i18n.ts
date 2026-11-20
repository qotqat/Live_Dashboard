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
    userSub: string;
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
    username: string;
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
  auth: {
    loginTitle: string;
    loginSub: string;
    email: string;
    mobile: string;
    loginSubmit: string;
    invalidPhone: string;
    noAccount: string;
    tooManyAttempts: string;
    genericError: string;
    emailTaken: string;
    usernameTaken: string;
    trackingUnassigned: string;
  };
  account: {
    menuAria: string;
    email: string;
    username: string;
    trackingId: string;
    logout: string;
  };
  tabs: {
    label: string;
    perf: string;
    payments: string;
    commissions: string;
  };
  payments: {
    next: string;
    last: string;
    noNext: string;
    noLast: string;
    noLastHint: string;
    history: string;
    empty: string;
    month: string;
    status: string;
    amount: string;
    expected: string;
    paid: string;
    note: string;
    estimated: string;
    statusPaid: string;
    statusValidated: string;
    statusPending: string;
  };
  rates: {
    title: string;
    sub: string;
    category: string;
    rate: string;
    empty: string;
  };
  errors: {
    loadTitle: string;
    sheetUnavailable: string;
    emptyTitle: string;
    emptyBody: string;
    noUserDataTitle: string;
    noUserDataBody: string;
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
    userSub: "Your performance for {username}.",
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
    title: "By username",
    sub: "Your account for the selected period.",
    empty: "No account data in this period.",
    username: "Username",
    orders: "Orders",
    clicks: "Clicks",
    sales: "Sales",
    earnings: "Earnings",
    share: "Share",
  },
  footer: {
    source:
      "Source: the data tab in Google Sheets · checked every 5 minutes · amounts in Egyptian pounds (EGP)",
    basis:
      "Earnings shown are the influencer share (50%) of Amazon's reported commission.",
  },
  auth: {
    loginTitle: "Sign in",
    loginSub: "Open your personal earnings dashboard.",
    email: "Email",
    mobile: "Mobile Number",
    loginSubmit: "Sign in",
    invalidPhone: "Enter a valid mobile number.",
    noAccount: "No account found with this email and phone number.",
    tooManyAttempts: "Too many attempts. Try again in 15 minutes.",
    genericError: "Something went wrong. Try again.",
    emailTaken: "This email is already registered. Sign in instead.",
    usernameTaken: "That username is taken. Choose another one.",
    trackingUnassigned:
      "No tracking ID is assigned to this email yet. Contact the administrator.",
  },
  account: {
    menuAria: "Open account menu",
    email: "Email",
    username: "Username",
    trackingId: "Tracking ID",
    logout: "Sign out",
  },
  tabs: {
    label: "Sections",
    perf: "Performance",
    payments: "Payments",
    commissions: "Commission",
  },
  payments: {
    next: "Next payment",
    last: "Last payment",
    noNext: "No pending payments right now",
    noLast: "No payments yet",
    noLastHint: "The first confirmed payment will appear here.",
    history: "Payment history",
    empty: "No payment records yet.",
    month: "Month",
    status: "Status",
    amount: "Amount",
    expected: "Expected date",
    paid: "Paid date",
    note: "Note",
    estimated: "Estimated",
    statusPaid: "Paid",
    statusValidated: "Validated",
    statusPending: "Pending",
  },
  rates: {
    title: "Commission rates",
    sub: "Your share of the commission for each product category.",
    category: "Category",
    rate: "Your rate",
    empty: "No commission rates available.",
  },
  errors: {
    loadTitle: "Could not load data",
    sheetUnavailable:
      "Make sure the data tab is still readable by anyone with the link, then reload the page.",
    emptyTitle: "No data yet",
    emptyBody:
      "The data tab was read, but no row had a tracking ID and a valid date.",
    noUserDataTitle: "No data for this account",
    noUserDataBody:
      "No rows were found for tracking ID {trackingId} in the selected period.",
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
    userSub: "أداؤك لحساب {username}.",
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
    title: "حسب اسم المستخدم",
    sub: "حسابك للفترة المحددة.",
    empty: "لا توجد بيانات لهذا الحساب في هذه الفترة.",
    username: "اسم المستخدم",
    orders: "الطلبات",
    clicks: "النقرات",
    sales: "المبيعات",
    earnings: "العمولة",
    share: "الحصة",
  },
  footer: {
    source:
      "المصدر: تبويب data في Google Sheets · يُفحص كل 5 دقائق · المبالغ بالجنيه المصري (ج.م)",
    basis:
      "العمولة المعروضة هي حصة المؤثر (50%) من عمولة أمازون الواردة في التقرير.",
  },
  auth: {
    loginTitle: "تسجيل الدخول",
    loginSub: "افتح لوحة أرباحك الشخصية.",
    email: "البريد الإلكتروني",
    mobile: "رقم الهاتف",
    loginSubmit: "دخول",
    invalidPhone: "أدخل رقم هاتف محمول صالحًا.",
    noAccount: "لم نجد حسابًا لهذا البريد الإلكتروني ورقم الهاتف.",
    tooManyAttempts: "محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة.",
    genericError: "حدث خطأ. حاول مرة أخرى.",
    emailTaken: "هذا البريد مسجّل بالفعل.",
    usernameTaken: "اسم المستخدم مستخدم بالفعل.",
    trackingUnassigned:
      "لم يتم تعيين معرّف تتبع لهذا البريد بعد. تواصل مع الإدارة.",
  },
  account: {
    menuAria: "فتح قائمة الحساب",
    email: "البريد الإلكتروني",
    username: "اسم المستخدم",
    trackingId: "معرّف التتبع",
    logout: "تسجيل الخروج",
  },
  tabs: {
    label: "الأقسام",
    perf: "الأداء",
    payments: "المدفوعات",
    commissions: "العمولة",
  },
  payments: {
    next: "الدفعة القادمة",
    last: "آخر دفعة",
    noNext: "لا توجد مستحقات قادمة حاليًا",
    noLast: "لم تتم أي مدفوعات بعد",
    noLastHint: "ستظهر هنا أول دفعة بعد تأكيد المبلغ وصرفه.",
    history: "سجل المدفوعات",
    empty: "لا توجد بيانات كافية لعرض سجل المدفوعات حاليًا.",
    month: "الشهر",
    status: "الحالة",
    amount: "المبلغ المؤكد",
    expected: "موعد الدفع",
    paid: "تاريخ الدفع",
    note: "ملاحظة",
    estimated: "تقديري",
    statusPaid: "مدفوعة",
    statusValidated: "مؤكدة",
    statusPending: "قيد المراجعة",
  },
  rates: {
    title: "نسب العمولة",
    sub: "نسبة عمولتك من سعر كل منتج يُباع من خلال رابطك، حسب فئة المنتج.",
    category: "الفئة",
    rate: "نسبة عمولتك",
    empty: "لا توجد نسب عمولة متاحة.",
  },
  errors: {
    loadTitle: "تعذر تحميل البيانات",
    sheetUnavailable:
      "تأكد أن تبويب data ما زال متاحًا للقراءة، ثم أعد تحميل الصفحة.",
    emptyTitle: "لا توجد بيانات بعد",
    emptyBody:
      "تم قراءة تبويب data لكن لم نجد صفًا يحتوي على معرّف تتبع وتاريخ صحيح.",
    noUserDataTitle: "لا توجد بيانات لهذا الحساب",
    noUserDataBody:
      "لم نجد صفوفًا لمعرّف التتبع {trackingId} في الفترة المحددة.",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
