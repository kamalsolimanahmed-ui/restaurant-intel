import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Input validation schema
const ExpenseSpikeSchema = z.object({
  category: z.string(),
  change: z.number(),
  lastMonth: z.number().optional(),
  thisMonth: z.number().optional(),
});

const RequestSchema = z.object({
  healthScore: z.number().min(-1).max(100),  // -1 = paused sentinel
  pauseReason: z.string().optional(),         // set when paused
  laborPct: z.number().optional(),
  primeCostPct: z.number().optional(),
  totalRevenue: z.number().optional(),
  // BUG #4 FIX: savings are now pre-computed accurately by the rules engine
  weeklySavings: z.number().optional(),
  monthlySavings: z.number().optional(),
  worstDay: z.string().optional(),
  worstDayRevenue: z.number().optional(),
  worstDayLabor: z.number().optional(),
  worstDayLoss: z.number().optional(),
  expenseSpikes: z.array(ExpenseSpikeSchema).optional(),
  issues: z.array(z.string()).optional(),
});

type InsightInput = z.infer<typeof RequestSchema>;

// Severity levels
const SEVERITY = {
  HEALTHY: "healthy",
  WARNING: "warning",
  AT_RISK: "at_risk",
  CRITICAL: "critical",
} as const;

type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

/**
 * Get severity based on health score
 */
