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

    const { message, sessionId, userId } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    // Get user context if authenticated
    let userContext = null
    if (userId) {
      userContext = await getUserContext(supabase, userId)
    }

    // Get available services and packages for recommendations
    const servicesContext = await getServicesContext(supabase)

    // Create system prompt with context
    const systemPrompt = createSystemPrompt(userContext, servicesContext)

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Save conversation to database
    if (sessionId) {
      await supabase.from('chat_messages').insert([
        {
          session_id: sessionId,
          sender_type: 'user',
          message: message,
          lead_id: null,
          ip_address: 'web_app',
          metadata: { user_id: userId }
        },
        {
          session_id: sessionId,
          sender_type: 'bot',
          message: aiResponse,
          lead_id: null,
          ip_address: 'web_app',
          metadata: { user_id: userId, ai_model: 'gpt-4' }
        }
      ])
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Chat AI error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function getUserContext(supabase: any, userId: string) {
  try {
    // Get couple profile
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select(`
        *,
        couple_style_preferences(
          style_tags!inner(label)
        ),
        couple_vibe_preferences(
          vibe_tags!inner(label)
        ),
        couple_language_preferences(
          languages!inner(language)
        )
      `)
      .eq('user_id', userId)
      .maybeSingle()

    if (coupleError && coupleError.code !== 'PGRST116') {
      console.error('Error fetching couple:', coupleError)
    }

    let bookings = []
    let payments = []
    let events = []
    let messages = []

    if (couple) {
      // Get bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          vendors!inner(name, rating, years_experience),
          service_packages(name, service_type, price, hour_amount),
          venues(name, city, state),
          events(start_time, end_time, title, location)
        `)
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })

      if (!bookingsError) {
        bookings = bookingsData || []
      }

      // Get payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })

      if (!paymentsError) {
        payments = paymentsData || []
      }

      // Get upcoming events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          vendors!inner(name)
        `)
        .eq('couple_id', couple.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (!eventsError) {
        events = eventsData || []
      }

      // Get recent messages
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          messages!inner(
            message_text,
            timestamp,
            sender_id
          )
        `)
        .contains('participant_ids', [userId])
        .order('updated_at', { ascending: false })
        .limit(5)

      if (!conversationsError) {
        messages = conversationsData?.flatMap(conv => 
          conv.messages.map(msg => ({
            ...msg,
            is_from_user: msg.sender_id === userId
          }))
        ).slice(0, 10) || []
      }
    }

    return {
      couple,
      bookings,
      payments,
      events,
      messages,
      preferences: {
        styles: couple?.couple_style_preferences?.map((p: any) => p.style_tags.label) || [],
        vibes: couple?.couple_vibe_preferences?.map((p: any) => p.vibe_tags.label) || [],
        languages: couple?.couple_language_preferences?.map((p: any) => p.languages.language) || []
      }
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return null
  }
}

async function getServicesContext(supabase: any) {
  try {
    // Get available service packages
    const { data: packages, error: packagesError } = await supabase
      .from('service_packages')
      .select(`
        id,
        service_type,
        name,
        description,
        price,
        features,
        hour_amount,
        event_type,
        status
      `)
      .eq('status', 'approved')
      .order('price', { ascending: true })

    if (packagesError) {
      console.error('Error fetching packages:', packagesError)
      return { packages: [] }
    }

    // Group packages by service type for easier recommendations
    const packagesByService = (packages || []).reduce((acc: any, pkg: any) => {
      if (!acc[pkg.service_type]) {
        acc[pkg.service_type] = []
      }
      acc[pkg.service_type].push(pkg)
      return acc
    }, {})

    return {
      packages: packages || [],
      packagesByService,
      serviceTypes: Object.keys(packagesByService)
    }
  } catch (error) {
    console.error('Error getting services context:', error)
    return { packages: [] }
  }
}

function createSystemPrompt(userContext: any, servicesContext: any) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100)
  }

  let prompt = `You are Ava Luna, a friendly and knowledgeable wedding planning assistant for B. Remembered, a wedding booking platform. You help couples plan their perfect wedding by recommending services, answering questions, and providing personalized advice.

PLATFORM INFORMATION:
B. Remembered is a wedding booking platform that connects couples with verified vendors for:
- Photography (capturing precious moments)
- Videography (cinematic wedding films)
- DJ Services (music and entertainment)
- Live Musicians (ceremony and reception music)
- Coordination (day-of planning and management)
- Planning (full-service wedding planning)

AVAILABLE SERVICES:`

  // Add service packages information
  if (servicesContext.packagesByService) {
    Object.entries(servicesContext.packagesByService).forEach(([serviceType, packages]: [string, any]) => {
      prompt += `\n\n${serviceType.toUpperCase()} PACKAGES:`
      packages.slice(0, 3).forEach((pkg: any) => {
        prompt += `\n- ${pkg.name}: ${formatPrice(pkg.price)}`
        if (pkg.hour_amount) prompt += ` (${pkg.hour_amount} hours)`
        if (pkg.description) prompt += ` - ${pkg.description.substring(0, 100)}...`
      })
    })
  }

  // Add user context if available
  if (userContext?.couple) {
    const couple = userContext.couple
    prompt += `\n\nUSER PROFILE:
- Names: ${couple.partner1_name}${couple.partner2_name ? ` & ${couple.partner2_name}` : ''}
- Wedding Date: ${couple.wedding_date ? new Date(couple.wedding_date).toLocaleDateString() : 'Not set'}
- Venue: ${couple.venue_name || 'Not selected'}
- Budget: ${couple.budget ? formatPrice(couple.budget) : 'Not specified'}
- Guest Count: ${couple.guest_count || 'Not specified'}
- Location: ${couple.venue_city && couple.venue_state ? `${couple.venue_city}, ${couple.venue_state}` : 'Not specified'}`

    if (userContext.preferences.styles.length > 0) {
      prompt += `\n- Style Preferences: ${userContext.preferences.styles.join(', ')}`
    }
    if (userContext.preferences.vibes.length > 0) {
      prompt += `\n- Vibe Preferences: ${userContext.preferences.vibes.join(', ')}`
    }
    if (userContext.preferences.languages.length > 0) {
      prompt += `\n- Language Preferences: ${userContext.preferences.languages.join(', ')}`
    }

    // Add booking history
    if (userContext.bookings.length > 0) {
      prompt += `\n\nCURRENT BOOKINGS:`
      userContext.bookings.forEach((booking: any) => {
        prompt += `\n- ${booking.service_packages?.name || booking.service_type} with ${booking.vendors.name} (${booking.status}) - ${formatPrice(booking.amount)}`
      })
    }

    // Add upcoming events
    if (userContext.events.length > 0) {
      prompt += `\n\nUPCOMING EVENTS:`
      userContext.events.forEach((event: any) => {
        prompt += `\n- ${event.title || 'Wedding Event'} on ${new Date(event.start_time).toLocaleDateString()} with ${event.vendors.name}`
      })
    }

    // Add payment status
    const totalPaid = userContext.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
    const totalBookings = userContext.bookings.reduce((sum: number, booking: any) => sum + booking.amount, 0)
    const remainingBalance = totalBookings - totalPaid

    if (totalBookings > 0) {
      prompt += `\n\nPAYMENT STATUS:
- Total Investment: ${formatPrice(totalBookings)}
- Amount Paid: ${formatPrice(totalPaid)}
- Remaining Balance: ${formatPrice(remainingBalance)}`
    }
  }

  prompt += `\n\nINSTRUCTIONS:
1. Be friendly, enthusiastic, and helpful
2. Use the user's name when you know it
3. Make personalized recommendations based on their profile, preferences, and existing bookings
4. Help them discover packages that complement their existing services
5. Provide specific package names and prices when recommending
6. If they ask about availability, remind them that they can check specific dates when adding to cart
7. For booking questions, guide them to the appropriate sections of the platform
8. Keep responses conversational and not too long (2-3 paragraphs max)
9. Use emojis sparingly but appropriately
10. If they need to take action (like booking or viewing), suggest specific next steps

RESPONSE FORMAT:
- Always be helpful and wedding-focused
- Provide actionable advice
- Include specific package recommendations when relevant
- Guide users to the right parts of the platform
- Be encouraging about their wedding planning journey

Remember: You're helping couples plan their dream wedding through B. Remembered's platform!`

  return prompt
}