
import React, { useState, useEffect } from 'react';
import { UserProfile, Mood } from './types';
import { saveProfile, getProfile, getMessages, calculateCycleStatus, logSymptom } from './services/storageService';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import CycleWheel from './components/CycleWheel';
import ProfileSettings from './components/ProfileSettings';
import { Heart, Smile, Frown, Coffee, Battery, Zap, Info, Search, Camera, MoreVertical, MessageSquare, Phone, Activity, X } from 'lucide-react';
import { INSIGHT_TRANSLATIONS, MOOD_RECOMMENDATIONS } from './constants';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'list' | 'chat'>('list');
  const [showDashboard, setShowDashboard] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

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

  const handleProfileUpdate = () => {
      refreshProfile();
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    saveProfile(updatedProfile);
    setUserProfile(updatedProfile);
  };

  const handleMoodSelect = (mood: Mood) => {
      setSelectedMood(mood);
      if (mood === 'cramps' || mood === 'tired' || mood === 'irritated') {
          logSymptom(mood);
          refreshProfile();
      }
  };

  if (!loaded) return null;

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const cycleStatus = calculateCycleStatus(userProfile.lastPeriodDate, userProfile.cycleLength);
  const messages = getMessages();
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const translation = INSIGHT_TRANSLATIONS[userProfile.language] || INSIGHT_TRANSLATIONS.english;
  const moodData = selectedMood && userProfile ? MOOD_RECOMMENDATIONS[userProfile.language][selectedMood] : null;

  return (
    <div className="flex flex-col h-[100dvh] bg-white max-w-lg mx-auto shadow-2xl overflow-hidden relative font-sans">
      
      {/* ---------------- SCREEN: CHAT LIST (MAIN WHATSAPP SCREEN) ---------------- */}
      {currentScreen === 'list' && (
          <div className="flex flex-col h-full bg-white">
              {/* WA Main Header */}
              <div className="bg-wa-teal text-white pt-safe-top sticky top-0 z-10">
                  <div className="flex justify-between items-center p-4 pb-2">
                      <span className="text-xl font-bold tracking-wide">WhatsApp</span>
                      <div className="flex gap-5">
                          <Camera size={22} />
                          <Search size={22} />
                          <MoreVertical size={22} />
                      </div>
                  </div>
                  {/* Tabs */}
                  <div className="flex text-gray-200 font-bold text-sm uppercase">
                      <div className="w-10 flex justify-center items-center pb-3">
                          <Activity size={20} className="opacity-70" />
                      </div>
                      <div className="flex-1 flex justify-center pb-3 border-b-[3px] border-white text-white">Chats</div>
                      <div className="flex-1 flex justify-center pb-3 opacity-80">Status</div>
                      <div className="flex-1 flex justify-center pb-3 opacity-80">Calls</div>
                  </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                  {/* Chat Item: Sakhi */}
                  <div 
                    onClick={() => setCurrentScreen('chat')}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                  >
                      <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-sakhi-100 flex items-center justify-center text-xl border border-gray-100">
                             🌸
                          </div>
                          {/* Online Indicator (Green Dot) - Optional in WA but good for bot */}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 border-b border-gray-100 pb-3">
                          <div className="flex justify-between items-center mb-0.5">
                              <span className="font-semibold text-gray-900 text-[17px]">Sakhi 🌸</span>
                              <span className="text-xs text-green-500 font-medium">
                                {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Now'}
                              </span>
                          </div>
                          <div className="flex justify-between items-center">
                                <p className="text-gray-500 text-sm truncate max-w-[200px]">
                                    {lastMessage ? lastMessage.text : "Namaste! Tap to chat about your health."}
                                </p>
                                {/* Unread badge dummy */}
                                {messages.length === 0 && (
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">1</div>
                                )}
                          </div>
                      </div>
                  </div>

                  {/* Dummy Chat: Mom */}
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer opacity-60">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-gray-600">
                         M
                      </div>
                      <div className="flex-1 border-b border-gray-100 pb-3">
                          <div className="flex justify-between items-center mb-0.5">
                              <span className="font-semibold text-gray-900 text-[17px]">Mom</span>
                              <span className="text-xs text-gray-400">Yesterday</span>
                          </div>
                          <p className="text-gray-500 text-sm truncate">Call me when you are free.</p>
                      </div>
                  </div>
                  
                  <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                      <span>Your personal messages are</span>
                      <span className="text-wa-teal font-medium">end-to-end encrypted</span>
                  </div>
              </div>

              {/* FAB */}
              <div className="absolute bottom-6 right-6 safe-bottom">
                  <div className="w-14 h-14 bg-wa-teal rounded-xl rounded-tl-3xl rounded-br-3xl flex items-center justify-center shadow-lg text-white">
                      <MessageSquare size={24} fill="white" />
                  </div>
              </div>
          </div>
      )}

      {/* ---------------- SCREEN: CHAT INTERFACE ---------------- */}
      {currentScreen === 'chat' && (
          <div className="h-full relative">
              <ChatInterface 
                 initialMessages={messages} 
                 userProfile={userProfile} 
                 onProfileUpdate={handleProfileUpdate}
                 onBack={() => setCurrentScreen('list')}
                 onOpenDashboard={() => setShowDashboard(true)}
              />
          </div>
      )}

      {/* ---------------- OVERLAY: HEALTH DASHBOARD (Mimics a WA Flow/Business Menu) ---------------- */}
      {showDashboard && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-fade-in backdrop-blur-sm">
              <div className="bg-white rounded-t-2xl h-[85%] w-full flex flex-col overflow-hidden animate-slide-up shadow-2xl">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                      <div>
                          <h2 className="text-lg font-bold text-gray-800">Health Status</h2>
                          <p className="text-xs text-gray-500">Updates based on your cycle</p>
                      </div>
                      <button onClick={() => setShowDashboard(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                          <X size={20} className="text-gray-600" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                      {/* Cycle Wheel Section */}
                      <div className="flex justify-center py-2">
                         <CycleWheel status={cycleStatus} />
                      </div>

                      {/* Daily Insight */}
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                              <Info size={16} />
                              {translation.title}
                          </h3>
                          <p className="text-blue-900 text-sm leading-relaxed">
                              {cycleStatus.phase === 'Menstrual' && translation.menstrual}
                              {cycleStatus.phase === 'Follicular' && translation.follicular}
                              {cycleStatus.phase === 'Ovulation' && translation.ovulation}
                              {cycleStatus.phase === 'Luteal' && translation.luteal}
                          </p>
                      </div>

                      {/* Mood Tracker */}
                      <div>
                          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <Heart size={18} className="text-sakhi-500" />
                              {translation.moodTitle || "How are you feeling?"}
                          </h3>
                          <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
                              {[
                                  { id: 'happy', icon: <Smile size={24} />, label: 'Happy', color: 'text-yellow-500 bg-yellow-50' },
                                  { id: 'sad', icon: <Frown size={24} />, label: 'Low', color: 'text-blue-500 bg-blue-50' },
                                  { id: 'irritated', icon: <Zap size={24} />, label: 'Angry', color: 'text-red-500 bg-red-50' },
                                  { id: 'tired', icon: <Battery size={24} />, label: 'Tired', color: 'text-purple-500 bg-purple-50' },
                                  { id: 'cramps', icon: <Coffee size={24} />, label: 'Pain', color: 'text-orange-500 bg-orange-50' },
                              ].map((mood) => (
                                  <button
                                      key={mood.id}
                                      onClick={() => handleMoodSelect(mood.id as Mood)}
                                      className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all active:scale-95 ${
                                          selectedMood === mood.id 
                                          ? `ring-2 ring-sakhi-400 ${mood.color} shadow-sm` 
                                          : 'hover:bg-gray-50 text-gray-400 grayscale hover:grayscale-0'
                                      }`}
                                  >
                                      <div className={`p-2 rounded-full ${selectedMood === mood.id ? '' : 'bg-gray-100'}`}>
                                          {mood.icon}
                                      </div>
                                      <span className="text-[10px] font-medium">{mood.label}</span>
                                  </button>
                              ))}
                          </div>
                          
                          {/* Mood Result Card */}
                          {selectedMood && moodData && (
                              <div className="mt-4 bg-sakhi-50 border border-sakhi-100 p-4 rounded-xl animate-fade-in">
                                   <p className="text-gray-800 font-medium text-sm mb-2">{moodData.message}</p>
                                   <div className="flex gap-2 items-start text-sm text-gray-600 mt-2 bg-white/50 p-2 rounded-lg">
                                       <span>{userProfile.dietPreference === 'vegetarian' ? '🥗' : '🍲'}</span>
                                       <span>{userProfile.dietPreference === 'vegetarian' ? moodData.veg : moodData.nonVeg}</span>
                                   </div>
                                   {moodData.activity && (
                                       <div className="flex gap-2 items-start text-sm text-gray-600 mt-2 bg-white/50 p-2 rounded-lg">
                                           <span>🧘‍♀️</span>
                                           <span>{moodData.activity}</span>
                                       </div>
                                   )}
                              </div>
                          )}
                      </div>

                      {/* Settings Access */}
                      <div className="pt-4 border-t border-gray-100">
                          <ProfileSettings userProfile={userProfile} onSave={handleSaveProfile} />
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
