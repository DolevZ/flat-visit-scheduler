import { getSupabaseAdmin } from "@/lib/supabase";
import { addMinutes, toIso, zonedDateTimeToUtc } from "@/lib/time";
import { listCalendarEvents } from "@/lib/calendar";

export function generateSlotsForWindow(window) {
  const slots = [];
  const duration = Number(window.slot_duration_minutes);
  const windowStart = zonedDateTimeToUtc(window.date, window.start_time);
  const windowEnd = zonedDateTimeToUtc(window.date, window.end_time);

  for (
    let start = windowStart;
    addMinutes(start, duration) <= windowEnd;
    start = addMinutes(start, duration)
  ) {
    const end = addMinutes(start, duration);
    slots.push({
      start: toIso(start),
      end: toIso(end),
      availabilityWindowId: window.id
    });
  }

  return slots;
}

export function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export async function getActiveAvailabilityWindows() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("availability_windows")
    .select("*")
    .eq("is_active", true)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getBookedSlotsBetween(start, end) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("start_time,end_time")
    .eq("status", "booked")
    .lt("start_time", end.toISOString())
    .gt("end_time", start.toISOString());

  if (error) throw error;
  return data || [];
}

export async function isBookedInSupabase(start, end) {
  const bookings = await getBookedSlotsBetween(start, end);
  return bookings.length > 0;
}

export async function selectedSlotBelongsToActiveWindow(start, end) {
  const windows = await getActiveAvailabilityWindows();

  return windows.some((window) =>
    generateSlotsForWindow(window).some(
      (slot) => slot.start === start.toISOString() && slot.end === end.toISOString()
    )
  );
}

export async function buildAvailableSlots() {
  const windows = await getActiveAvailabilityWindows();
  const now = new Date();
  const generatedSlots = windows
    .flatMap(generateSlotsForWindow)
    .filter((slot) => new Date(slot.start) > now);

  if (generatedSlots.length === 0) return [];

  const minStart = new Date(
    Math.min(...generatedSlots.map((slot) => new Date(slot.start).getTime()))
  );
  const maxEnd = new Date(
    Math.max(...generatedSlots.map((slot) => new Date(slot.end).getTime()))
  );
  const bookings = await getBookedSlotsBetween(minStart, maxEnd);
  const calendarEvents = await listCalendarEvents(minStart, maxEnd);

  const freeSlots = [];

  for (const slot of generatedSlots) {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    const booked = bookings.some((booking) =>
      intervalsOverlap(
        slotStart,
        slotEnd,
        new Date(booking.start_time),
        new Date(booking.end_time)
      )
    );

    if (booked) continue;

    const calendarBusy = calendarEvents.some((event) => {
      const eventStart = event.start?.dateTime || event.start?.date;
      const eventEnd = event.end?.dateTime || event.end?.date;

      if (!eventStart || !eventEnd) return false;

      return intervalsOverlap(slotStart, slotEnd, new Date(eventStart), new Date(eventEnd));
    });

    if (!calendarBusy) freeSlots.push(slot);
  }

  return freeSlots;
}
