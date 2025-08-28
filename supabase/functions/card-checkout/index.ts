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
    const stripe = new (await import('npm:stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      {
        apiVersion: '2023-10-16',
      }
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      cartItems, 
      totalAmount, 
      discountAmount = 0,
      referralDiscount = 0,
      customerInfo,
      successUrl,
      cancelUrl 
    } = await req.json()

    // Calculate final amounts
    const subtotal = totalAmount
    const totalDiscount = discountAmount + referralDiscount
    const discountedTotal = Math.max(0, subtotal - totalDiscount)
    const depositAmount = Math.round(discountedTotal * 0.5)
    const totalServiceFee = cartItems.length > 0 ? 150 * 100 : 0 // $150 per booking, convert to cents
    const grandTotal = depositAmount + totalServiceFee

    // Create line items for Stripe Checkout
    const lineItems = []

    // Add each service as a line item (deposit amount)
    for (const item of cartItems) {
      const itemDepositAmount = Math.round((item.package.price - (discountAmount / cartItems.length)) * 0.5)
      
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.package.name} (50% Deposit)`,
            description: `${item.package.service_type} - Remaining balance due before event`,
            metadata: {
              package_id: item.package.id,
              service_type: item.package.service_type,
              vendor_id: item.vendor?.id || '',
              full_amount: item.package.price.toString(),
              deposit_amount: itemDepositAmount.toString()
            }
          },
          unit_amount: itemDepositAmount,
        },
        quantity: 1,
      })
    }

    // Add service fees
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Service Fees',
          description: 'Platform service fee',
        },
        unit_amount: 15000, // $150 in cents
      },
      quantity: 1,
    })

    // Apply discounts if any
    const discounts = []
    if (totalDiscount > 0) {
      // Create a coupon for the total discount
      const coupon = await stripe.coupons.create({
        amount_off: totalDiscount,
        currency: 'usd',
        duration: 'once',
        name: 'Wedding Booking Discount',
      })
      
      discounts.push({
        coupon: coupon.id
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerInfo.email,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        type: 'wedding_booking',
        customer_name: customerInfo.partner2Name 
          ? `${customerInfo.partner1Name} & ${customerInfo.partner2Name}`
          : customerInfo.partner1Name,
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
        referral_code: customerInfo.referralCode || '',
        discount_amount: discountAmount.toString(),
        referral_discount: referralDiscount.toString()
      },
      ...(discounts.length > 0 && { discounts })
    })

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
      }
    )
  }
})