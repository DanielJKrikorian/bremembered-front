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

    const { paymentIntentId } = await req.json()

    if (!paymentIntentId) {
      throw new Error('Payment intent ID is required')
    }

    // Get the payment intent from Stripe to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment was not successful')
    }

    // Extract metadata
    const metadata = paymentIntent.metadata
    const bookingId = metadata.booking_id
    const newPackageId = metadata.new_package_id
    const currentPackageId = metadata.current_package_id
    const upgradeAmount = parseInt(metadata.upgrade_amount || '0')
    const coupleId = metadata.couple_id
    const vendorId = metadata.vendor_id

    if (!bookingId || !newPackageId || !currentPackageId) {
      throw new Error('Missing required metadata in payment intent')
    }

    // Get the new package details
    const { data: newPackage, error: packageError } = await supabase
      .from('service_packages')
      .select('*')
      .eq('id', newPackageId)
      .single()

    if (packageError) {
      throw new Error(`Failed to fetch new package: ${packageError.message}`)
    }

    // Update the booking with the new package
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        package_id: newPackageId,
        amount: newPackage.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (bookingUpdateError) {
      throw new Error(`Failed to update booking: ${bookingUpdateError.message}`)
    }

    // Record the upgrade payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: upgradeAmount,
        status: 'succeeded',
        stripe_payment_id: paymentIntentId,
        payment_type: 'package_upgrade',
        couple_id: coupleId,
        vendor_id: vendorId
      })

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`)
    }

    // Calculate vendor payout for upgrade (50% of upgrade amount)
    const vendorUpgradeShare = Math.round(upgradeAmount * 0.5)

    // Get vendor's Stripe account for transfer
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('stripe_account_id, name')
      .eq('id', vendorId)
      .single()

    if (vendorError) {
      console.warn('Could not fetch vendor for payout:', vendorError)
    } else if (vendor?.stripe_account_id && vendorUpgradeShare > 0) {
      try {
        // Transfer vendor's share of the upgrade
        const transfer = await stripe.transfers.create({
          amount: vendorUpgradeShare,
          currency: 'usd',
          destination: vendor.stripe_account_id,
          metadata: {
            booking_id: bookingId,
            vendor_id: vendorId,
            payment_type: 'package_upgrade_share',
            upgrade_amount: upgradeAmount.toString(),
            vendor_share: vendorUpgradeShare.toString()
          }
        })

        console.log(`Upgrade payout transferred to vendor: ${vendorUpgradeShare} cents`)
      } catch (transferError) {
        console.error('Failed to transfer upgrade payout to vendor:', transferError)
        // Continue processing even if transfer fails
      }
    }

    // Create notification for the couple
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: coupleId,
        type: 'booking_update',
        title: 'Package Upgraded Successfully',
        message: `Your ${newPackage.service_type} package has been upgraded to "${newPackage.name}". The vendor has been notified of the changes.`,
        data: {
          booking_id: bookingId,
          old_package_id: currentPackageId,
          new_package_id: newPackageId,
          upgrade_amount: upgradeAmount
        },
        priority: 'normal'
      })

    if (notificationError) {
      console.warn('Failed to create notification:', notificationError)
    }

    console.log(`Package upgrade processed successfully for booking ${bookingId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        bookingId,
        newPackageId,
        upgradeAmount,
        vendorPayout: vendorUpgradeShare,
        message: 'Package upgrade processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Package upgrade processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
