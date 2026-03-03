import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RestaurantAnalysisData } from "@/lib/deepseek";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
});

// GET /api/analyses/[id]/ai-insight
// Returns cached AI insight if exists, otherwise generates, streams, and saves it
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    try {
        const session = await auth();

        if (!session?.user?.restaurantId) {
            return new Response(JSON.stringify({ error: "Not authenticated" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { id } = await params;

        // Fetch the analysis from DB
        const analysis = await prisma.analysis.findFirst({
            where: { id, restaurantId: session.user.restaurantId },
            include: { restaurant: { select: { name: true } } },
        });

        if (!analysis) {
            return new Response(JSON.stringify({ error: "Analysis not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // ── CACHE HIT: already generated, return instantly ───────────────────────
        if (analysis.aiInsight) {
            return new Response(analysis.aiInsight, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "X-Cache": "HIT",
                },
            });
        }

        // ── CACHE MISS: call DeepSeek, stream to client, save when done ──────────
        const data: RestaurantAnalysisData = {
            healthScore: analysis.healthScore,
            laborPct: analysis.laborPct ? Number(analysis.laborPct) : null,
            primeCostPct: analysis.primeCostPct ? Number(analysis.primeCostPct) : null,
            totalRevenue: analysis.totalRevenue ? Number(analysis.totalRevenue) : null,
            totalLabor: analysis.totalLabor ? Number(analysis.totalLabor) : null,
            bestDay: analysis.bestDay,
            bestDayRevenue: analysis.bestDayRevenue ? Number(analysis.bestDayRevenue) : null,
            worstDay: analysis.worstDay,
            worstDayRevenue: analysis.worstDayRevenue ? Number(analysis.worstDayRevenue) : null,
            worstDayLabor: analysis.worstDayLabor ? Number(analysis.worstDayLabor) : null,
            worstDayLoss: analysis.worstDayLoss ? Number(analysis.worstDayLoss) : null,
            salesDays: analysis.salesDays,
            laborDays: analysis.laborDays,
            salesDateRange: analysis.salesDateRange,
            laborDateRange: analysis.laborDateRange,
            foodCostEstimated: analysis.foodCostEstimated,
            restaurantName: analysis.restaurant?.name,
            createdAt: analysis.createdAt.toISOString(),
        };

        const prompt = buildPrompt(data);

        // Stream DeepSeek response to client AND accumulate it for DB save
        const stream = new ReadableStream({
            async start(controller) {
                let fullText = "";
                try {
                    const completion = await deepseek.chat.completions.create({
                        model: "deepseek-chat",
                        stream: true,
                        max_tokens: 500,
                        temperature: 0.5,
                        messages: [
                            {
                                role: "system",
                                content:
                                    "You are a sharp restaurant financial advisor. Give exactly 3 numbered actions, each on its own line. Be specific with dollar amounts. No fluff.",
                            },
                            { role: "user", content: prompt },
                        ],
                    });

                    for await (const chunk of completion) {
                        const text = chunk.choices[0]?.delta?.content ?? "";
                        if (text) {
                            fullText += text;
                            controller.enqueue(new TextEncoder().encode(text));
                        }
                    }

                    // Save the full AI insight to DB so next visit uses the cache
                    if (fullText) {
                        await prisma.analysis.update({
                            where: { id },
                            data: { aiInsight: fullText },
                        }).catch((err) => {
                            // Non-fatal — cache save failure shouldn't break the response
                            console.error("Failed to cache AI insight:", err);
                        });
                    }

                    controller.close();
                } catch (err) {
                    console.error("DeepSeek stream error:", err);
                    const errMsg = err instanceof Error ? err.message : "Unknown error";
                    controller.enqueue(
                        new TextEncoder().encode(`\n\n[AI Error: ${errMsg}]`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-store",
                "X-Accel-Buffering": "no",
                "Transfer-Encoding": "chunked",
                "X-Cache": "MISS",
            },
        });
    } catch (error) {
        console.error("AI insight route error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate AI insights" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

function buildPrompt(data: RestaurantAnalysisData): string {
    const {
        laborPct, primeCostPct, totalRevenue, totalLabor,
        worstDay, worstDayRevenue, worstDayLabor, worstDayLoss,
        bestDay, bestDayRevenue, salesDays, laborDays, restaurantName,
    } = data;

    const monthlyRev = totalRevenue && salesDays
        ? Math.round(totalRevenue * (30 / salesDays)) : null;
    const monthlyLabor = totalLabor && laborDays
        ? Math.round(totalLabor * (30 / laborDays)) : null;

    return `Analyze this restaurant and give 3 specific money-saving actions with exact dollar amounts:

RESTAURANT: ${restaurantName || "Restaurant"}
Revenue (period): $${totalRevenue?.toLocaleString() ?? "N/A"}  |  Estimated monthly: $${monthlyRev?.toLocaleString() ?? "N/A"}
Labor: ${laborPct?.toFixed(1) ?? "N/A"}% of sales  |  Labor cost: $${totalLabor?.toLocaleString() ?? "N/A"}  |  Monthly labor: $${monthlyLabor?.toLocaleString() ?? "N/A"}
Prime Cost: ${primeCostPct?.toFixed(1) ?? "N/A"}% (target <60%)
Worst Day: ${worstDay ?? "N/A"} — avg revenue $${worstDayRevenue?.toLocaleString() ?? "N/A"}, avg labor $${worstDayLabor?.toLocaleString() ?? "N/A"}, avg loss $${worstDayLoss?.toLocaleString() ?? "N/A"}
Best Day: ${bestDay ?? "N/A"} — avg revenue $${bestDayRevenue?.toLocaleString() ?? "N/A"}

Write 3 numbered actions. Each must:
- Name a specific action (e.g. "Cut Tuesday lunch shift")
- State the exact dollar saving per month
- Give one sentence of rationale

Respond ONLY with the 3 numbered actions. No intro, no conclusion.`;
}
