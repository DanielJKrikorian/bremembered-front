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

    const { bookingId, paymentType, tipAmount = 0 } = await req.json()

    if (!bookingId || !paymentType) {
      throw new Error('Booking ID and payment type are required')
    }

    // Get booking with pre-calculated payment splits
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vendors!inner(
          id,
          name,
          stripe_account_id
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      throw new Error(`Failed to fetch booking: ${bookingError.message}`)
    }

    const vendor = booking.vendors

    if (!vendor.stripe_account_id) {
      throw new Error('Vendor does not have a Stripe Connect account')
    }

    let transferAmount = 0
    let paymentDescription = ''

    // Use pre-calculated amounts based on payment type
    if (paymentType === 'deposit') {
      transferAmount = booking.vendor_deposit_share || 0
      paymentDescription = 'Deposit payment share'
    } else if (paymentType === 'final') {
      transferAmount = booking.vendor_final_share || 0
      paymentDescription = 'Final payment share'
    } else if (paymentType === 'final_with_tip') {
      transferAmount = (booking.vendor_final_share || 0) + tipAmount
      paymentDescription = 'Final payment share with tip'
      
      // Update booking with tip amount
      await supabase
        .from('bookings')
        .update({
          tip_amount: tipAmount,
          vendor_payout_amount: booking.vendor_total_earnings + tipAmount
        })
        .eq('id', bookingId)
    } else {
      throw new Error('Invalid payment type. Must be: deposit, final, or final_with_tip')
    }

    if (transferAmount <= 0) {
      throw new Error('No amount to transfer to vendor')
    }

    // Create Stripe transfer
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: 'usd',
      destination: vendor.stripe_account_id,
      metadata: {
        booking_id: bookingId,
        vendor_id: vendor.id,
        payment_type: paymentType,
        payment_model: booking.payment_model || 'split',
        tip_amount: tipAmount.toString()
      }
    })

    // Record the payout in payments table
    await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: transferAmount - tipAmount, // Base payment amount
        tip: tipAmount,
        status: 'succeeded',
        stripe_transfer_id: transfer.id,
        payment_type: paymentDescription,
        vendor_id: vendor.id,
        couple_id: booking.couple_id
      })

    console.log(`Vendor payout completed: ${transferAmount} cents to ${vendor.name}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        transferId: transfer.id,
        amount: transferAmount,
        vendor: vendor.name,
        paymentType,
        tipAmount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Vendor payout error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})