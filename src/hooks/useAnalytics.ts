import { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';  // If using React Navigation
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';  // Your Supabase client

export function useAnalytics(screenName: string, site: 'bremembered.io', userId?: string) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate/load session ID
    const initSession = async () => {
      let sessionId = await AsyncStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        await AsyncStorage.setItem('analytics_session_id', sessionId);
      }
      sessionIdRef.current = sessionId;

      // Log session start
      await logEvent(site, sessionId, userId, 'session_start', null, {});
    };
    initSession();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (sessionIdRef.current) {
        // Log page view on screen focus
        logEvent(site, sessionIdRef.current, userId, 'page_view', screenName, {});
      }
    }, [screenName, site, userId])
  );

  // Optional: Log session end on app background (use AppState)
}

async function logEvent(
  site: string,
  sessionId: string,
  userId: string | undefined,
  eventType: string,
  screenName: string | null,
  deviceInfo: object
) {
  const payload = {
    site,
    session_id: sessionId,
    user_id: userId || null,
    screen_name: screenName || null,
    event_type: eventType,
    device_info: deviceInfo,
    user_agent: 'React Native App',  // Enhance with actual UA if needed
  };

  // Call Edge Function (instead of direct insert for security)
  const { data, error } = await supabase.functions.invoke('log-analytics-event', { body: payload });
  if (error) console.error('Analytics log failed:', error);
}