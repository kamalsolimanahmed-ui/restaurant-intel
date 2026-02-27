import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Input validation schema
const DataRowSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  laborCost: z.number(),
  laborHours: z.number().optional(),
  expenseAmount: z.number().optional(),
  expenseCategory: z.string().optional(),
});

const RequestSchema = z.object({
  data: z.array(DataRowSchema),
  // Optional: previous month data for expense spike detection
  previousMonthData: z.array(DataRowSchema).optional(),
});

type DataRow = z.infer<typeof DataRowSchema>;

// Rule thresholds — industry standard for full-service restaurants
const THRESHOLDS = {
  labor: {
    criticallyLow: 15, // <15% = severely understaffed
    tooLow: 20,        // <20% = understaffed (warning)
    good: 32,          // ≤32% = healthy range
    warning: 38,       // 32-38% = needs attention
    // >38% = critical overspend
  },
  primeCost: {
    good: 60,     // ≤60% → healthy
    warning: 65,  // 60-65% → needs attention
    // >65% → critical
  },
  expenseSpike: 20,
};

// Health score penalties
const PENALTIES = {
  laborCritical: 20,
  laborWarning: 10,
  primeCostCritical: 20, // >65%
  primeCostWarning: 15,  // 60-65% — new middle tier
  expenseSpike: 10,
  worstDay: 5,
};

// Day names for grouping
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Calculate Labor Percentage
 */
function calculateLaborPct(data: DataRow[]): {
  percentage: number;
  totalLabor: number;
  totalRevenue: number;
  status: "good" | "warning" | "critical";
  penalty: number;
} {
  // ── Diagnostic logging ────────────────────────────────────────────────
  console.log("=== RULES ENGINE INPUT ===");
  console.log("Total rows received:", data.length);
  console.log("First row:", JSON.stringify(data[0]));

  const validSalesRows = data.filter((r) => r.revenue != null && !isNaN(r.revenue) && r.revenue > 0);
  const validLaborRows = data.filter((r) => r.laborCost != null && !isNaN(r.laborCost) && r.laborCost >= 0);
  const validExpenseRows = data.filter((r) => r.expenseAmount != null && !isNaN(r.expenseAmount) && r.expenseAmount > 0);
  console.log("Valid revenue rows (before date-dedup):", validSalesRows.length);
  console.log("Valid labor rows (before date-dedup):", validLaborRows.length);
  console.log("Valid expense rows:", validExpenseRows.length);
  // ─────────────────────────────────────────────────────────────────────

  // CRITICAL: Both revenue AND labor must be de-duplicated by date.
  // The merge step in dashboard/page.tsx creates one row per expense-category per date.
  // If a day has 3 expense categories → 3 rows with the same revenue & laborCost.
  // Without de-duplication, revenue gets multiplied by the number of expense rows per day.
  const seenDates = new Set<string>();
  let totalRevenue = 0;
  let totalLabor = 0;

  for (const row of data) {
    if (seenDates.has(row.date)) continue; // already counted this date
    seenDates.add(row.date);

    if (row.revenue != null && !isNaN(row.revenue) && row.revenue > 0) {
      totalRevenue += row.revenue;
    }
    if (row.laborCost != null && !isNaN(row.laborCost) && row.laborCost >= 0) {
      totalLabor += row.laborCost;
    }
  }

  // ── Diagnostic: log de-duped totals ──────────────────────────────────
  const rawLaborPct = totalRevenue > 0 ? (totalLabor / totalRevenue) * 100 : 0;
  const validFoodCost = validExpenseRows
    .filter((e) => e.expenseCategory?.toLowerCase().includes("food"))
    .reduce((sum, e) => sum + (e.expenseAmount ?? 0), 0);
  const rawPrimePct = totalRevenue > 0 ? ((totalLabor + validFoodCost) / totalRevenue) * 100 : 0;
  console.log("=== CALCULATED TOTALS (after date-dedup) ===");
  console.log("Unique dates:", seenDates.size);
  console.log("Total Revenue:", totalRevenue.toFixed(2));
  console.log("Total Labor:", totalLabor.toFixed(2));
  console.log("Total Food Cost (food keyword):", validFoodCost.toFixed(2));
  console.log("Labor %:", rawLaborPct.toFixed(2));
  console.log("Prime Cost %:", rawPrimePct.toFixed(2));
  console.log("==========================================");
  // ─────────────────────────────────────────────────────────────────────

  if (totalRevenue === 0) {
    return { percentage: 0, totalLabor, totalRevenue, status: "good", penalty: 0 };
  }

  const rawPct = (totalLabor / totalRevenue) * 100;
  const percentage = Math.round(rawPct * 100) / 100;

  let status: "good" | "warning" | "critical" = "good";
  let penalty = 0;

  // Check HIGH labor (overspending)
  if (percentage > THRESHOLDS.labor.warning) {
    status = "critical";
    penalty = PENALTIES.laborCritical;
  } else if (percentage > THRESHOLDS.labor.good) {
    status = "warning";
    penalty = PENALTIES.laborWarning;
    // Check LOW labor (understaffed — equally dangerous)
  } else if (percentage < THRESHOLDS.labor.criticallyLow) {
    status = "critical";
    penalty = PENALTIES.laborCritical; // same penalty — critically understaffed
  } else if (percentage < THRESHOLDS.labor.tooLow) {
    status = "warning";
    penalty = PENALTIES.laborWarning;
  }

  return { percentage, totalLabor, totalRevenue, status, penalty };
}

