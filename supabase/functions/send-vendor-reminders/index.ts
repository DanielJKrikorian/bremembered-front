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

    // Define reminder intervals (days before event)
    const reminderIntervals = [30, 15, 7, 2, 0] // 0 = day of event

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable not set')
    }

    let totalEmailsSent = 0
    const emailResults = []

    // Process each reminder interval
    for (const daysBeforeEvent of reminderIntervals) {
      console.log(`Processing ${daysBeforeEvent} day reminder...`)

      // Calculate the target date
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysBeforeEvent)
      const targetDateStart = new Date(targetDate)
      targetDateStart.setHours(0, 0, 0, 0)
      const targetDateEnd = new Date(targetDate)
      targetDateEnd.setHours(23, 59, 59, 999)

      console.log(`Looking for events on: ${targetDateStart.toISOString()} to ${targetDateEnd.toISOString()}`)

      // Get bookings for the target date that haven't had this reminder sent yet
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          couple_id,
          vendor_id,
          service_type,
          amount,
          status,
          couples!inner(
            id,
            name,
            partner1_name,
            partner2_name,
            email,
            phone,
            wedding_date
          ),
          vendors!inner(
            id,
            name,
            user_id,
            phone
          ),
          service_packages(
            name,
            description,
            hour_amount
          ),
          events!inner(
            id,
            start_time,
            end_time,
            title,
            location
          ),
          venues(
            name,
            street_address,
            city,
            state,
            contact_name,
            phone
          )
        `)
        .eq('status', 'confirmed')
        .gte('events.start_time', targetDateStart.toISOString())
        .lte('events.start_time', targetDateEnd.toISOString())

      if (bookingsError) {
        console.error(`Error fetching bookings for ${daysBeforeEvent} day reminder:`, bookingsError)
        continue
      }

      console.log(`Found ${bookings?.length || 0} bookings for ${daysBeforeEvent} day reminder`)

      if (!bookings || bookings.length === 0) {
        continue
      }

      // Check which vendors already received this specific reminder
      const bookingIds = bookings.map(b => b.id)
      const reminderType = daysBeforeEvent === 0 ? 'day_of_event' : `${daysBeforeEvent}_days_before`
      
      const { data: existingReminders, error: remindersError } = await supabase
        .from('email_logs')
        .select('booking_id')
        .in('booking_id', bookingIds)
        .eq('type', 'reminder')
        .ilike('subject', `%${daysBeforeEvent === 0 ? 'today' : `${daysBeforeEvent} day`}%`)

      if (remindersError) {
        console.warn('Error checking existing reminders:', remindersError)
      }

      const bookingsWithReminders = new Set(existingReminders?.map(r => r.booking_id) || [])
      const bookingsToRemind = bookings.filter(b => !bookingsWithReminders.has(b.id))

      console.log(`${bookingsToRemind.length} vendors need ${daysBeforeEvent} day reminders`)

      // Send reminder emails
      for (const booking of bookingsToRemind) {
        try {
          const vendor = booking.vendors
          const couple = booking.couples
          const event = booking.events
          const venue = booking.venues
          const servicePackage = booking.service_packages

          // Get vendor's email from users table
          const { data: vendorUser, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', vendor.user_id)
            .single()

          if (userError || !vendorUser?.email) {
            console.log(`No email found for vendor ${vendor.id} (user_id: ${vendor.user_id}), skipping`)
            continue
          }

          const vendorEmail = vendorUser.email

          // Format dates and times
          const eventDate = new Date(event.start_time)
          const eventDateFormatted = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          
          const eventTimeFormatted = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })

          const endTime = event.end_time ? new Date(event.end_time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : null

          const formatPrice = (amount: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(amount / 100)
          }

          // Determine email subject and content based on days before event
          let subject, urgencyLevel, reminderMessage, actionItems
          
          if (daysBeforeEvent === 30) {
            subject = `📅 Upcoming booking in 30 days - ${couple.name}`
            urgencyLevel = 'info'
            reminderMessage = 'This is a friendly reminder about your upcoming wedding booking in 30 days.'
            actionItems = [
              'Confirm your equipment and backup plans',
              'Review the event timeline and location',
              'Reach out to the couple if you have any questions',
              'Block out your calendar for the full day'
            ]
          } else if (daysBeforeEvent === 15) {
            subject = `⏰ Booking reminder - 15 days until ${couple.name}'s wedding`
            urgencyLevel = 'normal'
            reminderMessage = 'Your wedding booking is coming up in 15 days. Time to start final preparations!'
            actionItems = [
              'Finalize your shot list or service plan',
              'Confirm arrival time and setup requirements',
              'Test all equipment and charge batteries',
              'Review weather forecast and backup plans'
            ]
          } else if (daysBeforeEvent === 7) {
            subject = `🚨 Important: Wedding booking in 7 days - ${couple.name}`
            urgencyLevel = 'important'
            reminderMessage = 'Your wedding booking is just 7 days away! Please ensure everything is ready.'
            actionItems = [
              'Confirm final timeline with the couple',
              'Pack and organize all equipment',
              'Plan your route to the venue',
              'Prepare backup equipment and contingency plans'
            ]
          } else if (daysBeforeEvent === 2) {
            subject = `🔔 Final reminder: Wedding in 2 days - ${couple.name}`
            urgencyLevel = 'urgent'
            reminderMessage = 'Final reminder: Your wedding booking is in just 2 days!'
            actionItems = [
              'Charge all batteries and format memory cards',
              'Load equipment into your vehicle',
              'Confirm arrival time and parking details',
              'Review emergency contact information'
            ]
          } else { // Day of event
            subject = `🎉 TODAY: Wedding day for ${couple.name}`
            urgencyLevel = 'critical'
            reminderMessage = 'Today is the big day! Your wedding booking is scheduled for today.'
            actionItems = [
              'Arrive early for setup and preparation',
              'Have emergency contact numbers ready',
              'Double-check all equipment is working',
              'Be prepared to create magical memories!'
            ]
          }

          console.log(`Sending ${daysBeforeEvent} day reminder to ${vendorEmail}`)

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'B. Remembered Bookings <no-reply@notifications-bremembered.com>',
              to: [vendorEmail],
              subject: subject,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Booking Reminder</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${daysBeforeEvent === 0 ? '🎉' : '📅'} Booking Reminder</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${reminderMessage}</p>
                  </div>
                  
                  <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f43f5e; margin-bottom: 25px;">
                    <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hi ${vendor.name},</h2>
                    <p style="margin: 0 0 15px 0; color: #4b5563;">
                      ${reminderMessage}
                    </p>
                    <p style="margin: 0; color: #4b5563;">
                      Here are the details for your upcoming ${booking.service_type.toLowerCase()} service:
                    </p>
                  </div>

                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Event Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Couple:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${couple.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${servicePackage?.name || booking.service_type}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${eventDateFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${eventTimeFormatted}${endTime ? ` - ${endTime}` : ''}</td>
                      </tr>
                      ${servicePackage?.hour_amount ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Duration:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${servicePackage.hour_amount} hours</td>
                      </tr>
                      ` : ''}
                      ${venue ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Venue:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${venue.name}</td>
                      </tr>
                      ${venue.street_address ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Address:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${venue.street_address}, ${venue.city}, ${venue.state}</td>
                      </tr>
                      ` : ''}
                      ${venue.contact_name ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Venue Contact:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${venue.contact_name}${venue.phone ? ` - ${venue.phone}` : ''}</td>
                      </tr>
                      ` : ''}
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Couple Contact:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${couple.email}${couple.phone ? ` - ${couple.phone}` : ''}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Booking Value:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formatPrice(booking.amount)}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background: ${urgencyLevel === 'critical' ? '#fef2f2' : urgencyLevel === 'urgent' ? '#fef3c7' : urgencyLevel === 'important' ? '#dbeafe' : '#f0f9ff'}; border: 1px solid ${urgencyLevel === 'critical' ? '#fecaca' : urgencyLevel === 'urgent' ? '#fcd34d' : urgencyLevel === 'important' ? '#93c5fd' : '#bfdbfe'}; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: ${urgencyLevel === 'critical' ? '#991b1b' : urgencyLevel === 'urgent' ? '#92400e' : urgencyLevel === 'important' ? '#1e40af' : '#1e3a8a'}; margin: 0 0 15px 0; font-size: 18px;">
                      ${daysBeforeEvent === 0 ? '🎉 Today\'s Action Items:' : `📋 ${daysBeforeEvent} Day Checklist:`}
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: ${urgencyLevel === 'critical' ? '#991b1b' : urgencyLevel === 'urgent' ? '#92400e' : urgencyLevel === 'important' ? '#1e40af' : '#1e3a8a'};">
                      ${actionItems.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
                    </ul>
                  </div>

                  ${event.location ? `
                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Event Location:</h3>
                    <p style="margin: 0; color: #4b5563; font-weight: 600;">${event.location}</p>
                    ${venue ? `
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                      ${venue.street_address ? `${venue.street_address}, ` : ''}${venue.city ? `${venue.city}, ` : ''}${venue.state || ''}
                    </p>
                    ` : ''}
                  </div>
                  ` : ''}

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://app.bremembered.io/vendor-dashboard" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                      View in Vendor Dashboard
                    </a>
                  </div>

                  <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                      <strong>💡 Need to contact the couple?</strong> You can message them directly through your vendor dashboard or use the contact information provided above.
                    </p>
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
                      You're receiving this because you have an upcoming booking through B. Remembered. 
                      <a href="https://app.bremembered.io/vendor-dashboard/settings" style="color: #6b7280;">Manage email preferences</a>
                    </p>
                  </div>
                </body>
                </html>
              `,
            }),
          })

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text()
            console.error(`Email sending failed for vendor ${vendor.id}:`, errorText)
            continue
          }

          const emailResult = await emailResponse.json()
          console.log(`${daysBeforeEvent} day reminder email sent to ${vendorEmail}:`, emailResult.id)

          // Log the email in the database
          await supabase
            .from('email_logs')
            .insert({
              booking_id: booking.id,
              vendor_id: booking.vendor_id,
              couple_id: booking.couple_id,
              email_to: vendorEmail,
              subject: subject,
              sent_at: new Date().toISOString(),
              type: 'reminder',
              content: `${daysBeforeEvent} day booking reminder`
            })

          totalEmailsSent++
          emailResults.push({
            bookingId: booking.id,
            vendorName: vendor.name,
            vendorEmail: vendorEmail,
            daysBeforeEvent,
            emailId: emailResult.id
          })

        } catch (error) {
          console.error(`Error sending ${daysBeforeEvent} day reminder for booking ${booking.id}:`, error)
          continue
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Vendor reminder emails sent successfully`,
        totalEmailsSent,
        emailResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Vendor reminder email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})