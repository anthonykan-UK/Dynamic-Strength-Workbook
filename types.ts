export type ViewState = 'welcome' | 'phase1' | 'phase2' | 'phase3' | 'dashboard' | 'weekly' | 'quarterly';

export interface Story {
  id: string;
  text: string; // Verbatim quote
  echoCheck?: 'Yes' | 'No' | 'Mostly';
  action?: string;
  feeling?: string;
  pattern?: string;
}

export interface FivePercentShift {
  id: string;
  territory: string;
  anchorId: string; // Links to a Core Anchor
  practice: string;
}

export interface DailyLog {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  anchorUsed: string;
  reflection: string;
}

export interface WeeklyReflection {
  id: string;
  date: string; // Week ending date
  wins: string;
  challenges: string;
  energyLevel: number;
  focusForNextWeek: string;
}

export interface QuarterlyCheckIn {
  id: string;
  date: string;
  shifted: string;
  creatingFlow: string;
  needsAdjustment: string;
  emerging: string;
}

export interface UserData {
  name: string;
  email: string;
  assessmentStrengths: string[]; // Phase 1: Hypotheses
  externalStories: Story[]; // Phase 1 & 2
  drainingPatterns: string[]; // Phase 2
  reframedBoundaries: string[]; // Phase 2
  coreAnchors: string[]; // Phase 2: Final Named Core Strengths
  shifts: FivePercentShift[]; // Phase 3
  dailyLogs: DailyLog[];
  weeklyReflections: WeeklyReflection[];
  quarterlyCheckIns: QuarterlyCheckIn[];
}

export const INITIAL_USER_DATA: UserData = {
  name: '',
  email: '',
  assessmentStrengths: ['', '', '', '', ''],
  externalStories: [],
  drainingPatterns: [''],
  reframedBoundaries: [''],
  coreAnchors: ['', '', '', '', ''],
  shifts: [],
  dailyLogs: [],
  weeklyReflections: [],
  quarterlyCheckIns: []
};

export const TERRITORIES = [
  'Work & Career',
  'Wellbeing & Health',
  'Relationships',
  'Creativity',
  'Leadership',
  'Learning'
];