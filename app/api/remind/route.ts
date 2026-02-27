import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: "Not authenticated" },
                { status: 401 }
            );
        }

        if (!process.env.RESEND_API_KEY) {
            // Silently succeed in dev if key not configured — don't break the UI
            console.warn("RESEND_API_KEY not set — skipping email reminder");
            return NextResponse.json({ success: true, skipped: true });
        }

        const restaurantName = session.user.restaurantName || "your restaurant";
        const userEmail = session.user.email;

        // Schedule reminder email (send immediately — in production use a queue/cron)
        const { error } = await resend.emails.send({
            from: "Restaurant Intel <reminders@restaurantintel.com>",
            to: userEmail,
            subject: "📊 Time to upload your monthly data",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px;">
            Monthly Analysis Reminder
          </h1>
          <p style="color: #6b7280; margin-bottom: 24px;">Hi there,</p>
          <p style="color: #374151; margin-bottom: 16px;">
            It's time to upload your monthly data for <strong>${restaurantName}</strong> 
            and get your latest health score.
          </p>
          <p style="color: #374151; margin-bottom: 32px;">
            Upload your sales, labor, and expense files to see what's changed and 
            what action to take this month.
          </p>
          <a 
            href="${process.env.AUTH_URL || "http://localhost:3000"}/dashboard"
            style="
              display: inline-block;
              background: #16a34a;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
            "
          >
            Upload This Month's Data →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
            Restaurant Intel · You requested this reminder from your results page.
          </p>
        </div>
      `,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json(
                { success: false, error: "Failed to send reminder email" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Remind error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send reminder" },
            { status: 500 }
        );
    }
}
