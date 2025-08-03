import React, { useState } from 'react';
import { Search, MapPin, Calendar, Camera, Video, Music, Users, CalendarDays, Package, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVenues } from '../../hooks/useSupabase';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [eventType, setEventType] = useState('');
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  
  const { venues, loading: venuesLoading } = useVenues(location);

  const serviceTypes = [
    { id: 'Photography', name: 'Photography', icon: Camera },
    { id: 'Videography', name: 'Videography', icon: Video },
    { id: 'DJ Services', name: 'DJ Services', icon: Music },
    { id: 'Coordination', name: 'Coordination', icon: Users },
    { id: 'Planning', name: 'Planning', icon: CalendarDays }
  ];

  const eventTypes = [
    'Wedding',
    'Corporate Event', 
    'Event',
    'Baptism',
    'Bar Mitzvah',
    'Birthday',
    'Other'
  ];
  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSearch = () => {
    onSearch?.({
      location,
      selectedVenue,
      date,
      selectedServices,
      eventType
    });
  };

  const handleVenueSelect = (venue: any) => {
    setSelectedVenue(venue);
    setLocation(venue.name);
    setShowVenueDropdown(false);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setSelectedVenue(null);
    setShowVenueDropdown(value.length > 2);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-4 ${className}`}>
      <div className="space-y-4">
        {/* Event Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What type of event are you planning? <span className="text-gray-500 font-normal">(select one)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setEventType(eventType === type ? '' : type)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all border
                  ${eventType === type
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What services are you looking to book? <span className="text-gray-500 font-normal">(select all you'd like to book)</span>
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {serviceTypes.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedServices.includes(service.id);
              
              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceToggle(service.id)}
                  className={`
                    flex flex-col items-center p-3 rounded-lg border-2 transition-all
                    ${isSelected 
                      ? 'border-rose-500 bg-rose-50 text-rose-700' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium text-center leading-tight">{service.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location and Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 relative">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Where's your wedding?"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => setShowVenueDropdown(location.length > 2)}
              className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {location && !selectedVenue && (
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {/* Venue Dropdown */}
          {showVenueDropdown && location.length > 2 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {venuesLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <span className="text-sm text-gray-600">Searching venues...</span>
                </div>
              ) : venues.length > 0 ? (
                <div className="py-2">
                  {venues.slice(0, 8).map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => handleVenueSelect(venue)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{venue.name}</div>
                      <div className="text-sm text-gray-600">
                        {venue.street_address && `${venue.street_address}, `}
                        {venue.city}, {venue.state} {venue.zip}
                      </div>
                      {venue.region && (
                        <div className="text-xs text-gray-500">{venue.region}</div>
                      )}
                    </button>
                  ))}
                  {venues.length > 8 && (
                    <div className="px-4 py-2 text-sm text-gray-500 border-t">
                      +{venues.length - 8} more venues found
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No venues found. You can add a new venue during checkout.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="flex items-end">
          <Button
            variant="primary"
            icon={Search}
            size="lg"
            onClick={handleSearch}
            className="w-full"
            disabled={selectedServices.length === 0}
          >
            Search
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};