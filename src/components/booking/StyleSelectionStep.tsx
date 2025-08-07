import React from 'react';
import { ArrowRight, Palette, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStyleTags } from '../../hooks/useSupabase';

interface StyleSelectionStepProps {
  selectedStyles: number[];
  onStyleToggle: (styleId: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  canProceed: boolean;
}

export const StyleSelectionStep: React.FC<StyleSelectionStepProps> = ({
  selectedStyles,
  onStyleToggle,
  onNext,
  onPrev,
  onSkip,
  canProceed
}) => {
  const { styleTags, loading: styleTagsLoading } = useStyleTags();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-purple-600" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          What style do you love?
        </h4>
        <p className="text-gray-600">
          Choose the photography/videography styles that speak to you
        </p>
      </div>

      {styleTagsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading styles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto max-h-80 overflow-y-auto">
          {styleTags.map((style) => {
            const isSelected = selectedStyles.includes(style.id);
            return (
              <div
                key={style.id}
                onClick={() => onStyleToggle(style.id)}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <h3 className="font-medium text-gray-900 mb-1">{style.label}</h3>
                {style.description && (
                  <p className="text-sm text-gray-600">{style.description}</p>
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
            Continue
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