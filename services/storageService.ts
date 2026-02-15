import { UserProfile, Message, SymptomEntry } from "../types";

const PROFILE_KEY = 'sakhi_user_profile';
const MESSAGES_KEY = 'sakhi_chat_history';

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return null;
  
  const profile = JSON.parse(data);
  // Backward compatibility: ensure symptomHistory exists
  if (!profile.symptomHistory) {
    profile.symptomHistory = [];
  }
  return profile;
};

export const saveMessages = (messages: Message[]) => {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};

export const getMessages = (): Message[] => {
  const data = localStorage.getItem(MESSAGES_KEY);
  return data ? JSON.parse(data) : [];
};

export const logSymptom = (symptom: string): SymptomEntry | null => {
  const profile = getProfile();
  if (!profile) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate Cycle Day for this symptom
  let cycleDay = 1;
  if (profile.lastPeriodDate) {
      const lastPeriod = new Date(profile.lastPeriodDate);
      const today = new Date();
      lastPeriod.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = today.getTime() - lastPeriod.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      cycleDay = (diffDays % profile.cycleLength) + 1;
      if (cycleDay <= 0) cycleDay = 1;
  }

  const newEntry: SymptomEntry = {
      date: todayStr,
      symptom: symptom,
      cycleDay: cycleDay
  };

  // Initialize if missing (double safety)
  if (!profile.symptomHistory) profile.symptomHistory = [];
  
  // Add to history
  profile.symptomHistory.push(newEntry);
  
  // Sort descending by date
  profile.symptomHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  saveProfile(profile);
  return newEntry;
};

export const addPeriodDate = (dateStr: string): UserProfile | null => {
  const profile = getProfile();
  if (!profile) return null;
  
  // Initialize history if missing
  if (!profile.periodHistory) profile.periodHistory = [profile.lastPeriodDate];

  // Add new date if it's not already the most recent one to avoid duplicates
  // We allow manual entry, so we should check if it exists
  if (!profile.periodHistory.includes(dateStr)) {
      profile.periodHistory.push(dateStr);
      // Sort descending (newest first)
      profile.periodHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }
  
  // Update lastPeriodDate to the most recent one
  profile.lastPeriodDate = profile.periodHistory[0];

  // Recalculate cycle length if we have enough history (at least 2 dates)
  if (profile.periodHistory.length >= 2) {
      // Simple average of last 3 gaps
      let totalDays = 0;
      let gaps = 0;
      const history = profile.periodHistory.slice(0, 4); // Take last 4 dates to get 3 gaps
      // History is sorted desc: D1, D2, D3...
      for (let i = 0; i < history.length - 1; i++) {
           const d1 = new Date(history[i]);
           const d2 = new Date(history[i+1]);
           const diffTime = Math.abs(d1.getTime() - d2.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           
           // Filter outliers (e.g. skipped periods or very short cycles)
           if (diffDays > 15 && diffDays < 45) { 
               totalDays += diffDays;
               gaps++;
           }
      }
      if (gaps > 0) {
          profile.cycleLength = Math.round(totalDays / gaps);
      }
  }
  
  saveProfile(profile);
  return profile;
};

export const calculateCycleStatus = (lastPeriodDateStr: string, cycleLength: number) => {
  const lastPeriod = new Date(lastPeriodDateStr);
  const today = new Date();
  
  // Reset time part to ensure day calculations are accurate
  today.setHours(0,0,0,0);
  lastPeriod.setHours(0,0,0,0);

  // Calculate difference in days
  // We need signed difference to know if we are ahead or behind, but logic below handles it
  const diffTime = today.getTime() - lastPeriod.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Current day in cycle (1-based)
  // If diffDays is 0 (today is period day), it's Day 1.
  // If diffDays is 5, it's Day 6.
  const currentDay = (diffDays % cycleLength) + 1;

  // Next period calculation
  const nextPeriod = new Date(lastPeriod);
  nextPeriod.setDate(lastPeriod.getDate() + cycleLength);
  
  // If next period is in the past (e.g. user hasn't logged recent period), 
  // project it forward
  while (nextPeriod < today) {
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
  }

  const daysUntilNext = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let phase = 'Follicular';
  if (currentDay >= 1 && currentDay <= 5) phase = 'Menstrual';
  else if (currentDay >= 6 && currentDay <= 13) phase = 'Follicular';
  else if (currentDay >= 14 && currentDay <= 16) phase = 'Ovulation';
  else if (currentDay >= 17) phase = 'Luteal';

  return {
    day: currentDay > 0 ? currentDay : 1,
    phase,
    nextPeriodDate: nextPeriod,
    daysUntilNext
  };
};