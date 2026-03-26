import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate } from '../middleware/auth.js'
import {
  createCheckoutSession,
  constructWebhookEvent,
  createPortalSession,
} from '../services/stripe.js'

const router = Router()

// POST /api/subscriptions/create-checkout-session — create Stripe Checkout Session
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    // Grab the specific priceId sent from our React frontend
    const { priceId, charityId } = req.body 

    if (!priceId) {
      return res.status(400).json({ error: 'Stripe price ID is required' })
    }

    // Pass the correct priceId to your Stripe service
    const session = await createCheckoutSession({
      email: req.user.email,
      priceId,
      userId: req.user.id,
      charityId,
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

        if (userId) {
          await supabase
            .from('users')
            .update({
              stripe_customer_id: session.customer,
              subscription_status: 'active',
              subscription_id: session.subscription,
            })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        await supabase
          .from('users')
          .update({ subscription_status: sub.status })
          .eq('stripe_customer_id', sub.customer)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabase
          .from('users')
          .update({ subscription_status: 'canceled', subscription_id: null })
          .eq('stripe_customer_id', sub.customer)
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
    const { data } = await supabase
      .from('users')
      .select('subscription_status, subscription_id, stripe_customer_id')
      .eq('id', req.user.id)
      .single()

    res.json(data || { subscription_status: 'none' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
