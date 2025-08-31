import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit2, Trash2, Save, X, MapPin, Users, Music, Camera, Video, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface TimelineEvent {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  location?: string;
  type: string;
  duration_minutes?: number;
  is_standard: boolean;
  music_notes?: string;
  playlist_requests?: string;
  photo_shotlist?: string;
  created_at: string;
  updated_at: string;
}

export const WeddingTimeline: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_time: '',
    location: '',
    type: 'custom',
    duration_minutes: 60,
    music_notes: '',
    playlist_requests: '',
    photo_shotlist: ''
  });

  useEffect(() => {
    if (couple?.id) {
      fetchTimelineEvents();
    }
  }, [couple]);

  const fetchTimelineEvents = async () => {
    if (!couple?.id) {
      setLoading(false);
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock timeline events for demo
      const mockEvents: TimelineEvent[] = [
        {
          id: 'mock-event-1',
          couple_id: couple.id,
          title: 'Getting Ready',
          description: 'Bride and groom preparation',
          event_date: couple.wedding_date || '2024-08-15',
          event_time: '14:00',
          location: 'Bridal Suite',
          type: 'preparation',
          duration_minutes: 120,
          is_standard: true,
          photo_shotlist: 'Detail shots, getting ready candids, dress hanging',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'mock-event-2',
          couple_id: couple.id,
          title: 'Ceremony',
          description: 'Wedding ceremony',
          event_date: couple.wedding_date || '2024-08-15',
          event_time: '16:00',
          location: 'Garden Altar',
          type: 'ceremony',
          duration_minutes: 30,
          is_standard: true,
          music_notes: 'Processional: Canon in D, Recessional: Wedding March',
          photo_shotlist: 'Processional, vows, ring exchange, first kiss, recessional',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'mock-event-3',
          couple_id: couple.id,
          title: 'Cocktail Hour',
          description: 'Guests mingle while couple takes photos',
          event_date: couple.wedding_date || '2024-08-15',
          event_time: '16:30',
          location: 'Garden Terrace',
          type: 'reception',
          duration_minutes: 60,
          is_standard: true,
          music_notes: 'Jazz playlist, acoustic background music',
          photo_shotlist: 'Couple portraits, family photos, guest candids',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'mock-event-4',
          couple_id: couple.id,
          title: 'Reception',
          description: 'Dinner, dancing, and celebration',
          event_date: couple.wedding_date || '2024-08-15',
          event_time: '17:30',
          location: 'Main Ballroom',
          type: 'reception',
          duration_minutes: 300,
          is_standard: true,
          music_notes: 'First dance: Perfect by Ed Sheeran, Party playlist attached',
          playlist_requests: 'Upbeat dance music, no explicit lyrics, mix of decades',
          photo_shotlist: 'First dance, toasts, cake cutting, dancing, candids',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ];
      setTimelineEvents(mockEvents);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('couple_id', couple.id)
        .order('event_time', { ascending: true });

      if (error) throw error;
      setTimelineEvents(data || []);
    } catch (err) {
      console.error('Error fetching timeline events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch timeline events');
    } finally {
      setLoading(false);
    }
  };

  const addTimelineEvent = async () => {
    if (!couple?.id || !newEvent.title || !newEvent.event_time) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock add for demo
      const mockEvent: TimelineEvent = {
        id: `mock-event-${Date.now()}`,
        couple_id: couple.id,
        title: newEvent.title,
        description: newEvent.description,
        event_date: couple.wedding_date || '2024-08-15',
        event_time: newEvent.event_time,
        location: newEvent.location,
        type: newEvent.type,
        duration_minutes: newEvent.duration_minutes,
        is_standard: false,
        music_notes: newEvent.music_notes,
        playlist_requests: newEvent.playlist_requests,
        photo_shotlist: newEvent.photo_shotlist,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTimelineEvents(prev => [...prev, mockEvent].sort((a, b) => a.event_time.localeCompare(b.event_time)));
      resetNewEvent();
      return;
    }

    try {
      const { error } = await supabase
        .from('timeline_events')
        .insert({
          couple_id: couple.id,
          title: newEvent.title,
          description: newEvent.description,
          event_date: couple.wedding_date || new Date().toISOString().split('T')[0],
          event_time: newEvent.event_time,
          location: newEvent.location,
          type: newEvent.type,
          duration_minutes: newEvent.duration_minutes,
          is_standard: false,
          music_notes: newEvent.music_notes,
          playlist_requests: newEvent.playlist_requests,
          photo_shotlist: newEvent.photo_shotlist
        });

      if (error) throw error;
      await fetchTimelineEvents();
      resetNewEvent();
    } catch (err) {
      console.error('Error adding timeline event:', err);
      setError(err instanceof Error ? err.message : 'Failed to add timeline event');
    }
  };

  const deleteTimelineEvent = async (eventId: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      // Mock delete for demo
      setTimelineEvents(prev => prev.filter(event => event.id !== eventId));
      return;
    }

    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventId)
        .eq('couple_id', couple?.id);

      if (error) throw error;
      setTimelineEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      console.error('Error deleting timeline event:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete timeline event');
    }
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      description: '',
      event_time: '',
      location: '',
      type: 'custom',
      duration_minutes: 60,
      music_notes: '',
      playlist_requests: '',
      photo_shotlist: ''
    });
    setShowAddForm(false);
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ceremony': return Calendar;
      case 'reception': return Users;
      case 'preparation': return Clock;
      case 'photography': return Camera;
      case 'videography': return Video;
      case 'music': return Music;
      default: return Clock;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ceremony': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'reception': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'preparation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'photography': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'videography': return 'bg-green-100 text-green-800 border-green-200';
      case 'music': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wedding timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wedding Timeline</h3>
            <p className="text-gray-600">
              Plan your perfect day and share it with your vendors
            </p>
            {couple?.wedding_date && (
              <p className="text-sm text-gray-500 mt-1">
                Wedding Date: {new Date(couple.wedding_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-rose-500">{timelineEvents.length}</div>
              <div className="text-sm text-gray-600">Timeline Events</div>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddForm(true)}
            >
              Add Event
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Add Event Form */}
      {showAddForm && (
        <Card className="p-6 bg-blue-50 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4">Add Timeline Event</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., First Look"
              required
            />
            <Input
              label="Event Time"
              type="time"
              value={newEvent.event_time}
              onChange={(e) => setNewEvent(prev => ({ ...prev, event_time: e.target.value }))}
              icon={Clock}
              required
            />
            <div className="md:col-span-2">
              <Input
                label="Description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this event"
              />
            </div>
            <Input
              label="Location"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Garden Altar, Bridal Suite"
              icon={MapPin}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="custom">Custom</option>
                <option value="ceremony">Ceremony</option>
                <option value="reception">Reception</option>
                <option value="preparation">Preparation</option>
                <option value="photography">Photography</option>
                <option value="videography">Videography</option>
                <option value="music">Music</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={newEvent.duration_minutes}
                onChange={(e) => setNewEvent(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Music Notes (for DJ/Musicians)"
                value={newEvent.music_notes}
                onChange={(e) => setNewEvent(prev => ({ ...prev, music_notes: e.target.value }))}
                placeholder="Special songs, volume preferences, etc."
                icon={Music}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Photo Shot List (for Photographers)"
                value={newEvent.photo_shotlist}
                onChange={(e) => setNewEvent(prev => ({ ...prev, photo_shotlist: e.target.value }))}
                placeholder="Specific shots you want captured during this time"
                icon={Camera}
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                resetNewEvent();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={addTimelineEvent}
              disabled={!newEvent.title || !newEvent.event_time}
              icon={Save}
            >
              Add Event
            </Button>
          </div>
        </Card>
      )}

      {/* Timeline Events */}
      {timelineEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No timeline events yet</h3>
          <p className="text-gray-600 mb-6">
            Start building your wedding day timeline by adding events and sharing details with your vendors
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            icon={Plus}
          >
            Add Your First Event
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {timelineEvents.map((event) => {
            const EventIcon = getEventIcon(event.type);
            const eventColorClass = getEventColor(event.type);
            
            return (
              <Card key={event.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${eventColorClass}`}>
                      <EventIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${eventColorClass}`}>
                          {event.type}
                        </span>
                        {event.is_standard && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Standard
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatTime(event.event_time)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>{event.duration_minutes} minutes</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}
                      
                      {/* Vendor Notes */}
                      <div className="space-y-2">
                        {event.music_notes && (
                          <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Music className="w-4 h-4 text-indigo-600" />
                              <span className="font-medium text-indigo-900 text-sm">Music Notes</span>
                            </div>
                            <p className="text-indigo-800 text-sm">{event.music_notes}</p>
                          </div>
                        )}
                        
                        {event.playlist_requests && (
                          <div className="bg-purple-50 border border-purple-200 rounded p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Music className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-900 text-sm">Playlist Requests</span>
                            </div>
                            <p className="text-purple-800 text-sm">{event.playlist_requests}</p>
                          </div>
                        )}
                        
                        {event.photo_shotlist && (
                          <div className="bg-rose-50 border border-rose-200 rounded p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Camera className="w-4 h-4 text-rose-600" />
                              <span className="font-medium text-rose-900 text-sm">Photo Shot List</span>
                            </div>
                            <p className="text-rose-800 text-sm">{event.photo_shotlist}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!event.is_standard && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => setEditingEvent(event.id)}
                        className="text-gray-400 hover:text-gray-600"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => deleteTimelineEvent(event.id)}
                        className="text-red-400 hover:text-red-600"
                      />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Share Timeline */}
      {timelineEvents.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Share Your Timeline
            </h3>
            <p className="text-gray-600 mb-4">
              Share your detailed timeline with your vendors so everyone is coordinated for your special day
            </p>
            <Button
              variant="primary"
              onClick={() => {
                // This would trigger sharing the timeline with vendors
                alert('Timeline sharing feature coming soon!');
              }}
            >
              Share with Vendors
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};