/**
 * Calculate Prime Cost Percentage
 * Prime Cost = (Labor + Food Cost) / Total Revenue × 100
 *
 * Strategy: BLACKLIST approach.
 * In a restaurant expenses file, the vast majority of rows ARE food/COGS.
 * Overhead items (rent, utilities, insurance, etc.) are the exception.
 * We exclude known non-food categories instead of trying to match food keywords.
 * This is far more robust than a whitelist — it won't silently drop real food rows.
 */
function calculatePrimeCostPct(
  data: DataRow[],
  totalLabor: number,
  totalRevenue: number
): {
  percentage: number;
  totalFoodCost: number;
  foodCostEstimated: boolean;
  matchedFoodCategories: string[];
  status: "good" | "warning" | "critical";
  penalty: number;
} {
  // Non-food overhead categories — anything matching these is EXCLUDED from prime cost
  const NON_FOOD_KEYWORDS = [
    "rent", "lease", "mortgage",
    "utility", "utilities", "electric", "electricity", "gas", "water", "internet", "phone", "telecom",
    "insurance", "liability", "workers comp",
    "marketing", "advertising", "ads", "promotion",
    "repair", "maintenance", "equipment",
    "accounting", "legal", "professional",
    "depreciation", "amortization",
    "loan", "interest", "bank",
    "tax", "licence", "license", "permit",
    "uniform", "cleaning", "laundry",
    "office", "admin", "software", "subscription",
  ];

  let totalFoodCost = 0;
  let foodCostEstimated = false;
  const matchedCats = new Set<string>();

  for (const row of data) {
    if (
      row.expenseAmount != null &&
      !isNaN(row.expenseAmount) &&
      row.expenseAmount > 0
    ) {
      if (!row.expenseCategory) {
        // No category label — include it (assume food/COGS by default in a restaurant)
        totalFoodCost += row.expenseAmount;
        matchedCats.add("(unlabelled)");
        continue;
      }

      const cat = row.expenseCategory.toLowerCase().trim();
      const isNonFood = NON_FOOD_KEYWORDS.some((kw) => cat.includes(kw));

      if (!isNonFood) {
        totalFoodCost += row.expenseAmount;
        matchedCats.add(row.expenseCategory.trim());
      }
    }
  }

  // Log what was matched for transparency
  console.log("Food cost categories matched:", [...matchedCats].join(", ") || "none");
  console.log("Total food cost from expenses:", totalFoodCost.toFixed(2));

  // Fallback ONLY if zero expense rows exist at all
  if (totalFoodCost === 0) {
    totalFoodCost = totalRevenue * 0.3;
    foodCostEstimated = true;
  }

  const primeCost = totalLabor + totalFoodCost;
  const rawPct = totalRevenue > 0 ? (primeCost / totalRevenue) * 100 : 0;
  const percentage = Math.round(rawPct * 100) / 100;

  let status: "good" | "warning" | "critical" = "good";
  let penalty = 0;

  if (percentage > THRESHOLDS.primeCost.warning) {
    status = "critical";
    penalty = PENALTIES.primeCostCritical;
  } else if (percentage > THRESHOLDS.primeCost.good) {
    status = "warning";
    penalty = PENALTIES.primeCostWarning;
  }

  return { percentage, totalFoodCost, foodCostEstimated, matchedFoodCategories: [...matchedCats], status, penalty };
}

