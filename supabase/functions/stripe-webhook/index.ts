import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new (await import('npm:stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      {
        apiVersion: '2023-10-16',
      }
    )

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      throw new Error('No Stripe signature found')
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object
        const subscriptionId = invoice.subscription
        
        // Update subscription status in database
        await supabase
          .from('couple_subscriptions')
          .update({ 
            payment_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscriptionId)
        
        console.log('Payment succeeded for subscription:', subscriptionId)
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object
        const failedSubscriptionId = failedInvoice.subscription
        
        // Update subscription status in database
        await supabase
          .from('couple_subscriptions')
          .update({ 
            payment_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', failedSubscriptionId)
        
        console.log('Payment failed for subscription:', failedSubscriptionId)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        
        // Update subscription status in database
        await supabase
          .from('couple_subscriptions')
          .update({ 
            payment_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', deletedSubscription.id)
        
        console.log('Subscription cancelled:', deletedSubscription.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})