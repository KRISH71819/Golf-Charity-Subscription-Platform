import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate } from '../middleware/auth.js'
import {
  createCheckoutSession,
  constructWebhookEvent,
  createPortalSession,
  getCheckoutSession,
  getSubscription,
} from '../services/stripe.js'

const router = Router()

async function applySubscriptionToUser({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  selectedCharityId,
  subscriptionTier,
  subscriptionStatus,
  currentPeriodStart,
  currentPeriodEnd,
}) {
  if (!userId) return

  const userUpdate = {
    stripe_customer_id: stripeCustomerId || null,
    subscription_status: subscriptionStatus || 'active',
    subscription_id: stripeSubscriptionId || null,
  }

  if (selectedCharityId !== undefined) {
    userUpdate.selected_charity_id = selectedCharityId || null
  }

  if (subscriptionTier) {
    userUpdate.subscription_tier = subscriptionTier
  }

  const { error } = await supabase
    .from('users')
    .update(userUpdate)
    .eq('id', userId)

  if (error) throw error

  await syncSubscriptionRecord({
    userId,
    stripeSubscriptionId,
    stripeCustomerId,
    tier: subscriptionTier,
    status: subscriptionStatus,
    charityId: selectedCharityId,
    currentPeriodStart,
    currentPeriodEnd,
  })
}

async function syncSubscriptionRecord({
  userId,
  stripeSubscriptionId,
  stripeCustomerId,
  tier,
  status,
  charityId,
  currentPeriodStart,
  currentPeriodEnd,
}) {
  if (!userId || !stripeSubscriptionId || !tier) return

  const payload = {
    user_id: userId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId || null,
    tier,
    status: status || 'active',
    charity_id: charityId || null,
    current_period_start: currentPeriodStart || null,
    current_period_end: currentPeriodEnd || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(payload, { onConflict: 'stripe_subscription_id' })

  if (error) throw error
}

// POST /api/subscriptions/create-checkout-session — create Stripe Checkout Session
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    // Grab the specific priceId sent from our React frontend
    const { priceId, charityId, tierId, billingCycle } = req.body 

    if (!priceId) {
      return res.status(400).json({ error: 'Stripe price ID is required' })
    }

    // Pass the correct priceId to your Stripe service
    const session = await createCheckoutSession({
      email: req.user.email,
      priceId,
      userId: req.user.id,
      charityId,
      tierId,
      billingCycle,
    })

    // Send the Stripe hosted checkout URL back to React
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/subscriptions/portal — Stripe Customer Portal
router.post('/portal', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single()

    if (!user?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' })
    }

    const session = await createPortalSession(user.stripe_customer_id)
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/subscriptions/webhook — Stripe webhook handler
// NOTE: raw body is parsed by Express middleware in server.js
router.post('/webhook', async (req, res) => {
  let event
  try {
    const sig = req.headers['stripe-signature']
    event = constructWebhookEvent(req.body, sig)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature failed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        const selectedCharityId = session.metadata?.charityId || null
        const subscriptionTier = session.metadata?.tierId || null

        if (userId) {
          let currentPeriodStart = null
          let currentPeriodEnd = null
          let subscriptionStatus = 'active'

          if (session.subscription) {
            const stripeSubscription = await getSubscription(session.subscription)
            subscriptionStatus = stripeSubscription.status || 'active'
            currentPeriodStart = stripeSubscription.current_period_start
              ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
              : null
            currentPeriodEnd = stripeSubscription.current_period_end
              ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
              : null
          }

          await applySubscriptionToUser({
            userId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            selectedCharityId,
            subscriptionTier,
            subscriptionStatus,
            currentPeriodStart,
            currentPeriodEnd,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        await supabase
          .from('users')
          .update({ subscription_status: sub.status })
          .eq('stripe_customer_id', sub.customer)

        const { data: user } = await supabase
          .from('users')
          .select('id, subscription_tier, selected_charity_id')
          .eq('stripe_customer_id', sub.customer)
          .single()

        await syncSubscriptionRecord({
          userId: user?.id,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer,
          tier: user?.subscription_tier,
          status: sub.status,
          charityId: user?.selected_charity_id,
          currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabase
          .from('users')
          .update({ subscription_status: 'canceled', subscription_id: null })
          .eq('stripe_customer_id', sub.customer)

        const { data: user } = await supabase
          .from('users')
          .select('id, subscription_tier, selected_charity_id')
          .eq('stripe_customer_id', sub.customer)
          .single()

        await syncSubscriptionRecord({
          userId: user?.id,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer,
          tier: user?.subscription_tier,
          status: 'cancelled',
          charityId: user?.selected_charity_id,
          currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        })
        break
      }

      default:
        // Unhandled event type
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/subscriptions/status — current user's subscription status
router.get('/status', authenticate, async (req, res) => {
  try {
    const { data: subscriptionData } = await supabase
      .from('users')
      .select('subscription_status, subscription_id, stripe_customer_id, subscription_tier, selected_charity_id')
      .eq('id', req.user.id)
      .single()

    if (!subscriptionData) {
      return res.json({ subscription_status: 'none' })
    }

    let selectedCharity = null
    if (subscriptionData.selected_charity_id) {
      const { data: charity } = await supabase
        .from('charities')
        .select('id, name')
        .eq('id', subscriptionData.selected_charity_id)
        .single()

      selectedCharity = charity || null
    }

    res.json({
      ...subscriptionData,
      selected_charity: selectedCharity,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sync-session', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    const session = await getCheckoutSession(sessionId)
    const metadataUserId = session.metadata?.userId

    if (!session || metadataUserId !== req.user.id) {
      return res.status(403).json({ error: 'This checkout session does not belong to the current user' })
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(400).json({ error: 'Checkout session is not completed yet' })
    }

    let currentPeriodStart = null
    let currentPeriodEnd = null
    let subscriptionStatus = 'active'

    if (session.subscription) {
      const stripeSubscription = await getSubscription(session.subscription)
      subscriptionStatus = stripeSubscription.status || 'active'
      currentPeriodStart = stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
        : null
      currentPeriodEnd = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : null
    }

    await applySubscriptionToUser({
      userId: req.user.id,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      selectedCharityId: session.metadata?.charityId || null,
      subscriptionTier: session.metadata?.tierId || null,
      subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd,
    })

    const { data: updatedUser, error } = await supabase
      .from('users')
      .select('id, email, full_name, handicap, home_course, role, is_admin, selected_charity_id, avatar_url, subscription_status, subscription_tier, created_at, updated_at')
      .eq('id', req.user.id)
      .single()

    if (error) throw error

    res.json({
      message: 'Subscription synced successfully',
      user: updatedUser,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/history', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        stripe_subscription_id,
        tier,
        status,
        current_period_start,
        current_period_end,
        created_at,
        charity:charities (
          id,
          name
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
