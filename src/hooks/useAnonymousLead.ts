import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AnonymousLead {
  id?: string;
  session_id: string;
  event_type?: string;
  selected_services?: string[];
  coverage_preferences?: string[];
  hour_preferences?: string;
  budget_range?: string;
  email?: string;
  current_step?: number;
  completed_at?: string;
  abandoned_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const useAnonymousLead = () => {
  const [lead, setLead] = useState<AnonymousLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate or get session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('anonymous_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymous_session_id', sessionId);
    }
    return sessionId;
  };

  // Initialize lead
  const initializeLead = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is properly configured before making requests
      if (!supabase || !isSupabaseConfigured()) {
        const sessionId = getSessionId();
        setLead({
          session_id: sessionId,
          current_step: 1
        });
        setLoading(false);
        return;
      }
      
      const sessionId = getSessionId();

      // Check if lead already exists
      let { data: existingLead, error: fetchError } = await supabase
        .from('anonymous_leads')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows found - treat as null
          existingLead = null;
        } else {
          throw fetchError;
        }
      }

      if (existingLead) {
        setLead(existingLead);
      } else {
        // Create new lead
        const newLead = {
          session_id: sessionId,
          current_step: 1
        };

        const { data, error: insertError } = await supabase
          .from('anonymous_leads')
          .insert([newLead])
          .select()
          .single();

        if (insertError) throw insertError;
        setLead(data);
      }
    } catch (err) {
      // Create local-only lead as fallback
      const sessionId = getSessionId();
      setLead({
        session_id: sessionId,
        current_step: 1
      });
    } finally {
      setLoading(false);
    }
  };

  // Update lead
  const updateLead = async (updates: Partial<AnonymousLead>) => {
    if (!lead) return;

    // Always update local state first
    setLead(prev => prev ? { ...prev, ...updates } : null);

    // Check if Supabase is properly configured before making requests
    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('anonymous_leads')
        .update(updatedData)
        .eq('session_id', lead.session_id)
        .select()
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setLead(data);
      }
    } catch (err) {
      console.error('Failed to update lead in database:', err);
      setError('Failed to save progress. Your selections are saved locally.');
      // Local state is already updated above, so we can continue
    }
  };

  // Save email
  const saveEmail = async (email: string) => {
    if (!lead) return;

    // Always update local state first
    setLead(prev => prev ? { ...prev, email } : null);

    // Check if Supabase is properly configured before making requests
    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('anonymous_leads')
        .update({ 
          email,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', lead.session_id)
        .select()
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setLead(data);
      }
    } catch (err) {
      // Local state is already updated above, so we can continue
    }
  };

  // Abandon lead
  const abandonLead = async () => {
    if (!lead) return;

    // Check if Supabase is properly configured before making requests
    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('anonymous_leads')
        .update({ 
          abandoned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', lead.session_id);

      if (error) throw error;
    } catch (err) {
      // Silently handle abandon failures
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeLead();
  }, []);

  return {
    lead,
    loading,
    error,
    updateLead,
    saveEmail,
    abandonLead
  };
};