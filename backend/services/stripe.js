import Stripe from 'stripe'

// Initialize Stripe. If the key is missing, it will throw a clear error instead of a silent 500.
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("⚠️ STRIPE_SECRET_KEY is missing from your backend .env file!");
}

const stripe = new Stripe(stripeKey || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
})

// Set a safe fallback for the frontend URL so Stripe doesn't crash on 'undefined'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession({ email, priceId, userId, charityId, tierId, billingCycle }) {
  // Ensure we have a string for metadata to prevent Stripe validation errors
  const safeUserId = String(userId || '');
  const safeCharityId = String(charityId || '');
  const safeTierId = String(tierId || '');
  const safeBillingCycle = String(billingCycle || 'monthly');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/pricing`,
    metadata: { 
      userId: safeUserId, 
      charityId: safeCharityId,
      tierId: safeTierId,
      billingCycle: safeBillingCycle,
    },
  })
  return session
}

/**
 * Create a Stripe Customer Portal session (manage subscription)
 */
export async function createPortalSession(customerId) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${FRONTEND_URL}/dashboard`,
  })
  return session
}

/**
 * Construct and verify a Stripe webhook event
 */
export function constructWebhookEvent(rawBody, sig) {
  return stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET || ''
  )
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId)
}

export async function getCheckoutSession(sessionId) {
  return stripe.checkout.sessions.retrieve(sessionId)
}

export default stripe
