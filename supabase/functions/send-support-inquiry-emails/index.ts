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

    // Get the inquiry data from the request
    const { record } = await req.json()
    
    console.log('Received trigger data:', JSON.stringify(record, null, 2))
    
    if (!record) {
      throw new Error('No inquiry record provided')
    }

    const { id, name, email, subject, message, priority, created_at } = record

    // Validate required fields
    if (!email || !name || !subject || !message) {
      console.error('Missing required fields:', { email: !!email, name: !!name, subject: !!subject, message: !!message })
      throw new Error('Missing required fields in inquiry record')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable not set')
      throw new Error('RESEND_API_KEY environment variable not set')
    }
    
    console.log('Resend API key configured:', !!resendApiKey)

    // Format priority for display
    const priorityDisplay = priority.charAt(0).toUpperCase() + priority.slice(1)
    
    // Format date for display
    const submissionDate = new Date(created_at).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    console.log('Sending customer confirmation email...')
    // Email 1: Confirmation to customer
    const customerEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'B. Remembered Support <no-reply@notifications-bremembered.com>',
        to: [email],
        subject: 'We received your support inquiry - B. Remembered',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Support Inquiry Received</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Thank You for Contacting Us!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">We've received your support inquiry</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f43f5e; margin-bottom: 25px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hi ${name},</h2>
              <p style="margin: 0 0 15px 0; color: #4b5563;">
                Thank you for reaching out to B. Remembered support. We've received your inquiry and our team will review it shortly.
              </p>
              <p style="margin: 0; color: #4b5563;">
                <strong>Expected response time:</strong> Within 2 hours during business hours (Mon-Fri 8AM-8PM PST)
              </p>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Your Inquiry Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Subject:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Priority:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${priorityDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Submitted:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${submissionDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Reference ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">#${id.substring(0, 8).toUpperCase()}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">💡 While you wait:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Check out our <a href="https://bremembered.io/support" style="color: #f59e0b;">FAQ section</a> for quick answers</li>
                <li>Browse our <a href="https://bremembered.io/inspiration" style="color: #f59e0b;">wedding inspiration</a> articles</li>
                <li>Join our community for tips and advice</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://bremembered.io" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Visit B. Remembered
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">
                <strong>B. Remembered</strong><br>
                The Smarter Way to Book Your Big Day
              </p>
              <p style="margin: 0;">
                📞 (978) 945-3WED | ✉️ hello@bremembered.io
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!customerEmailResponse.ok) {
      const errorText = await customerEmailResponse.text()
      console.error('Customer email failed:', errorText)
      throw new Error(`Failed to send customer email: ${errorText}`)
    }
    
    const customerEmailResult = await customerEmailResponse.json()
    console.log('Customer email sent successfully:', customerEmailResult)

    console.log('Sending admin alert email...')
    // Email 2: Alert to Daniel
    const adminEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'B. Remembered Alerts <no-reply@notifications-bremembered.com>',
        to: ['Daniel@brememberedproductions.com'],
        subject: `🚨 New Support Inquiry - ${priorityDisplay} Priority`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Support Inquiry</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626, #f59e0b); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">🚨 New Support Inquiry</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Priority: ${priorityDisplay}</p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #f43f5e; padding-bottom: 10px;">Inquiry Details</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600; width: 25%; border-bottom: 1px solid #f3f4f6;">Name:</td>
                  <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3f4f6;">Email:</td>
                  <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">
                    <a href="mailto:${email}" style="color: #f43f5e; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3f4f6;">Priority:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="background: ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#f59e0b' : priority === 'normal' ? '#10b981' : '#6b7280'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                      ${priorityDisplay}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3f4f6;">Subject:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3f4f6;">Submitted:</td>
                  <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${submissionDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Reference ID:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-family: monospace;">#${id.substring(0, 8).toUpperCase()}</td>
                </tr>
              </table>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Customer Message:</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f43f5e;">
                <p style="margin: 0; color: #374151; white-space: pre-wrap;">${message}</p>
              </div>
            </div>

            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>📋 Action Required:</strong> Please respond to this inquiry within 2 hours during business hours.
              </p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://app.bremembered.io/admin/support" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                View in Admin Dashboard
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">
                This is an automated notification from B. Remembered Support System
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!adminEmailResponse.ok) {
      const errorText = await adminEmailResponse.text()
      console.error('Admin email failed:', errorText)
      throw new Error(`Failed to send admin email: ${errorText}`)
    }

    const adminEmailResult = await adminEmailResponse.json()
    console.log('Admin email sent successfully:', adminEmailResult)
    
    console.log('Both support inquiry emails sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Support inquiry emails sent successfully',
        customerEmailId: customerEmailResult.id,
        adminEmailId: adminEmailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Support inquiry email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})