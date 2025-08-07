import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface ServiceType {
  id: string;
  name: string;
  icon: any;
  emoji: string;
}

interface ServiceSelectionStepProps {
  serviceTypes: ServiceType[];
  localSelectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkipToPackages: () => void;
  canProceed: boolean;
}

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  serviceTypes,
  localSelectedServices,
  onServiceToggle,
  onNext,
  onPrev,
  onSkipToPackages,
  canProceed
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          What services do you need?
        </h4>
        <p className="text-gray-600">
          Select all the services you'd like to book (you can choose multiple)
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {serviceTypes.map((service) => {
          const isSelected = localSelectedServices.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => onServiceToggle(service.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all text-left
                ${isSelected 
                  ? 'border-rose-500 bg-rose-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{service.emoji}</div>
                <div>
                  <h5 className="font-semibold text-gray-900">{service.name}</h5>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button
          variant="outline"
          onClick={onPrev}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canProceed}
          icon={ArrowRight}
          className="px-8"
        >
          Continue
        </Button>
      </div>
      
      <div className="text-center pt-2">
        <button
          onClick={onSkipToPackages}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
          disabled={localSelectedServices.length === 0}
        >
          Skip questions and find my perfect package
        </button>
      </div>
    </div>
  );
};