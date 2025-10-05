import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, X, MapPin, Music, Camera, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

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
  wedding_website: boolean;
}

interface EventFormData {
  title: string;
  description: string;
  event_day: string;
  event_time: string;
  location: string;
  type: string;
  duration_minutes: number;
  music_notes: string;
  playlist_requests: string;
  photo_shotlist: string;
  wedding_website: boolean;
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
  { value: "rehearsal_dinner", label: "Rehearsal Dinner" },
  { value: "welcome_party", label: "Welcome Party" },
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
  { value: "day_after_brunch", label: "Day-After Brunch" },
  { value: "transportation", label: "Transportation" },
  { value: "vendor_arrival", label: "Vendor Arrival" },
  { value: "other", label: "Other" },
];

const standardEvents = [
  {
    type: "rehearsal_dinner",
    title: "Rehearsal Dinner",
    description: "Dinner with wedding party and family the evening before",
    duration_minutes: 120,
    order: 0,
    default_day: 'day_before',
  },
  {
    type: "welcome_party",
    title: "Welcome Party",
    description: "Casual gathering to welcome guests",
    duration_minutes: 90,
    order: 1,
    default_day: 'day_before',
  },
  {
    type: "getting_ready",
    title: "Getting Ready",
    description: "Hair, makeup, and final preparations",
    duration_minutes: 120,
    order: 2,
    default_day: 'wedding_day',
  },
  {
    type: "first_look",
    title: "First Look",
    description: "Private moment seeing each other before the ceremony",
    duration_minutes: 30,
    order: 3,
    default_day: 'wedding_day',
  },
  {
    type: "ceremony",
    title: "Ceremony",
    description: "Wedding ceremony",
    duration_minutes: 60,
    order: 4,
    default_day: 'wedding_day',
  },
  {
    type: "cocktail_hour",
    title: "Cocktail Hour",
    description: "Drinks and appetizers for guests",
    duration_minutes: 60,
    order: 5,
    default_day: 'wedding_day',
  },
  {
    type: "reception_entrance",
    title: "Grand Entrance",
    description: "Introduction of the wedding party and newlyweds",
    duration_minutes: 15,
    order: 6,
    default_day: 'wedding_day',
  },
  {
    type: "first_dance",
    title: "First Dance",
    description: "First dance as a married couple",
    duration_minutes: 10,
    order: 7,
    default_day: 'wedding_day',
  },
  {
    type: "dinner",
    title: "Dinner Service",
    description: "Meal service for all guests",
    duration_minutes: 60,
    order: 8,
    default_day: 'wedding_day',
  },
  {
    type: "toasts",
    title: "Toasts & Speeches",
    description: "Speeches from wedding party and family",
    duration_minutes: 30,
    order: 9,
    default_day: 'wedding_day',
  },
  {
    type: "cake_cutting",
    title: "Cake Cutting",
    description: "Ceremonial cutting of the wedding cake",
    duration_minutes: 15,
    order: 10,
    default_day: 'wedding_day',
  },
  {
    type: "parent_dances",
    title: "Parent Dances",
    description: "Special dances with parents",
    duration_minutes: 15,
    order: 11,
    default_day: 'wedding_day',
  },
  {
    type: "open_dancing",
    title: "Open Dancing",
    description: "Dance floor opens for all guests",
    duration_minutes: 120,
    order: 12,
    default_day: 'wedding_day',
  },
  {
    type: "bouquet_toss",
    title: "Bouquet & Garter Toss",
    description: "Traditional bouquet and garter toss",
    duration_minutes: 15,
    order: 13,
    default_day: 'wedding_day',
  },
  {
    type: "send_off",
    title: "Grand Send-Off",
    description: "Final farewell as you depart the reception",
    duration_minutes: 15,
    order: 14,
    default_day: 'wedding_day',
  },
  {
    type: "day_after_brunch",
    title: "Day-After Brunch",
    description: "Post-wedding brunch with guests",
    duration_minutes: 120,
    order: 15,
    default_day: 'day_after',
  },
];

export const TimelineEventModal: React.FC<EventModalProps> = ({
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
    event_day: 'wedding_day',
    event_time: '',
    location: '',
    type: 'custom',
    duration_minutes: 60,
    music_notes: '',
    playlist_requests: '',
    photo_shotlist: '',
    wedding_website: true
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (event && weddingDate) {
      const parsedWeddingDate = parseISO(weddingDate);
      let event_day = 'wedding_day';
      if (event.event_date < weddingDate) {
        event_day = 'day_before';
      } else if (event.event_date > weddingDate) {
        event_day = 'day_after';
      }
      setFormData({
        title: event.title,
        description: event.description || '',
        event_day,
        event_time: event.event_time,
        location: event.location || '',
        type: event.type,
        duration_minutes: event.duration_minutes || 60,
        music_notes: event.music_notes || '',
        playlist_requests: event.playlist_requests || '',
        photo_shotlist: event.photo_shotlist || '',
        wedding_website: event.wedding_website
      });
    } else {
      setFormData({
        title: '',
        description: '',
        event_day: 'wedding_day',
        event_time: '',
        location: '',
        type: 'custom',
        duration_minutes: 60,
        music_notes: '',
        playlist_requests: '',
        photo_shotlist: '',
        wedding_website: true
      });
    }
    setCurrentStep(1);
    setFormErrors({});
  }, [event, isOpen, weddingDate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        event_day: standardEvent.default_day,
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
      if (!formData.event_day) {
        errors.event_day = "Event day is required";
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
        return formData.title.trim() && formData.event_day && formData.event_time && !isNaN(formData.duration_minutes) && formData.duration_minutes >= 5;
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Day
                  </label>
                  <select
                    name="event_day"
                    value={formData.event_day}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    disabled={!weddingDate}
                  >
                    <option value="day_before">Day Before {weddingDate ? `(${format(subDays(parseISO(weddingDate), 1), 'MMM d, yyyy')})` : ''}</option>
                    <option value="wedding_day">Wedding Day {weddingDate ? `(${format(parseISO(weddingDate), 'MMM d, yyyy')})` : ''}</option>
                    <option value="day_after">Day After {weddingDate ? `(${format(addDays(parseISO(weddingDate), 1), 'MMM d, yyyy')})` : ''}</option>
                  </select>
                  {!weddingDate && (
                    <p className="text-xs text-red-500 mt-1">Please set your wedding date in your profile first.</p>
                  )}
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
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="wedding_website"
                      checked={formData.wedding_website}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Show on Wedding Website</span>
                  </label>
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
                  List specific photos you want captured during this event.
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