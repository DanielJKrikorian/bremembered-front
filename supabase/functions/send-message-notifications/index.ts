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

    // Get the message data from the trigger
    const { record } = await req.json()
    
    console.log('Received message trigger data:', JSON.stringify(record, null, 2))
    
    if (!record) {
      throw new Error('No message record provided')
    }

    const { id, sender_id, message_text, timestamp, conversation_id } = record

    // Validate required fields
    if (!sender_id || !message_text || !conversation_id) {
      console.error('Missing required fields:', { sender_id: !!sender_id, message_text: !!message_text, conversation_id: !!conversation_id })
      throw new Error('Missing required fields in message record')
    }

    // Get conversation details to find participants
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', conversation_id)
      .single()

    if (conversationError) {
      throw new Error(`Failed to fetch conversation: ${conversationError.message}`)
    }

    // Find the recipient (the participant who is NOT the sender)
    const recipientId = conversation.participant_ids.find((id: string) => id !== sender_id)
    
    if (!recipientId) {
      console.log('No recipient found or sender is messaging themselves')
      return new Response(
        JSON.stringify({ success: true, message: 'No notification needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get sender information
    const { data: senderUser, error: senderError } = await supabase.auth.admin.getUserById(sender_id)
    if (senderError) {
      throw new Error(`Failed to fetch sender user: ${senderError.message}`)
    }

    // Get recipient information
    const { data: recipientUser, error: recipientError } = await supabase.auth.admin.getUserById(recipientId)
    if (recipientError) {
      throw new Error(`Failed to fetch recipient user: ${recipientError.message}`)
    }

    // Determine sender type and get additional info
    let senderInfo = {
      name: senderUser.user?.user_metadata?.name || 'Unknown User',
      email: senderUser.user?.email || '',
      type: 'user',
      service_type: null
    }

    // Check if sender is a vendor
    const { data: senderVendor, error: vendorError } = await supabase
      .from('vendors')
      .select('name, service_types')
      .eq('user_id', sender_id)
      .maybeSingle()

    if (!vendorError && senderVendor) {
      senderInfo = {
        name: senderVendor.name,
        email: senderUser.user?.email || '',
        type: 'vendor',
        service_type: senderVendor.service_types?.[0] || null
      }
    } else {
      // Check if sender is a couple
      const { data: senderCouple, error: coupleError } = await supabase
        .from('couples')
        .select('name')
        .eq('user_id', sender_id)
        .maybeSingle()

      if (!coupleError && senderCouple) {
        senderInfo = {
          name: senderCouple.name,
          email: senderUser.user?.email || '',
          type: 'couple',
          service_type: null
        }
      }
    }

    // Get recipient email
    const recipientEmail = recipientUser.user?.email
    if (!recipientEmail) {
      console.log('No email found for recipient')
      return new Response(
        JSON.stringify({ success: true, message: 'No email to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Check Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable not set')
      throw new Error('RESEND_API_KEY environment variable not set')
    }

    // Format timestamp
    const messageTime = new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    // Truncate message for email preview (full message in email body)
    const messagePreview = message_text.length > 100 
      ? message_text.substring(0, 100) + '...' 
      : message_text

    console.log('Sending message notification email...')
    
    // Send notification email
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'B. Remembered Messages <no-reply@notifications-bremembered.com>',
        to: [recipientEmail],
        subject: `💬 New message from ${senderInfo.name} - B. Remembered`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Message from ${senderInfo.name}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">💬 New Message</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You have a new message from ${senderInfo.name}</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f43f5e; margin-bottom: 25px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Message Details</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 20%;">From:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">
                    ${senderInfo.name}
                    ${senderInfo.type === 'vendor' && senderInfo.service_type ? ` (${senderInfo.service_type} Vendor)` : ''}
                    ${senderInfo.type === 'couple' ? ' (Couple)' : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${messageTime}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Message:</h3>
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #f43f5e;">
                <p style="margin: 0; color: #374151; white-space: pre-wrap; line-height: 1.6;">${message_text}</p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://bremembered.io/profile?tab=messages" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                Reply to Message
              </a>
            </div>

            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>💡 Tip:</strong> You can also reply directly through the B. Remembered app for faster communication.
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
                You're receiving this because you have active conversations on B. Remembered. 
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
      console.error('Email sending failed:', errorText)
      throw new Error(`Failed to send email: ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Message notification email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Message notification sent successfully',
        emailId: emailResult.id,
        recipient: recipientEmail,
        sender: senderInfo.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Message notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})