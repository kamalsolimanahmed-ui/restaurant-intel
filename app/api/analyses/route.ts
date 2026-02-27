import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/analyses - Get all analyses for current user's restaurant
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const analyses = await prisma.analysis.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        healthScore: true,
        createdAt: true,
        // Day metrics
        worstDay: true,
        bestDay: true,
        bestDayRevenue: true,
        // Totals
        totalRevenue: true,
        totalLabor: true,
        // Percentages
        laborPct: true,
        primeCostPct: true,
        // Insight
        insight: true,
        severity: true,
        // Flags
        foodCostEstimated: true,
        pdfUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error("Get analyses error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analyses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
