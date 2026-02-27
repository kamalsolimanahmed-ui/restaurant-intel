import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrialReminderEmail, sendTrialExpiredEmail } from "@/lib/email";

// Force dynamic rendering for API route
export const dynamic = "force-dynamic";

// Secure this endpoint with a secret token
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Day 13: Trial ends in 1 day (trialEndsAt = tomorrow)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Day 14: Trial ends today (trialEndsAt = today)
    
    // Find users whose trial ends tomorrow (Day 13 reminder)
    const day13Users = await prisma.user.findMany({
      where: {
        subscribed: false,
        trialEndsAt: {
          gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
          lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1),
        },
      },
      include: {
        restaurant: true,
      },
    });

    // Find users whose trial ends today (Day 14 expired notification)
    const day14Users = await prisma.user.findMany({
      where: {
        subscribed: false,
        trialEndsAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
      include: {
        restaurant: true,
      },
    });

    // Send Day 13 reminders
    const day13Results = [];
    for (const user of day13Users) {
      try {
        await sendTrialReminderEmail(
          user.email,
          user.restaurant?.name || "Your Restaurant",
          user.trialEndsAt!
        );
        day13Results.push({
          email: user.email,
          status: "sent",
          type: "day13_reminder",
        });
      } catch (error) {
        day13Results.push({
          email: user.email,
          status: "failed",
          type: "day13_reminder",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Send Day 14 expired notifications
    const day14Results = [];
    for (const user of day14Users) {
      try {
        await sendTrialExpiredEmail(
          user.email,
          user.restaurant?.name || "Your Restaurant"
        );
        day14Results.push({
          email: user.email,
          status: "sent",
          type: "day14_expired",
        });
      } catch (error) {
        day14Results.push({
          email: user.email,
          status: "failed",
          type: "day14_expired",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reminders sent successfully",
      stats: {
        day13: {
          total: day13Users.length,
          sent: day13Results.filter(r => r.status === "sent").length,
          failed: day13Results.filter(r => r.status === "failed").length,
        },
        day14: {
          total: day14Users.length,
          sent: day14Results.filter(r => r.status === "sent").length,
          failed: day14Results.filter(r => r.status === "failed").length,
        },
      },
      results: {
        day13: day13Results,
        day14: day14Results,
      },
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}