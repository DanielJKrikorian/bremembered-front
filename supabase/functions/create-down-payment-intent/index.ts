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
    // Check for required environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Stripe configuration' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase configuration' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const stripe = new (await import('npm:stripe@14.21.0')).default(
      stripeSecretKey,
      {
        apiVersion: '2023-10-16',
      }
    )

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    )

    const { 
      cartItems, 
      totalAmount, 
      discountAmount = 0,
      referralDiscount = 0,
      customerInfo
    } = await req.json()

    // Calculate final amounts
    const subtotal = totalAmount
    const totalDiscount = discountAmount + referralDiscount
    const discountedTotal = Math.max(0, subtotal - totalDiscount)
    const depositAmount = Math.round(discountedTotal * 0.5)
    const totalServiceFee = cartItems.length * 150 * 100 // Convert to cents
    const grandTotal = depositAmount + totalServiceFee

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: grandTotal,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always'
      },
      metadata: {
        type: 'wedding_booking_deposit',
        customer_name: customerInfo.partner2Name 
          ? `${customerInfo.partner1Name} & ${customerInfo.partner2Name}`
          : customerInfo.partner1Name || 'Wedding Customer',
        event_date: customerInfo.eventDate || '',
        event_location: customerInfo.eventLocation || '',
        guest_count: customerInfo.guestCount || '',
        special_requests: customerInfo.specialRequests || '',
        cart_items: JSON.stringify(cartItems.map(item => ({
          package_id: item.package.id,
          package_name: item.package.name,
          service_type: item.package.service_type,
          vendor_id: item.vendor?.id || '',
          vendor_name: item.vendor?.name || '',
          price: item.package.price,
          event_date: item.eventDate || '',
          event_time: item.eventTime || '',
          venue_name: item.venue?.name || ''
        }))),
        referral_code: '',
        discount_amount: discountAmount.toString(),
        referral_discount: referralDiscount.toString(),
        deposit_amount: depositAmount.toString(),
        remaining_balance: (discountedTotal - depositAmount).toString()
      }
    })

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: grandTotal
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})