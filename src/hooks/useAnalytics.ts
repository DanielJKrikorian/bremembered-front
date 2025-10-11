import { v4 as uuidv4 } from 'uuid';

// Event queue to ensure sequential processing
const eventQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

// Track processed events per session
const processedEvents: Set<string> = new Set();

export const useAnalytics = (screenName: string, site: string, userId?: string | null) => {
  // Debug: Log when useAnalytics is called
  console.log(`useAnalytics called: screenName=${screenName}, site=${site}, userId=${userId || 'null'}, time=${new Date().toISOString()}`);

  // Initialize session_id
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', sessionId);
    // Clear session-related flags
    sessionStorage.removeItem('analytics_session_started');
    processedEvents.clear();
    sessionStorage.setItem('analytics_processed_events', JSON.stringify([...processedEvents]));
  }

  // Load processed events from sessionStorage
  const storedEvents = sessionStorage.getItem('analytics_processed_events');
  if (storedEvents) {
    processedEvents.clear();
    JSON.parse(storedEvents).forEach((event: string) => processedEvents.add(event));
  }

  const logAnalyticsEvent = async (eventType: string, screen: string) => {
    // Create unique event key
    const eventKey = `${sessionId}_${screen}_${eventType}`;
    const currentTime = Date.now();

    // Check if event was already processed
    if (processedEvents.has(eventKey)) {
      console.log(`Skipping already processed event for ${screen} (${eventType}) at ${new Date().toISOString()}`);
      return;
    }

    const payload = {
      site,
      session_id: sessionId,
      user_id: userId || null,
      screen_name: screen,
      event_type: eventType,
      device_info: {},
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending analytics payload:', payload);

    try {
      const response = await fetch(
        'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/log-analytics-event',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log('Analytics event logged:', result);

      // Mark event as processed
      processedEvents.add(eventKey);
      sessionStorage.setItem('analytics_processed_events', JSON.stringify([...processedEvents]));
    } catch (error) {
      console.error('Error logging analytics event:', error);
    }
  };

  // Process events sequentially
  const processEvent = async (eventType: string, screen: string) => {
    const eventKey = `${sessionId}_${screen}_${eventType}`;
    if (processedEvents.has(eventKey)) {
      console.log(`Skipping queued event for ${screen} (${eventType}) at ${new Date().toISOString()}`);
      return;
    }

    if (isProcessing) {
      console.log(`Queueing event for ${screen} (${eventType}) at ${new Date().toISOString()}`);
      eventQueue.push(() => logAnalyticsEvent(eventType, screen));
      return;
    }

    isProcessing = true;
    await logAnalyticsEvent(eventType, screen);
    isProcessing = false;

    // Process next event in queue
    while (eventQueue.length > 0) {
      const nextEvent = eventQueue.shift();
      if (nextEvent) {
        isProcessing = true;
        await nextEvent();
        isProcessing = false;
      }
    }
  };

  // Log session_start only if not already logged
  const sessionStarted = sessionStorage.getItem('analytics_session_started');
  if (!sessionStarted) {
    console.log(`Logging session_start for ${screenName} at ${new Date().toISOString()}`);
    processEvent('session_start', screenName);
    sessionStorage.setItem('analytics_session_started', 'true');
  } else {
    console.log(`Skipping session_start for ${screenName} (already logged) at ${new Date().toISOString()}`);
  }

  // Log page_view
  console.log(`Logging page_view for ${screenName} at ${new Date().toISOString()}`);
  processEvent('page_view', screenName);
};