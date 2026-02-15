import React, { useState, useEffect } from 'react';
import { UserProfile, Message } from './types';
import { saveProfile, getProfile, getMessages, calculateCycleStatus } from './services/storageService';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import CycleWheel from './components/CycleWheel';
import ProfileSettings from './components/ProfileSettings';
import { Home, MessageCircle, Info, Settings } from 'lucide-react';

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

  return (
    <div className="flex flex-col h-screen bg-white max-w-lg mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
            <div className="h-full overflow-y-auto no-scrollbar pb-20">
                <div className="bg-sakhi-500 text-white p-6 pb-12 rounded-b-[2.5rem]">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Namaste! 🌸</h1>
                            <p className="text-sakhi-100 text-sm">Welcome back to your safe space.</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                             <div className="text-xs font-medium">{userProfile.dietPreference === 'vegetarian' ? '🥗 Veg' : '🍗 Non-Veg'}</div>
                        </div>
                    </div>
                </div>

                <div className="-mt-10 bg-white mx-4 rounded-2xl shadow-lg p-4 border border-gray-100">
                    <CycleWheel status={cycleStatus} />
                </div>

                <div className="px-6 mt-6">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Info size={18} className="text-sakhi-500"/>
                        Today's Insight
                    </h3>
                    <div className="bg-sakhi-50 border border-sakhi-100 p-4 rounded-xl">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {cycleStatus.phase === 'Menstrual' && "Iron levels drop now. Eat palak (spinach) and gud (jaggery). Rest well! 🛌"}
                            {cycleStatus.phase === 'Follicular' && "Energy rising! Great time for light exercise like yoga or a brisk walk. 🧘‍♀️"}
                            {cycleStatus.phase === 'Ovulation' && "You might feel more social. Stay hydrated with 8 glasses of water! 💧"}
                            {cycleStatus.phase === 'Luteal' && "PMS might start. Avoid salty snacks to reduce bloating. Eat cucumber! 🥒"}
                        </p>
                    </div>
                </div>

                <div className="px-6 mt-6 mb-4">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={20} />
                        Talk to Sakhi
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'chat' && (
            <ChatInterface 
                initialMessages={messages} 
                userProfile={userProfile} 
                onProfileUpdate={handleProfileUpdate}
                onBack={() => {
                    refreshProfile();
                    setActiveTab('home');
                }}
            />
        )}

        {activeTab === 'profile' && (
            <ProfileSettings 
                userProfile={userProfile} 
                onSave={handleSaveProfile} 
            />
        )}
      </div>

      {/* Bottom Navigation - Show on Home and Profile screens */}
      {activeTab !== 'chat' && (
        <div className="bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center absolute bottom-0 w-full z-20">
            <button 
                onClick={() => { setActiveTab('home'); refreshProfile(); }}
                className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'home' ? 'text-sakhi-500' : 'text-gray-400'}`}
            >
                <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'chat' ? 'text-sakhi-500' : 'text-gray-400'}`}
            >
                <MessageCircle size={24} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Chat</span>
            </button>

            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'profile' ? 'text-sakhi-500' : 'text-gray-400'}`}
            >
                <Settings size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Profile</span>
            </button>
        </div>
      )}
    </div>
  );
};

export default App;