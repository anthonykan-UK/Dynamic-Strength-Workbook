export type ViewState = 'welcome' | 'discovery' | 'phase1' | 'phase2' | 'phase3' | 'dashboard' | 'weekly' | 'quarterly';
export type Language = 'en-GB' | 'zh-HK';

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
  energyLevel: number; // 1-5 Scale (Gamification)
  aiFeedback?: string; // "Strength Spark" - Immediate validation
}

export interface WeeklyReflection {
  id: string;
  date: string; // Week ending date
  wins: string;
  challenges: string;
  energyLevel: number;
  focusForNextWeek: string;
  aiSummary?: string; // AI generated synthesis of the week
}

export interface QuarterlyCheckIn {
  id: string;
  date: string;
  shifted: string; // What shifted?
  creatingFlow: string; // What's creating flow?
  needsAdjustment: string; // What needs adjustment?
  emerging: string; // What's emerging?
}

export interface InternalAudit {
  momentum: string; // What created genuine momentum?
  draining: string; // What consumed energy without building capacity?
}

export interface UserData {
  name: string;
  email: string;
  yearlyTheme: string; // "One focused area or theme" (Page 6)
  internalAudit: InternalAudit; // Phase 1: Weigh
  assessmentStrengths: string[]; // Phase 1: Hypotheses
  externalStories: Story[]; // Phase 1 & 2: Assess
  drainingPatterns: string[]; // Phase 2: Boundary
  reframedBoundaries: string[]; // Phase 2: Boundary
  coreAnchors: string[]; // Phase 2: Venture
  shifts: FivePercentShift[]; // Phase 3: Scale
  dailyLogs: DailyLog[];
  weeklyReflections: WeeklyReflection[];
  quarterlyCheckIns: QuarterlyCheckIn[];
}

export const INITIAL_USER_DATA: UserData = {
  name: '',
  email: '',
  yearlyTheme: '',
  internalAudit: { momentum: '', draining: '' },
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

// Updated based on PDF Page 10 "Possibility Mapping"
export const TERRITORIES = [
  'Work & Career',
  'Resources & Assets',
  'Relationships & Community',
  'Learning & Growth',
  'Wellbeing & Presence',
  'Creativity & Expression',
  'Environment & Space',
  'Leadership'
];

export const COMMON_STRENGTHS = [
  "Strategic", "Empathy", "Achiever", "Learner", "Intellection",
  "Adaptability", "Connectedness", "Developer", "Positivity", "Relator",
  "Analytical", "Context", "Futuristic", "Ideation", "Input",
  "Command", "Communication", "Competition", "Maximizer", "Self-Assurance",
  "Arranger", "Discipline", "Consistency", "Focus", "Restorative",
  "Woo", "Includer", "Harmony", "Responsibility", "Belief"
];