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

    // Helper function to format price
    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount / 100)
    }

    // Process each reminder interval
    for (const daysBeforeEvent of reminderIntervals) {
      console.log(`Processing ${daysBeforeEvent} day couple reminder...`)

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
            profile_photo
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

      // Group bookings by couple to send one consolidated email per couple
      const bookingsByCouple = new Map()
      bookings.forEach(booking => {
        const coupleId = booking.couple_id
        if (!bookingsByCouple.has(coupleId)) {
          bookingsByCouple.set(coupleId, {
            couple: booking.couples,
            bookings: []
          })
        }
        bookingsByCouple.get(coupleId).bookings.push(booking)
      })

      console.log(`Grouped into ${bookingsByCouple.size} couples`)

      // Check which couples already received this specific reminder
      const coupleIds = Array.from(bookingsByCouple.keys())
      const reminderType = daysBeforeEvent === 0 ? 'day_of_event' : `${daysBeforeEvent}_days_before`
      
      const { data: existingReminders, error: remindersError } = await supabase
        .from('email_logs')
        .select('couple_id')
        .in('couple_id', coupleIds)
        .eq('type', 'reminder')
        .ilike('subject', `%${daysBeforeEvent === 0 ? 'today' : `${daysBeforeEvent} day`}%`)

      if (remindersError) {
        console.warn('Error checking existing reminders:', remindersError)
      }

      const couplesWithReminders = new Set(existingReminders?.map(r => r.couple_id) || [])
      const couplesToRemind = Array.from(bookingsByCouple.entries()).filter(([coupleId]) => !couplesWithReminders.has(coupleId))

      console.log(`${couplesToRemind.length} couples need ${daysBeforeEvent} day reminders`)

      // Send reminder emails
      for (const [coupleId, { couple, bookings: coupleBookings }] of couplesToRemind) {
        try {
          if (!couple.email) {
            console.log(`No email for couple ${couple.id}, skipping`)
            continue
          }

          // Get the primary event details (use first booking's event)
          const primaryEvent = coupleBookings[0].events
          const primaryVenue = coupleBookings[0].venues

          // Format dates and times
          const eventDate = new Date(primaryEvent.start_time)
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

          // Calculate total investment
          const totalInvestment = coupleBookings.reduce((sum, booking) => sum + booking.amount, 0)

          // Determine email subject and content based on days before event
          let subject, emoji, reminderMessage, excitementLevel, actionItems
          
          if (daysBeforeEvent === 30) {
            subject = `🎉 30 days until your wedding day, ${couple.partner1_name}!`
            emoji = '🎉'
            reminderMessage = 'Can you believe it? Your wedding day is just 30 days away!'
            excitementLevel = 'excited'
            actionItems = [
              'Finalize your timeline with your vendors',
              'Confirm all vendor arrival times',
              'Share your vision and special requests',
              'Start thinking about your day-of emergency kit'
            ]
          } else if (daysBeforeEvent === 15) {
            subject = `💕 2 weeks to go - Your dream wedding is almost here!`
            emoji = '💕'
            reminderMessage = 'The countdown is on! Your wedding day is just 2 weeks away and we are SO excited for you!'
            excitementLevel = 'very excited'
            actionItems = [
              'Confirm final guest count with your vendors',
              'Review and approve your wedding timeline',
              'Prepare your playlist or music requests',
              'Gather any special items for photos (rings, shoes, etc.)'
            ]
          } else if (daysBeforeEvent === 7) {
            subject = `✨ ONE WEEK until your magical day, ${couple.partner1_name}!`
            emoji = '✨'
            reminderMessage = 'ONE WEEK TO GO! We can hardly contain our excitement for your special day!'
            excitementLevel = 'thrilled'
            actionItems = [
              'Confirm all vendor arrival times and locations',
              'Prepare your emergency day-of kit',
              'Charge all devices and cameras for guests',
              'Take a moment to breathe and enjoy this exciting time!'
            ]
          } else if (daysBeforeEvent === 2) {
            subject = `🥳 2 DAYS LEFT! Your wedding weekend is here!`
            emoji = '🥳'
            reminderMessage = 'IT\'S ALMOST TIME! Your wedding day is just 2 days away and we are absolutely thrilled for you!'
            excitementLevel = 'over the moon'
            actionItems = [
              'Relax and trust your amazing vendor team',
              'Prepare your day-of timeline and emergency contacts',
              'Get plenty of rest - you want to glow on your big day!',
              'Remember: this is YOUR day to celebrate your love story'
            ]
          } else { // Day of event
            subject = `🎊 TODAY IS THE DAY! Happy Wedding Day, ${couple.partner1_name}${couple.partner2_name ? ` & ${couple.partner2_name}` : ''}!`
            emoji = '🎊'
            reminderMessage = 'TODAY IS YOUR WEDDING DAY! We are so honored to be part of your love story!'
            excitementLevel = 'absolutely ecstatic'
            actionItems = [
              'Take a deep breath and soak in every moment',
              'Trust your incredible vendor team - they\'ve got this!',
              'Stay hydrated and eat something before the ceremony',
              'Remember: today is about celebrating YOUR love story!'
            ]
          }

          console.log(`Sending ${daysBeforeEvent} day reminder to ${couple.email}`)

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'B. Remembered Wedding Team <no-reply@notifications-bremembered.com>',
              to: [couple.email],
              subject: subject,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Wedding Day Reminder</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${emoji} Wedding Day Countdown</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${reminderMessage}</p>
                  </div>
                  
                  <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f43f5e; margin-bottom: 25px;">
                    <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hi ${couple.partner1_name}${couple.partner2_name ? ` & ${couple.partner2_name}` : ''},</h2>
                    <p style="margin: 0 0 15px 0; color: #4b5563;">
                      We are ${excitementLevel} for your upcoming wedding! Your amazing vendor team is ready to make your day absolutely perfect.
                    </p>
                    <p style="margin: 0; color: #4b5563;">
                      Here's everything you need to know about your upcoming celebration:
                    </p>
                  </div>

                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Your Wedding Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Date:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${eventDateFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${eventTimeFormatted}</td>
                      </tr>
                      ${primaryVenue ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Venue:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${primaryVenue.name}</td>
                      </tr>
                      ${primaryVenue.street_address ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Address:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${primaryVenue.street_address}, ${primaryVenue.city}, ${primaryVenue.state}</td>
                      </tr>
                      ` : ''}
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Services Booked:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${coupleBookings.length} service${coupleBookings.length !== 1 ? 's' : ''}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Total Investment:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formatPrice(totalInvestment)}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Your Amazing Vendor Team:</h3>
                    ${coupleBookings.map(booking => `
                      <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                          ${booking.vendors.profile_photo ? 
                            `<img src="${booking.vendors.profile_photo}" alt="${booking.vendors.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` :
                            `<span style="font-size: 18px;">${booking.service_type === 'Photography' ? '📸' : booking.service_type === 'Videography' ? '🎥' : booking.service_type === 'DJ Services' ? '🎵' : booking.service_type === 'Coordination' ? '👰' : '💍'}</span>`
                          }
                        </div>
                        <div style="flex: 1;">
                          <h4 style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${booking.vendors.name}</h4>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">${booking.service_packages?.name || booking.service_type}</p>
                          <p style="margin: 0; color: #6b7280; font-size: 12px;">${formatPrice(booking.amount)} • ${booking.service_packages?.hour_amount ? `${booking.service_packages.hour_amount} hours` : 'Custom duration'}</p>
                        </div>
                      </div>
                    `).join('')}
                  </div>

                  <div style="background: ${daysBeforeEvent === 0 ? '#fef2f2' : daysBeforeEvent <= 2 ? '#fef3c7' : daysBeforeEvent <= 7 ? '#dbeafe' : '#f0f9ff'}; border: 1px solid ${daysBeforeEvent === 0 ? '#fecaca' : daysBeforeEvent <= 2 ? '#fcd34d' : daysBeforeEvent <= 7 ? '#93c5fd' : '#bfdbfe'}; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: ${daysBeforeEvent === 0 ? '#991b1b' : daysBeforeEvent <= 2 ? '#92400e' : daysBeforeEvent <= 7 ? '#1e40af' : '#1e3a8a'}; margin: 0 0 15px 0; font-size: 18px;">
                      ${daysBeforeEvent === 0 ? '🎊 Today\'s the Day!' : `💕 ${daysBeforeEvent} Day${daysBeforeEvent !== 1 ? 's' : ''} to Go!`}
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: ${daysBeforeEvent === 0 ? '#991b1b' : daysBeforeEvent <= 2 ? '#92400e' : daysBeforeEvent <= 7 ? '#1e40af' : '#1e3a8a'};">
                      ${actionItems.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
                    </ul>
                  </div>

                  ${daysBeforeEvent <= 7 ? `
                  <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">💚 Your Vendor Team is Ready!</h3>
                    <p style="margin: 0; color: #047857; font-size: 14px;">
                      All your vendors have been notified and are preparing for your special day. They're as excited as you are to make your wedding absolutely magical!
                    </p>
                  </div>
                  ` : ''}

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://bremembered.io/my-bookings" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                      View Your Bookings
                    </a>
                  </div>

                  <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                      <strong>💡 Need to contact your vendors?</strong> You can message them directly through your B. Remembered dashboard or use their contact information from your booking confirmations.
                    </p>
                  </div>

                  ${daysBeforeEvent === 0 ? `
                  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
                    <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 20px;">🎊 CONGRATULATIONS! 🎊</h3>
                    <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                      Today you become married! We are so honored to have been part of your journey. 
                      Enjoy every single moment of your magical day! 💕
                    </p>
                  </div>
                  ` : ''}

                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;">
                      <strong>B. Remembered</strong><br>
                      The Smarter Way to Book Your Big Day
                    </p>
                    <p style="margin: 0;">
                      📞 (978) 945-3WED | ✉️ hello@bremembered.io
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                      You're receiving this because your wedding day is approaching! We're so excited for you! 
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
          console.log(`${daysBeforeEvent} day reminder email sent to ${couple.email}:`, emailResult.id)

          // Log the email in the database for each booking
          for (const booking of coupleBookings) {
            await supabase
              .from('email_logs')
              .insert({
                booking_id: booking.id,
                vendor_id: booking.vendor_id,
                couple_id: booking.couple_id,
                email_to: couple.email,
                subject: subject,
                sent_at: new Date().toISOString(),
                type: 'reminder',
                content: `${daysBeforeEvent} day wedding countdown reminder`
              })
          }

          totalEmailsSent++
          emailResults.push({
            coupleId: couple.id,
            coupleName: couple.name,
            coupleEmail: couple.email,
            daysBeforeEvent,
            bookingsCount: coupleBookings.length,
            emailId: emailResult.id
          })

        } catch (error) {
          console.error(`Error sending ${daysBeforeEvent} day reminder for couple ${couple.id}:`, error)
          continue
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Couple reminder emails sent successfully`,
        totalEmailsSent,
        emailResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Couple reminder email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})