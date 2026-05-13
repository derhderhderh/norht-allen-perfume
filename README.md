# North Allen Perfumery

Production-ready Next.js storefront for a custom perfume and cologne shop with Firebase Auth, Firestore, Stripe Embedded Checkout, and Resend email notifications.

## Setup

1. Install dependencies:

```bash
corepack pnpm install
```

2. Copy `.env.example` to `.env.local` and fill in Firebase, Stripe, and Resend values.

3. In Firebase Authentication, enable Email/Password sign-in.

4. Deploy `firestore.rules` in Firebase Console or with Firebase CLI.

5. Create the first admin user by signing up, then set `/users/{uid}.role` to `admin` in Firestore.

6. Seed the first catalog and default pricing:

```bash
corepack pnpm run seed
```

7. Run locally:

```bash
corepack pnpm run dev
```

## Stripe

This app uses Stripe Embedded Checkout, so buyers complete payment inside `/checkout/[orderId]` instead of being redirected to a hosted stripe.com checkout page. Configure your webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

Listen for `checkout.session.completed`.

The checkout API recalculates price on the server from Firestore options and active note IDs. Do not trust client-submitted prices.

## Firestore Collections

- `users/{uid}`
- `notes/{noteId}`
- `products/options`
- `orders/{orderId}`

`products/options` contains `bottleSizes`, `scentStrengths`, and `pricingRules`.
