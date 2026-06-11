# Sentio ☀️

A daily mood check-in app. Rate your day once a day on a 1–7 scale, see how
your friends are doing (and reach out when they're having a rough one), and
keep a fully private journal. Built with Expo, expo-router, and Supabase.

## Setup

```bash
cd Sentio
npm install
npx expo start
```

Open the app in Expo Go (scan the QR code) or in an emulator/simulator from
the terminal menu. Web also works (`w`), though daily reminders are
mobile-only.

## Environment variables

`Sentio/.env` must contain:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Note: the URL is the bare project URL — no `/rest/v1/` suffix.

## Database migrations

Migrations live in `../supabase/migrations/`. With the Supabase CLI linked to
your project, apply them from the repo root:

```bash
supabase db push
```

This creates `profiles`, `friendships`, `checkins`, and `journal_entries`
with Row Level Security on every table (journal entries are owner-only, no
exceptions), plus a trigger that creates a profile row on signup from the
username chosen in the app.

If you prefer not to use the CLI, paste the contents of
`supabase/migrations/20260611000000_init.sql` into the Supabase SQL Editor.

## Project layout

- `src/app/` — expo-router routes: `(auth)` for sign in/up, `(tabs)` for
  Today, Friends, Journal, Profile (History lives on Profile)
- `src/lib/api.ts` — every Supabase call goes through here
- `src/constants/theme.ts` — all design tokens (light and dark palettes)
- `src/components/` — the chunky UI kit (3D buttons, chips, the 1–7 rating
  selector)

## Notes

- One check-in per day, editable until midnight local time; streaks are
  computed client-side from your own check-ins.
- The daily reminder ("Time to rate your day!") is a local notification
  scheduled via expo-notifications from the Profile tab.
- Appearance (System / Light / Dark) is also on the Profile tab.
