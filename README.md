# Business Website Template (Next.js + Firebase + Stripe + Twilio)

A production-ready template for a service business website built with Next.js App Router. It features a public marketing site, appointment booking, an admin-only dashboard gated by Stripe subscription, Firebase Authentication + Firestore, and Twilio notifications (WhatsApp with SMS fallback).

## Features
- Public marketing pages and components
- Appointment booking with availability controls
- Admin dashboard for managing appointments
- Access control via Stripe subscriptions
- Twilio notifications for status updates (WhatsApp, falls back to SMS)
- Firebase Authentication and Firestore for user and app data
- Analytics and CSV export for appointments
- Tailwind CSS, Lucide Icons, Recharts, Swiper

## Tech Stack
- Next.js (^15) App Router, React ^19
- Firebase SDK (Auth, Firestore)
- Stripe SDKs (`stripe`, `@stripe/stripe-js`)
- Twilio Node SDK
- Tailwind CSS

Key files:
- `app/layout.js` – Global layout, Nav, Footer
- `app/page.js` – Landing page
- `app/dashboard/page.js` – Admin dashboard (client component)
- `app/dashboard/api/route.js` – Twilio messaging + appointment status update endpoint
- `app/dashboard/api/stripe/create-checkout-session/route.js` – Checkout session creator
- `app/dashboard/api/stripe/check-subscription/route.js` – Access-gating by subscription
- `app/dashboard/api/stripe/webhook/route.js` – Stripe webhook handler
- `app/firebaseConfig.js` – Firebase client config and exports (`db`, `auth`)
- `app/firebase-admin.js` – Firebase Admin initialization (for server usage)
- `app/stripe.js` – Stripe server SDK initialization

## Data Model (Firestore)
- `appointments` – Customer bookings (status: `pending`, `approved`, `rejected`, `attended`)
- `BookedSlots` – Prevents double-booking for a specific date/time
- `BlockedSlots` – Admin-configured blocks (weekends, dayOfWeek, date, dateTime)
- `users` – Users keyed by email with Stripe `customerId`, `subscriptionId`, `subscriptionStatus`

## Access Control
- Dashboard is admin-only. The admin is identified by `NEXT_PUBLIC_ADMIN_EMAIL`.
- On load, the dashboard checks Stripe subscription via `POST /dashboard/api/stripe/check-subscription` for the logged-in user email (from Firebase Auth). If access is denied, user is redirected to `/payment-reminder`.

## Twilio Notifications
- `app/dashboard/api/route.js` updates appointment status and sends a message:
  - Tries WhatsApp first using `from: whatsapp:+<TWILIO_PHONE_NUMBER>`, then falls back to SMS.
  - Requires: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

## Stripe Integration
- `create-checkout-session` creates a subscription checkout and redirects back to `NEXT_PUBLIC_BASE_URL` on success/cancel.
- `check-subscription` validates access by checking Firestore-stored `customerId`/`subscriptionId` and Stripe APIs.
- `webhook` listens to Stripe events to persist `customerId`, `subscriptionId`, and update subscription state.

Recommended dev commands for Stripe webhooks:
```bash
# Start your dev server
npm run dev

# In another terminal, forward Stripe events to your webhook route
npx stripe listen --forward-to localhost:3000/dashboard/api/stripe/webhook
```

Common test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

## Environment Variables
Create `.env.local` at the project root. Example keys used in the codebase:

Firebase (client):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Firebase (admin):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY` (escape newlines as `\n`)
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CERT_URL`

Stripe:
- `STRIPE_SECRET_KEY` (server)
- `NEXT_PUBLIC_STRIPE_PRICE_ID` (client) – your recurring price ID
- `NEXT_PUBLIC_BASE_URL` – e.g., `http://localhost:3000`
- `STRIPE_WEBHOOK_SECRET` – from Stripe CLI or Dashboard

Twilio:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` – e.g., `+1415XXXXXXX`; for WhatsApp, Twilio sandbox must be enabled

App config:
- `NEXT_PUBLIC_ADMIN_EMAIL` – email address for the admin gate

## Getting Started
1) Install dependencies:
```bash
npm install
```

2) Create `.env.local` and populate the variables above.

3) Start the dev server:
```bash
npm run dev
```
Visit `http://localhost:3000`.

4) Stripe webhook (during dev):
```bash
npx stripe listen --forward-to localhost:3000/dashboard/api/stripe/webhook
```

5) Login as Admin
- Ensure your Firebase Auth user’s email matches `NEXT_PUBLIC_ADMIN_EMAIL`.
- Navigate to `/dashboard`.

## Core Flows
- Booking: Users submit an appointment; admin updates status in `app/dashboard/page.js`.
- Notifications: `POST /dashboard/api` updates Firestore, removes `BookedSlots` on reject, and sends Twilio messages.
- Subscription Gate: Admin dashboard calls `POST /dashboard/api/stripe/check-subscription` on mount, redirecting to `/payment-reminder` if needed.
- Webhooks: `app/dashboard/api/stripe/webhook/route.js` updates `users` collection on checkout/session/subscription events.

## Scripts
- `npm run dev` – Start Next.js dev server
- `npm run build` – Build
- `npm run start` – Start production server
- `npm run export` – Export static site (note: API routes are not available in static export)
- `npm run deploy` – Build, export, and `firebase deploy` (static hosting)

Note on deployment: Because this project includes server routes (`app/dashboard/api/...`), a pure static export will not include them. For full functionality, deploy on a platform that supports Next.js server routes (e.g., Vercel) or set up Firebase Hosting with Cloud Functions/Cloud Run to serve the Next.js server. The included `deploy` script publishes the static site to Firebase Hosting (`firebase.json` points to `public/`).

## Testing Twilio (WhatsApp + SMS)
- For WhatsApp, enable the Twilio WhatsApp sandbox and use numbers in the format `whatsapp:+<E164>`.
- The code first attempts WhatsApp and falls back to SMS if it fails.

## Troubleshooting
- Webhook signature errors: Make sure you pass the raw body (this project uses `req.text()` and `stripe.webhooks.constructEvent`). Ensure `STRIPE_WEBHOOK_SECRET` is set.
- Access denied on dashboard: Confirm Firebase Auth user is logged in and email matches `NEXT_PUBLIC_ADMIN_EMAIL`. Ensure Stripe subscription is active.
- Twilio not sending: Check that phone numbers are in E.164 format, and WhatsApp sandbox is configured.
- Static export missing API routes: Use Vercel or a serverful Next.js deployment instead of static export, or add Firebase Functions for SSR/API.

## License
MIT
