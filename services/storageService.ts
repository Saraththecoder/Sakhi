import { UserProfile, Message, SymptomEntry, CycleStatus, CyclePhase } from "../types";
import { PHASES } from "../constants";

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
  const lastPeriod = new Date(profile.lastPeriodDate);
  const today = new Date();
  
  // Calculate Cycle Day for this symptom
  // Reset time part to ensure day diff is correct
  lastPeriod.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  const diffTime = today.getTime() - lastPeriod.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  // Cycle day 1 is the start date
  const cycleDay = diffDays + 1;

  const newEntry: SymptomEntry = {
    date: todayStr,
    symptom: symptom,
    cycleDay: cycleDay > 0 ? cycleDay : 1
  };

  profile.symptomHistory = [newEntry, ...(profile.symptomHistory || [])];
  saveProfile(profile);
  return newEntry;
};

export const addPeriodDate = (date: string) => {
  const profile = getProfile();
  if (!profile) return;

  // Add current lastPeriodDate to history if it's different and not already there
  if (profile.lastPeriodDate && profile.lastPeriodDate !== date) {
      if (!profile.periodHistory.includes(profile.lastPeriodDate)) {
          profile.periodHistory.unshift(profile.lastPeriodDate); // Add to front
      }
  }

  profile.lastPeriodDate = date;
  
  // Ensure the new date is also in history
  if (!profile.periodHistory.includes(date)) {
      profile.periodHistory.unshift(date);
  }
  
  // Keep history sorted desc
  profile.periodHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  saveProfile(profile);
};

export const calculateCycleStatus = (lastPeriodDate: string, cycleLength: number): CycleStatus => {
  const start = new Date(lastPeriodDate);
  const today = new Date();
  
  // Reset hours
  start.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const diffTime = today.getTime() - start.getTime();
  const day = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Determine Phase using constants
  let phase = CyclePhase.Luteal; // Default fallback
  
  if (day >= PHASES.MENSTRUAL.start && day <= PHASES.MENSTRUAL.end) {
    phase = CyclePhase.Menstrual;
  } else if (day >= PHASES.FOLLICULAR.start && day <= PHASES.FOLLICULAR.end) {
    phase = CyclePhase.Follicular;
  } else if (day >= PHASES.OVULATION.start && day <= PHASES.OVULATION.end) {
    phase = CyclePhase.Ovulation;
  } else {
    phase = CyclePhase.Luteal;
  }

  // Next Period
  const nextPeriod = new Date(start);
  nextPeriod.setDate(start.getDate() + cycleLength);
  
  const diffNext = nextPeriod.getTime() - today.getTime();
  const daysUntilNext = Math.ceil(diffNext / (1000 * 60 * 60 * 24));

  return {
    day: day > 0 ? day : 1, 
    phase,
    nextPeriodDate: nextPeriod,
    daysUntilNext
  };
};