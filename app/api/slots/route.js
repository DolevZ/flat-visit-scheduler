import { NextResponse } from "next/server";
import { buildAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slots = await buildAvailableSlots();
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "לא ניתן לטעון מועדים פנויים."
      },
      { status: 500 }
    );
  }
}
