import React from 'react';
import { useCouple, useCouplePreferences, useStyleTags, useVibeTags, useLanguages } from '../hooks/useCouple';
import { Card } from '../components/ui/Card';

export const PreferencesSection: React.FC = () => {
  const { couple, refetchCouple } = useCouple();
  const { updateStylePreferences, updateVibePreferences, updateLanguagePreferences, loading: preferencesLoading } = useCouplePreferences();
  const { styleTags } = useStyleTags();
  const { vibeTags } = useVibeTags();
  const { languages } = useLanguages();

  const handleStyleToggle = async (styleLabel: string) => {
    if (!couple) return;
    const styleTag = styleTags.find(tag => tag.label === styleLabel);
    if (!styleTag) return;
    const currentStyleIds = couple.style_preferences?.map(pref => pref.id) || [];
    const isSelected = currentStyleIds.includes(styleTag.id);
    const newStyleIds = isSelected
      ? currentStyleIds.filter(id => id !== styleTag.id)
      : [...currentStyleIds, styleTag.id];
    try {
      await updateStylePreferences(newStyleIds);
      refetchCouple();
    } catch (error) {
      console.error('Error updating style preferences:', error);
    }
  };

  const handleVibeToggle = async (vibeLabel: string) => {
    if (!couple) return;
    const vibeTag = vibeTags.find(tag => tag.label === vibeLabel);
    if (!vibeTag) return;
    const currentVibeIds = couple.vibe_preferences?.map(pref => pref.id) || [];
    const isSelected = currentVibeIds.includes(vibeTag.id);
    const newVibeIds = isSelected
      ? currentVibeIds.filter(id => id !== vibeTag.id)
      : [...currentVibeIds, vibeTag.id];
    try {
      await updateVibePreferences(newVibeIds);
      refetchCouple();
    } catch (error) {
      console.error('Error updating vibe preferences:', error);
    }
  };

  const handleLanguageToggle = async (languageName: string) => {
    if (!couple) return;
    const language = languages.find(lang => lang.language === languageName);
    if (!language) return;
    const currentLanguageIds = couple.language_preferences?.map(pref => pref.id) || [];
    const isSelected = currentLanguageIds.includes(language.id);
    const newLanguageIds = isSelected
      ? currentLanguageIds.filter(id => id !== language.id)
      : [...currentLanguageIds, language.id];
    try {
      await updateLanguagePreferences(newLanguageIds);
      refetchCouple();
    } catch (error) {
      console.error('Error updating language preferences:', error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Wedding Preferences</h3>
      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Style Preferences</h4>
          <p className="text-gray-600 mb-4">Select the photography and videography styles you love</p>
          <div className="flex flex-wrap gap-3">
            {styleTags.map((style) => {
              const isSelected = couple?.style_preferences?.some(pref => pref.label === style.label);
              return (
                <button
                  key={style.label}
                  onClick={() => handleStyleToggle(style.label)}
                  disabled={preferencesLoading}
                  className={`
                    group relative px-6 py-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 min-w-[160px]
                    ${isSelected
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-800 shadow-xl'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-100 hover:text-indigo-700 hover:shadow-lg cursor-pointer'
                    }
                    ${preferencesLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm">📸</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold text-lg mb-2">{style.label}</div>
                    <div className="text-xs opacity-90 leading-tight font-medium">📸 {style.description || 'Photography style'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Vibe Preferences</h4>
          <p className="text-gray-600 mb-4">Choose the vibes that match your wedding vision</p>
          <div className="flex flex-wrap gap-3">
            {vibeTags.map((vibe) => {
              const vibeDescriptions: Record<string, string> = {
                'Romantic': '💕 Soft, dreamy, and intimate',
                'Fun': '🎉 Energetic and playful celebration',
                'Elegant': '✨ Sophisticated and refined',
                'Rustic': '🌾 Natural and countryside charm',
                'Boho': '🌸 Free-spirited and artistic',
                'Modern': '🏙️ Clean lines and contemporary',
                'Traditional': '👑 Classic and formal ceremony',
                'Intimate': '🤍 Small and meaningful gathering'
              };
              const isSelected = couple?.vibe_preferences?.some(pref => pref.label === vibe.label);
              return (
                <button
                  key={vibe.label}
                  onClick={() => handleVibeToggle(vibe.label)}
                  disabled={preferencesLoading}
                  className={`
                    group relative px-6 py-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-500/20 min-w-[160px]
                    ${isSelected
                      ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-100 text-pink-800 shadow-xl'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-100 hover:text-pink-700 hover:shadow-lg cursor-pointer'
                    }
                    ${preferencesLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm">💖</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold text-lg mb-2">{vibe.label}</div>
                    <div className="text-xs opacity-90 leading-tight font-medium">{vibeDescriptions[vibe.label] || vibe.description || 'Wedding vibe'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Language Preferences</h4>
          <p className="text-gray-600 mb-4">Select languages you'd like your vendors to speak</p>
          <div className="flex flex-wrap gap-3">
            {languages.map((language) => {
              const isSelected = couple?.language_preferences?.some(pref => pref.id === language.id);
              return (
                <button
                  key={language.id}
                  onClick={() => handleLanguageToggle(language.language)}
                  disabled={preferencesLoading}
                  className={`
                    relative px-5 py-3 rounded-full border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 min-w-[100px]
                    ${isSelected
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 shadow-xl'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-gradient-to-br hover:from-emerald-50 to-emerald-100 hover:text-emerald-700 hover:shadow-lg cursor-pointer'
                    }
                    ${preferencesLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <span className="font-bold">{language.language}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};