function getSeverity(healthScore: number): Severity {
  if (healthScore >= 90) return SEVERITY.HEALTHY;  // only truly healthy if no penalties
  if (healthScore >= 65) return SEVERITY.WARNING;
  if (healthScore >= 40) return SEVERITY.AT_RISK;
  return SEVERITY.CRITICAL;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/**
 * Format weekly savings to monthly
 */
function formatSavings(weeklySavings: number): string {
  const monthlySavings = weeklySavings * 4;
  return `$${weeklySavings}/week = $${monthlySavings}/month`;
}

/**
 * Get the primary issue to focus on
 */
function getPrimaryIssue(input: InsightInput): {
  type: "labor" | "worst_day" | "expense" | "prime_cost";
  details: string;
  weeklySavings: number;
} {
  const { worstDay, worstDayLoss, expenseSpikes, laborPct, issues = [] } = input;

  // Priority 1: Worst day with significant loss
  if (worstDay && worstDayLoss && worstDayLoss > 100) {
    return {
      type: "worst_day",
      details: `${worstDay} loses ${formatCurrency(worstDayLoss)}`,
      weeklySavings: worstDayLoss,
    };
  }

  // Priority 2: High labor cost
  if (laborPct && laborPct > 35) {
    const estimatedSavings = Math.round((laborPct - 32) * 10); // Rough estimate
    return {
      type: "labor",
      details: `Labor at ${laborPct}%`,
      weeklySavings: estimatedSavings,
    };
  }

  // Priority 3: Expense spikes
  if (expenseSpikes && expenseSpikes.length > 0) {
    const spike = expenseSpikes[0];
    const thisMonth = spike.thisMonth || 0;
    const lastMonth = spike.lastMonth || 0;
    return {
      type: "expense",
      details: `${spike.category} up ${spike.change}%`,
      weeklySavings: Math.round((thisMonth - lastMonth) / 4),
    };
  }

  // Priority 4: Worst day with smaller loss
  if (worstDay && worstDayLoss && worstDayLoss > 0) {
    return {
      type: "worst_day",
      details: `${worstDay} underperforming`,
      weeklySavings: worstDayLoss,
    };
  }

  // Default fallback
  return {
    type: "labor",
    details: "Labor costs",
    weeklySavings: 150,
  };
}

/**
 * Generate insight paragraph based on health score and issues
 */
function generateInsight(input: InsightInput): {
  insight: string;
  action: string;
  savings: string;
  severity: Severity;
} {
  const {
    healthScore,
    laborPct = 0,
    primeCostPct = 0,
    totalRevenue = 0,
    weeklySavings: precomputedWeekly,
    monthlySavings: precomputedMonthly,
    worstDay,
    worstDayRevenue,
    worstDayLabor,
    worstDayLoss,
    expenseSpikes = [],
  } = input;

  const severity = getSeverity(healthScore);

  // ── Savings string (BUG #4 FIX) ─────────────────────────────────────────
  // Use rules-engine pre-computed savings (exact dollar gap) if available;
  // fall back to the primaryIssue estimate only if not provided.
  const primaryIssue = getPrimaryIssue(input);
  const weeklySavings = precomputedWeekly ?? primaryIssue.weeklySavings;
  const monthlySavings = precomputedMonthly ?? Math.round(weeklySavings * 4.33);
  const savingsStr = weeklySavings > 0
    ? `${formatCurrency(weeklySavings)}/week = ${formatCurrency(monthlySavings)}/month potential savings`
    : "$0/week = $0/month";
  // ─────────────────────────────────────────────────────────────────────────

  // ── BUG #3 / FIX 1: Prime cost ≥ 100% = hard CRITICAL ──────────────────
  if (primeCostPct >= 100) {
    // FIX 1: If data is clearly broken (>150%), suspend savings rather than
    // showing a meaningless dollar figure
    const savingsDisplay = primeCostPct > 150
      ? "💾 Savings: Calculation suspended until data range is verified."
      : savingsStr;

    return {
      insight: `CRITICAL: Your Prime Cost is ${primeCostPct.toFixed(1)}%. This means you are spending MORE than you earn on labor and food combined — you lose money on every single sale. Most likely your labor or expense file covers more days than your sales file. Check your date ranges first, then audit your biggest cost driver.`,
      action: "Verify date ranges match across all three files, then cut your largest cost immediately",
      savings: savingsDisplay,
      severity: SEVERITY.CRITICAL,
    };
  }

  // ── Prime cost check (60–99%) ────────────────────────────────────────────
  if (primeCostPct > 60) {
    const overBy = (primeCostPct - 60).toFixed(1);
    return {
      insight: `Your Prime Cost is ${primeCostPct.toFixed(1)}%, which is ${overBy}% above the 60% target. Review ingredient waste and vendor prices to recover your margins.`,
      action: "Audit food waste and renegotiate supplier contracts",
      savings: savingsStr,
      severity: primeCostPct > 65 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
    };
  }

  // HEALTHY — prime cost is fine, report clean bill of health
  if (severity === SEVERITY.HEALTHY) {
    const laborNote = laborPct > 0 ? `Labor is solid at ${laborPct.toFixed(1)}%.` : "";
    return {
      insight: `Your restaurant is running efficiently. ${laborNote} Prime cost at ${primeCostPct.toFixed(1)}% — within the 60% target. Keep monitoring monthly.`.trim(),
      action: "Continue current operations and monitor monthly",
      savings: "$0/week = $0/month",
      severity,
    };
  }

  // WARNING (60-79)
  if (severity === SEVERITY.WARNING) {
    // Prime cost over budget — use exact spec template
    if (primeCostPct > 60) {
      return {
        insight: `Your Prime Cost is ${primeCostPct.toFixed(1)}%, above the 60% target. Review ingredient waste or vendor prices to improve margins.`,
        action: `Audit food waste and renegotiate supplier contracts`,
        savings: savingsStr,
        severity,
      };
    }

    if (primaryIssue.type === "worst_day" && worstDay && worstDayLoss) {
      const staffCount = worstDayLabor ? Math.round(worstDayLabor / 85) : 4;
      return {
        insight: `Your weakest day this month is ${worstDay}. You're paying ${staffCount} staff but averaging ${formatCurrency(worstDayRevenue || 0)} in revenue. Cut one position and save ${formatCurrency(worstDayLoss)} every week.`,
        action: `Cut one ${worstDay} shift`,
        savings: savingsStr,
        severity,
      };
    }

    if (primaryIssue.type === "labor" && laborPct > 32) {
      const overBy = (laborPct - 32).toFixed(2);
      return {
        insight: `Your labor cost is ${laborPct.toFixed(2)}% — ${overBy}% above the 32% target. Review scheduling and reduce hours during slow periods.`,
        action: "Audit staff schedules — cut slowest shifts first",
        savings: savingsStr,
        severity,
      };
    }

    if (primaryIssue.type === "expense" && expenseSpikes.length > 0) {
      const spike = expenseSpikes[0];
      return {
        insight: `Your ${spike.category} costs jumped ${spike.change}% this month (from ${formatCurrency(spike.lastMonth || 0)} to ${formatCurrency(spike.thisMonth || 0)}). This is compressing your margins.`,
        action: `Audit ${spike.category} usage and supplier pricing`,
        savings: savingsStr,
        severity,
      };
    }

    return {
      insight: `Your restaurant needs attention. Labor at ${laborPct.toFixed(2)}% and prime cost at ${primeCostPct.toFixed(2)}%. Target is under 60% prime cost and 28-32% labor.`,
      action: "Review your biggest cost driver this week",
      savings: savingsStr,
      severity,
    };
  }

  // AT RISK (40-59)
  if (severity === SEVERITY.AT_RISK) {
    const issues: string[] = [];
    const actions: string[] = [];

    if (laborPct > 35) {
      issues.push(`Labor at ${laborPct.toFixed(2)}% (target: 28-32%)`);
      actions.push("cut staff on your slowest days");
    }
    if (primeCostPct > 60) {
      issues.push(`Prime cost at ${primeCostPct.toFixed(2)}% (target: under 60%)`);
      actions.push("audit food waste and renegotiate supplier contracts");
    }
    if (expenseSpikes.length > 0) {
      const spike = expenseSpikes[0];
      issues.push(`${spike.category} up ${spike.change}%`);
      actions.push(`audit ${spike.category} spending`);
    }
    if (worstDay && worstDayLoss) {
      issues.push(`${worstDay} is your weakest day`);
      actions.push(`reduce ${worstDay} labour`);
    }

    return {
      insight: `Your margins are under pressure: ${issues.join(" + ")}. Act now.`,
      action: actions.join(" AND ") || "Cut costs immediately",
      savings: savingsStr,
      severity,
    };
  }

  // CRITICAL (<40)
  const criticalIssues: string[] = [];
  const criticalActions: string[] = [];

  if (laborPct > 35) {
    criticalIssues.push(`Labor at ${laborPct.toFixed(2)}% — ${(laborPct - 32).toFixed(2)}% above target`);
    criticalActions.push("cut staff on your slowest days immediately");
  }
  if (primeCostPct > 60) {
    criticalIssues.push(`Prime cost at ${primeCostPct.toFixed(2)}% (target: under 60%)`);
    criticalActions.push("audit food waste and renegotiate supplier contracts");
  }
  if (expenseSpikes.length > 0) {
    criticalIssues.push(`${expenseSpikes[0].category} costs spiked ${expenseSpikes[0].change}%`);
  }

  return {
    insight: `Critical: ${criticalIssues.join(". ") || "Multiple cost issues"}. Immediate action required.`,
    action: criticalActions.join(" AND ") || "Emergency cost review",
    savings: savingsStr,
    severity,
  };
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

    const input = validationResult.data;

    // ── PAUSED STATE: labor missing or severely mismatched ──────────────
    // healthScore = -1 is the sentinel emitted by the rules engine.
    if (input.healthScore < 0) {
      const pauseMsg = input.pauseReason
        ?? "Calculation Paused. Please upload Labor data to see your true profitability.";
      return NextResponse.json({
        success: true,
        insight: pauseMsg,
        action: "Upload matching labor data covering the same date range as your sales file.",
        savings: "N/A — complete your data to unlock savings insights.",
        severity: "at_risk",
        healthScore: -1,
        laborPct: null,
        primeCostPct: null,
        laborTarget: "28-32%",
        primeCostTarget: "under 60%",
      });
    }

    // Generate insight
    const { insight, action, savings, severity } = generateInsight(input);

    return NextResponse.json({
      success: true,
      insight,
      action,
      savings,
      severity,
      healthScore: input.healthScore,
      laborPct: input.laborPct,
      primeCostPct: input.primeCostPct,
      laborTarget: "28-32%",
      primeCostTarget: "under 60%",
    });
  } catch (error) {
    console.error("Insights engine error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
