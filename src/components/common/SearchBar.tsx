import React, { useState } from 'react';
import { Search, MapPin, Calendar, Camera, Video, Music, Users, CalendarDays, Package, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVenues } from '../../hooks/useSupabase';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [eventType, setEventType] = useState('');

  const serviceTypes = [
    { id: 'Photography', name: 'Photography', icon: Camera },
    { id: 'Engagement Photography', name: 'Engagement Photography', icon: Camera },
    { id: 'Videography', name: 'Videography', icon: Video },
    { id: 'DJ Services', name: 'DJ Services', icon: Music },
    { id: 'Coordination', name: 'Day-of Coordination', icon: Users },
    { id: 'Planning', name: 'Planning', icon: CalendarDays }
  ];

  const eventTypes = [
    'Wedding',
    'Proposal'
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
      selectedServices,
      eventType
    });
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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

        {/* Search Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            icon={Search}
            size="lg"
            onClick={handleSearch}
            className="px-12"
            disabled={selectedServices.length === 0}
          >
            Find Packages
          </Button>
        </div>
      </div>
    </div>
  );
};