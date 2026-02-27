import { NextResponse } from "next/server";

/**
 * Paddle Checkout Placeholder
 *
 * This endpoint will eventually create a real Paddle checkout session
 * and return the hosted checkout URL. For now it returns a stub so the
 * checkout page can be tested end-to-end without Paddle credentials.
 *
 * TODO: Replace stub with real Paddle Billing integration once
 *       PADDLE_API_KEY and PADDLE_PRICE_ID are available in .env.local
 */
export async function POST() {
    // ── Stub: return a placeholder URL ──────────────────────────────────────────
    // When Paddle is wired up, replace this with:
    //
    //   const paddle = new Paddle(process.env.PADDLE_API_KEY!);
    //   const session = await paddle.transactionItems.create({ ... });
    //   return NextResponse.json({ checkoutUrl: session.checkoutUrl });
    //
    return NextResponse.json({
        success: true,
        checkoutUrl: "/checkout?pending=true", // placeholder — real URL comes from Paddle
        message: "Paddle integration pending. Real checkout URL will be returned here.",
    });
}
