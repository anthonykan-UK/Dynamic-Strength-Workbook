import React, { useState, useEffect } from 'react';
import { 
  UserData, 
  ViewState, 
  Language,
  INITIAL_USER_DATA, 
  Story, 
  TERRITORIES, 
  DailyLog,
  COMMON_STRENGTHS,
  QuarterlyCheckIn,
  WeeklyReflection
} from './types';
import { TRANSLATIONS } from './translations';
import { REFLECTION_CARDS, ReflectionCard } from './constants';
import { analyzeStoryWithAI, suggestShiftsWithAI, discoverStrengthsWithAI, generateDailySpark, summarizeWeek, analyzeJourneyWithAI, JourneyEntry, suggestThemeWithAI, analyzeQuarterlyCheckIn, suggestBoundaryWithAI } from './services/ai';
import { Layout } from './components/Layout';
import { Coach } from './components/Coach';
import { 
  ArrowRight, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Sun,
  Moon,
  TrendingUp,
  Award,
  X,
  Calendar,
  Sparkles,
  Loader2,
  Lightbulb,
  Search,
  Check,
  ChevronRight,
  BookOpen,
  Anchor,
  BatteryWarning,
  ShieldCheck,
  Info,
  Scale,
  Zap,
  Flame,
  Wand2,
  Shuffle,
  Eye,
  RefreshCw,
  Play,
  ArrowDown,
  History,
  Activity,
  User,
  MessageCircle,
  Compass
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

export default function App() {
  // --- State ---
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('inkspire_strength_data');
    if (!saved) return INITIAL_USER_DATA;
    
    try {
        const parsed = JSON.parse(saved);
        // Robust Deep Merge: Ensures nested objects/arrays exist even if saved data is old/partial
        return {
            ...INITIAL_USER_DATA,
            ...parsed,
            internalAudit: { ...INITIAL_USER_DATA.internalAudit, ...(parsed.internalAudit || {}) },
            assessmentStrengths: parsed.assessmentStrengths || INITIAL_USER_DATA.assessmentStrengths,
            externalStories: parsed.externalStories || INITIAL_USER_DATA.externalStories,
            drainingPatterns: parsed.drainingPatterns || INITIAL_USER_DATA.drainingPatterns,
            reframedBoundaries: parsed.reframedBoundaries || INITIAL_USER_DATA.reframedBoundaries,
            coreAnchors: parsed.coreAnchors || INITIAL_USER_DATA.coreAnchors,
            shifts: parsed.shifts || INITIAL_USER_DATA.shifts,
            dailyLogs: parsed.dailyLogs || INITIAL_USER_DATA.dailyLogs,
            weeklyReflections: parsed.weeklyReflections || INITIAL_USER_DATA.weeklyReflections,
            quarterlyCheckIns: parsed.quarterlyCheckIns || INITIAL_USER_DATA.quarterlyCheckIns,
            // Ensure boolean toggles are respected if they exist, otherwise default
            useBNODeck: parsed.useBNODeck !== undefined ? parsed.useBNODeck : INITIAL_USER_DATA.useBNODeck
        };
    } catch(e) {
        console.error("Data parse error, resetting to default.", e);
        return INITIAL_USER_DATA;
    }
  });
  
  const [view, setView] = useState<ViewState>('welcome');
  // Initialize language from localStorage or default to en-GB
  const [language, setLanguage] = useState<Language>(() => {
      return (localStorage.getItem('inkspire_language') as Language) || 'en-GB';
  });
  
  const [notification, setNotification] = useState<string | null>(null);
  
  // Local loading states for AI operations
  const [analyzingStoryId, setAnalyzingStoryId] = useState<string | null>(null);
  const [suggestingShiftId, setSuggestingShiftId] = useState<string | null>(null);
  const [shiftSuggestions, setShiftSuggestions] = useState<Record<string, string[]>>({});
  
  // Boundary Suggestion State
  const [suggestingBoundary, setSuggestingBoundary] = useState(false);
  const [boundarySuggestions, setBoundarySuggestions] = useState<string[]>([]);

  // Discovery View State
  const [discoveryReflection, setDiscoveryReflection] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedDiscoveryStrengths, setSelectedDiscoveryStrengths] = useState<string[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  
  // BNO Deck State - Journey
  const [journeyCards, setJourneyCards] = useState<ReflectionCard[]>([]);
  const [journeyAnswers, setJourneyAnswers] = useState<JourneyEntry[]>([]);
  const [currentJourneyIndex, setCurrentJourneyIndex] = useState(0);
  const [isJourneyActive, setIsJourneyActive] = useState(false);

  // Phase 2 State
  const [isSuggestingTheme, setIsSuggestingTheme] = useState(false);

  // Dashboard State (Lifted)
  const [todayLog, setTodayLog] = useState({
      anchor: '',
      reflection: '',
      energy: 3
  });
  const [isLogging, setIsLogging] = useState(false);
  const [lastSpark, setLastSpark] = useState<string | null>(null);

  // Weekly State (Lifted)
  const [weeklyData, setWeeklyData] = useState({
      wins: '',
      challenges: '',
      theme: '',
      focus: ''
  });
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Quarterly State (Lifted)
  const [quarterlyData, setQuarterlyData] = useState({
      shifted: '',
      creatingFlow: '',
      needsAdjustment: '',
      emerging: ''
  });
  const [isAnalyzingQuarter, setIsAnalyzingQuarter] = useState(false);
  const [latestQuarterlyAnalysis, setLatestQuarterlyAnalysis] = useState<QuarterlyCheckIn['aiAnalysis'] | null>(null);

  // Phase 2 Definitions Toggle
  const [showDefinitions, setShowDefinitions] = useState(false);
  
  // Coach Trigger State
  const [coachTrigger, setCoachTrigger] = useState<string | undefined>(undefined);

  // Translation Helper
  const t = TRANSLATIONS[language];

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('inkspire_strength_data', JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    localStorage.setItem('inkspire_language', language);
  }, [language]);

  // Pre-populate discovery selections if data exists
  useEffect(() => {
      const existing = userData.assessmentStrengths?.filter(Boolean) || [];
      if (existing.length > 0) {
          setSelectedDiscoveryStrengths(existing);
      }
  }, [userData.assessmentStrengths]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Handlers ---
  const updateAssessmentStrength = (index: number, value: string) => {
    const newStrengths = [...userData.assessmentStrengths];
    newStrengths[index] = value;
    setUserData({ ...userData, assessmentStrengths: newStrengths });
  };

  const addStory = () => {
    const newStory: Story = { id: crypto.randomUUID(), text: '' };
    setUserData({ ...userData, externalStories: [...userData.externalStories, newStory] });
  };

  const updateStory = (id: string, field: keyof Story, value: string) => {
    const newStories = userData.externalStories.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    setUserData({ ...userData, externalStories: newStories });
  };

  const deleteStory = (id: string) => {
    setUserData({ ...userData, externalStories: userData.externalStories.filter(s => s.id !== id) });
  };

  const handleAnalyzeStory = async (story: Story) => {
    if (!story.text || story.text.length < 10) {
      showNotification("Please enter a longer story first.");
      return;
    }
    setAnalyzingStoryId(story.id);
    try {
      const result = await analyzeStoryWithAI(story.text, language);
      const newStories = userData.externalStories.map(s => 
        s.id === story.id ? { 
          ...s, 
          action: result.action, 
          feeling: result.feeling, 
          pattern: result.pattern 
        } : s
      );
      setUserData({ ...userData, externalStories: newStories });
      showNotification(t.notifications.storyAnalyzed);
    } catch (e) {
      showNotification(t.notifications.failedAnalyze);
    } finally {
      setAnalyzingStoryId(null);
    }
  };

  const updateAnchor = (index: number, value: string) => {
    const newAnchors = [...userData.coreAnchors];
    newAnchors[index] = value;
    setUserData({ ...userData, coreAnchors: newAnchors });
  };
  
  const selectCandidateToAnchor = (candidate: string) => {
      // Find first empty slot
      const emptyIndex = userData.coreAnchors.findIndex(a => !a);
      if (emptyIndex !== -1) {
          updateAnchor(emptyIndex, candidate);
      } else {
          showNotification("All 5 Anchor slots are full. Clear one to add.");
      }
  };

  const addShift = () => {
    setUserData({
      ...userData,
      shifts: [...userData.shifts, { id: crypto.randomUUID(), territory: TERRITORIES[0], anchorId: '', practice: '' }]
    });
  };

  const updateShift = (id: string, field: string, value: string) => {
    setUserData({
      ...userData,
      shifts: userData.shifts.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const deleteShift = (id: string) => {
    setUserData({ ...userData, shifts: userData.shifts.filter(s => s.id !== id) });
  };

  const handleSuggestShifts = async (shiftId: string, territory: string, anchorId: string) => {
    if (!territory || !anchorId) {
       showNotification(t.notifications.selectTerritory);
       return;
    }
    setSuggestingShiftId(shiftId);
    try {
        const suggestions = await suggestShiftsWithAI(territory, anchorId, language);
        setShiftSuggestions(prev => ({ ...prev, [shiftId]: suggestions }));
    } catch (e) {
        showNotification(t.notifications.failedSuggest);
    } finally {
        setSuggestingShiftId(null);
    }
  };

  const applySuggestion = (shiftId: string, suggestion: string) => {
    updateShift(shiftId, 'practice', suggestion);
    setShiftSuggestions(prev => {
        const newState = { ...prev };
        delete newState[shiftId];
        return newState;
    });
  };

  const handleSuggestBoundary = async () => {
      if (!userData.drainingPatterns[0]) {
          showNotification(t.notifications.missingDrain); 
          return;
      }
      setSuggestingBoundary(true);
      try {
          const suggestions = await suggestBoundaryWithAI(userData.drainingPatterns[0], language);
          setBoundarySuggestions(suggestions);
      } catch (e) {
          showNotification(t.notifications.failedSuggest);
      } finally {
          setSuggestingBoundary(false);
      }
  };

  const applyBoundarySuggestion = (suggestion: string) => {
      const newB = [...userData.reframedBoundaries];
      newB[0] = suggestion;
      setUserData({...userData, reframedBoundaries: newB});
      setBoundarySuggestions([]);
  };

  // --- Discovery Journey Handlers ---

  const startJourney = () => {
      // Logic to select 2 past, 2 transition, 2 future
      const pastCards = REFLECTION_CARDS.filter(c => c.category === 'past');
      const transitionCards = REFLECTION_CARDS.filter(c => c.category === 'transition');
      const futureCards = REFLECTION_CARDS.filter(c => c.category === 'future');

      const shuffle = (array: ReflectionCard[]) => array.sort(() => 0.5 - Math.random());

      const selected = [
          ...shuffle(pastCards).slice(0, 2),
          ...shuffle(transitionCards).slice(0, 2),
          ...shuffle(futureCards).slice(0, 2)
      ];

      setJourneyCards(selected);
      setJourneyAnswers([]);
      setCurrentJourneyIndex(0);
      setIsJourneyActive(true);
      setDiscoveryReflection('');
  };

  const swapJourneyCard = () => {
      const currentCard = journeyCards[currentJourneyIndex];
      // Get all currently used IDs to avoid picking duplicates
      const usedIds = new Set(journeyCards.map(c => c.id));
      
      // Pool of available cards: Same category, not currently used
      const available = REFLECTION_CARDS.filter(c => 
          c.category === currentCard.category && !usedIds.has(c.id)
      );

      if (available.length === 0) {
          showNotification("No other cards available in this category.");
          return;
      }

      // Random pick
      const newCard = available[Math.floor(Math.random() * available.length)];
      
      // Update state
      const newJourney = [...journeyCards];
      newJourney[currentJourneyIndex] = newCard;
      setJourneyCards(newJourney);
      
      // Clear input for the new question
      setDiscoveryReflection('');
  };

  const nextJourneyCard = async () => {
      if (!discoveryReflection.trim()) return;

      const currentCard = journeyCards[currentJourneyIndex];
      const entry: JourneyEntry = {
          stage: currentCard.category,
          question: currentCard.questions[language],
          answer: discoveryReflection
      };

      const newAnswers = [...journeyAnswers, entry];
      setJourneyAnswers(newAnswers);
      setDiscoveryReflection('');

      if (currentJourneyIndex < 5) {
          setCurrentJourneyIndex(prev => prev + 1);
      } else {
          // Finished 6 cards, analyze
          setIsDiscovering(true);
          try {
              const suggestions = await analyzeJourneyWithAI(newAnswers, language);
              const combined = Array.from(new Set([...selectedDiscoveryStrengths, ...suggestions])).slice(0, 5);
              setSelectedDiscoveryStrengths(combined);
              showNotification(t.notifications.strengthsIdentified);
              setIsJourneyActive(false); // Reset to summary view
          } catch(e) {
              showNotification(t.notifications.failedReflect);
          } finally {
              setIsDiscovering(false);
          }
      }
  };

  // Standard single prompt submit (for non-BNO or fallback)
  const handleSingleDiscoverySubmit = async () => {
      if(!discoveryReflection.trim()) return;
      setIsDiscovering(true);
      try {
          const suggestions = await discoverStrengthsWithAI(discoveryReflection, language);
          const combined = Array.from(new Set([...selectedDiscoveryStrengths, ...suggestions])).slice(0, 5);
          setSelectedDiscoveryStrengths(combined);
          showNotification(t.notifications.strengthsIdentified);
      } catch (e) {
          showNotification(t.notifications.failedReflect);
      } finally {
          setIsDiscovering(false);
      }
  };

  const toggleDiscoveryStrength = (s: string) => {
      if (selectedDiscoveryStrengths.includes(s)) {
          setSelectedDiscoveryStrengths(prev => prev.filter(i => i !== s));
      } else {
          if (selectedDiscoveryStrengths.length >= 5) {
              showNotification(t.notifications.maxStrengths);
              return;
          }
          setSelectedDiscoveryStrengths(prev => [...prev, s]);
      }
  };

  const saveDiscoveryToPhase1 = () => {
      const newStrengths = [...selectedDiscoveryStrengths];
      while(newStrengths.length < 5) newStrengths.push("");
      setUserData({ ...userData, assessmentStrengths: newStrengths });
      showNotification(t.notifications.savedPhase1);
      setView('phase1');
  };

  const nextPrompt = () => {
      setPromptIndex((prev) => (prev + 1) % t.prompts.length);
  };
  
  const addDailyLog = (log: DailyLog) => {
    setUserData(prev => ({
      ...prev,
      dailyLogs: [log, ...prev.dailyLogs]
    }));
    showNotification(t.notifications.dailyLogged);
  };

  const saveAndAnalyzeQuarterly = async () => {
      setIsAnalyzingQuarter(true);
      const newQ: QuarterlyCheckIn = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          ...quarterlyData
      };

      try {
          // Get recent logs (last 90 days)
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          
          const recentLogs = userData.dailyLogs.filter(l => new Date(l.date) > ninetyDaysAgo);
          const recentWeeklies = userData.weeklyReflections.filter(w => new Date(w.date) > ninetyDaysAgo);

          const analysis = await analyzeQuarterlyCheckIn(newQ, recentLogs, recentWeeklies, language);
          newQ.aiAnalysis = analysis;
          setLatestQuarterlyAnalysis(analysis);

          setUserData(prev => ({
              ...prev,
              quarterlyCheckIns: [newQ, ...prev.quarterlyCheckIns]
          }));
          
          setQuarterlyData({ shifted: '', creatingFlow: '', needsAdjustment: '', emerging: '' });
          showNotification(t.notifications.quarterlySaved);
      } catch (e) {
          // Fallback save without analysis if AI fails
          setUserData(prev => ({
              ...prev,
              quarterlyCheckIns: [newQ, ...prev.quarterlyCheckIns]
          }));
          showNotification(t.notifications.quarterlySaved + " (Analysis unavailable)");
      } finally {
          setIsAnalyzingQuarter(false);
      }
  };

  const handleLogSubmit = async () => {
      if(!todayLog.anchor || !todayLog.reflection) return;
      setIsLogging(true);
      
      // AI Feedback Loop: Get a Spark
      let spark = "";
      try {
          spark = await generateDailySpark(todayLog.anchor, todayLog.reflection, language);
          setLastSpark(spark);
      } catch(e) {}

      addDailyLog({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          anchorUsed: todayLog.anchor,
          reflection: todayLog.reflection,
          energyLevel: todayLog.energy,
          aiFeedback: spark
      });
      
      setTodayLog({ anchor: '', reflection: '', energy: 3 });
      setIsLogging(false);
  };

  const handleAutoDraft = async () => {
      setIsSummarizing(true);
      try {
          const summary = await summarizeWeek(userData.dailyLogs.slice(0, 7), language);
          setWeeklyData(prev => ({
              ...prev,
              wins: summary.wins || '',
              challenges: summary.challenges || '',
              theme: summary.theme || ''
          }));
      } catch(e) {
          showNotification("Could not auto-draft. Try again.");
      } finally {
          setIsSummarizing(false);
      }
  };
  
  const handleSuggestTheme = async () => {
      const strengths = userData.assessmentStrengths.filter(Boolean);
      if(strengths.length === 0) {
          showNotification("Complete Phase 1 strengths first.");
          return;
      }
      setIsSuggestingTheme(true);
      try {
          const theme = await suggestThemeWithAI(strengths, language);
          setUserData({...userData, yearlyTheme: theme});
      } catch(e) {
          showNotification("Failed to suggest theme.");
      } finally {
          setIsSuggestingTheme(false);
      }
  };
  
  const handleStartCoachJourney = () => {
      setCoachTrigger("I want to explore my Migration Arc. Please ask me the questions one by one, listen to my answers, and help me spot my strengths.");
  };

  const handleStartCoachSpotting = () => {
      setCoachTrigger("I want to do the Strength Spotting exercise. Please interview me about a time I felt at my best.");
  };

  const saveWeeklyReflection = () => {
      const newWeekly: WeeklyReflection = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          energyLevel: 3, 
          wins: weeklyData.wins,
          challenges: weeklyData.challenges,
          theme: weeklyData.theme,
          focusForNextWeek: weeklyData.focus
      };
      setUserData(prev => ({
          ...prev,
          weeklyReflections: [newWeekly, ...prev.weeklyReflections]
      }));
      setWeeklyData({ wins: '', challenges: '', theme: '', focus: '' });
      showNotification(t.weeklySaved);
  };

  // --- Render Views ---

  const renderWelcomeView = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-br from-primary-600 to-indigo-800 p-8 rounded-2xl shadow-xl text-white">
        <h2 className="text-3xl font-bold mb-4">{t.welcomeTitle}</h2>
        <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
          {t.welcomeDesc}
        </p>
        <button 
          onClick={() => setView('discovery')}
          className="mt-8 bg-white text-primary-600 px-6 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 text-base"
        >
          {t.beginDiscovery} <ArrowRight size={18} />
        </button>
      </div>
      
      {/* Principles Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {t.principles.map((p, i) => (
           <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
               <h3 className="text-lg font-semibold text-primary-400 mb-2">{p.t}</h3>
               <p className="text-slate-400 text-sm leading-relaxed">{p.d}</p>
           </div>
        ))}
      </div>
    </div>
  );

  const renderDiscoveryView = () => {
    // Current card object if active journey
    const currentCard = isJourneyActive ? journeyCards[currentJourneyIndex] : null;
    
    const getStageLabel = (cat: string) => {
        if(cat === 'past') return t.stageRoots;
        if(cat === 'transition') return t.stageTransition;
        if(cat === 'future') return t.stageGrowth;
        return '';
    };

    return (
      <div className="space-y-8 max-w-4xl">
        <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.discoveryTitle}</h2>
                <p className="text-slate-400 text-base">{t.discoverySubtitle}</p>
            </div>
            
            {/* Audience Toggle */}
            <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-3 border border-slate-700">
                 <span className="text-sm text-slate-300 font-medium">{t.bnoContextToggle}</span>
                 <button 
                    onClick={() => {
                        const newState = !userData.useBNODeck;
                        setUserData({...userData, useBNODeck: newState});
                        // Reset journey state if toggled off
                        if(!newState) {
                            setIsJourneyActive(false);
                            setJourneyCards([]);
                        }
                    }}
                    className={`w-10 h-6 rounded-full transition-colors relative ${userData.useBNODeck ? 'bg-primary-600' : 'bg-slate-600'}`}
                 >
                     <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${userData.useBNODeck ? 'left-5' : 'left-1'}`} />
                 </button>
            </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
            {/* AI Assist Column */}
            <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden min-h-[500px] flex flex-col">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="text-primary-500" size={18} /> 
                        {userData.useBNODeck ? t.journeyTitle : t.aiReflectionGuide}
                    </h3>
                    
                    {userData.useBNODeck ? (
                        // --- NARRATIVE DECK JOURNEY UI ---
                        <div className="space-y-4 flex-1 flex flex-col">
                            {!isJourneyActive ? (
                                <div className="flex-1 flex flex-col gap-4">
                                    {/* GUIDED MODE - PRIMARY */}
                                    <button 
                                        onClick={handleStartCoachJourney}
                                        className="bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-500/30 text-indigo-200 p-6 rounded-xl flex flex-col gap-2 transition-all w-full text-left group shadow-lg shadow-indigo-900/20"
                                    >
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="bg-indigo-500/20 p-2 rounded-full"><MessageCircle size={24} className="text-indigo-400"/></div>
                                            <div className="font-bold text-lg text-white">{t.guidedModeTitle}</div>
                                        </div>
                                        <div className="text-sm text-indigo-300/80 pl-1">
                                            {t.guidedModeDesc}
                                        </div>
                                        <div className="mt-2 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                                            {t.startConversation} <ArrowRight size={12}/>
                                        </div>
                                    </button>

                                    {/* MANUAL MODE - SECONDARY */}
                                    <div 
                                        onClick={startJourney}
                                        className="bg-slate-800/30 w-full py-8 px-6 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/50 hover:bg-slate-800/50 transition-all group min-h-[160px]"
                                    >
                                         <Play className="text-slate-600 group-hover:text-primary-400 mb-3" size={32} />
                                         <span className="text-base text-white font-medium mb-1">{t.drawCard}</span>
                                         <p className="text-xs text-slate-500 text-center max-w-xs px-4">{t.journeyIntro}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in space-y-4 flex-1 flex flex-col">
                                    {/* Progress Bar */}
                                    <div className="flex items-center gap-2 text-sm text-slate-400 uppercase tracking-wider mb-1">
                                        <span className="text-primary-400 font-bold">{getStageLabel(currentCard!.category)}</span>
                                        <span className="flex-1 h-1 bg-slate-800 rounded overflow-hidden">
                                            <div className="h-full bg-primary-500 transition-all duration-500" style={{width: `${((currentJourneyIndex + 1)/6)*100}%`}}></div>
                                        </span>
                                        <span>{t.journeyProgress} {currentJourneyIndex + 1}/6</span>
                                    </div>

                                    {/* Question Display - REPLACED IMAGES */}
                                    <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center space-y-4 mb-4">
                                        <div className="p-3 bg-primary-600/20 text-primary-400 rounded-full">
                                            {currentCard!.category === 'past' && <History size={32}/>}
                                            {currentCard!.category === 'transition' && <Shuffle size={32}/>}
                                            {currentCard!.category === 'future' && <TrendingUp size={32}/>}
                                            {currentCard!.category === 'identity' && <User size={32}/>}
                                        </div>
                                        <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                                            "{currentCard!.questions[language]}"
                                        </p>
                                    </div>
                                    
                                    <div className="relative">
                                        <textarea 
                                            value={discoveryReflection}
                                            onChange={(e) => setDiscoveryReflection(e.target.value)}
                                            className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white text-base focus:ring-1 focus:ring-primary-500 mb-3 leading-relaxed resize-none"
                                            placeholder={t.jotDown}
                                        />
                                    </div>
                                    
                                    <div className="mt-auto flex gap-3">
                                        <button 
                                            onClick={swapJourneyCard}
                                            className="px-4 py-3 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                                            title={t.skipCard}
                                        >
                                            <Shuffle size={16} />
                                            <span className="hidden sm:inline">{t.skipCard}</span>
                                        </button>
                                        <button 
                                            onClick={nextJourneyCard}
                                            disabled={isDiscovering || !discoveryReflection}
                                            className="flex-1 bg-primary-600 hover:bg-primary-500 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isDiscovering ? <Loader2 className="animate-spin" size={16} /> : (currentJourneyIndex === 5 ? <Sparkles size={16} /> : <ArrowRight size={16} />)}
                                            {currentJourneyIndex === 5 ? t.analyzeJourney : t.nextCard}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // --- STANDARD CAROUSEL UI ---
                        <div className="flex-1 flex flex-col">
                            <div className="bg-slate-800/50 p-4 rounded-lg mb-4 border border-slate-700/50 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm uppercase font-bold text-primary-400 tracking-wider">{t.sparkPrompt} {promptIndex + 1}/{t.prompts.length}</span>
                                    <button 
                                        onClick={nextPrompt} 
                                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded transition-colors"
                                    >
                                        {t.next} <ChevronRight size={12} />
                                    </button>
                                </div>
                                <p className="text-slate-200 font-medium leading-relaxed min-h-[3rem] text-base">
                                "{t.prompts[promptIndex]}"
                                </p>
                            </div>

                            {/* Interactive Mode Button for Strength Spotting */}
                            <button 
                                onClick={handleStartCoachSpotting}
                                className="mb-4 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-500/30 text-indigo-200 p-3 rounded-xl flex items-center gap-3 transition-all"
                            >
                                <div className="bg-indigo-500/20 p-2 rounded-full"><MessageCircle size={18} className="text-indigo-400"/></div>
                                <div className="text-left">
                                    <div className="font-semibold text-sm">{t.interactiveSpotterTitle}</div>
                                    <div className="text-xs text-indigo-300/70">{t.interactiveSpotterDesc}</div>
                                </div>
                            </button>

                            <div className="mt-auto flex-1 flex flex-col relative">
                                <div className="flex justify-between items-center mb-2">
                                     <p className="text-base text-slate-500">{t.jotDown}</p>
                                </div>
                                
                                <textarea 
                                    value={discoveryReflection}
                                    onChange={(e) => setDiscoveryReflection(e.target.value)}
                                    className="w-full flex-1 bg-slate-800 border border-slate-700 rounded p-3 text-white text-base focus:ring-1 focus:ring-primary-500 mb-3 leading-relaxed resize-none"
                                />
                                <button 
                                    onClick={handleSingleDiscoverySubmit}
                                    disabled={isDiscovering || !discoveryReflection}
                                    className="bg-slate-800 hover:bg-slate-700 text-primary-400 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 w-full justify-center border border-slate-700"
                                >
                                    {isDiscovering ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    {t.analyzeSuggest}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="font-semibold text-white mb-2">{t.selectedHypothesis}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.selectUpTo5}</p>
                    
                    <div className="space-y-2">
                        {selectedDiscoveryStrengths.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-primary-600/20 border border-primary-500/30 px-3 py-3 rounded-lg text-white">
                                <span className="text-base">{i+1}. {s}</span>
                                <button onClick={() => toggleDiscoveryStrength(s)} className="text-slate-400 hover:text-white p-1">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        {[...Array(5 - selectedDiscoveryStrengths.length)].map((_, i) => (
                             <div key={i} className="border border-dashed border-slate-800 px-3 py-3 rounded-lg text-slate-600 text-sm">
                                 {t.slotEmpty} {selectedDiscoveryStrengths.length + i + 1}
                             </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selection Grid Column */}
            <div>
                 <h3 className="font-semibold text-white mb-4">{t.quickSelect}</h3>
                 <div className="flex flex-wrap gap-2">
                     {COMMON_STRENGTHS.map(s => (
                         <button
                            key={s}
                            onClick={() => toggleDiscoveryStrength(s)}
                            className={`px-3 py-2 rounded-full text-sm border transition-all ${
                                selectedDiscoveryStrengths.includes(s)
                                ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/20'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                         >
                             {s}
                         </button>
                     ))}
                 </div>
            </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-800">
             <button 
                onClick={saveDiscoveryToPhase1}
                disabled={selectedDiscoveryStrengths.length === 0}
                className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
             >
                {t.saveStartPhase1} <ArrowRight size={18} />
             </button>
        </div>
      </div>
    );
  };

  const renderPhase1View = () => (
    // ... (No changes in Phase 1)
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t.phase1Title}</h2>
        <p className="text-slate-400 text-base">{t.phase1Subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Step 1: Internal Audit */}
        <div className="space-y-6">
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
               <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Scale className="text-primary-500" /> {t.miningPastTitle}</h3>
               <p className="text-sm text-slate-400 mb-6">{t.miningPastDesc}</p>
               
               <div className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-green-400 mb-2">{t.momentumLabel}</label>
                       <textarea 
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-green-500 h-32"
                           placeholder={t.momentumHelp}
                           value={userData.internalAudit.momentum}
                           onChange={e => setUserData({...userData, internalAudit: {...userData.internalAudit, momentum: e.target.value}})}
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-red-400 mb-2">{t.drainingLabel}</label>
                       <textarea 
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-red-500 h-32"
                           placeholder={t.drainingHelp}
                           value={userData.internalAudit.draining}
                           onChange={e => setUserData({...userData, internalAudit: {...userData.internalAudit, draining: e.target.value}})}
                       />
                   </div>
               </div>
           </div>
           
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
               <h3 className="font-semibold text-white mb-4">{t.top5Hypothesis}</h3>
               <div className="space-y-2">
                  {userData.assessmentStrengths.map((s, i) => (
                      <input 
                         key={i}
                         value={s}
                         onChange={e => updateAssessmentStrength(i, e.target.value)}
                         placeholder={`${t.strengthPlaceholder}${i+1}`}
                         className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                      />
                  ))}
               </div>
           </div>
        </div>

        {/* Step 2: External Stories */}
        <div className="space-y-4">
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl min-h-[600px] flex flex-col">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="font-semibold text-white flex items-center gap-2"><BookOpen className="text-blue-400" /> {t.assessTitle}</h3>
                     <button onClick={addStory} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-full flex items-center gap-1 border border-slate-600">
                         <Plus size={14} /> {t.addStory}
                     </button>
                 </div>
                 <p className="text-sm text-slate-400 mb-6">{t.askPeople}</p>
                 
                 <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                     {userData.externalStories.length === 0 && (
                         <div className="text-center py-10 text-slate-600 italic border-2 border-dashed border-slate-800 rounded-lg">
                             {t.noStoriesYet}
                         </div>
                     )}
                     {userData.externalStories.map((story) => (
                         <div key={story.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative group">
                             <button onClick={() => deleteStory(story.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Trash2 size={16} />
                             </button>
                             <textarea 
                                 className="w-full bg-transparent text-white border-none focus:ring-0 p-0 mb-3 resize-none text-base font-medium placeholder-slate-600"
                                 placeholder={t.storyPlaceholder}
                                 rows={3}
                                 value={story.text}
                                 onChange={e => updateStory(story.id, 'text', e.target.value)}
                             />
                             {story.action && (
                                 <div className="bg-slate-900/50 p-3 rounded text-sm space-y-1 mb-3">
                                     <div className="text-green-300"><span className="font-bold">Action:</span> {story.action}</div>
                                     <div className="text-blue-300"><span className="font-bold">Feeling:</span> {story.feeling}</div>
                                     <div className="text-yellow-300"><span className="font-bold">Pattern:</span> {story.pattern}</div>
                                 </div>
                             )}
                             <button 
                                onClick={() => handleAnalyzeStory(story)}
                                disabled={analyzingStoryId === story.id}
                                className="text-xs bg-slate-900 hover:bg-slate-700 text-primary-400 px-3 py-1.5 rounded flex items-center gap-2 w-fit transition-colors"
                             >
                                {analyzingStoryId === story.id ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                {t.analyzeSuggest}
                             </button>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-800">
         <button 
            onClick={() => setView('phase2')}
            className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
         >
            {t.saveContinuePhase2} <ArrowRight size={18} />
         </button>
      </div>
    </div>
  );

  const renderPhase2View = () => (
      // ... (No changes in Phase 2)
      <div className="space-y-8 animate-fade-in max-w-4xl">
        <header className="flex justify-between items-start">
             <div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.phase2Title}</h2>
                <p className="text-slate-400 text-base">{t.phase2Subtitle}</p>
             </div>
             <button onClick={() => setShowDefinitions(!showDefinitions)} className="text-xs text-primary-400 hover:text-white flex items-center gap-1">
                 <Info size={14} /> {showDefinitions ? t.hideDefinitions : t.showDefinitions}
             </button>
        </header>

        {showDefinitions && (
            <div className="grid md:grid-cols-2 gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
                {t.definitions.map((d, i) => (
                    <div key={i}><strong className="text-white block mb-1">{d.term}</strong><span className="text-slate-400 text-sm">{d.def}</span></div>
                ))}
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
             <div className="space-y-6">
                 {/* Directional Intention */}
                 <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                     <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Compass className="text-purple-400"/> {t.directionalIntention}</h3>
                     <label className="block text-sm text-slate-400 mb-2">{t.yearlyThemeLabel}</label>
                     <div className="flex gap-2">
                         <input 
                             value={userData.yearlyTheme}
                             onChange={e => setUserData({...userData, yearlyTheme: e.target.value})}
                             placeholder={t.themePlaceholder}
                             className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                         />
                         <button 
                            onClick={handleSuggestTheme}
                            disabled={isSuggestingTheme}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded border border-slate-700"
                         >
                            {isSuggestingTheme ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                         </button>
                     </div>
                 </div>

                 {/* Boundary Check */}
                 <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                     <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><ShieldCheck className="text-red-400"/> {t.boundaryCheck}</h3>
                     <div className="space-y-4">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t.drainingPattern}</label>
                             <textarea 
                                 value={userData.drainingPatterns[0] || ""}
                                 onChange={e => {
                                     const newD = [...userData.drainingPatterns];
                                     newD[0] = e.target.value;
                                     setUserData({...userData, drainingPatterns: newD});
                                 }}
                                 placeholder={t.drainingPatternHelp}
                                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm"
                                 rows={2}
                             />
                         </div>
                         <div>
                             <div className="flex justify-between items-center mb-1">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t.reframedBoundary}</label>
                                 <button onClick={handleSuggestBoundary} className="text-xs text-primary-400 hover:text-white flex items-center gap-1">
                                     {suggestingBoundary ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} {t.suggestIdeas}
                                 </button>
                             </div>
                             
                             {boundarySuggestions.length > 0 && (
                                 <div className="mb-3 space-y-2">
                                     {boundarySuggestions.map((s, i) => (
                                         <button key={i} onClick={() => applyBoundarySuggestion(s)} className="block w-full text-left text-xs bg-slate-800 hover:bg-slate-700 p-2 rounded text-slate-300 border border-slate-700">
                                             {s}
                                         </button>
                                     ))}
                                 </div>
                             )}

                             <textarea 
                                 value={userData.reframedBoundaries[0] || ""}
                                 onChange={e => {
                                     const newB = [...userData.reframedBoundaries];
                                     newB[0] = e.target.value;
                                     setUserData({...userData, reframedBoundaries: newB});
                                 }}
                                 placeholder={t.reframedBoundaryHelp}
                                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm"
                                 rows={2}
                             />
                         </div>
                     </div>
                 </div>
             </div>

             <div className="space-y-6">
                  {/* Candidates */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <h3 className="font-semibold text-white mb-4">{t.candidateAnchors}</h3>
                       <div className="flex flex-wrap gap-2">
                           {userData.assessmentStrengths.filter(Boolean).map((s, i) => (
                               <button 
                                  key={i} 
                                  onClick={() => selectCandidateToAnchor(s)}
                                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-sm transition-colors"
                               >
                                   + {s}
                               </button>
                           ))}
                           {userData.externalStories.filter(s => s.pattern).map((s, i) => (
                               <button 
                                  key={`s-${i}`} 
                                  onClick={() => selectCandidateToAnchor(s.pattern!)}
                                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-sm transition-colors"
                               >
                                   + {s.pattern}
                               </button>
                           ))}
                       </div>
                  </div>

                  {/* Core Anchors */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                      <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Anchor className="text-yellow-500" /> {t.finalAnchors}</h3>
                      <p className="text-sm text-slate-400 mb-4">{t.finalAnchorsDesc}</p>
                      
                      <div className="space-y-3">
                          {userData.coreAnchors.map((anchor, i) => (
                              <div key={i} className="flex gap-2">
                                  <div className="flex items-center justify-center w-8 text-slate-500 font-bold text-sm">{i+1}</div>
                                  <input 
                                      value={anchor}
                                      onChange={e => updateAnchor(i, e.target.value)}
                                      placeholder={`${t.anchorPlaceholder}${i+1}`}
                                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-medium"
                                  />
                                  {anchor && (
                                      <button onClick={() => updateAnchor(i, "")} className="text-slate-600 hover:text-white">
                                          <X size={16} />
                                      </button>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
             </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-800">
             <button 
                onClick={() => setView('phase3')}
                className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
             >
                {t.proceedPhase3} <ArrowRight size={18} />
             </button>
        </div>
      </div>
  );

  const renderPhase3View = () => (
      // ... (No changes in Phase 3)
      <div className="space-y-8 animate-fade-in max-w-4xl">
           <div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.phase3Title}</h2>
                <p className="text-slate-400 text-base">{t.phase3Subtitle}</p>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-white text-lg">{t.shiftAction}</h3>
                    <button onClick={addShift} className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <Plus size={16} /> {t.addNewShift}
                    </button>
                </div>
                
                <div className="space-y-6">
                    {userData.shifts.length === 0 && <div className="text-center text-slate-600 py-8 italic">{t.noActiveShifts}</div>}
                    {userData.shifts.map((shift, index) => (
                        <div key={shift.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
                             <button onClick={() => deleteShift(shift.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-400">
                                 <Trash2 size={18} />
                             </button>
                             <div className="grid md:grid-cols-2 gap-6">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.territory}</label>
                                     <select 
                                        value={shift.territory}
                                        onChange={e => updateShift(shift.id, 'territory', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white mb-4"
                                     >
                                         {Object.entries(t.territoryOptions).map(([k, v]) => (
                                             <option key={k} value={k}>{v}</option>
                                         ))}
                                     </select>

                                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.poweringAnchor}</label>
                                     <select 
                                        value={shift.anchorId}
                                        onChange={e => updateShift(shift.id, 'anchorId', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                     >
                                         <option value="">{t.selectAnchor}</option>
                                         {userData.coreAnchors.filter(Boolean).map(a => (
                                             <option key={a} value={a}>{a}</option>
                                         ))}
                                     </select>
                                 </div>
                                 <div className="flex flex-col">
                                      <div className="flex justify-between items-center mb-2">
                                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t.practicePlaceholder}</label>
                                          <button 
                                             onClick={() => handleSuggestShifts(shift.id, shift.territory, shift.anchorId)}
                                             className="text-xs text-primary-400 hover:text-white flex items-center gap-1"
                                          >
                                              {suggestingShiftId === shift.id ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} {t.suggestIdeas}
                                          </button>
                                      </div>
                                      
                                      {shiftSuggestions[shift.id] && (
                                          <div className="mb-3 space-y-2 bg-slate-900 p-3 rounded border border-slate-700">
                                              <p className="text-xs text-slate-400 mb-2">{t.selectIdea}</p>
                                              {shiftSuggestions[shift.id].map((s, i) => (
                                                  <button key={i} onClick={() => applySuggestion(shift.id, s)} className="block w-full text-left text-sm text-slate-200 hover:text-white hover:bg-slate-800 p-2 rounded transition-colors">
                                                      • {s}
                                                  </button>
                                              ))}
                                          </div>
                                      )}

                                      <textarea 
                                          value={shift.practice}
                                          onChange={e => updateShift(shift.id, 'practice', e.target.value)}
                                          className="flex-1 w-full bg-slate-900 border border-slate-700 rounded p-3 text-white resize-none"
                                          placeholder="e.g. Before I speak in meetings, I will write down one bullet point."
                                      />
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
           </div>
           
           <div className="flex justify-end pt-6 border-t border-slate-800">
                <button 
                    onClick={() => setView('dashboard')}
                    className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-500 transition-colors flex items-center gap-2"
                >
                    {t.goToDashboard} <ArrowRight size={18} />
                </button>
           </div>
      </div>
  );

  const renderDashboardView = () => (
      <div className="space-y-8 animate-fade-in max-w-4xl">
           <div>
               <h2 className="text-2xl font-bold text-white mb-2">{t.dailyDashboard}</h2>
               <p className="text-slate-400 text-base">{t.consistentSteps}</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Log Entry Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Zap className="text-yellow-400" fill="currentColor"/> {t.todaysLog}</h3>
                        
                        <div className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.anchorUsed}</label>
                                 <select 
                                     value={todayLog.anchor}
                                     onChange={e => setTodayLog({...todayLog, anchor: e.target.value})}
                                     className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white"
                                 >
                                     <option value="">{t.selectAnchor}</option>
                                     {userData.coreAnchors.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                                 </select>
                             </div>
                             
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.reflectionShifted}</label>
                                 <textarea 
                                     value={todayLog.reflection}
                                     onChange={e => setTodayLog({...todayLog, reflection: e.target.value})}
                                     className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white h-24 resize-none"
                                     placeholder="..."
                                 />
                             </div>

                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t.energyLabel}</label>
                                 <div className="flex justify-between items-center bg-slate-950 p-2 rounded-full border border-slate-700">
                                      <span className="text-xs text-slate-400 pl-3">{t.energyLow}</span>
                                      <div className="flex gap-2">
                                          {[1,2,3,4,5].map(n => (
                                              <button 
                                                 key={n}
                                                 onClick={() => setTodayLog({...todayLog, energy: n})}
                                                 className={`w-8 h-8 rounded-full font-bold text-sm transition-all ${
                                                     todayLog.energy === n 
                                                     ? 'bg-primary-600 text-white shadow-lg scale-110' 
                                                     : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                                 }`}
                                              >
                                                  {n}
                                              </button>
                                          ))}
                                      </div>
                                      <span className="text-xs text-slate-400 pr-3">{t.energyHigh}</span>
                                 </div>
                             </div>
                             
                             <button 
                                 onClick={handleLogSubmit}
                                 disabled={isLogging || !todayLog.anchor || !todayLog.reflection}
                                 className="w-full bg-white text-primary-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                             >
                                 {isLogging ? <Loader2 className="animate-spin"/> : <CheckCircle2 />}
                                 {t.logEntry}
                             </button>
                        </div>
                    </div>
                    
                    {lastSpark && (
                        <div className="bg-indigo-900/30 border border-indigo-500/30 p-6 rounded-xl animate-fade-in">
                            <h4 className="text-indigo-300 font-bold text-sm mb-2 flex items-center gap-2"><Sparkles size={16}/> {t.strengthSpark}</h4>
                            <p className="text-white text-lg font-medium leading-relaxed">"{lastSpark}"</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                         <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4">{t.activeShifts}</h3>
                         {userData.shifts.length === 0 && <p className="text-slate-600 text-sm italic">{t.noActiveShifts}</p>}
                         <ul className="space-y-3">
                             {userData.shifts.slice(0, 3).map(s => (
                                 <li key={s.id} className="text-sm text-slate-300 border-l-2 border-primary-500 pl-3 py-1">
                                     {s.practice}
                                 </li>
                             ))}
                         </ul>
                         <button onClick={() => setView('phase3')} className="mt-4 text-primary-400 text-xs hover:text-white">{t.editShifts} &rarr;</button>
                     </div>

                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                         <div className="flex justify-between items-end mb-2">
                             <div className="text-4xl font-bold text-white">{userData.dailyLogs.length}</div>
                             <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">{t.totalEntries}</div>
                         </div>
                         <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500" style={{ width: `${Math.min(userData.dailyLogs.length * 2, 100)}%` }}></div>
                         </div>
                     </div>
                </div>
           </div>

           <div className="pt-8 border-t border-slate-800">
               <h3 className="font-bold text-white mb-6 flex items-center gap-2"><History size={20}/> {t.recentEntries}</h3>
               <div className="space-y-4">
                   {userData.dailyLogs.length === 0 && <p className="text-slate-500">{t.noEntries}</p>}
                   {userData.dailyLogs.slice(0, 5).map(log => (
                       <div key={log.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex gap-4">
                           <div className="flex flex-col items-center justify-center bg-slate-800 w-16 h-16 rounded-lg border border-slate-700 shrink-0">
                               <span className="text-xs text-slate-400">{new Date(log.date).getDate()}</span>
                               <span className="text-xs font-bold text-slate-300">{new Date(log.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                           </div>
                           <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <span className="bg-primary-900/50 text-primary-300 text-xs px-2 py-0.5 rounded border border-primary-500/20">{log.anchorUsed}</span>
                                   <div className="flex">{[...Array(log.energyLevel)].map((_, i) => <Zap key={i} size={12} className="text-yellow-500" fill="currentColor"/>)}</div>
                               </div>
                               <p className="text-slate-300 text-sm leading-relaxed">{log.reflection}</p>
                               {log.aiFeedback && (
                                   <div className="mt-2 text-indigo-300 text-xs flex gap-1 items-start">
                                       <Sparkles size={12} className="mt-0.5 shrink-0"/> {log.aiFeedback}
                                   </div>
                               )}
                           </div>
                       </div>
                   ))}
               </div>
           </div>
      </div>
  );

  const renderWeeklyView = () => (
      <div className="space-y-8 animate-fade-in max-w-4xl">
           <header className="flex justify-between items-end">
               <div>
                   <h2 className="text-2xl font-bold text-white mb-2">{t.weeklyTitle}</h2>
                   <p className="text-slate-400 text-base">{t.weeklyContext}</p>
               </div>
               <button 
                  onClick={handleAutoDraft} 
                  disabled={isSummarizing || userData.dailyLogs.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                   {isSummarizing ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} {t.autoDraft}
               </button>
           </header>
           
           <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-6">
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <label className="block text-sm font-bold text-green-400 mb-2">{t.winsLabel}</label>
                       <textarea 
                           value={weeklyData.wins}
                           onChange={e => setWeeklyData({...weeklyData, wins: e.target.value})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-32"
                           placeholder="..."
                       />
                   </div>
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <label className="block text-sm font-bold text-red-400 mb-2">{t.challengesLabel}</label>
                       <textarea 
                           value={weeklyData.challenges}
                           onChange={e => setWeeklyData({...weeklyData, challenges: e.target.value})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-32"
                           placeholder="..."
                       />
                   </div>
               </div>
               
               <div className="space-y-6">
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <label className="block text-sm font-bold text-purple-400 mb-2">{t.themeLabel}</label>
                       <input 
                           value={weeklyData.theme}
                           onChange={e => setWeeklyData({...weeklyData, theme: e.target.value})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                           placeholder={t.weeklyThemePlaceholder}
                       />
                   </div>
                   
                   {/* Context Data */}
                   <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t.contextLast7Days}</h4>
                       {userData.dailyLogs.slice(0,7).length === 0 ? (
                           <p className="text-slate-500 text-sm">{t.noLogsThisWeek}</p>
                       ) : (
                           <ul className="space-y-2">
                               {userData.dailyLogs.slice(0, 7).map(l => (
                                   <li key={l.id} className="text-xs text-slate-300 flex justify-between">
                                       <span className="truncate max-w-[70%]">{l.reflection.substring(0, 40)}...</span>
                                       <span className={`px-1.5 rounded ${l.energyLevel >= 4 ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>E: {l.energyLevel}</span>
                                   </li>
                               ))}
                           </ul>
                       )}
                   </div>
                   
                   <button 
                       onClick={saveWeeklyReflection}
                       disabled={!weeklyData.wins}
                       className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                   >
                       <Save size={18} /> {t.saveAndAnalyze}
                   </button>
               </div>
           </div>
      </div>
  );

  const renderQuarterlyView = () => (
      // ... (No changes in Quarterly)
      <div className="space-y-8 animate-fade-in max-w-4xl">
           <header>
               <h2 className="text-2xl font-bold text-white mb-2">{t.quarterlyTitle}</h2>
               <p className="text-slate-400 text-base">{t.quarterlyDesc}</p>
           </header>

           {/* Rewind Stats */}
           <div className="grid grid-cols-3 gap-4 mb-8">
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                   <div className="text-2xl font-bold text-white">{userData.dailyLogs.length}</div>
                   <div className="text-xs text-slate-500 uppercase tracking-wider">{t.totalLogs}</div>
               </div>
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                   <div className="text-2xl font-bold text-white">{userData.weeklyReflections.length}</div>
                   <div className="text-xs text-slate-500 uppercase tracking-wider">{t.weekly}</div>
               </div>
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                   <div className="text-2xl font-bold text-green-400">
                       {userData.dailyLogs.length > 0 ? (userData.dailyLogs.reduce((a,b) => a + b.energyLevel, 0) / userData.dailyLogs.length).toFixed(1) : '-'}
                   </div>
                   <div className="text-xs text-slate-500 uppercase tracking-wider">{t.avgEnergy}</div>
               </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-6">
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <label className="block text-sm font-bold text-slate-300 mb-2">{t.q_shifted}</label>
                       <textarea 
                           value={quarterlyData.shifted}
                           onChange={e => setQuarterlyData({...quarterlyData, shifted: e.target.value})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none"
                           placeholder={t.q_shifted_help}
                       />
                   </div>
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <label className="block text-sm font-bold text-slate-300 mb-2">{t.q_flow}</label>
                       <textarea 
                           value={quarterlyData.creatingFlow}
                           onChange={e => setQuarterlyData({...quarterlyData, creatingFlow: e.target.value})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none"
                           placeholder={t.q_flow_help}
                       />
                   </div>
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <label className="block text-sm font-bold text-slate-300 mb-2">{t.q_adjust}</label>
                       <textarea 
                           value={quarterlyData.needsAdjustment}
                           onChange={e => setQuarterlyData({...quarterlyData, needsAdjustment: e.target.value})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none"
                           placeholder={t.q_adjust_help}
                       />
                   </div>
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                       <label className="block text-sm font-bold text-slate-300 mb-2">{t.q_emerging}</label>
                       <textarea 
                           value={quarterlyData.emerging}
                           onChange={e => setQuarterlyData({...quarterlyData, emerging: e.target.value})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none"
                           placeholder={t.q_emerging_help}
                       />
                   </div>

                   <button 
                       onClick={saveAndAnalyzeQuarterly}
                       disabled={isAnalyzingQuarter || !quarterlyData.shifted}
                       className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                   >
                       {isAnalyzingQuarter ? <Loader2 className="animate-spin" /> : <BarChart />} {t.saveAndAnalyze}
                   </button>
               </div>

               {/* Analysis Result */}
               <div className="space-y-6">
                    {latestQuarterlyAnalysis ? (
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-900/40 border border-indigo-500/30 p-8 rounded-xl animate-fade-in relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={60}/></div>
                             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Sparkles className="text-indigo-400"/> {t.strategicOutlook}</h3>
                             
                             <div className="space-y-6">
                                 <div>
                                     <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">{t.themesObserved}</h4>
                                     <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm">
                                         {latestQuarterlyAnalysis.themes.map((th, i) => <li key={i}>{th}</li>)}
                                     </ul>
                                 </div>
                                 <div>
                                     <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-2">{t.growthTrajectory}</h4>
                                     <p className="text-slate-200 text-sm leading-relaxed">{latestQuarterlyAnalysis.growthTrajectory}</p>
                                 </div>
                                 <div>
                                     <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-2">{t.nextQuarterFocus}</h4>
                                     <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg text-yellow-100 text-lg font-medium text-center">
                                         "{latestQuarterlyAnalysis.nextQuarterFocus}"
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl h-full flex items-center justify-center text-slate-500 p-8 text-center">
                            {t.saveAndAnalyze} to see AI Strategic Outlook here.
                        </div>
                    )}

                    {userData.quarterlyCheckIns.length > 0 && (
                        <div className="pt-8 border-t border-slate-800">
                             <h3 className="font-bold text-white mb-4">{t.pastCheckIns}</h3>
                             <div className="space-y-3">
                                 {userData.quarterlyCheckIns.map(q => (
                                     <div key={q.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="text-sm font-bold text-white">{new Date(q.date).toLocaleDateString()}</span>
                                             {q.aiAnalysis && <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded">{t.analyzedTag}</span>}
                                         </div>
                                         <p className="text-slate-400 text-xs truncate">{q.shifted}</p>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
               </div>
           </div>
      </div>
  );

  return (
    <Layout currentView={view} setView={setView} language={language} setLanguage={setLanguage}>
      {view === 'welcome' && renderWelcomeView()}
      {view === 'discovery' && renderDiscoveryView()}
      {view === 'phase1' && renderPhase1View()}
      {view === 'phase2' && renderPhase2View()}
      {view === 'phase3' && renderPhase3View()}
      {view === 'dashboard' && renderDashboardView()}
      {view === 'weekly' && renderWeeklyView()}
      {view === 'quarterly' && renderQuarterlyView()}
      
      <Coach 
        userData={userData} 
        setUserData={setUserData} 
        language={language}
        triggerPrompt={coachTrigger}
        onCloseTrigger={() => setCoachTrigger(undefined)}
        currentView={view}
        onViewChange={setView}
        onNotify={showNotification}
      />
      
      {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl border border-slate-700 animate-fade-in-up z-50 flex items-center gap-2">
              <CheckCircle2 className="text-primary-500" size={20} />
              {notification}
          </div>
      )}
    </Layout>
  );
}