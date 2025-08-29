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
    console.log('=== PAYMENT INTENT CREATION DEBUG ===')
    
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

    // Parse and validate request body
    const requestBody = await req.json()
    console.log('Request body received:', JSON.stringify(requestBody, null, 2))
    
    const { 
      cartItems, 
      totalAmount, 
      discountAmount = 0,
      referralDiscount = 0,
      customerInfo
    } = requestBody

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.error('Invalid or missing cartItems:', cartItems)
      return new Response(
        JSON.stringify({ error: 'Invalid cart items provided' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!totalAmount || totalAmount <= 0) {
      console.error('Invalid totalAmount:', totalAmount)
      return new Response(
        JSON.stringify({ error: 'Invalid total amount provided' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!customerInfo || !customerInfo.email) {
      console.error('Invalid customerInfo:', customerInfo)
      return new Response(
        JSON.stringify({ error: 'Customer information is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Cart items count:', cartItems.length)
    console.log('Total amount:', totalAmount)
    console.log('Customer email:', customerInfo.email)

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

    // Calculate final amounts
    console.log('Calculating amounts...')
    const subtotal = totalAmount
    const totalDiscount = discountAmount + referralDiscount
    const discountedTotal = Math.max(0, subtotal - totalDiscount)
    const depositAmount = Math.round(discountedTotal * 0.5)
    const totalServiceFee = 150 * 100 // Single $150 service fee per booking, convert to cents
    const grandTotal = depositAmount + totalServiceFee

    console.log('Amount calculations:')
    console.log('- Subtotal:', subtotal)
    console.log('- Total discount:', totalDiscount)
    console.log('- Discounted total:', discountedTotal)
    console.log('- Deposit amount (50%):', depositAmount)
    console.log('- Service fee:', totalServiceFee)
    console.log('- Grand total:', grandTotal)

    if (grandTotal <= 0) {
      console.error('Invalid grand total calculated:', grandTotal)
      return new Response(
        JSON.stringify({ error: 'Invalid payment amount calculated' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create payment intent
    console.log('Creating Stripe payment intent...')
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
          vendor_id: item.vendor?.id || ''
        }))),
        referral_code: customerInfo.referralCode || '',
        discount_amount: discountAmount.toString(),
        referral_discount: referralDiscount.toString(),
        deposit_amount: depositAmount.toString(),
        remaining_balance: (discountedTotal - depositAmount).toString(),
        customer_email: customerInfo.email || '',
        customer_phone: customerInfo.phone || '',
        billing_address: customerInfo.billingAddress || '',
        city: customerInfo.city || '',
        state: customerInfo.state || '',
        zip_code: customerInfo.zipCode || ''
      }
    })

    console.log('Payment intent created successfully:', paymentIntent.id)
    console.log('Client secret generated:', !!paymentIntent.client_secret)

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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})