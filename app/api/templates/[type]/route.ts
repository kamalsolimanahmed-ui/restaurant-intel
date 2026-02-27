import { NextRequest, NextResponse } from "next/server";

const TEMPLATES: Record<string, { filename: string; content: string }> = {
    sales: {
        filename: "sales_template.csv",
        content: [
            "date,revenue",
            "2024-01-01,3250.00",
            "2024-01-02,2980.50",
            "2024-01-03,4100.75",
            "2024-01-04,3750.00",
            "2024-01-05,5200.25",
            "2024-01-06,6100.00",
            "2024-01-07,4850.50",
        ].join("\n"),
    },
    labor: {
        filename: "labor_template.csv",
        content: [
            "date,labor_cost,labor_hours",
            "2024-01-01,975.00,42.5",
            "2024-01-02,820.50,36.0",
            "2024-01-03,1050.00,45.0",
            "2024-01-04,900.00,39.5",
            "2024-01-05,1200.00,52.0",
            "2024-01-06,1450.00,63.0",
            "2024-01-07,1100.50,48.0",
        ].join("\n"),
    },
    expenses: {
        filename: "expenses_template.csv",
        content: [
            "date,expense_amount,expense_category",
            "2024-01-01,320.00,Food & Beverage",
            "2024-01-02,85.50,Utilities",
            "2024-01-03,450.00,Food & Beverage",
            "2024-01-04,120.00,Supplies",
            "2024-01-05,600.00,Food & Beverage",
            "2024-01-06,200.00,Marketing",
            "2024-01-07,75.00,Maintenance",
        ].join("\n"),
    },
};

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
): Promise<NextResponse> {
    const { type } = await params;
    const template = TEMPLATES[type];

    if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return new NextResponse(template.content, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${template.filename}"`,
            "Cache-Control": "public, max-age=86400",
        },
    });
}
