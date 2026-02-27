import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ─── Schemas ────────────────────────────────────────────────────────────────

const BaseRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  revenue: z.number().min(0).optional(),
  laborCost: z.number().min(0).optional(),
  laborHours: z.number().min(0).optional(),
  expenseAmount: z.number().min(0).optional(),
  expenseCategory: z.string().optional(),
});

const SalesRowSchema = BaseRowSchema.extend({
  revenue: z.number().min(0, "Revenue must be non-negative"),
});

const LaborRowSchema = BaseRowSchema.extend({
  laborCost: z.number().min(0, "Labor cost must be non-negative"),
});

const ExpensesRowSchema = BaseRowSchema.extend({
  expenseAmount: z.number().min(0, "Expense amount must be non-negative"),
});

type ParsedRow = z.infer<typeof BaseRowSchema>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodObject = z.ZodObject<any>;

// ─── Column name mappings ────────────────────────────────────────────────────
// Each key is our internal field name → list of aliases (most specific first)

const COLUMN_ALIASES: Record<string, string[]> = {
  date: [
    "date",
    "day",
    "business date",
    "business_date",
    "txn date",
    "txn_date",
    "transaction date",
    "transaction_date",
    "order date",
    "order_date",
    "sale date",
    "sale_date",
    "report date",
    "report_date",
    "period",
    "period start",
    "period_start",
    "week",
    "datetime",
    "time",
    "timestamp",
    "created at",
    "created_at",
  ],
  revenue: [
    "revenue",
    "total revenue",
    "total_revenue",
    "net revenue",
    "net_revenue",
    "gross revenue",
    "gross_revenue",
    "sales",
    "total sales",
    "total_sales",
    "gross sales",
    "gross_sales",
    "net sales",
    "net_sales",
    "daily sales",
    "daily_sales",
    "sale amount",
    "sale_amount",
    "sales amount",
    "sales_amount",
    "income",
    "total income",
    "total_income",
    "gross income",
    "gross_income",
    "turnover",
    "receipts",
    "takings",
    "total takings",
    "daily takings",
    "amount",
    "total amount",
    "total",
    "subtotal",
    "sub total",
    "sub_total",
    "payment amount",
    "payment_amount",
    "collected",
    "total collected",
  ],
  laborCost: [
    "labor cost",
    "labor_cost",
    "labour cost",
    "labour_cost",
    "labor",
    "labour",
    "labor expense",
    "labour_expense",
    "staff cost",
    "staff_cost",
    "staff expense",
    "staff_expense",
    "staff wages",
    "staff_wages",
    "payroll",
    "payroll cost",
    "total payroll",
    "total_payroll",
    "wages",
    "total wages",
    "wage cost",
    "wage_cost",
    "employee cost",
    "employee_cost",
    "employee wages",
    "salary",
    "salaries",
    "total salary",
    "total_salary",
    "crew cost",
    "crew_cost",
  ],
  laborHours: [
    "labor hours",
    "labor_hours",
    "labour hours",
    "labour_hours",
    "hours worked",
    "hours_worked",
    "hours",
    "total hours",
    "total_hours",
    "staff hours",
    "staff_hours",
    "employee hours",
    "employee_hours",
    "work hours",
    "work_hours",
    "scheduled hours",
    "scheduled_hours",
    "actual hours",
    "actual_hours",
    "clock hours",
    "hrs",
  ],
  expenseAmount: [
    "expense amount",
    "expense_amount",
    "expense",
    "expenses",
    "total expenses",
    "total_expenses",
    "cost",
    "costs",
    "total cost",
    "total_cost",
    "expenditure",
    "spend",
    "spending",
    "overhead",
    "cogs",
    "cost of goods",
    "cost of goods sold",
    "food cost",
    "food_cost",
    "beverage cost",
    "supplies cost",
    "supplies_cost",
    "operating expense",
    "operating_expense",
    "amount spent",
  ],
  expenseCategory: [
    "expense category",
    "expense_category",
    "category",
    "expense type",
    "expense_type",
    "type",
    "cost category",
    "cost_category",
    "cost type",
    "cost_type",
    "description",
    "dept",
    "department",
    "account",
    "account name",
    "gl account",
    "gl_account",
    "item",
    "vendor",
  ],
};

