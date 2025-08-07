import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { Button } from '../ui/Button';

interface VendorMatchingStepProps {
  selectedServices: string[];
  selectedEventType: string;
  onRevealVendors: () => void;
}

export const VendorMatchingStep: React.FC<VendorMatchingStepProps> = ({
  selectedServices,
  selectedEventType,
  onRevealVendors
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Finding Your Perfect Vendors...
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        We're matching you with the best {selectedServices.join(' and ').toLowerCase()} vendors for your {selectedEventType.toLowerCase()}
      </p>
      
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-sm text-gray-500">
          Analyzing your preferences and vendor availability...
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onRevealVendors}
        icon={Heart}
        className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
      >
        Click here to meet your perfect vendors! ✨
      </Button>
    </div>
  );
};