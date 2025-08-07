import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface PreferenceTypeStepProps {
  localSelectedServices: string[];
  preferenceType: string;
  onPreferenceTypeSelect: (type: 'hours' | 'coverage') => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
}

export const PreferenceTypeStep: React.FC<PreferenceTypeStepProps> = ({
  localSelectedServices,
  preferenceType,
  onPreferenceTypeSelect,
  onNext,
  onPrev,
  canProceed
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          How would you like to choose your package?
        </h4>
        {localSelectedServices.includes('Live Musician') ? (
          <p className="text-gray-600">
            For live musicians, we'll help you choose based on the specific moments you want music for
          </p>
        ) : (
          <p className="text-gray-600">
            Choose how you'd like to find your perfect {localSelectedServices[0]?.toLowerCase()} package
          </p>
        )}
      </div>
      
      {localSelectedServices.includes('Live Musician') ? (
        /* Auto-select moments for musicians */
        <div className="text-center">
          <div className="p-6 rounded-xl border-2 border-rose-500 bg-rose-50">
            <div className="text-4xl mb-4">🎼</div>
            <h5 className="text-lg font-semibold text-gray-900 mb-2">Choose by Moments</h5>
            <p className="text-sm text-gray-600">
              We'll help you find the perfect musician based on when you need music during your event
            </p>
          </div>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => {
                onPreferenceTypeSelect('coverage');
                onNext();
              }}
              icon={ArrowRight}
            >
              Choose Musical Moments
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => onPreferenceTypeSelect('hours')}
            className={`
              relative p-6 rounded-xl border-2 transition-all text-center
              ${preferenceType === 'hours'
                ? 'border-amber-500 bg-amber-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {preferenceType === 'hours' && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="text-4xl mb-4">⏰</div>
            <h5 className="text-lg font-semibold text-gray-900 mb-2">By Hours</h5>
            <p className="text-sm text-gray-600">
              Choose based on how many hours of coverage you need
            </p>
          </button>

          <button
            onClick={() => onPreferenceTypeSelect('coverage')}
            className={`
              relative p-6 rounded-xl border-2 transition-all text-center
              ${preferenceType === 'coverage'
                ? 'border-rose-500 bg-rose-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {preferenceType === 'coverage' && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="text-4xl mb-4">📸</div>
            <h5 className="text-lg font-semibold text-gray-900 mb-2">By Moments</h5>
            <p className="text-sm text-gray-600">
              Choose based on specific moments you want captured
            </p>
          </button>
        </div>
      )}
      
      {!localSelectedServices.includes('Live Musician') && (
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
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};