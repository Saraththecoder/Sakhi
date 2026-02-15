import React, { useState } from 'react';
import { UserProfile, DietPreference, Language } from '../types';
import { Calendar, ChevronRight, Languages } from 'lucide-react';
import { LANGUAGES } from '../constants';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [diet, setDiet] = useState<DietPreference>('vegetarian');
  const [language, setLanguage] = useState<Language>('english');
  // Used to trigger re-animation key
  const [animKey, setAnimKey] = useState(0);

  const handleNext = () => {
    if (step === 1) { // Language
      setStep(2);
      setAnimKey(prev => prev + 1);
    } else if (step === 2 && date) { // Date
      setStep(3);
      setAnimKey(prev => prev + 1);
    } else if (step === 3) { // Diet
      const profile: UserProfile = {
        lastPeriodDate: date,
        periodHistory: [date], // Initialize history with first entry
        symptomHistory: [], // Initialize empty symptom history
        cycleLength: 28, // Default, can be adjusted in settings later
        dietPreference: diet,
        language: language,
        onboardingComplete: true
      };
      onComplete(profile);
    }
  };

  return (
    <div className="min-h-screen bg-sakhi-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sakhi-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
            🌸
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Namaste! Main Sakhi.</h1>
          <p className="text-gray-500 mt-2">Aapki sehat ki saathi (Your health companion).</p>
        </div>

        {/* Step 1: Language Selection */}
        {step === 1 && (
          <div key={`step-1-${animKey}`} className="space-y-6 animate-slide-in-right">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Languages size={18} /> Select your language
              </label>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3 rounded-xl border transition-all text-left flex justify-between items-center active:scale-[0.98]
                      ${language === lang.code 
                        ? 'border-sakhi-500 bg-sakhi-50 text-sakhi-700 shadow-sm' 
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-sakhi-200'}
                    `}
                  >
                    <span>{lang.label}</span>
                    <span className="text-sm opacity-70">{lang.native}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleNext}
              className="w-full py-4 bg-sakhi-500 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-sakhi-600 active:scale-[0.98] transition-all shadow-md"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Last Period Date */}
        {step === 2 && (
          <div key={`step-2-${animKey}`} className="space-y-6 animate-slide-in-right">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When did your last period start?
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sakhi-400 focus:border-transparent outline-none transition-all"
                />
                <Calendar className="absolute right-4 top-4 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-1">Date Format: MM/DD/YYYY</p>
            </div>
            
            <button
              onClick={handleNext}
              disabled={!date}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] shadow-md
                ${date ? 'bg-sakhi-500 text-white hover:bg-sakhi-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 3: Diet Preference */}
        {step === 3 && (
          <div key={`step-3-${animKey}`} className="space-y-6 animate-slide-in-right">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What is your diet preference?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDiet('vegetarian')}
                  className={`p-4 rounded-xl border-2 transition-all text-center active:scale-[0.95]
                    ${diet === 'vegetarian' 
                      ? 'border-sakhi-500 bg-sakhi-50 text-sakhi-700 shadow-sm' 
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-sakhi-200'}
                  `}
                >
                  <span className="block text-2xl mb-2">🥗</span>
                  Vegetarian
                </button>
                <button
                  onClick={() => setDiet('non-vegetarian')}
                  className={`p-4 rounded-xl border-2 transition-all text-center active:scale-[0.95]
                    ${diet === 'non-vegetarian' 
                      ? 'border-sakhi-500 bg-sakhi-50 text-sakhi-700 shadow-sm' 
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-sakhi-200'}
                  `}
                >
                  <span className="block text-2xl mb-2">🍗</span>
                  Non-Veg
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                This helps me suggest relevant food tips.
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-sakhi-500 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-sakhi-600 active:scale-[0.98] transition-all shadow-md"
            >
              Get Started <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;