/**
 * Check whether sales and labor date ranges match.
 * Returns a warning string if they differ by more than 2 days, otherwise null.
 * Also returns the raw day counts for the coverage bar UI.
 */
function checkDateRangeMismatch(data: DataRow[]): {
  warning: string | null;
  salesDays: number;
  laborDays: number;
  salesDateRange: string;
  laborDateRange: string;
  suggestion: string | null;
} {
  const salesDates: string[] = [];
  const laborDates: string[] = [];
  const seen = new Set<string>();

  for (const row of data) {
    if (seen.has(row.date)) continue;
    seen.add(row.date);
    if (row.revenue > 0) salesDates.push(row.date);
    if (row.laborCost > 0) laborDates.push(row.date);
  }

  const salesDays = salesDates.length;
  const laborDays = laborDates.length;

  if (salesDays === 0 || laborDays === 0) {
    return { warning: null, salesDays, laborDays, salesDateRange: "", laborDateRange: "", suggestion: null };
  }

  salesDates.sort();
  laborDates.sort();

  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  const salesDateRange = `${fmt(salesDates[0])}–${fmt(salesDates[salesDates.length - 1])}`;
  const laborDateRange = `${fmt(laborDates[0])}–${fmt(laborDates[laborDates.length - 1])}`;

  const diff = Math.abs(salesDays - laborDays);
  if (diff <= 2) {
    return { warning: null, salesDays, laborDays, salesDateRange, laborDateRange, suggestion: null };
  }

  const warning = `⚠️ Date range mismatch: Sales covers ${salesDateRange} (${salesDays} days), Labor covers ${laborDateRange} (${laborDays} days). Upload matching date ranges for accurate results.`;

  // Build a concrete fix suggestion pointing to the smaller period
  const shorterLabel = salesDays < laborDays ? "sales" : "labor";
  const longerLabel = salesDays < laborDays ? "labor" : "sales";
  const shorterRange = salesDays < laborDays ? salesDateRange : laborDateRange;
  const longerRange = salesDays < laborDays ? laborDateRange : salesDateRange;
  const shorterDays = Math.min(salesDays, laborDays);
  const longerDays = Math.max(salesDays, laborDays);
  const suggestion =
    `💡 Suggestion: Either upload ${longerDays} days of ${shorterLabel} data (${longerRange}) to match ${longerLabel}, ` +
    `or upload ${shorterDays} days of ${longerLabel} data (${shorterRange}) to match ${shorterLabel}.`;

  return { warning, salesDays, laborDays, salesDateRange, laborDateRange, suggestion };
}

/**
 * FIX 3: Validate that per-day numbers are physically plausible.
 * Returns a warning string if labor cost per day is more than 2× the sales per day.
 */
function validateNumbers(data: DataRow[]): string | null {
  const seen = new Set<string>();
  let totalRevenue = 0;
  let totalLabor = 0;
  let salesDays = 0;
  let laborDays = 0;

  for (const row of data) {
    if (seen.has(row.date)) continue;
    seen.add(row.date);
    if (row.revenue > 0) { totalRevenue += row.revenue; salesDays++; }
    if (row.laborCost > 0) { totalLabor += row.laborCost; laborDays++; }
  }

  if (salesDays === 0 || laborDays === 0) return null;

  const avgSalesPerDay = totalRevenue / salesDays;
  const avgLaborPerDay = totalLabor / laborDays;

  if (avgLaborPerDay > avgSalesPerDay * 2) {
    const fmtCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    return `⚠️ Impossible numbers detected: Your average labor cost (${fmtCurrency(avgLaborPerDay)}/day) is more than 2× your average daily sales (${fmtCurrency(avgSalesPerDay)}/day). This almost always means your labor or expense file covers more days than your sales file. Verify your date ranges before trusting these results.`;
  }

  return null;
}

