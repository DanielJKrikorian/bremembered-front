import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Calendar, 
  X, 
  Edit2, 
  Save, 
  Download, 
  Share2, 
  Music, 
  AlertCircle, 
  Check, 
  ChevronDown, 
  ChevronUp,
  FileDown,
  FileText,
  Play,
  Trash2
} from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
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
  is_standard?: boolean;
  music_notes?: string;
  playlist_type?: string;
  song_requests?: string[];
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  type: string;
  duration_minutes: number;
  music_notes: string;
  playlist_type: string;
  song_requests: string[];
}

interface StandardEvent {
  type: string;
  title: string;
  description: string;
  duration_minutes: number;
  order: number;
  playlist_type?: string;
}

export const WeddingTimeline: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [showStandardEvents, setShowStandardEvents] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_date: couple?.wedding_date || '',
    event_time: '',
    location: '',
    type: 'custom',
    duration_minutes: 60,
    music_notes: '',
    playlist_type: '',
    song_requests: []
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [newSongRequest, setNewSongRequest] = useState('');

  const eventTypes = [
    { value: 'custom', label: 'Custom Event' },
    { value: 'getting_ready', label: 'Getting Ready' },
    { value: 'first_look', label: 'First Look' },
    { value: 'ceremony', label: 'Ceremony' },
    { value: 'cocktail_hour', label: 'Cocktail Hour' },
    { value: 'reception_entrance', label: 'Reception Entrance' },
    { value: 'first_dance', label: 'First Dance' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'toasts', label: 'Toasts & Speeches' },
    { value: 'cake_cutting', label: 'Cake Cutting' },
    { value: 'parent_dances', label: 'Parent Dances' },
    { value: 'open_dancing', label: 'Open Dancing' },
    { value: 'bouquet_toss', label: 'Bouquet & Garter Toss' },
    { value: 'send_off', label: 'Grand Send-Off' },
    { value: 'photo_session', label: 'Photo Session' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'vendor_arrival', label: 'Vendor Arrival' },
    { value: 'other', label: 'Other' }
  ];

  const playlistTypes = [
    { value: '', label: 'No music needed' },
    { value: 'specific_song', label: 'Specific Song' },
    { value: 'playlist', label: 'Playlist/Genre' },
    { value: 'live_music', label: 'Live Music' },
    { value: 'dj_choice', label: 'DJ\'s Choice' }
  ];

  const standardEvents: StandardEvent[] = [
    {
      type: 'getting_ready',
      title: 'Getting Ready',
      description: 'Hair, makeup, and final preparations',
      duration_minutes: 120,
      order: 1,
      playlist_type: 'playlist'
    },
    {
      type: 'first_look',
      title: 'First Look',
      description: 'Private moment seeing each other before the ceremony',
      duration_minutes: 30,
      order: 2,
      playlist_type: 'specific_song'
    },
    {
      type: 'ceremony',
      title: 'Ceremony',
      description: 'Wedding ceremony',
      duration_minutes: 60,
      order: 3,
      playlist_type: 'specific_song'
    },
    {
      type: 'cocktail_hour',
      title: 'Cocktail Hour',
      description: 'Drinks and appetizers for guests',
      duration_minutes: 60,
      order: 4,
      playlist_type: 'playlist'
    },
    {
      type: 'reception_entrance',
      title: 'Grand Entrance',
      description: 'Introduction of the wedding party and newlyweds',
      duration_minutes: 15,
      order: 5,
      playlist_type: 'specific_song'
    },
    {
      type: 'first_dance',
      title: 'First Dance',
      description: 'First dance as a married couple',
      duration_minutes: 10,
      order: 6,
      playlist_type: 'specific_song'
    },
    {
      type: 'dinner',
      title: 'Dinner Service',
      description: 'Meal service for all guests',
      duration_minutes: 60,
      order: 7,
      playlist_type: 'playlist'
    },
    {
      type: 'toasts',
      title: 'Toasts & Speeches',
      description: 'Speeches from wedding party and family',
      duration_minutes: 30,
      order: 8
    },
    {
      type: 'cake_cutting',
      title: 'Cake Cutting',
      description: 'Ceremonial cutting of the wedding cake',
      duration_minutes: 15,
      order: 9,
      playlist_type: 'specific_song'
    },
    {
      type: 'parent_dances',
      title: 'Parent Dances',
      description: 'Special dances with parents',
      duration_minutes: 15,
      order: 10,
      playlist_type: 'specific_song'
    },
    {
      type: 'open_dancing',
      title: 'Open Dancing',
      description: 'Dance floor opens for all guests',
      duration_minutes: 120,
      order: 11,
      playlist_type: 'playlist'
    },
    {
      type: 'bouquet_toss',
      title: 'Bouquet & Garter Toss',
      description: 'Traditional bouquet and garter toss',
      duration_minutes: 15,
      order: 12,
      playlist_type: 'specific_song'
    },
    {
      type: 'send_off',
      title: 'Grand Send-Off',
      description: 'Final farewell as you depart the reception',
      duration_minutes: 15,
      order: 13,
      playlist_type: 'specific_song'
    }
  ];

  useEffect(() => {
    if (couple?.id) {
      fetchEvents();
    }
  }, [couple?.id]);

  useEffect(() => {
    if (couple?.wedding_date && !formData.event_date) {
      setFormData(prev => ({ ...prev, event_date: couple.wedding_date! }));
    }
  }, [couple?.wedding_date]);

  const fetchEvents = async () => {
    if (!couple?.id) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock data for demo
      const mockEvents: TimelineEvent[] = [
        {
          id: 'mock-1',
          couple_id: couple.id,
          title: 'Getting Ready',
          description: 'Hair, makeup, and final preparations',
          event_date: couple.wedding_date || '2024-08-15',
          event_time: '10:00',
          location: 'Bridal Suite',
          type: 'getting_ready',
          duration_minutes: 120,
          is_standard: true,
          music_notes: 'Upbeat, feel-good songs to get everyone excited',
          playlist_type: 'playlist',
          song_requests: ['Good as Hell - Lizzo', 'Confident - Demi Lovato'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'mock-2',
          couple_id: couple.id,
          title: 'Ceremony',
          description: 'Wedding ceremony',
          event_date: couple.wedding_date || '2024-08-15',
          event_time: '16:00',
          location: 'Garden Pavilion',
          type: 'ceremony',
          duration_minutes: 60,
          is_standard: true,
          music_notes: 'Processional: Canon in D, Recessional: Marry Me by Train',
          playlist_type: 'specific_song',
          song_requests: ['Canon in D - Pachelbel', 'Marry Me - Train'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];
      setEvents(mockEvents);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('couple_id', couple.id)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load timeline events');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.event_date) {
      errors.event_date = 'Date is required';
    }
    if (!formData.event_time) {
      errors.event_time = 'Time is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (type: string) => {
    const standardEvent = standardEvents.find(event => event.type === type);
    
    if (standardEvent) {
      setFormData(prev => ({
        ...prev,
        type,
        title: standardEvent.title,
        description: standardEvent.description,
        duration_minutes: standardEvent.duration_minutes,
        playlist_type: standardEvent.playlist_type || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, type }));
    }
  };

  const addSongRequest = () => {
    if (newSongRequest.trim()) {
      setFormData(prev => ({
        ...prev,
        song_requests: [...prev.song_requests, newSongRequest.trim()]
      }));
      setNewSongRequest('');
    }
  };

  const removeSongRequest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      song_requests: prev.song_requests.filter((_, i) => i !== index)
    }));
  };

  const handleAddEvent = async () => {
    if (!validateForm() || !couple?.id) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock add for demo
      const newEvent: TimelineEvent = {
        id: `mock-${Date.now()}`,
        couple_id: couple.id,
        ...formData,
        is_standard: formData.type !== 'custom' && formData.type !== 'other',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setEvents(prev => [...prev, newEvent].sort((a, b) => {
        const dateA = new Date(`${a.event_date}T${a.event_time}`);
        const dateB = new Date(`${b.event_date}T${b.event_time}`);
        return dateA.getTime() - dateB.getTime();
      }));
      setIsAddingEvent(false);
      resetForm();
      setSuccessMessage('Event added successfully');
      return;
    }

    try {
      const eventData = {
        ...formData,
        couple_id: couple.id,
        is_standard: formData.type !== 'custom' && formData.type !== 'other'
      };

      const { error } = await supabase
        .from('timeline_events')
        .insert([eventData]);

      if (error) throw error;

      fetchEvents();
      setIsAddingEvent(false);
      resetForm();
      setSuccessMessage('Event added successfully');
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event');
    }
  };

  const handleUpdateEvent = async (eventId: string) => {
    if (!validateForm()) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock update for demo
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, ...formData, updated_at: new Date().toISOString() }
          : event
      ));
      setEditingEvent(null);
      resetForm();
      setSuccessMessage('Event updated successfully');
      return;
    }

    try {
      const { error } = await supabase
        .from('timeline_events')
        .update(formData)
        .eq('id', eventId);

      if (error) throw error;

      fetchEvents();
      setEditingEvent(null);
      resetForm();
      setSuccessMessage('Event updated successfully');
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      // Mock delete for demo
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setSuccessMessage('Event deleted successfully');
      return;
    }

    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      fetchEvents();
      setSuccessMessage('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
    }
  };

  const addStandardEvents = async () => {
    if (!couple?.id || !couple.wedding_date) {
      setError('Please set your wedding date first');
      return;
    }

    const weddingDate = couple.wedding_date;
    let currentTime = new Date(`${weddingDate}T12:00:00`);

    const ceremonyEvent = events.find(e => e.type === 'ceremony');
    if (ceremonyEvent) {
      currentTime = new Date(`${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`);
    }

    const standardEventsToAdd = standardEvents
      .filter(stdEvent => !events.some(e => e.type === stdEvent.type))
      .map(stdEvent => {
        if (stdEvent.order < 3 && ceremonyEvent) {
          const ceremonyTime = new Date(`${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`);
          let eventTime;

          if (stdEvent.type === 'getting_ready') {
            eventTime = new Date(ceremonyTime);
            eventTime.setHours(eventTime.getHours() - 3);
          } else if (stdEvent.type === 'first_look') {
            eventTime = new Date(ceremonyTime);
            eventTime.setHours(eventTime.getHours() - 1);
          }

          return {
            couple_id: couple.id,
            title: stdEvent.title,
            description: stdEvent.description,
            event_date: weddingDate,
            event_time: format(eventTime || currentTime, 'HH:mm'),
            type: stdEvent.type,
            duration_minutes: stdEvent.duration_minutes,
            is_standard: true,
            playlist_type: stdEvent.playlist_type || ''
          };
        }

        const eventData = {
          couple_id: couple.id,
          title: stdEvent.title,
          description: stdEvent.description,
          event_date: weddingDate,
          event_time: format(currentTime, 'HH:mm'),
          type: stdEvent.type,
          duration_minutes: stdEvent.duration_minutes,
          is_standard: true,
          playlist_type: stdEvent.playlist_type || ''
        };

        currentTime = addMinutes(currentTime, stdEvent.duration_minutes);
        return eventData;
      });

    if (!supabase || !isSupabaseConfigured()) {
      // Mock add for demo
      const mockEvents = standardEventsToAdd.map((eventData, index) => ({
        ...eventData,
        id: `mock-standard-${Date.now()}-${index}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) as TimelineEvent[];
      
      setEvents(prev => [...prev, ...mockEvents].sort((a, b) => {
        const dateA = new Date(`${a.event_date}T${a.event_time}`);
        const dateB = new Date(`${b.event_date}T${b.event_time}`);
        return dateA.getTime() - dateB.getTime();
      }));
      setShowStandardEvents(false);
      setSuccessMessage('Standard events added successfully');
      return;
    }

    try {
      const { error } = await supabase
        .from('timeline_events')
        .insert(standardEventsToAdd);

      if (error) throw error;

      fetchEvents();
      setShowStandardEvents(false);
      setSuccessMessage('Standard events added successfully');
    } catch (err) {
      console.error('Error adding standard events:', err);
      setError('Failed to add standard events');
    }
  };

  const startEditing = (event: TimelineEvent) => {
    setEditingEvent(event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location || '',
      type: event.type,
      duration_minutes: event.duration_minutes || 60,
      music_notes: event.music_notes || '',
      playlist_type: event.playlist_type || '',
      song_requests: event.song_requests || []
    });
    setFormErrors({});
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: couple?.wedding_date || '',
      event_time: '',
      location: '',
      type: 'custom',
      duration_minutes: 60,
      music_notes: '',
      playlist_type: '',
      song_requests: []
    });
    setFormErrors({});
    setNewSongRequest('');
  };

  const cancelForm = () => {
    setIsAddingEvent(false);
    setEditingEvent(null);
    resetForm();
  };

  const calculateTimeDifference = (currentEvent: TimelineEvent, nextEvent: TimelineEvent) => {
    const currentDateTime = new Date(`${currentEvent.event_date}T${currentEvent.event_time}`);
    const nextDateTime = new Date(`${nextEvent.event_date}T${nextEvent.event_time}`);

    if (currentEvent.duration_minutes) {
      currentDateTime.setMinutes(currentDateTime.getMinutes() + currentEvent.duration_minutes);
    }

    const diffMinutes = Math.round((nextDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60));

    if (diffMinutes < 0) {
      return (
        <span className="text-red-500 text-xs">
          ⚠️ Events overlap by {Math.abs(diffMinutes)} minutes
        </span>
      );
    } else if (diffMinutes === 0) {
      return <span className="text-xs text-gray-500">Next event starts immediately</span>;
    } else if (diffMinutes < 60) {
      return <span className="text-xs text-gray-500">{diffMinutes} minute break</span>;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return (
        <span className="text-xs text-gray-500">
          {hours} hour{hours !== 1 ? 's' : ''}{minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''} break
        </span>
      );
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ceremony': return '💒';
      case 'first_dance': return '💃';
      case 'cake_cutting': return '🎂';
      case 'cocktail_hour': return '🍸';
      case 'dinner': return '🍽️';
      case 'getting_ready': return '💄';
      case 'photo_session': return '📸';
      case 'reception_entrance': return '🎉';
      case 'toasts': return '🥂';
      case 'parent_dances': return '👨‍👩‍👧‍👦';
      case 'open_dancing': return '🕺';
      case 'bouquet_toss': return '💐';
      case 'send_off': return '✨';
      default: return '📅';
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Wedding Timeline</h2>
            <p className="text-gray-600 mt-1">Plan and organize your wedding day events with music preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button
                variant="outline"
                icon={Download}
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={events.length === 0}
              >
                Download
                {showDownloadMenu ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
              
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {/* handleDownloadPDF */}}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download as PDF
                    </button>
                    <button
                      onClick={() => {/* handleDownloadCSV */}}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download as CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              icon={showStandardEvents ? ChevronUp : ChevronDown}
              onClick={() => setShowStandardEvents(!showStandardEvents)}
            >
              {showStandardEvents ? 'Hide' : 'Add'} Standard Events
            </Button>
            
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsAddingEvent(true)}
            >
              Add Custom Event
            </Button>
          </div>
        </div>

        {/* Wedding Date */}
        {!couple?.wedding_date && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
              <p className="text-amber-700">Please set your wedding date in your profile to use the timeline feature.</p>
            </div>
          </div>
        )}
      </Card>

      {/* Standard Events */}
      {showStandardEvents && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Standard Wedding Events</h3>
            <Button
              variant="primary"
              icon={Plus}
              onClick={addStandardEvents}
              disabled={!couple?.wedding_date}
            >
              Add All Standard Events
            </Button>
          </div>

          {!couple?.wedding_date && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                <p className="text-yellow-700">Please set your wedding date first to add standard events.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardEvents.map((event) => {
              const isAdded = events.some(e => e.type === event.type);
              return (
                <div
                  key={event.type}
                  className={`p-4 rounded-lg border transition-all ${
                    isAdded
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getEventIcon(event.type)}</span>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                    </div>
                    {isAdded ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Added
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Plus}
                        onClick={() => {
                          const eventData = {
                            couple_id: couple.id,
                            title: event.title,
                            description: event.description,
                            event_date: couple.wedding_date!,
                            event_time: format(currentTime, 'HH:mm'),
                            type: event.type,
                            duration_minutes: event.duration_minutes,
                            is_standard: true,
                            playlist_type: event.playlist_type || ''
                          };
                          
                          if (!supabase || !isSupabaseConfigured()) {
                            const newEvent: TimelineEvent = {
                              ...eventData,
                              id: `mock-${Date.now()}`,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            };
                            setEvents(prev => [...prev, newEvent].sort((a, b) => {
                              const dateA = new Date(`${a.event_date}T${a.event_time}`);
                              const dateB = new Date(`${b.event_date}T${b.event_time}`);
                              return dateA.getTime() - dateB.getTime();
                            }));
                            setSuccessMessage(`Added ${event.title} to your timeline`);
                          }
                        }}
                        disabled={!couple?.wedding_date}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {event.duration_minutes} minutes
                    {event.playlist_type && (
                      <>
                        <Music className="w-3 h-3 ml-2 mr-1" />
                        Music needed
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Event Form */}
      {(isAddingEvent || editingEvent) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {editingEvent ? 'Edit Event' : 'Add Custom Event'}
          </h3>
          
          <div className="space-y-6">
            {/* Basic Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Event Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                error={formErrors.title}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Enter event description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                error={formErrors.event_date}
                required
              />
              
              <Input
                label="Time"
                type="time"
                value={formData.event_time}
                onChange={(e) => handleInputChange('event_time', e.target.value)}
                error={formErrors.event_time}
                required
              />
              
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration_minutes.toString()}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                min="5"
                step="5"
              />
            </div>

            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location (optional)"
              icon={MapPin}
            />

            {/* Music Section */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Music className="w-5 h-5 text-rose-600" />
                <h4 className="text-lg font-semibold text-gray-900">Music & Playlist Preferences</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Music Type</label>
                  <select
                    value={formData.playlist_type}
                    onChange={(e) => handleInputChange('playlist_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {playlistTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.playlist_type && formData.playlist_type !== '' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Music Notes & Requests
                      </label>
                      <textarea
                        value={formData.music_notes}
                        onChange={(e) => handleInputChange('music_notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Describe the music style, mood, or specific instructions for this event..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Song Requests
                      </label>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newSongRequest}
                            onChange={(e) => setNewSongRequest(e.target.value)}
                            placeholder="Song Title - Artist"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            onKeyPress={(e) => e.key === 'Enter' && addSongRequest()}
                          />
                          <Button
                            variant="outline"
                            icon={Plus}
                            onClick={addSongRequest}
                            disabled={!newSongRequest.trim()}
                          >
                            Add Song
                          </Button>
                        </div>
                        
                        {formData.song_requests.length > 0 && (
                          <div className="space-y-2">
                            {formData.song_requests.map((song, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Music className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-900">{song}</span>
                                </div>
                                <button
                                  onClick={() => removeSongRequest(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => editingEvent ? handleUpdateEvent(editingEvent) : handleAddEvent()}
                icon={editingEvent ? Save : Plus}
              >
                {editingEvent ? 'Update Event' : 'Add Event'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline Events */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Wedding Day Schedule</h3>
          <p className="text-sm text-gray-600 mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''} planned
          </p>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h4>
            <p className="text-gray-600 mb-6">
              Get started by adding standard wedding events or creating custom ones
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => setShowStandardEvents(true)}
                disabled={!couple?.wedding_date}
              >
                Add Standard Events
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingEvent(true)}
              >
                Add Custom Event
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="divide-y divide-gray-100">
              {events.map((event, index) => (
                <div key={event.id} className="p-6 relative hover:bg-gray-50 transition-colors">
                  {/* Timeline Dot */}
                  <div className="absolute left-8 top-8 w-4 h-4 rounded-full bg-rose-500 transform -translate-x-1/2 border-2 border-white shadow-sm"></div>

                  <div className="ml-12">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-lg">{getEventIcon(event.type)}</span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800">
                            {format(parseISO(`2000-01-01T${event.event_time}`), 'h:mm a')}
                            {event.duration_minutes && (
                              <> - {format(addMinutes(parseISO(`2000-01-01T${event.event_time}`), event.duration_minutes), 'h:mm a')}</>
                            )}
                          </span>
                          <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                        </div>

                        {event.description && (
                          <p className="text-gray-600 mb-3">{event.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(parseISO(event.event_date), 'MMMM d, yyyy')}
                          </div>
                          {event.duration_minutes && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {event.duration_minutes} minutes
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>

                        {/* Music Section */}
                        {(event.music_notes || event.song_requests?.length || event.playlist_type) && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Music className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-900">Music Preferences</span>
                            </div>
                            
                            {event.playlist_type && (
                              <div className="mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {playlistTypes.find(p => p.value === event.playlist_type)?.label}
                                </span>
                              </div>
                            )}
                            
                            {event.music_notes && (
                              <p className="text-sm text-purple-800 mb-2">{event.music_notes}</p>
                            )}
                            
                            {event.song_requests && event.song_requests.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-purple-900">Song Requests:</p>
                                {event.song_requests.map((song, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <Play className="w-3 h-3 text-purple-600" />
                                    <span className="text-xs text-purple-800">{song}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Time Gap Indicator */}
                        {index < events.length - 1 && (
                          <div className="mt-3">
                            {calculateTimeDifference(event, events[index + 1])}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          icon={Edit2}
                          size="sm"
                          onClick={() => startEditing(event)}
                        />
                        <Button
                          variant="ghost"
                          icon={Trash2}
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-500 hover:text-red-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Share Timeline */}
      {events.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Share Timeline with Vendors</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Share your wedding timeline with your vendors so they can coordinate and prepare for your special day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" icon={Share2}>
              Generate Share Link
            </Button>
            <Button variant="outline" icon={Download}>
              Download for Vendors
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};