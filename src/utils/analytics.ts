// analytics.ts
import { v4 as uuidv4 } from 'uuid';

// Event queue to ensure sequential processing
const eventQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

// Track processed events per session with timestamps
interface ProcessedEvent {
  key: string;
  timestamp: number;
}

const processedEvents: ProcessedEvent[] = [];

// Initialize session_id
let sessionId = sessionStorage.getItem('analytics_session_id');
if (!sessionId) {
  sessionId = uuidv4();
  sessionStorage.setItem('analytics_session_id', sessionId);
  sessionStorage.removeItem('analytics_session_started');
  processedEvents.length = 0;
  sessionStorage.setItem('analytics_processed_events', JSON.stringify(processedEvents));
}

// Load processed events from sessionStorage
const storedEvents = sessionStorage.getItem('analytics_processed_events');
if (storedEvents) {
  processedEvents.length = 0;
  processedEvents.push(...JSON.parse(storedEvents));
}

export const logAnalyticsEvent = async (
  eventType: string,
  screenName: string,
  site: string,
  userId?: string | null
) => {
  // Create unique event key
  const eventKey = `${sessionId}_${screenName}_${eventType}`;
  const currentTime = Date.now();

  // Check if event was already processed recently (within 1 second for page_view)
  const existingEvent = processedEvents.find(event => event.key === eventKey);
  if (existingEvent && eventType === 'page_view' && currentTime - existingEvent.timestamp < 1000) {
    console.log(`Skipping recently processed event for ${screenName} (${eventType}) at ${new Date().toISOString()}`);
    return;
  }
  if (existingEvent && eventType === 'session_start') {
    console.log(`Skipping already processed event for ${screenName} (${eventType}) at ${new Date().toISOString()}`);
    return;
  }

  const payload = {
    site,
    session_id: sessionId,
    user_id: userId || null,
    screen_name: screenName,
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

    // Update or add event to processedEvents
    if (existingEvent) {
      existingEvent.timestamp = currentTime;
    } else {
      processedEvents.push({ key: eventKey, timestamp: currentTime });
    }
    sessionStorage.setItem('analytics_processed_events', JSON.stringify(processedEvents));
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

// Process events sequentially
const processEvent = async (eventType: string, screenName: string, site: string, userId?: string | null) => {
  const eventKey = `${sessionId}_${screenName}_${eventType}`;
  const currentTime = Date.now();

  // Check if event was already processed recently
  const existingEvent = processedEvents.find(event => event.key === eventKey);
  if (existingEvent && eventType === 'page_view' && currentTime - existingEvent.timestamp < 1000) {
    console.log(`Skipping queued event for ${screenName} (${eventType}) at ${new Date().toISOString()}`);
    return;
  }
  if (existingEvent && eventType === 'session_start') {
    console.log(`Skipping queued event for ${screenName} (${eventType}) at ${new Date().toISOString()}`);
    return;
  }

  if (isProcessing) {
    console.log(`Queueing event for ${screenName} (${eventType}) at ${new Date().toISOString()}`);
    eventQueue.push(() => logAnalyticsEvent(eventType, screenName, site, userId));
    return;
  }

  isProcessing = true;
  await logAnalyticsEvent(eventType, screenName, site, userId);
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

// Public function to track page views and session starts
export const trackPageView = (screenName: string, site: string, userId?: string | null) => {
  console.log(`Tracking analytics for ${screenName} at ${new Date().toISOString()}`);

  // Log session_start only if not already logged
  const sessionStarted = sessionStorage.getItem('analytics_session_started');
  if (!sessionStarted) {
    console.log(`Logging session_start for ${screenName} at ${new Date().toISOString()}`);
    processEvent('session_start', screenName, site, userId);
    sessionStorage.setItem('analytics_session_started', 'true');
  } else {
    console.log(`Skipping session_start for ${screenName} (already logged) at ${new Date().toISOString()}`);
  }

  // Log page_view
  console.log(`Logging page_view for ${screenName} at ${new Date().toISOString()}`);
  processEvent('page_view', screenName, site, userId);
};