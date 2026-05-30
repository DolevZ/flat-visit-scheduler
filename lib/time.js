import { TIME_ZONE } from "@/lib/constants";

const formatterParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

export function getTimeZoneOffset(date) {
  const parts = Object.fromEntries(
    formatterParts.formatToParts(date).map((part) => [part.type, part.value])
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

export function zonedDateTimeToUtc(dateString, timeString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const approximateUtc = new Date(localAsUtc);
  const offset = getTimeZoneOffset(approximateUtc);
  const firstPass = new Date(localAsUtc - offset);
  const correctedOffset = getTimeZoneOffset(firstPass);

  return new Date(localAsUtc - correctedOffset);
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function toIso(date) {
  return date.toISOString();
}

export function formatSlotDate(iso) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(iso));
}

export function formatSlotTime(iso) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}
