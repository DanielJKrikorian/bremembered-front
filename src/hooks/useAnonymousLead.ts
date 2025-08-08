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
      
      // Always check if Supabase is properly configured before making requests
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured, using local-only lead');
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
      const { data: existingLead, error: fetchError } = await supabase
        .from('anonymous_leads')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingLead) {
        setLead(existingLead);
      } else {
        // Create new lead
        const newLead = {
          session_id: sessionId,
          ip_address: null, // Will be handled by server
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
      console.error('Error initializing lead:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
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

    // Always check if Supabase is properly configured before making requests
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured, updating local state only');
      setLead(prev => prev ? { ...prev, ...updates } : null);
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
        .single();

      if (error) throw error;
      setLead(data);
    } catch (err) {
      console.error('Error updating lead:', err);
      // Update local state even if DB update fails
      setLead(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Save email
  const saveEmail = async (email: string) => {
    if (!lead) return;

    // Always check if Supabase is properly configured before making requests
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured, updating local state only');
      setLead(prev => prev ? { ...prev, email } : null);
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
        .single();

      if (error) throw error;
      setLead(data);
    } catch (err) {
      console.error('Error saving email:', err);
      // Update local state even if DB update fails
      setLead(prev => prev ? { ...prev, email } : null);
    }
  };

  // Abandon lead
  const abandonLead = async () => {
    if (!lead) return;

    // Always check if Supabase is properly configured before making requests
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured, skipping abandon operation');
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
      console.error('Error abandoning lead:', err);
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