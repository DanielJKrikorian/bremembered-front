import React from 'react';
import { ArrowRight, Heart, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVibeTags } from '../../hooks/useSupabase';

interface VibeSelectionStepProps {
  selectedVibes: number[];
  eventType: string;
  onVibeToggle: (vibeId: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  canProceed: boolean;
}

export const VibeSelectionStep: React.FC<VibeSelectionStepProps> = ({
  selectedVibes,
  eventType,
  onVibeToggle,
  onNext,
  onPrev,
  onSkip,
  canProceed
}) => {
  const { vibeTags, loading: vibeTagsLoading } = useVibeTags();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-pink-600" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          What vibe are you going for?
        </h4>
        <p className="text-gray-600">
          Select the vibes that match your {eventType.toLowerCase()} vision
        </p>
      </div>

      {vibeTagsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading vibes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto max-h-80 overflow-y-auto">
          {vibeTags.map((vibe) => {
            const isSelected = selectedVibes.includes(vibe.id);
            return (
              <div
                key={vibe.id}
                onClick={() => onVibeToggle(vibe.id)}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-pink-500 bg-pink-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <h3 className="font-medium text-gray-900 mb-1">{vibe.label}</h3>
                {vibe.description && (
                  <p className="text-sm text-gray-600">{vibe.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
            Find My Perfect Vendors
          </Button>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={onSkip}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};