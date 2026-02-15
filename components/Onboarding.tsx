import React, { useState } from 'react';
import { UserProfile, DietPreference } from '../types';
import { Calendar, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [diet, setDiet] = useState<DietPreference>('vegetarian');

  const handleNext = () => {
    if (step === 1 && date) {
      setStep(2);
    } else if (step === 2) {
      const profile: UserProfile = {
        lastPeriodDate: date,
        periodHistory: [date], // Initialize history with first entry
        symptomHistory: [], // Initialize empty symptom history
        cycleLength: 28, // Default, can be adjusted in settings later
        dietPreference: diet,
        onboardingComplete: true
      };
      onComplete(profile);
    }
  };

  return (
    <div className="min-h-screen bg-sakhi-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sakhi-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🌸
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Namaste! Main Sakhi.</h1>
          <p className="text-gray-500 mt-2">Aapki sehat ki saathi (Your health companion).</p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When did your last period start?
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sakhi-400 focus:border-transparent outline-none"
                />
                <Calendar className="absolute right-4 top-4 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-1">Date Format: MM/DD/YYYY</p>
            </div>
            
            <button
              onClick={handleNext}
              disabled={!date}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors
                ${date ? 'bg-sakhi-500 text-white hover:bg-sakhi-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What is your diet preference?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDiet('vegetarian')}
                  className={`p-4 rounded-xl border-2 transition-all text-center
                    ${diet === 'vegetarian' 
                      ? 'border-sakhi-500 bg-sakhi-50 text-sakhi-700' 
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-sakhi-200'}
                  `}
                >
                  <span className="block text-2xl mb-2">🥗</span>
                  Vegetarian
                </button>
                <button
                  onClick={() => setDiet('non-vegetarian')}
                  className={`p-4 rounded-xl border-2 transition-all text-center
                    ${diet === 'non-vegetarian' 
                      ? 'border-sakhi-500 bg-sakhi-50 text-sakhi-700' 
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
              className="w-full py-4 bg-sakhi-500 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-sakhi-600 transition-colors"
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