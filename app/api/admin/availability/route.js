import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateAvailabilityPayload } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("availability_windows")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ availabilityWindows: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "טעינת הזמינות נכשלה." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const validation = validateAvailabilityPayload(payload);
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("availability_windows")
      .insert(validation.data)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ availabilityWindow: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "יצירת הזמינות נכשלה." },
      { status: 500 }
    );
  }
}
