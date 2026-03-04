import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error(
                "STRIPE_SECRET_KEY is missing. Did you restart your Next.js dev server after updating .env.local?"
            );
            return NextResponse.json(
                {
                    error: "Stripe configuration is missing on the server. Please restart your dev server (Ctrl+C then npm run dev) to load the new environment variables.",
                },
                { status: 500 }
            );
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2023-10-16" as any,
        });

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { origin } = new URL(req.url);

        // Create a Stripe Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Restaurant Intel Pro",
                            description:
                                "Unlimited monthly analyses & Deep Analysis AI recommendations",
                        },
                        unit_amount: 1500, // $15.00
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${origin}/dashboard?success=true`,
            cancel_url: `${origin}/checkout`,
            customer_email: session.user.email,
            client_reference_id: session.user.id,
            metadata: {
                userId: session.user.id,
                restaurantId: session.user.restaurantId,
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (err: any) {
        console.error("Stripe Checkout Error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
