import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SaveAnalysisSchema = z.object({
  uploadId: z.string().uuid(),
  healthScore: z.number().min(-1).max(100),  // -1 = paused/incomplete
  laborPct: z.number().optional(),
  laborTarget: z.string().optional(),
  primeCostPct: z.number().optional(),
  primeCostTarget: z.string().optional(),
  totalRevenue: z.number().optional(),
  totalLabor: z.number().optional(),
  bestDay: z.string().optional(),
  bestDayRevenue: z.number().optional(),
  worstDay: z.string().optional(),
  worstDayRevenue: z.number().optional(),
  worstDayLabor: z.number().optional(),
  worstDayLoss: z.number().optional(),
  insight: z.string(),
  action: z.string(),
  savings: z.string(),
  severity: z.enum(["healthy", "warning", "at_risk", "critical"]),
  pdfUrl: z.string().optional(),
  foodCostEstimated: z.boolean().optional(),
  salesDays: z.number().int().optional(),
  laborDays: z.number().int().optional(),
  salesDateRange: z.string().optional(),
  laborDateRange: z.string().optional(),
  // Financial data rows to save
  financialData: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      laborCost: z.number(),
      laborHours: z.number().optional(),
      expenseAmount: z.number().optional(),
      expenseCategory: z.string().optional(),
    })
  ).optional(),
});

// POST /api/analyses/save - Save a new analysis
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const restaurantId = session.user.restaurantId;

    // ── GATE: trial expired + not paying → max 1 analysis ───────────────────
    const isPaying = session.user.subscribed === true;
    const trialEndsAt = session.user.trialEndsAt
      ? new Date(session.user.trialEndsAt)
      : null;
    const trialExpired = !trialEndsAt || new Date() > trialEndsAt;

    if (trialExpired && !isPaying) {
      const existingCount = await prisma.analysis.count({
        where: { restaurantId },
      });
      if (existingCount >= 1) {
        return NextResponse.json(
          { success: false, error: "UPGRADE_REQUIRED", upgradeRequired: true },
          { status: 403 }
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const body = await request.json();
    const validationResult = SaveAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the analysis
    const analysis = await prisma.analysis.create({
      data: {
        restaurantId,
        uploadId: data.uploadId,
        healthScore: data.healthScore,
        laborPct: data.laborPct,
        laborTarget: data.laborTarget,
        primeCostPct: data.primeCostPct,
        primeCostTarget: data.primeCostTarget,
        totalRevenue: data.totalRevenue,
        totalLabor: data.totalLabor,
        bestDay: data.bestDay,
        bestDayRevenue: data.bestDayRevenue,
        worstDay: data.worstDay,
        worstDayRevenue: data.worstDayRevenue,
        worstDayLabor: data.worstDayLabor,
        worstDayLoss: data.worstDayLoss,
        insight: data.insight,
        action: data.action,
        savings: data.savings,
        severity: data.severity,
        pdfUrl: data.pdfUrl,
        foodCostEstimated: data.foodCostEstimated ?? false,
        salesDays: data.salesDays,
        laborDays: data.laborDays,
        salesDateRange: data.salesDateRange,
        laborDateRange: data.laborDateRange,
      },
    });

    // Save financial data if provided
    if (data.financialData && data.financialData.length > 0) {
      await prisma.financialData.createMany({
        data: data.financialData.map((row) => ({
          restaurantId,
          uploadId: data.uploadId,
          date: new Date(row.date),
          revenue: row.revenue,
          laborCost: row.laborCost,
          laborHours: row.laborHours,
          expenseAmount: row.expenseAmount,
          expenseCategory: row.expenseCategory,
        })),
      });
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Save analysis error:", error);
    if (error && typeof error === "object" && "code" in error) {
      console.error("Prisma error code:", (error as { code: string }).code);
      console.error("Prisma error meta:", JSON.stringify((error as { meta?: unknown }).meta));
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    const code = (error && typeof error === "object" && "code" in error)
      ? String((error as { code: string }).code)
      : undefined;
    return NextResponse.json(
      { success: false, error: "Failed to save analysis", details: message, code },
      { status: 500 }
    );
  }
}

