import { google } from "googleapis";
import { getGooglePrivateKey, getRequiredEnv, TIME_ZONE } from "@/lib/config";

let calendarClient;

function getCalendarClient() {
  if (!calendarClient) {
    const auth = new google.auth.JWT({
      email: getRequiredEnv("GOOGLE_CLIENT_EMAIL"),
      key: getGooglePrivateKey(),
      scopes: ["https://www.googleapis.com/auth/calendar"]
    });

    calendarClient = google.calendar({ version: "v3", auth });
  }

  return calendarClient;
}

export async function listCalendarEvents(start, end) {
  const calendar = getCalendarClient();
  const response = await calendar.events.list({
    calendarId: getRequiredEnv("GOOGLE_CALENDAR_ID"),
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime"
  });

  return response.data.items || [];
}

export async function hasCalendarOverlap(start, end) {
  const events = await listCalendarEvents(start, end);
  return events.some((event) => {
    const eventStart = event.start?.dateTime || event.start?.date;
    const eventEnd = event.end?.dateTime || event.end?.date;

    if (!eventStart || !eventEnd) return false;

    return new Date(eventStart) < end && new Date(eventEnd) > start;
  });
}

export async function createCalendarEvent({ name, phone, start, end }) {
  const calendar = getCalendarClient();
  const response = await calendar.events.insert({
    calendarId: getRequiredEnv("GOOGLE_CALENDAR_ID"),
    requestBody: {
      summary: `ביקור בדירה - ${name}`,
      description: `שם: ${name}\nטלפון: ${phone}\nמקור: FlatVisit Scheduler`,
      start: {
        dateTime: start.toISOString(),
        timeZone: TIME_ZONE
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: TIME_ZONE
      }
    }
  });

  return response.data;
}

export async function deleteCalendarEvent(eventId) {
  if (!eventId) return;

  const calendar = getCalendarClient();
  await calendar.events.delete({
    calendarId: getRequiredEnv("GOOGLE_CALENDAR_ID"),
    eventId
  });
}
