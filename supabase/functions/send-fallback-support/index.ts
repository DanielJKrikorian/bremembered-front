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
    const { 
      userQuestion, 
      sessionId, 
      userId, 
      userEmail, 
      userName,
      conversationHistory 
    } = await req.json()

    if (!userQuestion) {
      throw new Error('User question is required')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable not set')
      throw new Error('RESEND_API_KEY environment variable not set')
    }

    // Format conversation history for email
    const formatConversationHistory = (messages: any[]) => {
      if (!messages || messages.length === 0) return 'No previous conversation'
      
      return messages.map(msg => {
        const sender = msg.sender === 'user' ? userName : 'Ava Luna (AI)'
        const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        return `[${time}] ${sender}: ${msg.message}`
      }).join('\n')
    }

    const conversationText = formatConversationHistory(conversationHistory)
    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    console.log('Sending fallback support email to daniel@bremembered.io')

    // Send email to Daniel
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'B. Remembered AI Assistant <no-reply@notifications-bremembered.com>',
        to: ['daniel@bremembered.io'],
        subject: `🤖 AI Chatbot Fallback - User needs help: "${userQuestion.substring(0, 50)}..."`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Chatbot Fallback Support Request</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626, #f59e0b); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">🤖 AI Chatbot Fallback</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">User question couldn't be handled by AI</p>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">🚨 User Needs Personal Assistance</h2>
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                The AI chatbot couldn't provide a satisfactory answer to this user's question. They may need personal support.
              </p>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">User Information:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 25%;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">
                    <a href="mailto:${userEmail}" style="color: #f43f5e; text-decoration: none;">${userEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">User ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 12px;">${userId || 'Anonymous'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Session ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 12px;">${sessionId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Timestamp:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${timestamp}</td>
                </tr>
              </table>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">User's Question:</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f43f5e;">
                <p style="margin: 0; color: #374151; white-space: pre-wrap; font-weight: 600; font-size: 16px;">${userQuestion}</p>
              </div>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Recent Conversation History:</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;">
                <pre style="margin: 0; white-space: pre-wrap; color: #374151;">${conversationText}</pre>
              </div>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>📋 Action Required:</strong> Please reach out to this user personally to provide the assistance they need. They're expecting follow-up from the support team.
              </p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="mailto:${userEmail}?subject=Re: Your B. Remembered Question&body=Hi ${userName},%0D%0A%0D%0AThank you for reaching out through our AI assistant. I'm following up on your question: "${userQuestion}"%0D%0A%0D%0A" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Reply to User
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">
                This is an automated notification from the B. Remembered AI Assistant fallback system
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
    console.log('Fallback support email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Fallback support email sent successfully',
        emailId: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Fallback support email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})