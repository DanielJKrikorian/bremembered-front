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

    const { bookingId, upgradeAmount, newPackageId, currentPackageId } = await req.json()

    if (!bookingId || !upgradeAmount || !newPackageId || !currentPackageId) {
      throw new Error('Missing required fields')
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        couples!inner(
          id,
          name,
          email
        ),
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

    // Get new package details
    const { data: newPackage, error: packageError } = await supabase
      .from('service_packages')
      .select('*')
      .eq('id', newPackageId)
      .single()

    if (packageError) {
      throw new Error(`Failed to fetch new package: ${packageError.message}`)
    }

    // Create payment intent for upgrade amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: upgradeAmount,
      currency: 'usd',
      metadata: {
        type: 'package_upgrade',
        booking_id: bookingId,
        new_package_id: newPackageId,
        current_package_id: currentPackageId,
        upgrade_amount: upgradeAmount.toString(),
        couple_id: booking.couple_id,
        vendor_id: booking.vendor_id,
        couple_email: booking.couples.email,
        couple_name: booking.couples.name,
        vendor_name: booking.vendors.name,
        service_type: booking.service_type
      }
    })

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Upgrade payment intent creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})