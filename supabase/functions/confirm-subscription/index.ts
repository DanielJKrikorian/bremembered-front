import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentIntentId, customerId, planId, coupleId } = await req.json()

    const stripe = new (await import('npm:stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      {
        apiVersion: '2023-10-16',
      }
    )

    // Get the payment intent to verify it was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment was not successful')
    }

    // Get the plan details
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: planData, error: planError } = await supabase
      .from('storage_plans')
      .select('stripe_price_id')
      .eq('plan_id', planId)
      .single()

    if (planError) throw planError

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: planData.stripe_price_id }],
      default_payment_method: paymentIntent.payment_method,
      expand: ['latest_invoice.payment_intent'],
    })

    // Update the couple subscription in the database
    await supabase
      .from('couple_subscriptions')
      .upsert({
        couple_id: coupleId,
        plan_id: planId,
        payment_status: 'active',
        subscription_id: subscription.id,
        customer_id: customerId,
        updated_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        status: subscription.status,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Subscription confirmation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})