const REQUIRED_COLUMNS: Record<string, string[]> = {
  sales: ["date", "revenue"],
  labor: ["date", "laborCost"],
  expenses: ["date", "expenseAmount"],
  default: ["date", "revenue", "laborCost"],
};

const FILE_SCHEMAS: Record<string, AnyZodObject> = {
  sales: SalesRowSchema,
  labor: LaborRowSchema,
  expenses: ExpensesRowSchema,
  default: BaseRowSchema,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── String similarity (Levenshtein) ────────────────────────────────────────
// Used for fuzzy matching so "revneue" still maps to "revenue"

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Column normalisation ───────────────────────────────────────────────────

function normalise(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\uFEFF]/g, "")           // strip BOM chars that leak into header names
    .replace(/[_\-]+/g, " ")            // underscores / hyphens → single space
    .replace(/\s+/g, " ")               // collapse multiple spaces
    .replace(/[^a-z0-9 ]/g, "");        // strip punctuation (£, # etc.)
}

/**
 * Given a list of detected column headers, find the best match for each
 * internal field. Returns the original (un-normalised) header string or null.
 *
 * Priority:
 *  1. Exact normalised match to an alias
 *  2. Alias is substring of header (e.g. "net revenue (usd)" contains "net revenue")
 *  3. Header is substring of alias
 *  4. Levenshtein similarity ≥ 0.80 (typo tolerance)
 */
function findBestMatch(headers: string[], field: string): string | null {
  const aliases = COLUMN_ALIASES[field] ?? [];
  const normHeaders = headers.map((h) => ({ original: h, norm: normalise(h) }));

  // Pass 1 — exact match
  for (const alias of aliases) {
    const normAlias = normalise(alias);
    const found = normHeaders.find((h) => h.norm === normAlias);
    if (found) return found.original;
  }

  // Pass 2 — alias contained in header OR header contained in alias
  for (const alias of aliases) {
    const normAlias = normalise(alias);
    const found = normHeaders.find(
      (h) => h.norm.includes(normAlias) || normAlias.includes(h.norm)
    );
    if (found) return found.original;
  }

  // Pass 3 — fuzzy (Levenshtein) — only for short-ish tokens where typos matter
  for (const alias of aliases) {
    const normAlias = normalise(alias);
    for (const h of normHeaders) {
      if (similarity(h.norm, normAlias) >= 0.80) return h.original;
    }
  }

  return null;
}

function buildMapping(headers: string[]): Record<string, string | null> {
  return Object.fromEntries(
    Object.keys(COLUMN_ALIASES).map((field) => [field, findBestMatch(headers, field)])
  );
}

// ─── Value parsers ──────────────────────────────────────────────────────────

const JUNK_STRINGS = new Set([
  "pending", "n/a", "na", "-", "null", "undefined",
  "#ref!", "#value!", "#n/a", "#div/0!", "total", "subtotal", "average",
]);

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).trim();
  if (JUNK_STRINGS.has(raw.toLowerCase())) return null;
  if (typeof value === "number") return isNaN(value) ? null : value;

  const cleaned = raw
    .replace(/[£€$¥₹,\s%]/g, "")       // strip currency symbols, commas, spaces, percent
    .replace(/\(([0-9.]+)\)/, "-$1");   // (123.45) → -123.45 (accounting format)

  if (cleaned === "" || cleaned === "-") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// Month name → zero-indexed month number
