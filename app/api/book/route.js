import { NextResponse } from "next/server";
import { createCalendarEvent, deleteCalendarEvent, hasCalendarOverlap } from "@/lib/calendar";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isBookedInSupabase, selectedSlotBelongsToActiveWindow } from "@/lib/slots";
import { cleanString, isValidPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const name = cleanString(payload?.name);
  const phone = cleanString(payload?.phone);
  const start = new Date(payload?.start);
  const end = new Date(payload?.end);

  if (!name) {
    return NextResponse.json({ error: "יש להזין שם פרטי." }, { status: 400 });
  }

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: "יש להזין מספר טלפון תקין." }, { status: 400 });
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return NextResponse.json({ error: "המועד שנבחר אינו תקין." }, { status: 400 });
  }

  if (start <= new Date()) {
    return NextResponse.json({ error: "לא ניתן לקבוע ביקור בעבר." }, { status: 400 });
  }

  try {
    const belongsToWindow = await selectedSlotBelongsToActiveWindow(start, end);
    if (!belongsToWindow) {
      return NextResponse.json(
        { error: "המועד שנבחר אינו חלק מחלון זמינות פעיל." },
        { status: 400 }
      );
    }

    const alreadyBooked = await isBookedInSupabase(start, end);
    if (alreadyBooked) {
      return NextResponse.json(
        { error: "המועד כבר נתפס. בחרו מועד אחר." },
        { status: 409 }
      );
    }

    const calendarBusy = await hasCalendarOverlap(start, end);
    if (calendarBusy) {
      return NextResponse.json(
        { error: "המועד אינו פנוי ביומן. בחרו מועד אחר." },
        { status: 409 }
      );
    }

    const calendarEvent = await createCalendarEvent({ name, phone, start, end });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        name,
        phone,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        calendar_event_id: calendarEvent.id,
        status: "booked"
      })
      .select("*")
      .single();

    if (error) {
      await deleteCalendarEvent(calendarEvent.id);
      throw error;
    }

    return NextResponse.json({ ok: true, booking: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "לא ניתן לקבוע ביקור.";
    const isConflict =
      message.includes("duplicate") ||
      message.includes("bookings_no_double_booking");

    return NextResponse.json(
      { error: isConflict ? "המועד כבר נתפס. בחרו מועד אחר." : message },
      { status: isConflict ? 409 : 500 }
    );
  }
}
