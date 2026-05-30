CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT availability_window_time_order CHECK (start_time < end_time),
  CONSTRAINT availability_window_duration_check CHECK (
    slot_duration_minutes >= 10
    AND slot_duration_minutes <= 180
  )
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bookings_time_order CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS availability_windows_lookup_idx
  ON availability_windows (is_active, date, start_time);

CREATE INDEX IF NOT EXISTS bookings_time_lookup_idx
  ON bookings (status, start_time, end_time);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_booking_idx
  ON bookings (start_time, end_time)
  WHERE status = 'booked';
