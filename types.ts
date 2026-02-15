export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'sakhi';
  timestamp: Date;
}

export type DietPreference = 'vegetarian' | 'non-vegetarian';

export interface SymptomEntry {
  date: string; // ISO Date string (YYYY-MM-DD)
  symptom: string;
  cycleDay?: number; // Which day of the cycle did this occur?
}

export interface UserProfile {
  name?: string;
  lastPeriodDate: string; // ISO Date string
  periodHistory: string[]; // List of past period dates
  symptomHistory: SymptomEntry[]; // List of logged symptoms
  cycleLength: number;
  dietPreference: DietPreference;
  onboardingComplete: boolean;
}

export interface DailyTip {
  phase: string;
  tip: string;
  nutrition: string[];
}

export enum CyclePhase {
  Menstrual = 'Menstrual',
  Follicular = 'Follicular',
  Ovulation = 'Ovulation',
  Luteal = 'Luteal'
}

export interface CycleStatus {
  day: number;
  phase: CyclePhase;
  nextPeriodDate: Date;
  daysUntilNext: number;
}