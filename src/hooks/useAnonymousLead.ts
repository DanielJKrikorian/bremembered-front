import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AnonymousLead {
  id: string;
  ip_address?: string;
  session_id: string;
  event_type?: string;
  selected_services: string[];
  coverage_preferences: string[];
  hour_preferences?: string;
  budget_range?: string;
  email?: string;
  current_step: number;
  completed_at?: string;
  abandoned_at?: string;
  created_at: string;
  updated_at: string;
}

// Generate a unique session ID
const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('booking_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('booking_session_id', sessionId);
  }
  return sessionId;
};

// Get user's IP address (simplified - in production you'd use a proper service)
const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return 'unknown';
  }
};

export const useAnonymousLead = () => {
  const [lead, setLead] = useState<AnonymousLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize or fetch existing lead
  useEffect(() => {
    const initializeLead = async () => {
      if (!supabase) {
        setError('Supabase connection not available');
        setLoading(false);
        return;
      }

      try {
        const sessionId = getSessionId();
        const ipAddress = await getUserIP();

        // Try to fetch existing lead
        const { data: existingLead, error: fetchError } = await supabase
          .from('anonymous_leads')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingLead) {
          setLead(existingLead);
        } else {
          // Create new lead
          const newLead = {
            session_id: sessionId,
            ip_address: ipAddress,
            current_step: 1,
            selected_services: [],
            coverage_preferences: [],
          };

          const { data: createdLead, error: createError } = await supabase
            .from('anonymous_leads')
            .insert(newLead)
            .select()
            .single();

          if (createError) throw createError;
          setLead(createdLead);
        }
      } catch (err) {
        console.error('Error initializing lead:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeLead();
  }, []);

  // Update lead data
  const updateLead = useCallback(async (updates: Partial<AnonymousLead>) => {
    if (!supabase || !lead) return null;

    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('anonymous_leads')
        .update(updatedData)
        .eq('id', lead.id)
        .select()
        .single();

      if (error) throw error;
      
      setLead(data);
      return data;
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
      return null;
    }
  }, [lead]);

  // Mark as completed
  const completeLead = useCallback(async () => {
    return updateLead({
      completed_at: new Date().toISOString(),
      current_step: 7
    });
  }, [updateLead]);

  // Mark as abandoned and save email
  const abandonLead = useCallback(async (email?: string) => {
    const updates: Partial<AnonymousLead> = {
      abandoned_at: new Date().toISOString()
    };
    
    if (email) {
      updates.email = email;
    }
    
    return updateLead(updates);
  }, [updateLead]);

  // Save email
  const saveEmail = useCallback(async (email: string) => {
    return updateLead({ email });
  }, [updateLead]);

  return {
    lead,
    loading,
    error,
    updateLead,
    completeLead,
    abandonLead,
    saveEmail
  };
};