/**
 * Find the worst performing day of the week.
 * Uses UTC day to avoid timezone date-shift (new Date("YYYY-MM-DD") is UTC midnight;
 * getDay() returns local day which is off by 1 on UTC-5/UTC+X servers).
 */
function findWorstDay(data: DataRow[]): {
  day: string;
  revenue: number;
  laborCost: number;
  laborPct: number;
  loss: number;
  found: boolean;
} | null {
  // Use de-duped data — only count revenue/labor once per date
  const seenForDay = new Set<string>();
  const dayStats: Record<number, { revenue: number; laborCost: number; count: number }> = {};

  for (const row of data) {
    if (seenForDay.has(row.date)) continue; // skip duplicate expense rows
    seenForDay.add(row.date);

    const date = new Date(row.date);
    const dayOfWeek = date.getUTCDay(); // ← UTC day, not local day

    if (!dayStats[dayOfWeek]) {
      dayStats[dayOfWeek] = { revenue: 0, laborCost: 0, count: 0 };
    }
    dayStats[dayOfWeek].revenue += row.revenue;
    dayStats[dayOfWeek].laborCost += row.laborCost;
    dayStats[dayOfWeek].count += 1;
  }

  const daysWithData = Object.entries(dayStats).filter(([_, s]) => s.count > 0);

  // BUG #2 FIX: Need at least 2 distinct days of data to meaningfully compare days
  if (daysWithData.length < 2) return null;

  let worstDay: { dayIndex: number; avgRevenue: number; avgLaborCost: number; laborPct: number; score: number } | null = null;

  for (const [dayIndex, stats] of daysWithData) {
    const avgRevenue = stats.revenue / stats.count;
    const avgLaborCost = stats.laborCost / stats.count;
    const laborPct = avgRevenue > 0 ? (avgLaborCost / avgRevenue) * 100 : 0;
    const score = laborPct / (avgRevenue / 1000 + 1);

    if (!worstDay || score > worstDay.score) {
      worstDay = { dayIndex: parseInt(dayIndex), avgRevenue, avgLaborCost, laborPct, score };
    }
  }

  if (!worstDay) return null;

  const breakEvenLaborRatio = 0.25;
  const loss = Math.round(worstDay.avgLaborCost - worstDay.avgRevenue * breakEvenLaborRatio);

  return {
    day: DAY_NAMES[worstDay.dayIndex],
    revenue: Math.round(worstDay.avgRevenue),
    laborCost: Math.round(worstDay.avgLaborCost),
    laborPct: Math.round(worstDay.laborPct * 10) / 10,
    loss,
    found: true,
  };
}

/**
 * Find the best performing day of the week.
 * Uses getUTCDay() to match findWorstDay — avoids timezone date-shift.
 */
function findBestDay(data: DataRow[]): { day: string; revenue: number } | null {
  const seenForDay = new Set<string>();
  const dayStats: Record<number, { revenue: number; count: number }> = {};

  for (const row of data) {
    if (seenForDay.has(row.date)) continue;
    seenForDay.add(row.date);

    const date = new Date(row.date);
    const dayOfWeek = date.getUTCDay(); // ← UTC day, not local
    if (!dayStats[dayOfWeek]) dayStats[dayOfWeek] = { revenue: 0, count: 0 };
    dayStats[dayOfWeek].revenue += row.revenue;
    dayStats[dayOfWeek].count += 1;
  }

  let best: { dayIndex: number; avgRevenue: number } | null = null;
  for (const [dayIndex, stats] of Object.entries(dayStats)) {
    if (stats.count === 0) continue;
    const avgRevenue = stats.revenue / stats.count;
    if (!best || avgRevenue > best.avgRevenue) {
      best = { dayIndex: parseInt(dayIndex), avgRevenue };
    }
  }

  if (!best) return null;
  return { day: DAY_NAMES[best.dayIndex], revenue: Math.round(best.avgRevenue) };
}

/**
 * Detect expense spikes by comparing this month vs previous month
 */
