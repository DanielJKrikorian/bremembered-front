import React, { useState } from 'react';
import { Search, MapPin, Calendar, Camera, Video, Music, Users, CalendarDays, Package } from 'lucide-react';
import { Button } from '../ui/Button';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const serviceTypes = [
    { id: 'Photography', name: 'Photography', icon: Camera },
    { id: 'Videography', name: 'Videography', icon: Video },
    { id: 'DJ Services', name: 'DJ Services', icon: Music },
    { id: 'Coordination', name: 'Coordination', icon: Users },
    { id: 'Planning', name: 'Planning', icon: CalendarDays },
    { id: 'Packages', name: 'Packages', icon: Package }
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
      date,
      selectedServices
    });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-4 ${className}`}>
      <div className="space-y-4">
        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">What services do you need?</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Where's your wedding?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
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