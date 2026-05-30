# flat-visit-scheduler

A JavaScript-only Next.js App Router MVP for scheduling apartment visits. Visitors pick an available slot, enter a first name and phone number, and the app creates a Google Calendar event and saves the booking in Supabase.

The UI is Hebrew RTL, the app timezone is `Asia/Jerusalem`, and the project is ready to deploy from GitHub to Vercel.

## Stack

- Next.js App Router
- JavaScript only
- Supabase database
- Google Calendar API with a Google Service Account
- Vercel deployment

## Pages

- `/` public booking page
- `/admin` admin page for availability windows

## API routes

- `GET /api/slots`
- `POST /api/book`
- `GET /api/admin/availability`
- `POST /api/admin/availability`
- `PUT /api/admin/availability/[id]`
- `DELETE /api/admin/availability/[id]`

Admin API routes require the `x-admin-password` header. The browser stores the entered admin password in `sessionStorage` and sends it only to server-side API routes.

## Environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Required values:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
ADMIN_PASSWORD="choose-a-strong-admin-password"
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
GOOGLE_CLIENT_EMAIL="service-account-name@project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_EMAIL`, or `GOOGLE_PRIVATE_KEY` in client code. This project only uses them inside server route handlers and server libraries.

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run the SQL in `sql/schema.sql`.
4. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.

The schema creates:

- `availability_windows`
- `bookings`

It also adds indexes and a partial unique index to reduce double-booking risk for identical booked slots.

## Google Cloud Service Account setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Enable the Google Calendar API for that project.
4. Go to IAM & Admin > Service Accounts.
5. Create a service account.
6. Open the service account and create a JSON key.
7. From the JSON file, copy:
   - `client_email` to `GOOGLE_CLIENT_EMAIL`
   - `private_key` to `GOOGLE_PRIVATE_KEY`

For Vercel, keep the private key as one environment variable string. If the key contains real line breaks, paste it as-is. If your environment requires escaped line breaks, use `\n`; the app converts them back before authenticating.

## Share your Google Calendar with the service account

1. Open Google Calendar.
2. Open the settings for the calendar you want to use.
3. Find the calendar ID and set it as `GOOGLE_CALENDAR_ID`.
4. Under "Share with specific people or groups", add the service account email from `GOOGLE_CLIENT_EMAIL`.
5. Give it permission to "Make changes to events".

Without this sharing step, the service account can authenticate but cannot read busy events or create booking events in your calendar.

## Local development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/admin`

## Admin workflow

1. Go to `/admin`.
2. Enter the `ADMIN_PASSWORD`.
3. Create availability windows with:
   - date
   - start time
   - end time
   - slot duration in minutes
   - active/inactive state
4. The public page will generate bookable slots from active windows only.

## Booking rules

`GET /api/slots`:

- Reads active availability windows from Supabase.
- Generates slots using `slot_duration_minutes`.
- Hides slots in the past.
- Hides slots already booked in Supabase.
- Hides slots that overlap Google Calendar events.

`POST /api/book` re-checks before confirming:

- Name is required.
- Phone is required and must look like an Israeli phone number.
- Slot is not in the past.
- Slot belongs to an active admin-defined availability window.
- Slot is not already booked in Supabase.
- Slot does not overlap a Google Calendar event.

Then it creates a Google Calendar event and saves the booking in Supabase.

## Timezone behavior

Admin-entered dates and times are interpreted as `Asia/Jerusalem` local time. Internally, slots are converted to UTC ISO strings for backend validation, Supabase storage, and Google Calendar API calls.

Manual sanity check:

1. Create an availability window for 18:00 Israel time.
2. Confirm the public booking page displays 18:00.
3. Book the slot.
4. Confirm the Google Calendar event appears at 18:00 Israel time.

## Deploy to Vercel from GitHub

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Add all environment variables from `.env.example` in Vercel Project Settings > Environment Variables.
4. Deploy.

Vercel detects Next.js automatically and runs:

```bash
npm run build
```

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```
