export function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidPhone(phone) {
  const normalized = cleanString(phone).replace(/[\s-]/g, "");
  return /^(\+972|0)[2-9]\d{7,8}$/.test(normalized);
}

export function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(cleanString(value));
}

export function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(cleanString(value));
}

export function normalizeTime(value) {
  return cleanString(value).slice(0, 5);
}

export function isValidSlotDuration(value) {
  const duration = Number(value);
  return Number.isInteger(duration) && duration >= 10 && duration <= 180;
}

export function validateAvailabilityPayload(payload) {
  const date = cleanString(payload?.date);
  const startTime = normalizeTime(payload?.start_time);
  const endTime = normalizeTime(payload?.end_time);
  const slotDuration = Number(payload?.slot_duration_minutes ?? 30);
  const isActive =
    typeof payload?.is_active === "boolean" ? payload.is_active : true;

  if (!isValidDate(date)) return { error: "יש להזין תאריך תקין." };
  if (!isValidTime(startTime)) return { error: "יש להזין שעת התחלה תקינה." };
  if (!isValidTime(endTime)) return { error: "יש להזין שעת סיום תקינה." };
  if (startTime >= endTime) return { error: "שעת הסיום חייבת להיות אחרי שעת ההתחלה." };
  if (!isValidSlotDuration(slotDuration)) {
    return { error: "משך כל ביקור חייב להיות בין 10 ל-180 דקות." };
  }

  return {
    data: {
      date,
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: slotDuration,
      is_active: isActive
    }
  };
}
