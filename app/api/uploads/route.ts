import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateUploadSchema = z.object({
  fileName: z.string(),
  fileType: z.enum(["sales", "labor", "expenses"]),
  periodStart: z.string(),
  periodEnd: z.string(),
});

// POST /api/uploads - Create a new upload record
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = CreateUploadSchema.safeParse(body);

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

    const upload = await prisma.upload.create({
      data: {
        restaurantId: session.user.restaurantId,
        fileName: data.fileName,
        fileType: data.fileType,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
      },
    });

    return NextResponse.json({
      success: true,
      upload,
    });
  } catch (error) {
    console.error("Create upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/uploads - Get all uploads for current user's restaurant
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const uploads = await prisma.upload.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      uploads,
    });
  } catch (error) {
    console.error("Get uploads error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch uploads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
