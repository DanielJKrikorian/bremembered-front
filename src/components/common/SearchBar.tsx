import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { BookingModal } from './BookingModal';

export const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <>
      {/* Search Bar */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search wedding services..."
            className="w-full pl-12 pr-32 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 text-lg bg-white shadow-lg"
            onFocus={() => navigate('/search')}
          />
          <Button
            variant="primary"
            size="lg"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsBookingModalOpen(true);
            }}
          >
            Start Your Booking Journey
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </>
  );
};