function detectExpenseSpikes(
  currentData: DataRow[],
  previousData?: DataRow[]
): Array<{
  category: string;
  change: number;
  lastMonth: number;
  thisMonth: number;
}> {
  if (!previousData || previousData.length === 0) {
    return []; // Need previous month data to detect spikes
  }

  // Group expenses by category for both months
  const currentExpenses: Record<string, number> = {};
  const previousExpenses: Record<string, number> = {};

  for (const row of currentData) {
    if (row.expenseAmount && row.expenseCategory) {
      const category = row.expenseCategory.toLowerCase().trim();
      currentExpenses[category] =
        (currentExpenses[category] || 0) + row.expenseAmount;
    }
  }

  for (const row of previousData) {
    if (row.expenseAmount && row.expenseCategory) {
      const category = row.expenseCategory.toLowerCase().trim();
      previousExpenses[category] =
        (previousExpenses[category] || 0) + row.expenseAmount;
    }
  }

  // Find spikes (>20% increase)
  const spikes: Array<{
    category: string;
    change: number;
    lastMonth: number;
    thisMonth: number;
  }> = [];

  for (const [category, thisMonthAmount] of Object.entries(currentExpenses)) {
    const lastMonthAmount = previousExpenses[category] || 0;

    if (lastMonthAmount > 0) {
      const change = ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100;

      if (change > THRESHOLDS.expenseSpike) {
        spikes.push({
          category,
          change: Math.round(change),
          lastMonth: Math.round(lastMonthAmount * 100) / 100,
          thisMonth: Math.round(thisMonthAmount * 100) / 100,
        });
      }
    }
  }

  // Sort by change percentage (highest first)
  return spikes.sort((a, b) => b.change - a.change);
}

/**
 * Calculate overall health score
 * FIX 4: tiered prime cost hard caps.
 */
