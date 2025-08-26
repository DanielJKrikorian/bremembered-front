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

    // Get the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment was not successful')
    }

    // Parse metadata
    const metadata = paymentIntent.metadata
    const cartItems = JSON.parse(metadata.cart_items || '[]')
    const customerName = metadata.customer_name || ''
    const eventDate = metadata.event_date || ''
    const eventLocation = metadata.event_location || ''
    const customerEmail = metadata.customer_email || ''
    const customerPhone = metadata.customer_phone || ''
    const depositAmount = parseInt(metadata.deposit_amount || '0')
    const discountAmount = parseInt(metadata.discount_amount || '0')

    // Create or get couple
    let coupleId = null
    
    // First try to find existing couple by email
    const { data: existingCouple, error: coupleSearchError } = await supabase
      .from('couples')
      .select('id, user_id')
      .eq('email', customerEmail)
      .maybeSingle()

    if (coupleSearchError && coupleSearchError.code !== 'PGRST116') {
      throw coupleSearchError
    }

    if (existingCouple) {
      coupleId = existingCouple.id
    } else {
      // Create new user account
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: Math.random().toString(36).slice(-8) + 'A1!', // Generate random password
        email_confirm: true,
        user_metadata: {
          name: customerName,
          role: 'couple'
        }
      })

      if (authError) {
        console.error('Error creating user:', authError)
        throw authError
      }

      // Create couple profile
      const [partner1Name, partner2Name] = customerName.split(' & ')
      
      const { data: newCouple, error: coupleError } = await supabase
        .from('couples')
        .insert({
          user_id: authUser.user.id,
          name: customerName,
          partner1_name: partner1Name || customerName,
          partner2_name: partner2Name || null,
          email: customerEmail,
          phone: customerPhone,
          wedding_date: eventDate || null,
          venue_name: eventLocation || null
        })
        .select('id')
        .single()

      if (coupleError) throw coupleError
      coupleId = newCouple.id

      // Create user record
      await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: customerEmail,
          name: customerName,
          role: 'couple'
        })
    }

    // Process each cart item
    const bookingIds = []
    const totalPlatformFee = cartItems.length * 150 * 100 // $150 per service in cents

    for (const item of cartItems) {
      const vendor = item.vendor_id ? await getVendorById(supabase, item.vendor_id) : null
      
      if (!vendor) {
        console.warn(`No vendor found for item ${item.package_id}`)
        continue
      }

      // Calculate amounts for this specific item
      const itemDepositAmount = Math.round(item.price * 0.5) // 50% deposit
      const itemPlatformFee = 150 * 100 // $150 service fee per item
      const vendorTransferAmount = Math.round(itemDepositAmount * 0.5) // 50% of deposit to vendor
      
      // Create event
      const eventStartTime = item.event_date && item.event_time 
        ? `${item.event_date}T${item.event_time}:00`
        : new Date().toISOString()
      
      const eventEndTime = item.event_date && item.end_time
        ? `${item.event_date}T${item.end_time}:00`
        : new Date(new Date(eventStartTime).getTime() + (item.package?.hour_amount || 8) * 60 * 60 * 1000).toISOString()

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          vendor_id: vendor.id,
          couple_id: coupleId,
          start_time: eventStartTime,
          end_time: eventEndTime,
          type: 'wedding',
          title: `${customerName} Wedding - ${item.service_type}`,
          description: `${item.service_type} service for ${customerName}`,
          location: eventLocation || item.venue_name || null
        })
        .select('id')
        .single()

      if (eventError) throw eventError

      // Create booking
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          couple_id: coupleId,
          vendor_id: vendor.id,
          status: 'confirmed',
          amount: item.price,
          service_type: item.service_type,
          package_id: item.package_id,
          event_id: newEvent.id,
          venue_id: item.venue_id || null,
          initial_payment: itemDepositAmount,
          platform_fee: itemPlatformFee,
          paid_amount: itemDepositAmount,
          discount: Math.round((discountAmount / cartItems.length)) || 0,
          stripe_payment_intent_id: paymentIntentId
        })
        .select('id')
        .single()

      if (bookingError) throw bookingError
      bookingIds.push(newBooking.id)

      // Create contract
      const { data: contractTemplate, error: templateError } = await supabase
        .from('contract_templates')
        .select('content')
        .eq('service_type', item.service_type)
        .maybeSingle()

      if (templateError && templateError.code !== 'PGRST116') {
        throw templateError
      }

      const contractContent = contractTemplate?.content || generateDefaultContract(item, customerName, eventDate, eventLocation)

      await supabase
        .from('contracts')
        .insert({
          booking_id: newBooking.id,
          content: contractContent,
          status: 'pending'
        })

      // Record payment
      await supabase
        .from('payments')
        .insert({
          booking_id: newBooking.id,
          amount: itemDepositAmount,
          status: 'succeeded',
          stripe_payment_id: paymentIntentId,
          payment_type: 'deposit',
          couple_id: coupleId,
          vendor_id: vendor.id
        })

      // Transfer to vendor if they have a Stripe account
      if (vendor.stripe_account_id && vendorTransferAmount > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: vendorTransferAmount,
            currency: 'usd',
            destination: vendor.stripe_account_id,
            metadata: {
              booking_id: newBooking.id,
              vendor_id: vendor.id,
              couple_id: coupleId,
              service_type: item.service_type,
              payment_type: 'vendor_deposit_share'
            }
          })

          console.log(`Transfer created for vendor ${vendor.id}: ${vendorTransferAmount} cents`)
        } catch (transferError) {
          console.error(`Failed to transfer to vendor ${vendor.id}:`, transferError)
          // Continue processing other items even if one transfer fails
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        coupleId,
        bookingIds,
        message: 'Booking processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Booking processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function getVendorById(supabase: any, vendorId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, stripe_account_id')
    .eq('id', vendorId)
    .single()

  if (error) {
    console.error('Error fetching vendor:', error)
    return null
  }

  return data
}

function generateDefaultContract(item: any, customerName: string, eventDate: string, eventLocation: string) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(item.price / 100)

  const depositAmount = Math.round(item.price * 0.5)
  const formattedDeposit = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(depositAmount / 100)

  const remainingBalance = item.price - depositAmount
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(remainingBalance / 100)

  return `${item.service_type.toUpperCase()} SERVICE AGREEMENT

This agreement is between ${customerName} (Client) and ${item.vendor_name || 'the selected vendor'} (Service Provider) for ${item.service_type.toLowerCase()} services.

EVENT DETAILS:
- Date: ${eventDate ? new Date(eventDate).toLocaleDateString() : '[Event Date]'}
- Location: ${eventLocation || '[Event Location]'}
- Service: ${item.package_name || item.service_type}

SERVICES PROVIDED:
${item.package?.features?.map((feature: string) => `- ${feature}`).join('\n') || `- Professional ${item.service_type.toLowerCase()} services`}

PAYMENT TERMS:
- Total Amount: ${formattedPrice}
- Deposit (50%): ${formattedDeposit}
- Balance Due: ${formattedBalance}
- Service Fee: $150

TERMS AND CONDITIONS:
1. The Service Provider agrees to provide professional ${item.service_type.toLowerCase()} services for the specified event.
2. The Client agrees to pay the total amount as outlined in the payment schedule.
3. Cancellation policy: 30 days notice required for partial refund of deposit.
4. The Service Provider retains copyright to all work but grants usage rights to the Client.
5. Weather contingency plans will be discussed prior to the event.
6. Any changes to services must be agreed upon in writing by both parties.

By signing below, both parties agree to the terms outlined in this contract.`
}