import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, Edit2, Trash2, Save, X, MapPin, Users, Music, Camera, AlertCircle, Check, ArrowLeft, ArrowRight, Download, FileDown, FileText, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz'; // Added for EDT formatting
import { jsPDF } from 'jspdf';
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

interface EventFormData {
  title: string;
  description: string;
  event_time: string;
  location: string;
  type: string;
  duration_minutes: number;
  music_notes: string;
  playlist_requests: string;
  photo_shotlist: string;
}

interface StandardEvent {
  type: string;
  title: string;
  description: string;
  duration_minutes: number;
  order: number;
}

interface Vendor {
  id: string;
  name: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: TimelineEvent;
  weddingDate: string;
  onSave: (eventData: EventFormData) => void;
  isEditing: boolean;
}

const eventTypes = [
  { value: "custom", label: "Custom Event" },
  { value: "getting_ready", label: "Getting Ready" },
  { value: "first_look", label: "First Look" },
  { value: "ceremony", label: "Ceremony" },
  { value: "cocktail_hour", label: "Cocktail Hour" },
  { value: "reception_entrance", label: "Reception Entrance" },
  { value: "first_dance", label: "First Dance" },
  { value: "dinner", label: "Dinner" },
  { value: "toasts", label: "Toasts & Speeches" },
  { value: "cake_cutting", label: "Cake Cutting" },
  { value: "parent_dances", label: "Parent Dances" },
  { value: "open_dancing", label: "Open Dancing" },
  { value: "bouquet_toss", label: "Bouquet & Garter Toss" },
  { value: "send_off", label: "Grand Send-Off" },
  { value: "photo_session", label: "Photo Session" },
  { value: "transportation", label: "Transportation" },
  { value: "vendor_arrival", label: "Vendor Arrival" },
  { value: "other", label: "Other" },
];