function calculateHealthScore(
  laborResult: ReturnType<typeof calculateLaborPct>,
  primeCostResult: ReturnType<typeof calculatePrimeCostPct>,
  worstDay: ReturnType<typeof findWorstDay>,
  expenseSpikes: ReturnType<typeof detectExpenseSpikes>
): number {
  const lp = laborResult.percentage;
  const pc = primeCostResult.percentage;

  // FIX 4 — hard caps for impossible prime costs
  if (pc > 150) return 0;   // Physically impossible: losing money on every transaction
  if (pc > 100) return 10;  // Red warning: costs exceed all revenue

  let score = 100;

  // Labor thresholds
  if (lp > 35) score -= 20;
  else if (lp > 32) score -= 10;
  else if (lp < THRESHOLDS.labor.criticallyLow) score -= 20;
  else if (lp < THRESHOLDS.labor.tooLow) score -= 10;

  // Prime cost thresholds — progressive
  if (pc > 65) score -= 20;
  else if (pc > 60) score -= 15;

  if (worstDay?.found) score -= PENALTIES.worstDay;
  score -= expenseSpikes.length * PENALTIES.expenseSpike;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate human-readable issues list
 */
function generateIssues(
  laborResult: ReturnType<typeof calculateLaborPct>,
  primeCostResult: ReturnType<typeof calculatePrimeCostPct>,
  worstDay: ReturnType<typeof findWorstDay>,
  expenseSpikes: ReturnType<typeof detectExpenseSpikes>
): string[] {
  const issues: string[] = [];

  // Labor issues — covers both HIGH (overspending) and LOW (understaffed)
  const lp = laborResult.percentage;
  if (laborResult.status === "critical") {
    if (lp < THRESHOLDS.labor.criticallyLow) {
      issues.push(`Labor is critically low at ${lp}% — severe understaffing risk`);
    } else {
      issues.push(`Labor is critically high at ${lp}% — overspending on staff`);
    }
  } else if (laborResult.status === "warning") {
    if (lp < THRESHOLDS.labor.tooLow) {
      issues.push(`Labor is low at ${lp}% — possible understaffing, check service quality`);
    } else {
      issues.push(`Labor is high at ${lp}%`);
    }
  }

  // Prime cost issues
  if (primeCostResult.status === "critical") {
    issues.push(`Prime cost is critically high at ${primeCostResult.percentage}%`);
  } else if (primeCostResult.status === "warning") {
    issues.push(`Prime cost is high at ${primeCostResult.percentage}%`);
  }

  // Worst day
  if (worstDay?.found) {
    issues.push(`${worstDay.day} has the worst revenue-to-labor ratio`);
  }

  // Expense spikes
  for (const spike of expenseSpikes) {
    issues.push(
      `${spike.category.charAt(0).toUpperCase() + spike.category.slice(1)} up ${spike.change}%`
    );
  }

  return issues;
}

/**
 * Main POST handler
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { data, previousMonthData } = validationResult.data;

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data provided" },
        { status: 400 }
      );
    }

    // FIX 1+2: Mismatch detection with date range strings and suggestion
    const mismatchResult = checkDateRangeMismatch(data);
    const mismatchWarning = mismatchResult.warning;
    const { salesDays, laborDays, salesDateRange, laborDateRange } = mismatchResult;
    const mismatchSuggestion = mismatchResult.suggestion;

    // FIX 3: Impossible number detection
    const impossibleWarning = validateNumbers(data);

    // Single-day warning
    const uniqueDates = new Set(data.map((r) => r.date));
    const singleDayWarning = uniqueDates.size === 1
      ? "⚠️ Only one day of data found. Need a full week for accurate best/worst day analysis."
      : null;

    // ── PAUSED STATE ─────────────────────────────────────────────────────────
    // Labor missing entirely OR significantly behind sales → results meaningless.
    // Return sentinel healthScore = -1 so the UI shows "--" (gray) instead of
    // a falsely healthy green score.
    const isPaused = laborDays === 0 || laborDays < salesDays - 2;
    if (isPaused) {
      const pauseReason = laborDays === 0
        ? "Calculation Paused. No labor data found. Upload your labor costs to see your true profitability."
        : `Calculation Paused. Labor data only covers ${laborDays} days vs. ${salesDays} sales days — results would be misleading. Upload matching date ranges to proceed.`;

      // Compute total revenue quickly for display, but return no analytics
      const seenPause = new Set<string>();
      let totalRevPaused = 0;
      for (const row of data) {
        if (seenPause.has(row.date)) continue;
        seenPause.add(row.date);
        totalRevPaused += row.revenue;
      }

      return NextResponse.json({
        success: true,
        paused: true,
        pauseReason,
        healthScore: -1,          // sentinel: UI shows "--"
        laborPct: 0,
        laborTarget: "28-32%",
        laborStatus: "unknown",
        primeCostPct: 0,
        primeCostTarget: "under 60%",
        primeCostStatus: "unknown",
        foodCostEstimated: false,
        totalFoodCost: 0,
        totalRevenue: Math.round(totalRevPaused * 100) / 100,
        totalLabor: 0,
        weeklySavings: 0,
        monthlySavings: 0,
        salesDays,
        laborDays,
        salesDateRange,
        laborDateRange,
        mismatchSuggestion: mismatchResult.suggestion,
        impossibleNumbers: false,
        expenseSpikes: [],
        warnings: [mismatchWarning, pauseReason].filter(Boolean) as string[],
        issues: [pauseReason],
        summary: {
          totalRevenue: Math.round(totalRevPaused * 100) / 100,
          totalLabor: 0,
          daysAnalyzed: data.length,
          uniqueDates: uniqueDates.size,
        },
      });
    }
    // ── END PAUSED STATE ─────────────────────────────────────────────────────

    const laborResult = calculateLaborPct(data);
    const primeCostResult = calculatePrimeCostPct(
      data,
      laborResult.totalLabor,
      laborResult.totalRevenue
    );
    const worstDay = findWorstDay(data);

    // BUG #2 FIX: Only include bestDay if it differs from worstDay
    const bestDayRaw = findBestDay(data);
    const bestDay = (bestDayRaw && worstDay && bestDayRaw.day === worstDay.day)
      ? null  // same day = meaningless comparison, suppress both
      : bestDayRaw;
    const effectiveWorstDay = (bestDayRaw && worstDay && bestDayRaw.day === worstDay.day)
      ? null
      : worstDay;

    const expenseSpikes = detectExpenseSpikes(data, previousMonthData);

    // Calculate health score
    const healthScore = calculateHealthScore(
      laborResult,
      primeCostResult,
      effectiveWorstDay,
      expenseSpikes
    );

    // Generate issues list — prepend any data quality warnings
    const issues = generateIssues(
      laborResult,
      primeCostResult,
      effectiveWorstDay,
      expenseSpikes
    );
    if (mismatchWarning) issues.unshift(mismatchWarning);
    if (impossibleWarning) issues.unshift(impossibleWarning);
    if (singleDayWarning) issues.unshift(singleDayWarning);

    // BUG #3 FIX: prime cost > 100% gets a hard CRITICAL issue label
    const pc = primeCostResult.percentage;
    if (pc >= 100) {
      issues.unshift(
        `🚨 CRITICAL: Prime Cost is ${pc.toFixed(1)}% — you are losing money on every sale. This commonly means your labor or expense file covers more days than your sales file. Check your date ranges first.`
      );
    }

    // BUG #4 FIX: Savings = actual monthly dollar gap to reach 60% prime cost target
    // If prime cost is X% and target is 60%, the monthly overspend is:
    //   gap = totalRevenue × (primeCostPct - 60) / 100
    // That is the real savings opportunity — not a weekly fraction.
    const TARGET_PRIME_COST = 60;
    const overBudgetPct = Math.max(0, pc - TARGET_PRIME_COST);
    const monthlySavings = Math.round((laborResult.totalRevenue * overBudgetPct) / 100);
    const weeklySavings = Math.round(monthlySavings / 4.33);

    const response: {
      success: boolean;
      paused?: false;
      healthScore: number;  // -1 = paused (only in early-return branch)
      laborPct: number;
      laborTarget: string;
      laborStatus: string;
      primeCostPct: number;
      primeCostTarget: string;
      primeCostStatus: string;
      foodCostEstimated: boolean;
      totalFoodCost: number;
      totalRevenue: number;
      totalLabor: number;
      weeklySavings: number;
      monthlySavings: number;
      salesDays: number;
      laborDays: number;
      salesDateRange: string;
      laborDateRange: string;
      mismatchSuggestion: string | null;
      impossibleNumbers: boolean;
      bestDay?: string;
      bestDayRevenue?: number;
      worstDay?: string;
      worstDayRevenue?: number;
      worstDayLabor?: number;
      worstDayLoss?: number;
      warnings: string[];
      expenseSpikes: Array<{
        category: string;
        change: number;
        lastMonth: number;
        thisMonth: number;
      }>;
      issues: string[];
      summary: {
        totalRevenue: number;
        totalLabor: number;
        daysAnalyzed: number;
        uniqueDates: number;
      };
    } = {
      success: true,
      healthScore,
      laborPct: laborResult.percentage,
      laborTarget: "28-32%",
      laborStatus: laborResult.status,
      primeCostPct: primeCostResult.percentage,
      primeCostTarget: "under 60%",
      primeCostStatus: primeCostResult.status,
      foodCostEstimated: primeCostResult.foodCostEstimated,
      totalFoodCost: Math.round(primeCostResult.totalFoodCost * 100) / 100,
      totalRevenue: Math.round(laborResult.totalRevenue * 100) / 100,
      totalLabor: Math.round(laborResult.totalLabor * 100) / 100,
      weeklySavings,
      monthlySavings,
      salesDays,
      laborDays,
      salesDateRange,
      laborDateRange,
      mismatchSuggestion,
      impossibleNumbers: impossibleWarning !== null,
      expenseSpikes,
      warnings: [mismatchWarning, impossibleWarning, singleDayWarning].filter(Boolean) as string[],
      issues,
      summary: {
        totalRevenue: Math.round(laborResult.totalRevenue * 100) / 100,
        totalLabor: Math.round(laborResult.totalLabor * 100) / 100,
        daysAnalyzed: data.length,
        uniqueDates: uniqueDates.size,
      },
    };

    if (bestDay) {
      response.bestDay = bestDay.day;
      response.bestDayRevenue = bestDay.revenue;
    }

    if (effectiveWorstDay?.found) {
      response.worstDay = effectiveWorstDay.day;
      response.worstDayRevenue = effectiveWorstDay.revenue;
      response.worstDayLabor = effectiveWorstDay.laborCost;
      response.worstDayLoss = effectiveWorstDay.loss;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Rules engine error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process rules",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
