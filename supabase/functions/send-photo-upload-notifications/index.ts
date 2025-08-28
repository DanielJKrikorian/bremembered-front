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

    // Get the file upload data from the trigger
    const { record } = await req.json()
    
    console.log('Received photo upload trigger data:', JSON.stringify(record, null, 2))
    
    if (!record) {
      throw new Error('No file upload record provided')
    }

    const { id, vendor_id, couple_id, file_name, file_size, upload_date } = record

    // Validate required fields
    if (!vendor_id || !couple_id || !file_name) {
      console.error('Missing required fields:', { vendor_id: !!vendor_id, couple_id: !!couple_id, file_name: !!file_name })
      throw new Error('Missing required fields in file upload record')
    }

    // Check if there are other recent uploads from the same vendor to the same couple
    // Look for uploads within the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    
    const { data: recentUploads, error: recentError } = await supabase
      .from('file_uploads')
      .select('id, file_name, file_size, upload_date')
      .eq('vendor_id', vendor_id)
      .eq('couple_id', couple_id)
      .gte('upload_date', twoMinutesAgo)
      .order('upload_date', { ascending: true })

    if (recentError) {
      throw new Error(`Failed to fetch recent uploads: ${recentError.message}`)
    }

    console.log(`Found ${recentUploads?.length || 0} recent uploads in the last 2 minutes`)

    // If this is the first upload in the batch, wait 30 seconds then send notification
    // If there are already recent uploads, this means we're in the middle of a batch
    const isFirstInBatch = !recentUploads || recentUploads.length <= 1

    if (!isFirstInBatch) {
      console.log('Not the first upload in batch, skipping notification (will be handled by the first upload)')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Upload added to existing batch, notification will be sent by first upload'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log('This is the first upload in the batch, setting up delayed notification...')

    // Wait 30 seconds to collect any additional uploads
    await new Promise(resolve => setTimeout(resolve, 30000))

    // Now fetch all uploads from the last 2.5 minutes (to account for the 30 second delay)
    const batchCutoff = new Date(Date.now() - 2.5 * 60 * 1000).toISOString()
    
    const { data: batchUploads, error: batchError } = await supabase
      .from('file_uploads')
      .select('id, file_name, file_size, upload_date')
      .eq('vendor_id', vendor_id)
      .eq('couple_id', couple_id)
      .gte('upload_date', batchCutoff)
      .order('upload_date', { ascending: true })

    if (batchError) {
      throw new Error(`Failed to fetch batch uploads: ${batchError.message}`)
    }

    const files = batchUploads || []
    console.log(`Sending notification for ${files.length} files`)

    // Get couple information
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('name, email, partner1_name, partner2_name')
      .eq('id', couple_id)
      .single()

    if (coupleError) {
      throw new Error(`Failed to fetch couple: ${coupleError.message}`)
    }

    if (!couple.email) {
      console.log('No email found for couple')
      return new Response(
        JSON.stringify({ success: true, message: 'No email to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get vendor information
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('name, profile_photo')
      .eq('id', vendor_id)
      .single()

    if (vendorError) {
      throw new Error(`Failed to fetch vendor: ${vendorError.message}`)
    }

    // Process files and send notification
    await sendBatchNotification(files, vendor, couple)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Batch notification sent successfully',
        filesCount: files.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Photo upload notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function getFileType(fileName: string): string {
  const fileExtension = fileName.split('.').pop()?.toLowerCase()
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExtension || '')
  const isPhoto = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
  
  return isVideo ? 'video' : isPhoto ? 'photo' : 'file'
}

async function sendBatchNotification(files: any[], vendor: any, couple: any) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable not set')
  }

  // Count file types
  const photos = files.filter((f: any) => getFileType(f.file_name) === 'photo')
  const videos = files.filter((f: any) => getFileType(f.file_name) === 'video')
  const otherFiles = files.filter((f: any) => getFileType(f.file_name) === 'file')

  // Create summary text
  const summaryParts = []
  if (photos.length > 0) summaryParts.push(`${photos.length} photo${photos.length !== 1 ? 's' : ''}`)
  if (videos.length > 0) summaryParts.push(`${videos.length} video${videos.length !== 1 ? 's' : ''}`)
  if (otherFiles.length > 0) summaryParts.push(`${otherFiles.length} file${otherFiles.length !== 1 ? 's' : ''}`)
  
  const summary = summaryParts.join(' and ')
  const totalFiles = files.length
  const emoji = photos.length > videos.length ? '📸' : videos.length > 0 ? '🎥' : '📁'

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Calculate total size
  const totalSize = files.reduce((sum: number, file: any) => sum + file.file_size, 0)

  // Format upload date (use the most recent upload)
  const latestUpload = files.reduce((latest: any, file: any) => {
    return new Date(file.upload_date) > new Date(latest.upload_date) ? file : latest
  })
  
  const uploadDate = new Date(latestUpload.upload_date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  console.log(`Sending batched notification for ${totalFiles} files to ${couple.email}`)
  
  // Send consolidated notification email
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'B. Remembered Gallery <no-reply@notifications-bremembered.com>',
      to: [couple.email],
      subject: `${emoji} ${totalFiles} new file${totalFiles !== 1 ? 's' : ''} uploaded to your wedding gallery!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New files uploaded</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${emoji} New Files Uploaded!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${vendor.name} has uploaded ${summary} to your gallery</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f43f5e; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Hi ${couple.partner1_name}${couple.partner2_name ? ` & ${couple.partner2_name}` : ''},</h2>
            <p style="margin: 0 0 15px 0; color: #4b5563;">
              Great news! ${vendor.name} has just uploaded ${totalFiles} new file${totalFiles !== 1 ? 's' : ''} to your wedding gallery.
            </p>
            <p style="margin: 0; color: #4b5563;">
              You can view and download all your files anytime from your gallery.
            </p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Upload Summary:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Vendor:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${vendor.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Files Uploaded:</td>
                <td style="padding: 8px 0; color: #1f2937;">${summary}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Total Size:</td>
                <td style="padding: 8px 0; color: #1f2937;">${formatFileSize(totalSize)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Uploaded:</td>
                <td style="padding: 8px 0; color: #1f2937;">${uploadDate}</td>
              </tr>
            </table>
          </div>

          ${files.length <= 5 ? `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Files Uploaded:</h3>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${files.map((file: any) => `
                <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #1f2937; font-weight: 500;">${file.file_name}</span>
                  <span style="color: #6b7280; font-size: 12px;">${formatFileSize(file.file_size)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://bremembered.io/profile?tab=gallery" style="background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              View Your Gallery
            </a>
          </div>

          <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>💡 Tip:</strong> Download your files to keep them forever! Your gallery subscription ensures you never lose these precious memories.
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
              You're receiving this because you have an active wedding gallery. 
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
  console.log('Batched photo upload notification email sent successfully:', emailResult)

  return emailResult
}