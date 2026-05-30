import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateAvailabilityPayload } from "@/lib/validation";

async function getId(params) {
  const resolvedParams = await params;
  return resolvedParams.id;
}

export async function PUT(request, { params }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const id = await getId(params);
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
      .update(validation.data)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ availabilityWindow: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "עדכון הזמינות נכשל." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const id = await getId(params);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("availability_windows").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "מחיקת הזמינות נכשלה." },
      { status: 500 }
    );
  }
}
