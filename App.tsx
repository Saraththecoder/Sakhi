import React, { useState, useEffect } from 'react';
import { UserProfile, Message } from './types';
import { saveProfile, getProfile, getMessages, calculateCycleStatus } from './services/storageService';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import CycleWheel from './components/CycleWheel';
import ProfileSettings from './components/ProfileSettings';
import { Home, MessageCircle, Info, Settings } from 'lucide-react';
import { INSIGHT_TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'profile'>('home');
  const [loaded, setLoaded] = useState(false);

  // Load profile on mount
  useEffect(() => {
    refreshProfile();
    setLoaded(true);
  }, []);

  const refreshProfile = () => {
    const savedProfile = getProfile();
    if (savedProfile) {
      setUserProfile(savedProfile);
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    saveProfile(profile);
    setUserProfile(profile);
  };

  // Called when returning from Chat or when Chat triggers an update
  const handleProfileUpdate = () => {
      refreshProfile();
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    saveProfile(updatedProfile);
    setUserProfile(updatedProfile);
  };

  if (!loaded) return null;

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const cycleStatus = calculateCycleStatus(userProfile.lastPeriodDate, userProfile.cycleLength);
  const messages = getMessages();

  // Get localized strings
  const translation = INSIGHT_TRANSLATIONS[userProfile.language] || INSIGHT_TRANSLATIONS.english;

  return (
    // Use h-[100dvh] for dynamic viewport height on mobile browsers
    <div className="flex flex-col h-[100dvh] bg-white max-w-lg mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <div key="home" className="h-full overflow-y-auto no-scrollbar pb-20 animate-fade-in">
                <div className="bg-sakhi-500 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8 blur-lg"></div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="animate-slide-in-right">
                            <h1 className="text-2xl font-bold">Namaste! 🌸</h1>
                            <p className="text-sakhi-100 text-sm">Welcome back to your safe space.</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm animate-fade-in" style={{animationDelay: '0.2s'}}>
                             <div className="text-xs font-medium">{userProfile.dietPreference === 'vegetarian' ? '🥗 Veg' : '🍗 Non-Veg'}</div>
                        </div>
                    </div>
                </div>

                <div className="-mt-10 bg-white mx-4 rounded-2xl shadow-lg p-4 border border-gray-100 animate-slide-up relative z-20">
                    <CycleWheel status={cycleStatus} />
                </div>

                <div className="px-6 mt-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Info size={18} className="text-sakhi-500"/>
                        {translation.title}
                    </h3>
                    <div className="bg-sakhi-50 border border-sakhi-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {cycleStatus.phase === 'Menstrual' && translation.menstrual}
                            {cycleStatus.phase === 'Follicular' && translation.follicular}
                            {cycleStatus.phase === 'Ovulation' && translation.ovulation}
                            {cycleStatus.phase === 'Luteal' && translation.luteal}
                        </p>
                    </div>
                </div>

                <div className="px-6 mt-6 mb-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                        <MessageCircle size={20} className="group-hover:scale-110 transition-transform"/>
                        Talk to Sakhi
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'chat' && (
            <div key="chat" className="h-full animate-fade-in">
                <ChatInterface 
                    initialMessages={messages} 
                    userProfile={userProfile} 
                    onProfileUpdate={handleProfileUpdate}
                    onBack={() => {
                        refreshProfile();
                        setActiveTab('home');
                    }}
                />
            </div>
        )}

        {activeTab === 'profile' && (
            <div key="profile" className="h-full animate-fade-in">
                <ProfileSettings 
                    userProfile={userProfile} 
                    onSave={handleSaveProfile} 
                />
            </div>
        )}
      </div>

      {/* Bottom Navigation - Show on Home and Profile screens */}
      {activeTab !== 'chat' && (
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-3 pb-safe-bottom flex justify-between items-center absolute bottom-0 w-full z-20 safe-bottom">
            <button 
                onClick={() => { setActiveTab('home'); refreshProfile(); }}
                className={`flex flex-col items-center gap-1 transition-all w-16 active:scale-95 ${activeTab === 'home' ? 'text-sakhi-500' : 'text-gray-400'}`}
            >
                <div className={`p-1 rounded-full ${activeTab === 'home' ? 'bg-sakhi-50' : 'bg-transparent'}`}>
                    <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">Home</span>
            </button>
            
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex flex-col items-center gap-1 transition-all w-16 text-gray-400 active:scale-95 hover:text-sakhi-400`}
            >
                <div className="p-1 rounded-full">
                    <MessageCircle size={24} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium">Chat</span>
            </button>

            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 transition-all w-16 active:scale-95 ${activeTab === 'profile' ? 'text-sakhi-500' : 'text-gray-400'}`}
            >
                <div className={`p-1 rounded-full ${activeTab === 'profile' ? 'bg-sakhi-50' : 'bg-transparent'}`}>
                    <Settings size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">Profile</span>
            </button>
        </div>
      )}
    </div>
  );
};

export default App;