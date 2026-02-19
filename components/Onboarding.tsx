
import React, { useState } from 'react';
import { UserProfile, DietPreference, Language } from '../types';
import { Languages } from 'lucide-react';
import { LANGUAGES } from '../constants';
import CalendarInput from './CalendarInput';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [diet, setDiet] = useState<DietPreference>('vegetarian');
  const [language, setLanguage] = useState<Language>('english');
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
        periodHistory: [date], 
        symptomHistory: [],
        cycleLength: 28, 
        dietPreference: diet,
        language: language,
        onboardingComplete: true
      };
      onComplete(profile);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-4 animate-slide-up">
        {/* WA Welcome Header Style */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-wa-teal mb-4">Welcome to Sakhi 🌸</h1>
          <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl shadow-sm border-4 border-white ring-1 ring-gray-100">
            <span className="z-10 relative">🌸</span>
          </div>
          <p className="text-gray-500 text-sm px-6">
            A WhatsApp-powered health companion to help you track your cycle and feel your best.
          </p>
        </div>

        {/* Step 1: Language Selection */}
        {step === 1 && (
          <div key={`step-1-${animKey}`} className="space-y-6 animate-slide-in-right">
            <div>
              <label className="block text-sm font-medium text-wa-teal mb-4 flex items-center gap-2">
                <Languages size={18} /> Choose Language
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3 rounded-lg border text-left flex justify-between items-center active:bg-gray-100
                      ${language === lang.code 
                        ? 'border-wa-teal bg-green-50 text-wa-dark' 
                        : 'border-gray-200 bg-white text-gray-600'}
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
              className="w-full py-3 bg-wa-teal text-white rounded-full flex items-center justify-center gap-2 font-bold hover:bg-wa-dark active:scale-[0.98] transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Last Period Date */}
        {step === 2 && (
          <div key={`step-2-${animKey}`} className="space-y-6 animate-slide-in-right">
            <div>
              <label className="block text-sm font-medium text-wa-teal mb-4">
                When did your last period start?
              </label>
              
              <CalendarInput 
                selectedDate={date} 
                onDateSelect={setDate} 
              />
              
              {!date && (
                <p className="text-xs text-gray-400 mt-2 text-center">Please select a date to continue.</p>
              )}
            </div>
            
            <button
              onClick={handleNext}
              disabled={!date}
              className={`w-full py-3 rounded-full flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] shadow-sm
                ${date ? 'bg-wa-teal text-white hover:bg-wa-dark' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              Next
            </button>
          </div>
        )}

        {/* Step 3: Diet Preference */}
        {step === 3 && (
          <div key={`step-3-${animKey}`} className="space-y-6 animate-slide-in-right">
            <div>
              <label className="block text-sm font-medium text-wa-teal mb-4">
                What is your diet preference?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDiet('vegetarian')}
                  className={`p-4 rounded-xl border-2 transition-all text-center active:scale-[0.95]
                    ${diet === 'vegetarian' 
                      ? 'border-wa-teal bg-green-50 text-wa-dark shadow-sm' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-green-200'}
                  `}
                >
                  <span className="block text-3xl mb-2">🥗</span>
                  Vegetarian
                </button>
                <button
                  onClick={() => setDiet('non-vegetarian')}
                  className={`p-4 rounded-xl border-2 transition-all text-center active:scale-[0.95]
                    ${diet === 'non-vegetarian' 
                      ? 'border-wa-teal bg-green-50 text-wa-dark shadow-sm' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-green-200'}
                  `}
                >
                  <span className="block text-3xl mb-2">🍗</span>
                  Non-Veg
                </button>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-wa-teal text-white rounded-full flex items-center justify-center gap-2 font-bold hover:bg-wa-dark active:scale-[0.98] transition-all shadow-sm"
            >
              Start Chatting
            </button>
          </div>
        )}
        
        {/* Footer info */}
        <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400">from</p>
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase">Meta</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
