import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [serviceType, setServiceType] = useState('');

  const handleSearch = () => {
    onSearch?.({
      location,
      date,
      serviceType
    });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Service Type</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
            >
              <option value="">All Services</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="dj">DJ Services</option>
              <option value="coordination">Coordination</option>
              <option value="bundle">Complete Packages</option>
            </select>
          </div>
        </div>

        <div className="flex items-end">
          <Button
            variant="primary"
            icon={Search}
            size="lg"
            onClick={handleSearch}
            className="w-full"
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};