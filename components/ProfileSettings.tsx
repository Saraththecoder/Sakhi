import React, { useState } from 'react';
import { UserProfile, DietPreference } from '../types';
import { Save, User, Calendar, Utensils, Activity, Clock } from 'lucide-react';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userProfile, onSave }) => {
  const [date, setDate] = useState(userProfile.lastPeriodDate);
  const [cycleLength, setCycleLength] = useState(userProfile.cycleLength);
  const [diet, setDiet] = useState<DietPreference>(userProfile.dietPreference);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    // Create updated profile object
    const updatedProfile = { 
        ...userProfile, 
        lastPeriodDate: date, 
        cycleLength: Number(cycleLength),
        dietPreference: diet 
    };
    
    // Logic to keep history consistent:
    // If the user manually corrects the "Last Period Date", we assume they are correcting 
    // the most recent entry in their history log.
    if (date !== userProfile.lastPeriodDate && updatedProfile.periodHistory && updatedProfile.periodHistory.length > 0) {
        updatedProfile.periodHistory[0] = date;
        // Re-sort just in case, ensuring desc order
        updatedProfile.periodHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }

    onSave(updatedProfile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto pb-20">
       {/* Header */}
       <div className="bg-white p-6 shadow-sm border-b sticky top-0 z-10">
         <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <User className="text-sakhi-500" /> My Profile
         </h1>
         <p className="text-gray-500 text-sm">Manage your health preferences</p>
       </div>

       <div className="p-6 space-y-6">
         {/* Cycle Section */}
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
             <Calendar size={18} className="text-sakhi-400" /> Cycle Details
           </h3>
           
           <div className="space-y-4">
             <div>
               <label className="block text-sm text-gray-600 mb-1">Last Period Start Date</label>
               <input 
                 type="date" 
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sakhi-400 outline-none text-gray-800"
               />
               <p className="text-xs text-gray-400 mt-1">Correct this if your start date was different.</p>
             </div>
             
             <div>
                <label className="block text-sm text-gray-600 mb-1">Cycle Length (Days)</label>
                <input 
                 type="number"
                 min="20"
                 max="45"
                 value={cycleLength}
                 onChange={(e) => setCycleLength(Number(e.target.value))}
                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sakhi-400 outline-none text-gray-800"
               />
                <p className="text-xs text-gray-400 mt-1">Usually 28 days. Adjust if yours is different.</p>
             </div>
           </div>
         </div>

         {/* Diet Section */}
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
             <Utensils size={18} className="text-sakhi-400" /> Diet Preference
           </h3>
           
           <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDiet('vegetarian')}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                  ${diet === 'vegetarian' 
                    ? 'border-sakhi-500 bg-sakhi-50 text-sakhi-700 font-medium' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'}
                `}
              >
                <span className="text-xl">🥗</span>
                Vegetarian
              </button>
              <button
                onClick={() => setDiet('non-vegetarian')}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                  ${diet === 'non-vegetarian' 
                    ? 'border-sakhi-500 bg-sakhi-50 text-sakhi-700 font-medium' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'}
                `}
              >
                <span className="text-xl">🍗</span>
                Non-Veg
              </button>
           </div>
           <p className="text-xs text-gray-400 mt-2 text-center">Used for daily food recommendations.</p>
         </div>

         {/* Symptom History Timeline */}
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-sakhi-400" /> Symptom History
            </h3>
            
            {!userProfile.symptomHistory || userProfile.symptomHistory.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No symptoms logged yet.</p>
                    <p className="text-xs mt-1">Tell Sakhi "I have cramps" to start tracking!</p>
                </div>
            ) : (
                <div className="relative pl-4 border-l-2 border-sakhi-100 space-y-6 py-2">
                    {userProfile.symptomHistory.slice(0, 5).map((entry, idx) => (
                        <div key={idx} className="relative">
                            <span className="absolute -left-[21px] top-1 w-3 h-3 bg-sakhi-400 rounded-full border-2 border-white shadow-sm"></span>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-800 capitalize">{entry.symptom}</p>
                                    <p className="text-xs text-gray-500">Cycle Day {entry.cycleDay || '?'}</p>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                    {new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {userProfile.symptomHistory.length > 5 && (
                        <p className="text-center text-xs text-gray-400 pt-2">
                            + {userProfile.symptomHistory.length - 5} older logs
                        </p>
                    )}
                </div>
            )}
         </div>

         {/* Save Button */}
         <button
            onClick={handleSave}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
              ${isSaved ? 'bg-green-500' : 'bg-gray-900 hover:bg-gray-800'}
            `}
         >
           <Save size={20} />
           {isSaved ? 'Saved Successfully!' : 'Save Changes'}
         </button>
       </div>
    </div>
  );
};

export default ProfileSettings;