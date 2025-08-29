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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get bookings that are 1 day old and haven't had review requests sent yet
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    oneDayAgo.setHours(0, 0, 0, 0) // Start of day

    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    twoDaysAgo.setHours(0, 0, 0, 0) // Start of day

    console.log('Looking for bookings between:', twoDaysAgo.toISOString(), 'and', oneDayAgo.toISOString())

    // Get bookings from yesterday that are confirmed and don't have review request emails sent
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        couple_id,
        vendor_id,
        service_type,
        amount,
        created_at,
        couples!inner(
          id,
          name,
          partner1_name,
          partner2_name,
          email
        ),
        vendors!inner(
          id,
          name,
          profile_photo
        ),
        service_packages(
          name,
          description
        )
      `)
      .eq('status', 'confirmed')
      .gte('created_at', twoDaysAgo.toISOString())
      .lt('created_at', oneDayAgo.toISOString())

    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`)
    }

    console.log(`Found ${bookings?.length || 0} bookings from yesterday`)

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No bookings found from yesterday',
          emailsSent: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Check which couples already received review request emails
    const coupleIds = bookings.map(b => b.couple_id)
    const { data: existingEmails, error: emailsError } = await supabase
      .from('email_logs')
      .select('couple_id')
      .in('couple_id', coupleIds)
      .eq('type', 'review_request')
      .gte('sent_at', twoDaysAgo.toISOString())

    if (emailsError) {
      console.warn('Error checking existing emails:', emailsError)
    }

    const couplesWithEmails = new Set(existingEmails?.map(e => e.couple_id) || [])
    const bookingsToEmail = bookings.filter(b => !couplesWithEmails.has(b.couple_id))

    console.log(`${bookingsToEmail.length} couples need review request emails`)

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable not set')
    }

    let emailsSent = 0

    // Send review request emails
    for (const booking of bookingsToEmail) {
      try {
        const couple = booking.couples
        const vendor = booking.vendors
        const servicePackage = booking.service_packages

        if (!couple.email) {
          console.log(`No email for couple ${couple.id}, skipping`)
          continue
        }

        const formatPrice = (amount: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amount / 100)
        }

        const bookingDate = new Date(booking.created_at).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        console.log(`Sending review request email to ${couple.email}`)

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'B. Remembered <no-reply@notifications-bremembered.com>',
            to: [couple.email],
            subject: `⭐ How was your experience with ${vendor.name}? - B. Remembered`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Share Your Experience</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">⭐ How Was Your Experience?</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Help other couples by sharing your experience</p>
                </div>
                
                <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f43f5e; margin-bottom: 25px;">
                  <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hi ${couple.partner1_name}${couple.partner2_name ? ` & ${couple.partner2_name}` : ''},</h2>
                  <p style="margin: 0 0 15px 0; color: #4b5563;">
                    Thank you for booking with ${vendor.name} through B. Remembered! We hope you had a wonderful experience working with them.
                  </p>
                  <p style="margin: 0; color: #4b5563;">
                    Your feedback helps other couples make informed decisions and helps us maintain the quality of our vendor network.
                  </p>
                </div>

                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Your Booking Details:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Vendor:</td>
                      <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${vendor.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${servicePackage?.name || booking.service_type}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service Type:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${booking.service_type}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Amount:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${formatPrice(booking.amount)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Booked:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${bookingDate}</td>
                    </tr>
                  </table>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://feedback.bremembered.io" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                    Leave a Review
                  </a>
                </div>

                <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    <strong>💡 Why reviews matter:</strong> Your honest feedback helps other couples choose the right vendors and helps us maintain our high standards. Reviews also help vendors improve their services.
                  </p>
                </div>

                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What to include in your review:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li>How was the communication and responsiveness?</li>
                    <li>Did they deliver what was promised?</li>
                    <li>How was the quality of their work?</li>
                    <li>Would you recommend them to other couples?</li>
                    <li>Any specific highlights or areas for improvement?</li>
                  </ul>
                </div>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                  <p style="margin: 0 0 10px 0;">
                    <strong>B. Remembered</strong><br>
                    The Smarter Way to Book Your Big Day
                  </p>
                  <p style="margin: 0;">
                    📞 (978) 945-3WED | ✉️ hello@bremembered.io
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                    You're receiving this because you recently booked through B. Remembered. 
                    <a href="https://bremembered.io/profile?tab=settings" style="color: #6b7280;">Manage email preferences</a>
                  </p>
                </div>
              </body>
              </html>
            `,
          }),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error(`Email sending failed for couple ${couple.id}:`, errorText)
          continue
        }

        const emailResult = await emailResponse.json()
        console.log(`Review request email sent successfully to ${couple.email}:`, emailResult.id)

        // Log the email in the database
        await supabase
          .from('email_logs')
          .insert({
            booking_id: booking.id,
            couple_id: booking.couple_id,
            vendor_id: booking.vendor_id,
            email_to: couple.email,
            subject: `⭐ How was your experience with ${vendor.name}? - B. Remembered`,
            sent_at: new Date().toISOString(),
            type: 'review_request',
            content: 'Review request email sent day after booking'
          })

        emailsSent++
      } catch (error) {
        console.error(`Error sending review request email for booking ${booking.id}:`, error)
        continue
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Review request emails sent successfully`,
        emailsSent,
        bookingsProcessed: bookingsToEmail.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Review request email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})