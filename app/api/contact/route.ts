import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY!);

const ContactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = ContactSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, message } = parsed.data;

        // Email to the owner (you)
        const ownerEmail = await resend.emails.send({
            from: "Restaurant Intel Contact <onboarding@resend.dev>",
            to: "cymalima53@gmail.com",
            subject: `New contact message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: "${message}"`,
            replyTo: email,
        });

        if (ownerEmail.error) {
            throw new Error(`Failed to send owner email: ${ownerEmail.error.message}`);
        }

        // Confirmation email to the customer
        const customerEmail = await resend.emails.send({
            from: "Restaurant Intel <onboarding@resend.dev>",
            to: email,
            subject: "We received your message",
            text: "Thanks for contacting us. We'll respond within 24 hours.",
        });

        if (customerEmail.error) {
            console.warn(`Customer confirmation email blocked (likely Resend Free Tier restriction): ${customerEmail.error.message}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to send contact emails:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : JSON.stringify(error) }, // EXPOSE ERROR
            { status: 500 }
        );
    }
}