const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parseDate(value: unknown): string | null {
  if (!value || value === "") return null;
  const raw = String(value).trim();

  // ── ISO variants: 2024-01-15 or 2024/01/15 ──────────────────────────────
  const isoMatch = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1], m = isoMatch[2].padStart(2, "0"), d = isoMatch[3].padStart(2, "0");
    const dt = new Date(`${y}-${m}-${d}`);
    if (!isNaN(dt.getTime())) return `${y}-${m}-${d}`;
  }

  // ── US format: MM/DD/YY or MM/DD/YYYY (including with time suffix) ───────
  const usMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (usMatch) {
    let year = parseInt(usMatch[3], 10);
    if (year < 100) year += year >= 50 ? 1900 : 2000;   // 2-digit year: 24→2024, 99→1999
    const m = usMatch[1].padStart(2, "0"), d = usMatch[2].padStart(2, "0");
    const y = String(year);
    const dt = new Date(`${y}-${m}-${d}`);
    if (!isNaN(dt.getTime())) return `${y}-${m}-${d}`;
  }

  // ── European: DD.MM.YYYY ─────────────────────────────────────────────────
  const euDotMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (euDotMatch) {
    let year = parseInt(euDotMatch[3], 10);
    if (year < 100) year += year >= 50 ? 1900 : 2000;
    const d = euDotMatch[1].padStart(2, "0"), m = euDotMatch[2].padStart(2, "0");
    const y = String(year);
    return `${y}-${m}-${d}`;
  }

  // ── Named month: "Jan 15, 2024" / "January 15 2024" / "15 Jan 2024" ─────
  const namedMonthMatch = raw.match(
    /(\d{1,2})\s+([a-zA-Z]+)\s+(\d{2,4})|([a-zA-Z]+)\s+(\d{1,2})[,\s]+(\d{2,4})/i
  );
  if (namedMonthMatch) {
    let day: string, monthName: string, yearStr: string;
    if (namedMonthMatch[1]) {
      // DD Month YYYY
      day = namedMonthMatch[1];
      monthName = namedMonthMatch[2];
      yearStr = namedMonthMatch[3];
    } else {
      // Month DD YYYY
      monthName = namedMonthMatch[4];
      day = namedMonthMatch[5];
      yearStr = namedMonthMatch[6];
    }
    const monthIdx = MONTH_NAMES[monthName.toLowerCase()];
    if (monthIdx !== undefined) {
      let year = parseInt(yearStr, 10);
      if (year < 100) year += year >= 50 ? 1900 : 2000;
      const dt = new Date(year, monthIdx, parseInt(day, 10));
      if (!isNaN(dt.getTime())) {
        const y = String(dt.getFullYear());
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const d = String(dt.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
  }

  // ── Excel serial date (integer or float) ─────────────────────────────────
  if (/^\d+\.?\d*$/.test(raw)) {
    const serial = parseFloat(raw);
    if (serial > 1 && serial < 80000) {
      // Excel epoch: Dec 30, 1899
      const epoch = new Date(1899, 11, 30);
      const dt = new Date(epoch.getTime() + serial * 86400000);
      if (!isNaN(dt.getTime())) {
        const y = String(dt.getFullYear());
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const d = String(dt.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
  }

  // ── JS Date fallback ─────────────────────────────────────────────────────
  const fallback = new Date(raw);
  if (!isNaN(fallback.getTime())) {
    const y = String(fallback.getFullYear());
    const m = String(fallback.getMonth() + 1).padStart(2, "0");
    const d = String(fallback.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

// ─── Row transformer ────────────────────────────────────────────────────────

function transformRow(
  row: Record<string, unknown>,
  mapping: Record<string, string | null>
): Partial<ParsedRow> {
  const out: Partial<ParsedRow> = {};

  if (mapping.date) {
    const d = parseDate(row[mapping.date]);
    if (d) out.date = d;
  }

  if (mapping.revenue) {
    const n = parseNumber(row[mapping.revenue]);
    if (n !== null && n >= 0) out.revenue = n;
  }

  if (mapping.laborCost) {
    const n = parseNumber(row[mapping.laborCost]);
    if (n !== null && n >= 0) out.laborCost = n;
  }

  if (mapping.laborHours) {
    const n = parseNumber(row[mapping.laborHours]);
    if (n !== null && n >= 0) out.laborHours = n;
  }

  if (mapping.expenseAmount) {
    const n = parseNumber(row[mapping.expenseAmount]);
    if (n !== null && n >= 0) out.expenseAmount = n;
  }

  if (mapping.expenseCategory) {
    const cat = row[mapping.expenseCategory];
    if (cat !== undefined && cat !== null && cat !== "") {
      out.expenseCategory = String(cat).trim();
    }
  }

  return out;
}

// ─── File readers ────────────────────────────────────────────────────────────

function readCSV(buffer: Buffer): { data: Record<string, unknown>[]; headers: string[] } {
  // Strip UTF-8 BOM if present (\uFEFF at start of file)
  let csvText = buffer.toString("utf-8");
  if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1);

  const result = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  return {
    data: result.data,
    headers: (result.meta.fields ?? []).filter((h) => h !== ""),
  };
}

function readExcel(buffer: Buffer): { data: Record<string, unknown>[]; headers: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  if (rows.length === 0) return { data: [], headers: [] };

  const headers = (rows[0] as unknown[])
    .map((h) => String(h).trim())
    .filter((h) => h !== "");

  const data = rows.slice(1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = (row as unknown[])[i];
    });
    return obj;
  });

  return { data, headers };
}

// ─── Helpful error builder ───────────────────────────────────────────────────

function buildMissingColumnsError(
  missingFields: string[],
  detected: string[],
  fileType: string
): string {
  const friendlyNames: Record<string, string> = {
    date: "date",
    revenue: "revenue / sales / total",
    laborCost: "labor_cost / payroll / wages",
    expenseAmount: "expense_amount / cost / spend",
  };

  const missingList = missingFields.map((f) => `"${friendlyNames[f] ?? f}"`).join(", ");
  const detectedList = detected.length > 0
    ? detected.map((h) => `"${h}"`).join(", ")
    : "(none detected)";

  const hint: Record<string, string> = {
    sales: "Sales file needs: date + revenue",
    labor: "Labor file needs: date + labor_cost",
    expenses: "Expenses file needs: date + expense_amount",
    default: "File needs: date + revenue + labor_cost",
  };

  return (
    `Missing required column(s): ${missingList}. ` +
    `Columns we found: ${detectedList}. ` +
    `${hint[fileType] ?? ""} — column names are flexible (e.g. "total sales", "wages", "payroll" all work).`
  );
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File is too large (max 10 MB)" },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    const isCSV = name.endsWith(".csv");
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { success: false, error: "Only CSV (.csv) or Excel (.xlsx / .xls) files are accepted" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: rawData, headers } = isCSV ? readCSV(buffer) : readExcel(buffer);

    if (headers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No column headers found. Make sure the first row of your file contains column names like: date, revenue, labor_cost.",
        },
        { status: 400 }
      );
    }

    if (rawData.length === 0) {
      return NextResponse.json(
        { success: false, error: "The file has headers but no data rows." },
        { status: 400 }
      );
    }

    // Resolve file type
    const rawType = ((formData.get("fileType") as string | null) ?? "").toLowerCase();
    const fileType = ["sales", "labor", "expenses"].includes(rawType) ? rawType : "default";

    // Build column mapping using flexible matching
    const mapping = buildMapping(headers);

    // Check required columns
    const required = REQUIRED_COLUMNS[fileType];
    const missing = required.filter((f) => mapping[f] === null);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: buildMissingColumnsError(missing, headers, fileType),
          detectedHeaders: headers,
          columnMapping: mapping,
        },
        { status: 400 }
      );
    }

    // Transform + validate rows
    const schema = FILE_SCHEMAS[fileType];
    const validRows: ParsedRow[] = [];
    let skipped = 0;

    for (const row of rawData) {
      // Skip rows that are completely empty
      const hasAnyValue = Object.values(row).some((v) => v !== "" && v !== null && v !== undefined);
      if (!hasAnyValue) { skipped++; continue; }

      const transformed = transformRow(row, mapping);
      const result = schema.safeParse(transformed);
      if (result.success) {
        validRows.push(result.data as ParsedRow);
      } else {
        skipped++;
      }
    }

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No valid data rows found after parsing ${rawData.length} row(s). ` +
            `Check that your date column contains real dates and your number columns contain numbers.`,
          detectedHeaders: headers,
          columnMapping: mapping,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: validRows,
      rowsProcessed: rawData.length,
      rowsSkipped: skipped,
      message: `${validRows.length} row(s) parsed successfully${skipped > 0 ? ` (${skipped} skipped)` : ""}`,
      columnMapping: {
        date: mapping.date,
        revenue: mapping.revenue,
        laborCost: mapping.laborCost,
        laborHours: mapping.laborHours,
        expenseAmount: mapping.expenseAmount,
        expenseCategory: mapping.expenseCategory,
      },
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error while parsing the file. Please check the format and try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
