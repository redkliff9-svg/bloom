export type Lang = 'uz' | 'ru' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type EntryType = 'episode' | 'daily';
export type PainLocation = 'lower_abdomen' | 'lower_back' | 'thighs' | 'pelvis' | 'upper_abdomen';
export type ReliefMethod = 'heat' | 'medication' | 'rest' | 'exercise' | 'none';
export type Symptom = 'bloating' | 'headache' | 'mood_swings' | 'nausea' | 'fatigue' | 'breast_tenderness';
export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';
export type ChallengeId = '3day' | '7day' | 'full_cycle';

export interface Episode {
  id: string;
  type: EntryType;
  date: string;
  timestamp: number;
  painLevel: number;
  painLocations: PainLocation[];
  symptoms: Symptom[];
  reliefMethods: ReliefMethod[];
  notes: string;
  flow?: FlowIntensity;
  memberId?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  color: string;
  isOwner: boolean;
}

export interface Challenge {
  id: ChallengeId;
  startDate: string;
  loggedDates: string[];
  completed: boolean;
  completedDate?: string;
  badgeEarned?: boolean;
}

export interface UserSettings {
  language: Lang;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string;
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
  reminderTime: string;
  periodActive: boolean;
  theme: Theme;
}
