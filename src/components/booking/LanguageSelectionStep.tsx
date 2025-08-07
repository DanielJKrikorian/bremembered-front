import React from 'react';
import { ArrowRight, Globe, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguages } from '../../hooks/useSupabase';

interface LanguageSelectionStepProps {
  selectedLanguages: string[];
  onLanguageToggle: (languageId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  canProceed: boolean;
}

export const LanguageSelectionStep: React.FC<LanguageSelectionStepProps> = ({
  selectedLanguages,
  onLanguageToggle,
  onNext,
  onPrev,
  onSkip,
  canProceed
}) => {
  const { languages, loading: languagesLoading } = useLanguages();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-emerald-600" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          What languages do you prefer?
        </h4>
        <p className="text-gray-600">
          Select the languages you'd like your vendors to speak
        </p>
      </div>

      {languagesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading languages...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto max-h-80 overflow-y-auto">
          {languages.map((language) => {
            const isSelected = selectedLanguages.includes(language.id);
            return (
              <div
                key={language.id}
                onClick={() => onLanguageToggle(language.id)}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                  ${isSelected 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="font-medium text-gray-900">{language.language}</div>
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