const standardEvents: StandardEvent[] = [
  {
    type: "getting_ready",
    title: "Getting Ready",
    description: "Hair, makeup, and final preparations",
    duration_minutes: 120,
    order: 1,
  },
  {
    type: "first_look",
    title: "First Look",
    description: "Private moment seeing each other before the ceremony",
    duration_minutes: 30,
    order: 2,
  },
  {
    type: "ceremony",
    title: "Ceremony",
    description: "Wedding ceremony",
    duration_minutes: 60,
    order: 3,
  },
  {
    type: "cocktail_hour",
    title: "Cocktail Hour",
    description: "Drinks and appetizers for guests",
    duration_minutes: 60,
    order: 4,
  },
  {
    type: "reception_entrance",
    title: "Grand Entrance",
    description: "Introduction of the wedding party and newlyweds",
    duration_minutes: 15,
    order: 5,
  },
  {
    type: "first_dance",
    title: "First Dance",
    description: "First dance as a married couple",
    duration_minutes: 10,
    order: 6,
  },
  {
    type: "dinner",
    title: "Dinner Service",
    description: "Meal service for all guests",
    duration_minutes: 60,
    order: 7,
  },
  {
    type: "toasts",
    title: "Toasts & Speeches",
    description: "Speeches from wedding party and family",
    duration_minutes: 30,
    order: 8,
  },
  {
    type: "cake_cutting",
    title: "Cake Cutting",
    description: "Ceremonial cutting of the wedding cake",
    duration_minutes: 15,
    order: 9,
  },
  {
    type: "parent_dances",
    title: "Parent Dances",
    description: "Special dances with parents",
    duration_minutes: 15,
    order: 10,
  },
  {
    type: "open_dancing",
    title: "Open Dancing",
    description: "Dance floor opens for all guests",
    duration_minutes: 120,
    order: 11,
  },
  {
    type: "bouquet_toss",
    title: "Bouquet & Garter Toss",
    description: "Traditional bouquet and garter toss",
    duration_minutes: 15,
    order: 12,
  },
  {
    type: "send_off",
    title: "Grand Send-Off",
    description: "Final farewell as you depart the reception",
    duration_minutes: 15,
    order: 13,
  },
];

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  weddingDate,
  onSave,
  isEditing
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>({
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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        event_time: event.event_time,
        location: event.location || '',
        type: event.type,
        duration_minutes: event.duration_minutes || 60,
        music_notes: event.music_notes || '',
        playlist_requests: event.playlist_requests || '',
        photo_shotlist: event.photo_shotlist || ''
      });
    } else {
      setFormData({
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
    }
    setCurrentStep(1);
    setFormErrors({});
  }, [event, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'duration_minutes') {
      const parsedValue = parseInt(value, 10);
      if (!isNaN(parsedValue) && parsedValue >= 5) {
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
      } else {
        setFormData(prev => ({ ...prev, [name]: 5 }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    const standardEvent = standardEvents.find(event => event.type === selectedType);
    if (standardEvent) {
      setFormData(prev => ({
        ...prev,
        type: selectedType,
        title: standardEvent.title,
        description: standardEvent.description,
        duration_minutes: standardEvent.duration_minutes,
      }));
    } else {
      setFormData(prev => ({ ...prev, type: selectedType }));
    }
  };

  const validateCurrentStep = () => {
    const errors: { [key: string]: string } = {};
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        errors.title = "Title is required";
      }
      if (!formData.event_time) {
        errors.event_time = "Time is required";
      }
      if (isNaN(formData.duration_minutes) || formData.duration_minutes < 5) {
        errors.duration_minutes = "Duration must be at least 5 minutes";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.event_time && !isNaN(formData.duration_minutes) && formData.duration_minutes >= 5;
      case 2:
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      onSave(formData);
      onClose();
      setCurrentStep(1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Event Details';
      case 2: return 'Music & Playlist';
      case 3: return 'Photo Shotlist';
      default: return 'Event Details';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Event' : 'Add New Event'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep} of 3: {getStepTitle()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${currentStep >= step
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">{getStepTitle()}</span>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Event Details</h2>
                <p className="text-gray-600">Basic information about your event</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
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
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter event title"
                  error={formErrors.title}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Enter event description"
                  />
                </div>
                <Input
                  label="Time"
                  name="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={handleInputChange}
                  error={formErrors.event_time}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter location"
                    icon={MapPin}
                  />
                  <Input
                    label="Duration (minutes)"
                    name="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    min="5"
                    step="5"
                    error={formErrors.duration_minutes}
                    icon={Clock}
                  />
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Music & Playlist</h2>
                <p className="text-gray-600">Share your music preferences and requests</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Song Requests
                  </label>
                  <textarea
                    name="music_notes"
                    value={formData.music_notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 'Bridal party entrance song: Perfect by Ed Sheeran', 'First dance: At Last by Etta James'"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Playlist Requests & Preferences
                  </label>
                  <textarea
                    name="playlist_requests"
                    value={formData.playlist_requests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 'Cocktail hour: Jazz and acoustic covers', 'Reception: Mix of 80s, 90s, and current hits', 'Do NOT play: Country music'"
                  />
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Photo Shotlist</h2>
                <p className="text-gray-600">Specify the photos you want captured</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Requests & Must-Have Shots
                </label>
                <textarea
                  name="photo_shotlist"
                  value={formData.photo_shotlist}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 'Family group photo with grandparents', 'Ring exchange close-up', 'Bride with bridesmaids getting ready', 'Sunset couple portraits', 'Detail shots of flowers and decor'"
                />
                <p className="text-xs text-gray-500 mt-1">
                  List specific photos you want captured during this event. This helps your photographer plan and ensures no important moments are missed.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center p-4 md:p-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                icon={ArrowLeft}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentStep < 3 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                icon={ArrowRight}
              >
                Next: {currentStep === 1 ? 'Music' : 'Photos'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                icon={Save}
                disabled={!canProceedToNextStep()}
              >
                {isEditing ? 'Update Event' : 'Add Event'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export const WeddingTimeline: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [showStandardEvents, setShowStandardEvents] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (couple?.id) {
      fetchTimelineEvents();
      fetchVendors();
    }
  }, [couple]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchTimelineEvents = async () => {
    if (!couple?.id) {
      setLoading(false);
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      const mockEvents: TimelineEvent[] = [
        {
          id: 'mock-event-1',
          couple_id: couple.id,
          title: 'Getting Ready',
          description: 'Bride and groom preparation',
          event_date: couple.wedding_date || '2026-05-24',
          event_time: '14:00',
          location: 'Bridal Suite',
          type: 'getting_ready',
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
          event_date: couple.wedding_date || '2026-05-24',
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
          event_date: couple.wedding_date || '2026-05-24',
          event_time: '16:30',
          location: 'Garden Terrace',
          type: 'cocktail_hour',
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
          event_date: couple.wedding_date || '2026-05-24',
          event_time: '17:30',
          location: 'Main Ballroom',
          type: 'reception_entrance',
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
        .order('event_date', { ascending: true })
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

  const fetchVendors = async () => {
    if (!couple?.id || !supabase || !isSupabaseConfigured()) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("vendors(id, name)")
        .eq("couple_id", couple.id);
      if (error) throw error;
      const uniqueVendors = Array.from(
        new Map(data?.map((v: any) => [v.vendors.id, v.vendors])).values()
      );
      setVendors(uniqueVendors as Vendor[]);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Failed to fetch vendors");
    }
  };

  const handleSaveEvent = async (eventData: EventFormData) => {
    if (!couple?.id) return;

    console.log('Saving event with data:', eventData, { editingEvent });

    if (!supabase || !isSupabaseConfigured()) {
      // Mock save
      const mockEvent: TimelineEvent = {
        id: editingEvent ? editingEvent.id : `mock-event-${Date.now()}`,
        couple_id: couple.id,
        title: eventData.title,
        description: eventData.description,
        event_date: editingEvent ? editingEvent.event_date : (couple.wedding_date || '2026-05-24'),
        event_time: eventData.event_time,
        location: eventData.location,
        type: eventData.type,
        duration_minutes: eventData.duration_minutes,
        is_standard: eventData.type !== 'custom' && eventData.type !== 'other',
        music_notes: eventData.music_notes,
        playlist_requests: eventData.playlist_requests,
        photo_shotlist: eventData.photo_shotlist,
        created_at: editingEvent ? editingEvent.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (editingEvent) {
        setTimelineEvents(prev => prev.map(event => 
          event.id === editingEvent.id ? mockEvent : event
        ).sort((a, b) => {
          const dateA = new Date(`${a.event_date}T${a.event_time}`);
          const dateB = new Date(`${b.event_date}T${b.event_time}`);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.error('Invalid date in sorting:', { dateA: a.event_date, timeA: a.event_time, dateB: b.event_date, timeB: b.event_time });
            return 0;
          }
          return dateA.getTime() - dateB.getTime();
        }));
      } else {
        setTimelineEvents(prev => [...prev, mockEvent].sort((a, b) => {
          const dateA = new Date(`${a.event_date}T${a.event_time}`);
          const dateB = new Date(`${b.event_date}T${b.event_time}`);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.error('Invalid date in sorting:', { dateA: a.event_date, timeA: a.event_time, dateB: b.event_date, timeB: b.event_time });
            return 0;
          }
          return dateA.getTime() - dateB.getTime();
        }));
      }
      setSuccessMessage(editingEvent ? "Event updated successfully" : "Event added successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowEventModal(false);
      setEditingEvent(null);
      return;
    }

    try {
      const dataToSave = {
        ...eventData,
        couple_id: couple.id,
        event_date: editingEvent ? editingEvent.event_date : (couple.wedding_date || new Date().toISOString().split('T')[0]),
        is_standard: eventData.type !== 'custom' && eventData.type !== 'other'
      };

      console.log('Data to save:', dataToSave);

      if (editingEvent) {
        const { error } = await supabase
          .from('timeline_events')
          .update(dataToSave)
          .eq('id', editingEvent.id)
          .eq('couple_id', couple.id);

        if (error) throw error;
        setSuccessMessage("Event updated successfully");
      } else {
        const { error } = await supabase
          .from('timeline_events')
          .insert([dataToSave]);

        if (error) throw error;
        setSuccessMessage("Event added successfully");
      }

      await fetchTimelineEvents();
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Error saving timeline event:', err);
      setError(err instanceof Error ? err.message : 'Failed to save timeline event');
    }
  };

  const deleteTimelineEvent = async (eventId: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      setTimelineEvents(prev => prev.filter(event => event.id !== eventId));
      setSuccessMessage("Event deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
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
      setSuccessMessage("Event deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting timeline event:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete timeline event');
    }
  };

  const addStandardEvents = async () => {
    if (!couple?.id || !couple.wedding_date) {
      setError("Please set your wedding date in your profile first");
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock add standard
      let currentTime = new Date(`${couple.wedding_date}T12:00:00`);
      const mockStandard = standardEvents.map((stdEvent) => {
        const eventData: TimelineEvent = {
          id: `mock-${stdEvent.type}`,
          couple_id: couple.id,
          title: stdEvent.title,
          description: stdEvent.description,
          event_date: couple.wedding_date,
          event_time: format(currentTime, "HH:mm"),
          type: stdEvent.type,
          duration_minutes: stdEvent.duration_minutes,
          is_standard: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        currentTime = addMinutes(currentTime, stdEvent.duration_minutes);
        return eventData;
      });
      setTimelineEvents(prev => [...prev, ...mockStandard].sort((a, b) => {
        const dateA = new Date(`${a.event_date}T${a.event_time}`);
        const dateB = new Date(`${b.event_date}T${b.event_time}`);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.error('Invalid date in sorting:', { dateA: a.event_date, timeA: a.event_time, dateB: b.event_date, timeB: b.event_time });
          return 0;
        }
        return dateA.getTime() - dateB.getTime();
      }));
      setSuccessMessage("Standard events added successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowStandardEvents(false);
      return;
    }

    try {
      let currentTime = new Date(`${couple.wedding_date}T12:00:00`);
      const ceremonyEvent = timelineEvents.find((e) => e.type === "ceremony");
      if (ceremonyEvent) {
        currentTime = new Date(`${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`);
      }

      const standardEventsToAdd = standardEvents
        .filter((stdEvent) => !timelineEvents.some((e) => e.type === stdEvent.type))
        .map((stdEvent) => {
          let eventTime = currentTime;
          if (stdEvent.order < 3 && ceremonyEvent) {
            const ceremonyTime = new Date(`${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`);
            if (stdEvent.type === "getting_ready") {
              eventTime = new Date(ceremonyTime);
              eventTime.setHours(eventTime.getHours() - 3);
            } else if (stdEvent.type === "first_look") {
              eventTime = new Date(ceremonyTime);
              eventTime.setHours(eventTime.getHours() - 1);
            }
          } else if (stdEvent.order > 3) {
            eventTime = addMinutes(currentTime, stdEvent.duration_minutes || 0);
          }

          const eventData = {
            couple_id: couple.id,
            title: stdEvent.title,
            description: stdEvent.description,
            event_date: couple.wedding_date,
            event_time: format(eventTime, "HH:mm"),
            type: stdEvent.type,
            duration_minutes: stdEvent.duration_minutes,
            is_standard: true,
          };
          currentTime = addMinutes(eventTime, stdEvent.duration_minutes);
          return eventData;
        });

      if (standardEventsToAdd.length === 0) {
        setError("All standard events have already been added");
        return;
      }

      const { error } = await supabase
        .from("timeline_events")
        .insert(standardEventsToAdd);

      if (error) throw error;
      await fetchTimelineEvents();
      setSuccessMessage("Standard events added successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowStandardEvents(false);
    } catch (err) {
      console.error('Error adding standard events:', err);
      setError(err instanceof Error ? err.message : 'Failed to add standard events');
    }
  };

  const addSingleStandardEvent = async (stdEvent: StandardEvent) => {
    if (!couple?.id || !couple.wedding_date) {
      setError("Please set your wedding date in your profile first");
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock add single
      let eventTime = new Date(`${couple.wedding_date}T12:00:00`);
      const mockEvent: TimelineEvent = {
        id: `mock-${stdEvent.type}`,
        couple_id: couple.id,
        title: stdEvent.title,
        description: stdEvent.description,
        event_date: couple.wedding_date,
        event_time: format(eventTime, "HH:mm"),
        type: stdEvent.type,
        duration_minutes: stdEvent.duration_minutes,
        is_standard: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTimelineEvents(prev => [...prev, mockEvent].sort((a, b) => {
        const dateA = new Date(`${a.event_date}T${a.event_time}`);
        const dateB = new Date(`${b.event_date}T${b.event_time}`);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.error('Invalid date in sorting:', { dateA: a.event_date, timeA: a.event_time, dateB: b.event_date, timeB: b.event_time });
          return 0;
        }
        return dateA.getTime() - dateB.getTime();
      }));
      setSuccessMessage(`Added ${stdEvent.title} to your timeline`);
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    try {
      let eventTime = new Date(`${couple.wedding_date}T12:00:00`);
      const ceremonyEvent = timelineEvents.find((e) => e.type === "ceremony");
      if (ceremonyEvent) {
        const ceremonyTime = new Date(
          `${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`
        );
        if (stdEvent.order < 3) {
          if (stdEvent.type === "getting_ready") {
            eventTime = new Date(ceremonyTime);
            eventTime.setHours(eventTime.getHours() - 3);
          } else if (stdEvent.type === "first_look") {
            eventTime = new Date(ceremonyTime);
            eventTime.setHours(eventTime.getHours() - 1);
          }
        } else if (stdEvent.order > 3) {
          const sortedEvents = [...timelineEvents].sort((a, b) => {
            const dateA = new Date(`${a.event_date}T${a.event_time}`);
            const dateB = new Date(`${b.event_date}T${b.event_time}`);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              console.error('Invalid date in sorting:', { dateA: a.event_date, timeA: a.event_time, dateB: b.event_date, timeB: b.event_time });
              return 0;
            }
            return dateA.getTime() - dateB.getTime();
          });
          if (sortedEvents.length > 0) {
            const lastEvent = sortedEvents[sortedEvents.length - 1];
            eventTime = new Date(
              `${lastEvent.event_date}T${lastEvent.event_time}`
            );
            if (lastEvent.duration_minutes) {
              eventTime = addMinutes(eventTime, lastEvent.duration_minutes);
            }
          } else if (ceremonyEvent) {
            eventTime = addMinutes(ceremonyTime, 30);
          }
        } else {
          eventTime = ceremonyTime;
        }
      }

      const eventData = {
        couple_id: couple.id,
        title: stdEvent.title,
        description: stdEvent.description,
        event_date: couple.wedding_date,
        event_time: format(eventTime, "HH:mm"),
        type: stdEvent.type,
        duration_minutes: stdEvent.duration_minutes,
        is_standard: true,
      };

      const { error } = await supabase
        .from("timeline_events")
        .insert([eventData]);

      if (error) throw error;
      await fetchTimelineEvents();
      setSuccessMessage(`Added ${stdEvent.title} to your timeline`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding standard event:', err);
      setError(err instanceof Error ? err.message : 'Failed to add standard event');
    }
  };

  const handleShareWithVendor = async () => {
    if (!selectedVendor || !couple?.id || !supabase || !isSupabaseConfigured()) {
      setError("Please select a vendor to share with");
      return;
    }
    setIsSharing(true);
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("timeline_shares").insert({
        couple_id: couple.id,
        vendor_id: selectedVendor,
        status: "active",
        token,
      });
      if (error) throw error;
      const shareUrl = `${window.location.origin}/vendor/timeline?token=${token}`;
      setShareLink(shareUrl);
      setSuccessMessage("Timeline shared successfully! Copy the link below.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error sharing timeline:", error);
      setError("Failed to share timeline");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadTimelinePDF = () => {
    if (timelineEvents.length === 0) {
      setError("No events to download");
      return;
    }
    setIsDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("WEDDING TIMELINE", 105, 20, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text(couple?.name || "Wedding Timeline", 105, 30, { align: "center" });
      doc.setFontSize(12);
      let yPos = 40;
      if (couple?.wedding_date) {
        doc.text(
          `Date: ${formatInTimeZone(parseISO(couple.wedding_date), 'America/New_York', 'MMMM d, yyyy')}`,
          105,
          yPos,
          { align: "center" }
        );
        yPos += 7;
      }
      doc.setFont("helvetica", "bold");
      doc.text("SCHEDULE", 20, yPos + 10);
      yPos += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      timelineEvents.forEach((event) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const eventTime = format(
          parseISO(`2000-01-01T${event.event_time}`),
          "h:mm a"
        );
        const endTime = event.duration_minutes
          ? format(
              addMinutes(
                parseISO(`2000-01-01T${event.event_time}`),
                event.duration_minutes
              ),
              "h:mm a"
            )
          : null;
        doc.setFont("helvetica", "bold");
        doc.text(
          `${eventTime}${endTime ? ` - ${endTime}` : ""}: ${event.title}`,
          20,
          yPos
        );
        yPos += 6;
        if (event.description) {
          doc.setFont("helvetica", "normal");
          const descriptionLines = doc.splitTextToSize(event.description, 170);
          doc.text(descriptionLines, 25, yPos);
          yPos += 6 * descriptionLines.length;
        }
        if (event.location) {
          doc.setFont("helvetica", "normal");
          doc.text(`Location: ${event.location}`, 25, yPos);
          yPos += 6;
        }
        if (event.music_notes) {
          doc.setFont("helvetica", "normal");
          doc.text(`Music: ${event.music_notes}`, 25, yPos);
          yPos += 6;
        }
        if (event.playlist_requests) {
          doc.setFont("helvetica", "normal");
          doc.text(`Playlist: ${event.playlist_requests}`, 25, yPos);
          yPos += 6;
        }
        if (event.photo_shotlist) {
          doc.setFont("helvetica", "normal");
          doc.text(`Photos: ${event.photo_shotlist}`, 25, yPos);
          yPos += 6;
        }
        yPos += 4;
      });
      doc.save(`Wedding_Timeline_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      setSuccessMessage("Timeline downloaded as PDF successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError("Failed to download PDF");
    } finally {
      setIsDownloading(false);
      setShowDownloadMenu(false);
    }
  };

  const handleDownloadCSV = () => {
    if (timelineEvents.length === 0) {
      setError("No events to download");
      return;
    }
    const headers = [
      "Title", "Type", "Date", "Time", "Duration (min)", "Location", "Description",
      "Music Notes", "Playlist Requests", "Photo Shotlist"
    ];
    const csvContent = [
      headers.join(","),
      ...timelineEvents.map(event => [
        `"${event.title.replace(/"/g, '""')}"`,
        event.type,
        event.event_date,
        event.event_time,
        event.duration_minutes || "",
        `"${(event.location || "").replace(/"/g, '""')}"`,
        `"${(event.description || "").replace(/"/g, '""')}"`,
        `"${(event.music_notes || "").replace(/"/g, '""')}"`,
        `"${(event.playlist_requests || "").replace(/"/g, '""')}"`,
        `"${(event.photo_shotlist || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Wedding_Timeline_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage("Timeline downloaded as CSV successfully");
    setTimeout(() => setSuccessMessage(null), 3000);
    setShowDownloadMenu(false);
  };

  const calculateTimeDifference = (
    currentEvent: TimelineEvent,
    nextEvent: TimelineEvent
  ) => {
    try {
      // Validate event dates and times
      if (!currentEvent.event_date || !currentEvent.event_time || !nextEvent.event_date || !nextEvent.event_time) {
        console.error('Missing date/time:', { currentEvent, nextEvent });
        return <span className="text-gray-500">Missing date/time</span>;
      }

      // Parse event dates and times
      const currentDateTime = new Date(`${currentEvent.event_date}T${currentEvent.event_time}`);
      const nextDateTime = new Date(`${nextEvent.event_date}T${nextEvent.event_time}`);

      // Validate dates
      if (isNaN(currentDateTime.getTime()) || isNaN(nextDateTime.getTime())) {
        console.error('Invalid date/time:', {
          currentEvent: { date: currentEvent.event_date, time: currentEvent.event_time },
          nextEvent: { date: nextEvent.event_date, time: nextEvent.event_time }
        });
        return <span className="text-gray-500">Invalid date/time</span>;
      }

      // Get duration in minutes, default to 0 if undefined or invalid
      const durationMinutes = Number(currentEvent.duration_minutes) || 0;
      if (isNaN(durationMinutes)) {
        console.error('Invalid duration_minutes:', currentEvent.duration_minutes);
        return <span className="text-gray-500">Invalid duration</span>;
      }

      // Calculate end time of current event
      const currentEndTime = new Date(currentDateTime.getTime() + durationMinutes * 60 * 1000);

      // Calculate difference in minutes
      const diffMinutes = Math.round(
        (nextDateTime.getTime() - currentEndTime.getTime()) / (1000 * 60)
      );

      // Log for debugging
      console.log('Time Difference Calculation:', {
        currentEvent: currentEvent.title,
        currentDate: currentEvent.event_date,
        currentTime: currentEvent.event_time,
        durationMinutes,
        currentEndTime: currentEndTime.toISOString(),
        nextEvent: nextEvent.title,
        nextDate: nextEvent.event_date,
        nextTime: nextEvent.event_time,
        diffMinutes
      });

      if (diffMinutes < 0) {
        return (
          <span className="text-red-500">
            Warning: Events overlap by {Math.abs(diffMinutes)} minutes
          </span>
        );
      } else if (diffMinutes === 0) {
        return <span>Next event starts immediately</span>;
      } else if (diffMinutes < 60) {
        return <span>{diffMinutes} minute{diffMinutes !== 1 ? 's' : ''} break</span>;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return (
          <span>
            {hours} hour{hours !== 1 ? 's' : ''}
            {minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''} break
          </span>
        );
      }
    } catch (error) {
      console.error('Error in calculateTimeDifference:', error, {
        currentEvent,
        nextEvent
      });
      return <span className="text-gray-500">Unable to calculate time difference</span>;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(`2000-01-01T${timeString}`), "h:mm a");
    } catch {
      return timeString;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ceremony': return Calendar;
      case 'cocktail_hour':
      case 'reception_entrance':
      case 'dinner':
      case 'toasts':
      case 'cake_cutting':
      case 'open_dancing':
      case 'bouquet_toss': return Users;
      case 'getting_ready':
      case 'first_look':
      case 'parent_dances':
      case 'first_dance':
      case 'send_off':
      case 'transportation':
      case 'vendor_arrival': return Clock;
      case 'photo_session': return Camera;
      case 'music': return Music;
      default: return Clock;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ceremony': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'cocktail_hour':
      case 'reception_entrance':
      case 'dinner':
      case 'toasts':
      case 'cake_cutting':
      case 'open_dancing':
      case 'bouquet_toss': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'getting_ready':
      case 'first_look':
      case 'parent_dances':
      case 'first_dance':
      case 'send_off': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'photo_session': return 'bg-purple-100 text-purple-800 border-purple-200';
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
      {successMessage && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wedding Timeline</h3>
            <p className="text-gray-600">
              Plan your perfect day and share it with your vendors
            </p>
            {couple?.wedding_date && (
              <p className="text-sm text-gray-500 mt-1">
                Wedding Date: {formatInTimeZone(parseISO(couple.wedding_date), 'America/New_York', 'eeee, MMMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-rose-500">{timelineEvents.length}</div>
            <div className="text-sm text-gray-600">Timeline Events</div>
          </div>
        </div>
        <div className="border-t pt-6 mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Share Timeline with Vendor</h4>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vendor
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              icon={Share2}
              onClick={handleShareWithVendor}
              disabled={!selectedVendor || isSharing}
            >
              Share Timeline
            </Button>
          </div>
          {shareLink && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-2">
                Share this link with the vendor:
              </p>
              <div className="flex items-center">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-grow p-2 rounded-l-lg border border-gray-300 bg-white text-sm"
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setSuccessMessage("Link copied to clipboard!");
                    setTimeout(() => setSuccessMessage(null), 3000);
                  }}
                  className="rounded-l-none"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative" ref={downloadMenuRef}>
            <Button
              variant="outline"
              icon={Download}
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={timelineEvents.length === 0 || isDownloading}
            >
              Download
              {showDownloadMenu ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
            {showDownloadMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={handleDownloadTimelinePDF}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download as PDF
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
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
            {showStandardEvents ? "Hide" : "Add"} Standard Events
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingEvent(null);
              setShowEventModal(true);
            }}
          >
            Add Event
          </Button>
        </div>
      </Card>

      {showStandardEvents && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Standard Wedding Events</h3>
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
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 flex items-start border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <p className="text-yellow-700">
                Please set your wedding date in your profile first to add standard events.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardEvents.map((event) => {
              const isAdded = timelineEvents.some((e) => e.type === event.type);
              return (
                <div
                  key={event.type}
                  className={`p-4 rounded-lg border ${
                    isAdded ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    {isAdded ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Added
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Plus}
                        onClick={() => addSingleStandardEvent(event)}
                        disabled={!couple?.wedding_date}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {event.duration_minutes} minutes
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {timelineEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No timeline events yet</h3>
          <p className="text-gray-600 mb-6">
            Start building your wedding day timeline by adding events and sharing details with your vendors
          </p>
          <Button
            variant="primary"
            onClick={() => setShowEventModal(true)}
            icon={Plus}
          >
            Add Your First Event
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {timelineEvents.map((event, index) => {
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
                        {event.duration_minutes && (
                          <div className="flex items-center">
                            <span>{event.duration_minutes} minutes</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{formatInTimeZone(parseISO(event.event_date), 'America/New_York', 'MMMM d, yyyy')}</span>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}
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
                      {index < timelineEvents.length - 1 && (
                        <div className="mt-4 text-sm text-gray-500 italic">
                          {calculateTimeDifference(event, timelineEvents[index + 1])}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit2}
                      onClick={() => {
                        setEditingEvent(event);
                        setShowEventModal(true);
                      }}
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
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
                alert('Timeline sharing feature coming soon!');
              }}
            >
              Share with Vendors
            </Button>
          </div>
        </Card>
      )}

      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        weddingDate={couple?.wedding_date || ''}
        onSave={handleSaveEvent}
        isEditing={!!editingEvent}
      />
    </div>
  );
};