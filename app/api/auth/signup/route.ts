import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Force dynamic rendering for API route
export const dynamic = "force-dynamic";

const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  restaurantName: z.string().min(1, "Restaurant name is required"),
  country: z.enum(["US", "UK", "ES", "FR", "Other"]).default("US"),
  currency: z.enum(["USD", "GBP", "EUR"]).default("USD"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = SignupSchema.safeParse(body);
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

    const { email, password, restaurantName, country, currency } =
      validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create restaurant first
    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        country,
        currency,
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        restaurantId: restaurant.id,
        trialEndsAt,
        subscribed: false,
      },
    });

    return NextResponse.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

