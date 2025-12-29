
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
  QuarterlyCheckIn
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
  MessageCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

export default function App() {
  // --- State ---
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('inkspire_strength_data');
    return saved ? JSON.parse(saved) : INITIAL_USER_DATA;
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
      const existing = userData.assessmentStrengths.filter(Boolean);
      if (existing.length > 0) {
          setSelectedDiscoveryStrengths(existing);
      }
  }, []);

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

  // --- Render Views ---

  // ... (renderWelcomeView, renderDiscoveryView, renderPhase1View, renderPhase2View, renderPhase3View, renderDashboardView omitted for brevity as they are unchanged) ...
  // Re-declare them here for context of the file structure, assuming they exist as defined in previous turns.
  const renderWelcomeView = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-br from-primary-600 to-indigo-800 p-8 rounded-2xl shadow-xl text-white">
        <h2 className="text-3xl font-bold mb-4">{t.welcomeTitle}</h2>
        <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
          {t.welcomeDesc}
        </p>
        <button 
          onClick={() => setView('discovery')}
          className="mt-8 bg-white text-primary-600 px-6 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
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
                <p className="text-slate-400">{t.discoverySubtitle}</p>
            </div>
            
            {/* Audience Toggle */}
            <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-3 border border-slate-700">
                 <span className="text-xs text-slate-300 font-medium">{t.bnoContextToggle}</span>
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
                                    <div 
                                        onClick={startJourney}
                                        className="bg-slate-800/50 aspect-video rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/50 hover:bg-slate-800 transition-all group flex-1"
                                    >
                                         <Play className="text-slate-600 group-hover:text-primary-400 mb-4" size={48} />
                                         <span className="text-lg text-white font-medium mb-2">{t.drawCard}</span>
                                         <p className="text-sm text-slate-500 text-center max-w-xs">{t.journeyIntro}</p>
                                    </div>
                                    
                                    {/* Interactive Mode Button */}
                                    <button 
                                        onClick={handleStartCoachJourney}
                                        className="bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-500/30 text-indigo-200 p-4 rounded-xl flex items-center gap-3 transition-all"
                                    >
                                        <div className="bg-indigo-500/20 p-2 rounded-full"><MessageCircle size={20} className="text-indigo-400"/></div>
                                        <div className="text-left">
                                            <div className="font-semibold text-sm">Guided Dialogue Mode</div>
                                            <div className="text-xs text-indigo-300/70">Discuss your journey with the AI Coach</div>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in space-y-4 flex-1 flex flex-col">
                                    {/* Progress Bar */}
                                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-1">
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
                                            className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-primary-500 mb-3 leading-relaxed resize-none"
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
                                    <span className="text-xs uppercase font-bold text-primary-400 tracking-wider">{t.sparkPrompt} {promptIndex + 1}/{t.prompts.length}</span>
                                    <button 
                                        onClick={nextPrompt} 
                                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded transition-colors"
                                    >
                                        {t.next} <ChevronRight size={12} />
                                    </button>
                                </div>
                                <p className="text-slate-200 font-medium leading-relaxed min-h-[3rem]">
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
                                    <div className="font-semibold text-sm">Interactive Strength Spotter</div>
                                    <div className="text-xs text-indigo-300/70">Let the AI interview you</div>
                                </div>
                            </button>

                            <div className="mt-auto flex-1 flex flex-col relative">
                                <div className="flex justify-between items-center mb-2">
                                     <p className="text-sm text-slate-500">{t.jotDown}</p>
                                </div>
                                
                                <textarea 
                                    value={discoveryReflection}
                                    onChange={(e) => setDiscoveryReflection(e.target.value)}
                                    className="w-full flex-1 bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-primary-500 mb-3 leading-relaxed resize-none"
                                />
                                <button 
                                    onClick={handleSingleDiscoverySubmit}
                                    disabled={isDiscovering || !discoveryReflection}
                                    className="bg-slate-800 hover:bg-slate-700 text-primary-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 w-full justify-center border border-slate-700"
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
                            <div key={i} className="flex justify-between items-center bg-primary-600/20 border border-primary-500/30 px-3 py-2 rounded-lg text-white">
                                <span>{i+1}. {s}</span>
                                <button onClick={() => toggleDiscoveryStrength(s)} className="text-slate-400 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {[...Array(5 - selectedDiscoveryStrengths.length)].map((_, i) => (
                             <div key={i} className="border border-dashed border-slate-800 px-3 py-2 rounded-lg text-slate-600 text-sm">
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
                            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
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
                className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {t.saveStartPhase1} <ArrowRight size={18} />
             </button>
        </div>
      </div>
    );
  };
  const renderPhase1View = () => (
    <div className="space-y-8 max-w-3xl">
      <header className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">{t.phase1Title}</h2>
        <p className="text-slate-400">{t.phase1Subtitle}</p>
      </header>
      
      {/* Assessment Results */}
      <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center gap-2">
          <Award size={20} /> {t.top5Hypothesis}
        </h3>
        <div className="grid gap-3">
          {userData.assessmentStrengths.map((str, idx) => (
            <input
              key={idx}
              type="text"
              value={str}
              onChange={(e) => updateAssessmentStrength(idx, e.target.value)}
              placeholder={`${t.strengthPlaceholder}${idx + 1}`}
              className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          ))}
        </div>
      </section>

      {/* WEIGH: Mining the Past (Internal Audit) */}
      <section className="bg-slate-900 p-8 rounded-xl border border-slate-800">
         <div className="flex items-center gap-2 mb-2 text-primary-400">
            <Scale size={20} />
            <h3 className="text-lg font-semibold">{t.miningPastTitle}</h3>
         </div>
         <p className="text-sm text-slate-500 mb-6">{t.miningPastDesc}</p>

         <div className="grid md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium text-white mb-1">{t.momentumLabel}</label>
               <p className="text-xs text-slate-500 mb-2">{t.momentumHelp}</p>
               <textarea 
                  value={userData.internalAudit?.momentum || ''}
                  onChange={(e) => setUserData({...userData, internalAudit: {...userData.internalAudit, momentum: e.target.value}})}
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-white mb-1">{t.drainingLabel}</label>
               <p className="text-xs text-slate-500 mb-2">{t.drainingHelp}</p>
               <textarea 
                  value={userData.internalAudit?.draining || ''}
                  onChange={(e) => setUserData({...userData, internalAudit: {...userData.internalAudit, draining: e.target.value}})}
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500"
               />
            </div>
         </div>
      </section>

      {/* ASSESS: External Stories */}
      <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary-400">{t.assessTitle}</h3>
          <button onClick={addStory} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <Plus size={16} /> {t.addStory}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {t.askPeople}
        </p>
        
        <div className="space-y-6">
          {userData.externalStories.map((story, idx) => (
            <div key={story.id} className="relative group">
              <textarea
                value={story.text}
                onChange={(e) => updateStory(story.id, 'text', e.target.value)}
                placeholder={t.storyPlaceholder}
                className="w-full h-24 bg-slate-800 border border-slate-700 text-white p-4 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
              <button 
                onClick={() => deleteStory(story.id)}
                className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {userData.externalStories.length === 0 && (
            <div className="text-center py-8 text-slate-600 border-2 border-dashed border-slate-800 rounded-lg">
              {t.noStoriesYet}
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end pt-6">
        <button 
          onClick={() => { showNotification(t.notifications.progressSaved); setView('phase2'); }}
          className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
        >
          {t.saveContinuePhase2} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
  const renderPhase2View = () => {
    // Gather candidate anchors from Phase 1 strengths and story patterns
    const candidateAnchors = Array.from(new Set([
        ...userData.assessmentStrengths.filter(s => s && s.length > 0),
        ...userData.externalStories.map(s => s.pattern).filter(p => p && p.length > 0)
    ]));

    return (
    <div className="space-y-8">
      <header className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">{t.phase2Title}</h2>
        <p className="text-slate-400">{t.phase2Subtitle}</p>
        
        {/* Definition Toggle */}
        <button 
          onClick={() => setShowDefinitions(!showDefinitions)}
          className="mt-4 text-sm text-primary-400 flex items-center gap-2 hover:text-primary-300"
        >
          <BookOpen size={16} />
          {showDefinitions ? t.hideDefinitions : t.showDefinitions}
        </button>

        {/* Definitions Panel */}
        {showDefinitions && (
          <div className="mt-4 bg-slate-800/50 p-6 rounded-xl border border-slate-700 grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
             {t.definitions.map((def, i) => (
               <div key={i}>
                 <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide text-primary-500">{def.term}</h4>
                 <p className="text-xs text-slate-300 leading-relaxed">{def.def}</p>
               </div>
             ))}
          </div>
        )}
      </header>

      {/* Directional Intention */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-900/30 p-6 rounded-xl border border-slate-700">
           <h3 className="text-lg font-semibold text-white mb-2">{t.directionalIntention}</h3>
           
           <div className="flex flex-col md:flex-row gap-6 mb-4">
               {/* Phase 1 Bridge */}
               <div className="md:w-1/3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                   <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">{t.phase1Insight}</h4>
                   <div className="flex flex-wrap gap-2">
                       {userData.assessmentStrengths.filter(Boolean).length > 0 ? (
                           userData.assessmentStrengths.filter(Boolean).map(s => (
                               <span key={s} className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{s}</span>
                           ))
                       ) : (
                           <span className="text-xs text-slate-500 italic">{t.noPhase1Strengths}</span>
                       )}
                   </div>
               </div>
               
               {/* Input Area */}
               <div className="md:w-2/3">
                   <label className="block text-sm text-primary-300 mb-1">{t.yearlyThemeLabel}</label>
                   <p className="text-xs text-slate-400 mb-3">{t.yearlyThemeHelp}</p>
                   
                   <div className="flex gap-2">
                       <input 
                          type="text"
                          value={userData.yearlyTheme || ''}
                          onChange={(e) => setUserData({...userData, yearlyTheme: e.target.value})}
                          className="flex-1 bg-slate-900 border border-slate-600 text-white rounded p-3 focus:ring-2 focus:ring-primary-500 font-medium text-lg"
                          placeholder={t.themePlaceholder}
                       />
                       <button
                         onClick={handleSuggestTheme}
                         disabled={isSuggestingTheme}
                         className="bg-primary-600/20 hover:bg-primary-600/40 text-primary-400 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                         title={t.suggestTheme}
                       >
                           {isSuggestingTheme ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20} />}
                       </button>
                   </div>
               </div>
           </div>
      </section>

      {/* Story Deconstruction */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-white">{t.deconstruct}</h3>
        {userData.externalStories.length === 0 && <p className="text-yellow-500">{t.phase1StoriesReq}</p>}
        
        <div className="grid md:grid-cols-2 gap-6">
          {userData.externalStories.map((story, idx) => (
            <div key={story.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="relative">
                 <div className="text-sm text-slate-400 italic mb-2 border-l-2 border-primary-500 pl-3 pr-8">
                    "{story.text.substring(0, 100)}..."
                 </div>
                 {/* Smart Analysis Button */}
                 <button 
                    onClick={() => handleAnalyzeStory(story)}
                    disabled={analyzingStoryId === story.id}
                    className="absolute top-0 right-0 text-primary-400 hover:text-primary-300 disabled:opacity-50"
                    title="Auto-analyze with AI"
                 >
                    {analyzingStoryId === story.id ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
                 </button>
              </div>
              
              <div>
                <label className="text-xs uppercase font-bold text-slate-500">{t.echoCheck}</label>
                <div className="flex gap-2 mt-1">
                  {[t.yes, t.no, t.mostly].map(opt => (
                    <button
                      key={opt}
                      onClick={() => updateStory(story.id, 'echoCheck', opt as any)}
                      className={`px-3 py-1 rounded text-sm border ${
                        story.echoCheck === opt 
                          ? 'bg-primary-600 border-primary-600 text-white' 
                          : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                 <div className="relative">
                    <input 
                        placeholder={t.actionPlaceholder}
                        value={story.action || ''}
                        onChange={(e) => updateStory(story.id, 'action', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                 </div>
                 <input 
                    placeholder={t.feelingPlaceholder}
                    value={story.feeling || ''}
                    onChange={(e) => updateStory(story.id, 'feeling', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                 />
                 <input 
                    placeholder={t.patternPlaceholder}
                    value={story.pattern || ''}
                    onChange={(e) => updateStory(story.id, 'pattern', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                 />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Boundary Check - BRIDGED */}
      <section className="bg-slate-900 p-8 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
            <BatteryWarning size={20} />
            {t.boundaryCheck}
        </h3>
        <p className="text-slate-400 mb-6 max-w-2xl">{t.boundaryCheckIntro}</p>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Context from Phase 1 */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Info size={16} /> {t.phase1Insight}
                </label>
                <div className="bg-slate-900 p-4 rounded text-sm text-slate-400 italic mb-4 min-h-[4rem]">
                    "{userData.internalAudit.draining || t.noDrainIdentified}"
                </div>
                
                <label className="block text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} /> {t.drainingPattern}
                </label>
                <textarea 
                    value={userData.drainingPatterns[0] || ''}
                    onChange={(e) => {
                        const newP = [...userData.drainingPatterns];
                        newP[0] = e.target.value;
                        setUserData({...userData, drainingPatterns: newP});
                    }}
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-red-500 outline-none placeholder:text-slate-600"
                    placeholder={t.drainingPatternHelp}
                />
            </div>
            
            {/* Reframe Column */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-green-500/20 flex flex-col relative">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-green-300 flex items-center gap-2">
                        <ShieldCheck size={16} /> {t.reframedBoundary}
                    </label>
                    <button 
                        onClick={handleSuggestBoundary}
                        disabled={suggestingBoundary}
                        className="text-xs bg-green-900/40 text-green-400 hover:text-green-300 px-2 py-1 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                        {suggestingBoundary ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12} />}
                        {t.suggestBoundary}
                    </button>
                </div>
                
                {boundarySuggestions.length > 0 && (
                    <div className="mb-3 flex flex-col gap-2 p-3 bg-slate-900 rounded-lg border border-slate-700 animate-fade-in">
                         <span className="text-xs text-slate-500 flex items-center gap-1"><Lightbulb size={12}/> {t.selectBoundary}</span>
                         {boundarySuggestions.map((s, i) => (
                             <button 
                                key={i} 
                                onClick={() => applyBoundarySuggestion(s)}
                                className="text-left text-sm text-slate-200 hover:bg-slate-800 p-2 rounded transition-colors border border-transparent hover:border-slate-600"
                             >
                                {s}
                             </button>
                         ))}
                    </div>
                )}

                <div className="mb-4">
                     <p className="text-xs text-slate-400 mb-2" dangerouslySetInnerHTML={{ __html: t.boundaryDescription }}></p>
                </div>
                <textarea 
                    value={userData.reframedBoundaries[0] || ''}
                    onChange={(e) => {
                        const newB = [...userData.reframedBoundaries];
                        newB[0] = e.target.value;
                        setUserData({...userData, reframedBoundaries: newB});
                    }}
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-green-500 outline-none placeholder:text-slate-600 mt-auto"
                    placeholder={t.reframedBoundaryHelp}
                />
            </div>
        </div>
      </section>

      {/* Final Anchors - SYNTHESIS BOARD */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-850 p-8 rounded-xl border border-primary-500/30">
        <h3 className="text-lg font-semibold text-primary-400 mb-2 flex items-center gap-2">
            <Anchor size={20} />
            {t.finalAnchors}
        </h3>
        
        {/* Anchor Education Block */}
        <div className="bg-primary-900/20 border-l-4 border-primary-500 p-4 mb-6 rounded-r">
             <h4 className="font-bold text-white text-sm mb-1">{t.whatIsAnchor}</h4>
             <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                 {t.anchorDefinition}
             </p>
             <p className="text-xs text-primary-300 italic">
                 {t.anchorContext}
             </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Candidates */}
            <div>
                 <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">{t.candidateAnchors}</h4>
                 <p className="text-xs text-slate-500 mb-4">{t.candidateAnchorsHelp}</p>
                 <div className="flex flex-wrap gap-2">
                     {candidateAnchors.map((cand, i) => (
                         <button
                            key={i}
                            onClick={() => selectCandidateToAnchor(cand || '')}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary-500 text-sm px-3 py-2 rounded-lg transition-colors text-left"
                         >
                             {cand}
                         </button>
                     ))}
                     {candidateAnchors.length === 0 && <span className="text-slate-600 text-sm italic">{t.noPatternsFound}</span>}
                 </div>
            </div>

            {/* Right: Core Anchors Inputs */}
            <div className="space-y-3">
                 {userData.coreAnchors.map((anchor, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                       <span className="text-slate-500 font-mono text-sm w-6">0{idx + 1}</span>
                       <input
                        type="text"
                        value={anchor}
                        onChange={(e) => updateAnchor(idx, e.target.value)}
                        placeholder={`${t.anchorPlaceholder}${idx + 1}`}
                        className="flex-1 bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-semibold"
                      />
                      {anchor && (
                          <button onClick={() => updateAnchor(idx, '')} className="text-slate-600 hover:text-red-400">
                              <X size={16} />
                          </button>
                      )}
                    </div>
                  ))}
            </div>
        </div>
      </section>

      <div className="flex justify-end pt-6">
        <button 
          onClick={() => { showNotification(t.notifications.anchorsLocked); setView('phase3'); }}
          className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
        >
          {t.proceedPhase3} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
  };
  const renderPhase3View = () => (
    <div className="space-y-8">
      <header className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">{t.phase3Title}</h2>
        <p className="text-slate-400">{t.phase3Subtitle}</p>
      </header>

      <div className="grid gap-6">
        {userData.shifts.map((shift, idx) => (
            <div key={shift.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative">
                <button 
                  onClick={() => deleteShift(shift.id)}
                  className="absolute top-4 right-4 text-slate-600 hover:text-red-500"
                >
                    <X size={18} />
                </button>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">{t.territory}</label>
                        <select 
                            value={shift.territory}
                            onChange={(e) => updateShift(shift.id, 'territory', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:ring-1 focus:ring-primary-500"
                        >
                             {TERRITORIES.map(tr => <option key={tr} value={tr}>{(t.territoryOptions as any)[tr] || tr}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">{t.poweringAnchor}</label>
                        <select 
                             value={shift.anchorId}
                             onChange={(e) => updateShift(shift.id, 'anchorId', e.target.value)}
                             className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:ring-1 focus:ring-primary-500"
                        >
                            <option value="">{t.selectAnchor}</option>
                            {userData.coreAnchors.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs uppercase font-bold text-primary-400">{t.shiftAction}</label>
                        <button 
                             onClick={() => handleSuggestShifts(shift.id, shift.territory, shift.anchorId)}
                             disabled={suggestingShiftId === shift.id || !shift.territory || !shift.anchorId}
                             className="text-xs flex items-center gap-1 text-primary-400 hover:text-primary-300 disabled:opacity-50"
                        >
                             {suggestingShiftId === shift.id ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}
                             {t.suggestIdeas}
                        </button>
                    </div>
                    
                    {/* Suggestions Area */}
                    {shiftSuggestions[shift.id] && (
                        <div className="mb-3 flex flex-col gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                             <span className="text-xs text-slate-500 flex items-center gap-1"><Lightbulb size={12}/> {t.selectIdea}</span>
                             {shiftSuggestions[shift.id].map((s, i) => (
                                 <button 
                                    key={i} 
                                    onClick={() => applySuggestion(shift.id, s)}
                                    className="text-left text-sm text-slate-200 hover:bg-slate-700 p-2 rounded transition-colors"
                                 >
                                    {s}
                                 </button>
                             ))}
                        </div>
                    )}

                    <input 
                        value={shift.practice}
                        onChange={(e) => updateShift(shift.id, 'practice', e.target.value)}
                        placeholder={t.practicePlaceholder}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>
        ))}

        <button 
            onClick={addShift}
            className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-primary-400 hover:border-primary-500/50 transition-colors flex justify-center items-center gap-2"
        >
            <Plus size={20} /> {t.addNewShift}
        </button>
      </div>

       <div className="flex justify-end pt-6">
        <button 
          onClick={() => { showNotification(t.notifications.systemReady); setView('dashboard'); }}
          className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
        >
          {t.goToDashboard} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
  const renderDashboardView = () => {
    // Process data for the momentum chart
    const data = userData.dailyLogs.slice(0, 14).reverse().map(log => ({
        name: new Date(log.date).toLocaleDateString(undefined, {weekday: 'short'}),
        energy: log.energyLevel || 3,
        anchor: log.anchorUsed
    }));

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{t.dailyDashboard}</h2>
                    <p className="text-slate-400 text-sm">{t.consistentSteps}</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-primary-400 flex items-center justify-end gap-2">
                         <Flame className={userData.dailyLogs.length > 0 ? "text-orange-500 animate-pulse" : "text-slate-700"} />
                         {userData.dailyLogs.length}
                    </div>
                    <div className="text-xs text-slate-500 uppercase">{t.totalEntries}</div>
                </div>
            </header>
            
            {/* Success Spark Overlay */}
            {lastSpark && (
                <div className="bg-gradient-to-r from-primary-900/80 to-indigo-900/80 p-6 rounded-xl border border-primary-500 flex items-start gap-4 animate-fade-in relative mb-6">
                    <div className="bg-primary-600 p-2 rounded-full mt-1">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <div>
                        <h4 className="text-primary-300 font-bold text-sm uppercase mb-1">{t.strengthSpark}</h4>
                        <p className="text-white text-lg font-medium italic">"{lastSpark}"</p>
                    </div>
                    <button onClick={() => setLastSpark(null)} className="absolute top-2 right-2 text-primary-400 hover:text-white"><X size={16}/></button>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Input */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Sun size={20} className="text-yellow-500" /> {t.todaysLog}
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">{t.anchorUsed}</label>
                            <select 
                                value={todayLog.anchor}
                                onChange={(e) => setTodayLog({...todayLog, anchor: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2"
                            >
                                <option value="">{t.selectAnchor}</option>
                                {userData.coreAnchors.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">{t.reflectionShifted}</label>
                            <textarea 
                                value={todayLog.reflection}
                                onChange={(e) => setTodayLog({...todayLog, reflection: e.target.value})}
                                className="w-full h-32 bg-slate-800 border border-slate-700 text-white rounded p-3 resize-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                        
                        {/* Energy Slider (Gamification) */}
                        <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span className="flex items-center gap-1"><BatteryWarning size={12}/> {t.energyLow}</span>
                                <span className="uppercase font-bold text-slate-400">{t.energyLabel}</span>
                                <span className="flex items-center gap-1 text-yellow-500"><Zap size={12}/> {t.energyHigh}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={todayLog.energy} 
                                onChange={(e) => setTodayLog({...todayLog, energy: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>

                        <button 
                            onClick={handleLogSubmit}
                            disabled={!todayLog.anchor || !todayLog.reflection || isLogging}
                            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                        >
                            {isLogging ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {t.logEntry}
                        </button>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Momentum Chart - UPDATED STRUCTURE */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-64 flex flex-col">
                         <h3 className="font-semibold text-white mb-4 text-sm uppercase text-slate-500 flex-none">{t.momentum}</h3>
                         <div className="flex-1 w-full min-h-0 min-w-0"> {/* Add min-w-0 to prevent flex blowout */}
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.length ? data : [{name: 'Today', energy: 0}]}>
                                    <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                    <Bar dataKey="energy" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                      {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.energy >= 4 ? '#fbbf24' : '#6366f1'} />
                                      ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>

                    {/* Active Shifts Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="font-semibold text-white mb-4 text-sm uppercase text-slate-500">{t.activeShifts}</h3>
                        <div className="space-y-3">
                            {userData.shifts.length > 0 ? userData.shifts.slice(0, 3).map(shift => (
                                <div key={shift.id} className="text-sm border-l-2 border-primary-500 pl-3">
                                    <div className="text-slate-200">{shift.practice}</div>
                                    <div className="text-xs text-slate-500 mt-1">{shift.territory}</div>
                                </div>
                            )) : <div className="text-slate-500 text-sm">{t.noActiveShifts}</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Logs with Spark Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">{t.recentEntries}</h3>
                <div className="space-y-4">
                    {userData.dailyLogs.length > 0 ? userData.dailyLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-primary-400 font-medium text-sm flex items-center gap-2">
                                    {log.anchorUsed}
                                    <span className="text-xs text-slate-500 font-normal px-2 py-0.5 bg-slate-800 rounded-full flex items-center gap-1">
                                        <Zap size={10} className={log.energyLevel >= 4 ? "text-yellow-500" : "text-slate-500"}/> {log.energyLevel}/5
                                    </span>
                                </span>
                                <span className="text-slate-500 text-xs">{new Date(log.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-300 text-sm mb-2">{log.reflection}</p>
                            {log.aiFeedback && (
                                <div className="bg-primary-900/20 p-2 rounded text-xs text-primary-300 italic flex items-start gap-2">
                                    <Sparkles size={12} className="mt-0.5 flex-shrink-0" />
                                    "{log.aiFeedback}"
                                </div>
                            )}
                        </div>
                    )) : <div className="text-slate-500 text-center py-4">{t.noEntries}</div>}
                </div>
            </div>
        </div>
    );
  };
  const renderWeeklyView = () => {
    // 1. Calculate Weekly Stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get recent logs for this week
    const recentLogs = userData.dailyLogs.filter(l => new Date(l.date) > sevenDaysAgo).reverse(); // Reverse to chronological for chart

    // Calculate Stats
    const totalLogs = recentLogs.length;
    const avgEnergy = totalLogs > 0 
        ? (recentLogs.reduce((acc, l) => acc + l.energyLevel, 0) / totalLogs).toFixed(1)
        : "0";
    
    // Find Top Anchor
    const anchorCounts: Record<string, number> = {};
    recentLogs.forEach(l => {
        anchorCounts[l.anchorUsed] = (anchorCounts[l.anchorUsed] || 0) + 1;
    });
    const topAnchor = Object.entries(anchorCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Chart Data
    const chartData = recentLogs.map(l => ({
        day: new Date(l.date).toLocaleDateString(undefined, {weekday: 'short'}),
        energy: l.energyLevel
    }));

    return (
      <div className="max-w-4xl mx-auto py-8 animate-fade-in">
          <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                  <div className="bg-slate-800 p-3 rounded-full">
                      <Calendar size={32} className="text-primary-500" />
                  </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{t.weeklyTitle}</h2>
          </div>

          {/* WEEKLY CONTEXT DASHBOARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Activity size={120} className="text-primary-500" />
               </div>

               <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                   <Activity size={20} className="text-primary-400" /> 
                   {t.weeklyContext}
               </h3>
               <p className="text-sm text-slate-500 mb-6">{t.weeklyContextDesc}</p>

               <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                         <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center flex flex-col justify-center">
                             <div className="text-2xl font-bold text-white">{totalLogs}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold">{t.totalEntries}</div>
                         </div>
                         <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center flex flex-col justify-center">
                             <div className="text-2xl font-bold text-primary-400">{avgEnergy}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold">{t.avgEnergy}</div>
                         </div>
                         <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center flex flex-col justify-center">
                             <div className="text-sm font-bold text-white truncate px-1">{topAnchor}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold">{t.topAnchor}</div>
                         </div>
                    </div>

                    {/* Mini Energy Chart */}
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 h-24">
                         {chartData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <Line type="monotone" dataKey="energy" stroke="#6366f1" strokeWidth={2} dot={{r: 2}} />
                                    <XAxis dataKey="day" hide />
                                </LineChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="flex items-center justify-center h-full text-xs text-slate-500 italic">{t.noDataYet}</div>
                         )}
                    </div>
               </div>

               {/* Key Moments Scrollable List */}
               <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">{t.keyMoments}</h4>
               <div className="bg-slate-800/50 rounded-lg border border-slate-700 max-h-48 overflow-y-auto custom-scrollbar">
                   {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                       <div key={i} className="p-3 border-b border-slate-700/50 last:border-0 text-sm">
                           <div className="flex justify-between mb-1">
                               <span className="text-primary-400 font-medium">{log.anchorUsed}</span>
                               <span className="text-slate-500 text-xs">{new Date(log.date).toLocaleDateString()}</span>
                           </div>
                           <p className="text-slate-300 mb-1">{log.reflection}</p>
                           {log.aiFeedback && <p className="text-xs text-slate-500 italic border-l-2 border-primary-500/30 pl-2">"{log.aiFeedback}"</p>}
                       </div>
                   )) : (
                       <div className="p-4 text-center text-slate-500 text-sm italic">
                           {t.noLogsThisWeek}
                       </div>
                   )}
               </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-left space-y-6 relative">
                
               {/* Auto-Draft Button */}
               <div className="absolute top-6 right-6">
                   <button 
                    onClick={handleAutoDraft}
                    disabled={isSummarizing || userData.dailyLogs.length === 0}
                    className="text-xs bg-primary-600/20 hover:bg-primary-600/40 text-primary-300 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all disabled:opacity-50"
                   >
                       {isSummarizing ? <Loader2 className="animate-spin" size={12}/> : <Wand2 size={12} />}
                       {isSummarizing ? t.analyzingLogs : t.autoDraft}
                   </button>
               </div>

               <div>
                   <label className="block text-sm font-bold text-primary-400 mb-2">{t.themeLabel}</label>
                   <input 
                      value={weeklyData.theme}
                      onChange={(e) => setWeeklyData({...weeklyData, theme: e.target.value})}
                      placeholder={t.weeklyThemePlaceholder}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white font-serif text-lg italic focus:ring-1 focus:ring-primary-500" 
                   />
               </div>

               <div>
                   <label className="block text-sm font-bold text-white mb-2">{t.winsLabel}</label>
                   <textarea 
                      value={weeklyData.wins}
                      onChange={(e) => setWeeklyData({...weeklyData, wins: e.target.value})}
                      className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" 
                   />
               </div>

               <div>
                   <label className="block text-sm font-bold text-white mb-2">{t.challengesLabel}</label>
                   <textarea 
                      value={weeklyData.challenges}
                      onChange={(e) => setWeeklyData({...weeklyData, challenges: e.target.value})}
                      className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" 
                   />
               </div>

               <button 
                  onClick={() => showNotification(t.weeklySaved)} 
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-500 transition-colors"
               >
                   <Save size={18} className="inline mr-2"/> {t.saveQuarterly}
               </button>
          </div>
      </div>
    );
  };
  // Updated Quarterly View based on PDF Page 12
  const renderQuarterlyView = () => {
    // 1. Calculate Stats for the "Quarterly Rewind"
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentLogs = userData.dailyLogs.filter(l => new Date(l.date) > ninetyDaysAgo);
    
    const logCount = recentLogs.length;
    const avgEnergy = logCount > 0 
        ? (recentLogs.reduce((acc, l) => acc + l.energyLevel, 0) / logCount).toFixed(1) 
        : "0";
    
    // Calculate Top Anchor
    const anchorCounts: Record<string, number> = {};
    recentLogs.forEach(l => {
        anchorCounts[l.anchorUsed] = (anchorCounts[l.anchorUsed] || 0) + 1;
    });
    const topAnchor = Object.entries(anchorCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    return (
     <div className="max-w-4xl mx-auto py-8 animate-fade-in">
          <div className="text-center mb-10">
              <TrendingUp size={48} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">{t.quarterlyTitle}</h2>
              <p className="text-slate-400 max-w-xl mx-auto">{t.quarterlyDesc}</p>
          </div>
          
          {/* QUARTERLY REWIND PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                   <History size={100} className="text-primary-500" />
               </div>
               
               <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                   <History size={20} className="text-primary-400" /> 
                   {t.quarterlyRewind}
               </h3>
               <p className="text-sm text-slate-500 mb-6">{t.rewindIntro}</p>

               <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                        <div className="text-2xl font-bold text-white">{logCount}</div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">{t.totalLogs}</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                        <div className="text-2xl font-bold text-primary-400">{avgEnergy}</div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">{t.avgEnergy}</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                        <div className="text-lg font-bold text-white truncate px-1">{topAnchor}</div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">{t.topAnchor}</div>
                    </div>
               </div>

               {/* Recent Context List */}
               <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                   {userData.weeklyReflections.slice(0, 5).map((w, i) => (
                       <div key={i} className="text-xs text-slate-400 border-l-2 border-slate-700 pl-3 py-1">
                           <span className="text-slate-500 block mb-0.5">{new Date(w.date).toLocaleDateString()}</span>
                           <span className="text-slate-300">"{w.focusForNextWeek}"</span>
                       </div>
                   ))}
                   {userData.weeklyReflections.length === 0 && <p className="text-xs text-slate-600 italic">{t.noWeeklyReflections}</p>}
               </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-left space-y-8">
               
               <div className="grid md:grid-cols-2 gap-8">
                   <div>
                       <label className="block text-sm font-bold text-white mb-1">{t.q_shifted}</label>
                       <p className="text-xs text-slate-500 mb-2">{t.q_shifted_help}</p>
                       <textarea 
                           value={quarterlyData.shifted}
                           onChange={(e) => setQuarterlyData({...quarterlyData, shifted: e.target.value})}
                           className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" 
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-bold text-white mb-1">{t.q_flow}</label>
                       <p className="text-xs text-slate-500 mb-2">{t.q_flow_help}</p>
                       <textarea 
                           value={quarterlyData.creatingFlow}
                           onChange={(e) => setQuarterlyData({...quarterlyData, creatingFlow: e.target.value})}
                           className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" 
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-bold text-white mb-1">{t.q_adjust}</label>
                       <p className="text-xs text-slate-500 mb-2">{t.q_adjust_help}</p>
                       <textarea 
                           value={quarterlyData.needsAdjustment}
                           onChange={(e) => setQuarterlyData({...quarterlyData, needsAdjustment: e.target.value})}
                           className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" 
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-bold text-white mb-1">{t.q_emerging}</label>
                       <p className="text-xs text-slate-500 mb-2">{t.q_emerging_help}</p>
                       <textarea 
                           value={quarterlyData.emerging}
                           onChange={(e) => setQuarterlyData({...quarterlyData, emerging: e.target.value})}
                           className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" 
                       />
                   </div>
               </div>

               <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button 
                        onClick={saveAndAnalyzeQuarterly} 
                        disabled={isAnalyzingQuarter}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isAnalyzingQuarter ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
                        {isAnalyzingQuarter ? t.analyzing : t.saveAndAnalyze}
                    </button>
               </div>
          </div>
          
          {/* AI ANALYSIS RESULTS */}
          {latestQuarterlyAnalysis && (
              <div className="mt-8 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/50 rounded-xl p-8 animate-fade-in shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                       <Sparkles className="text-yellow-400" /> {t.strategicOutlook}
                   </h3>
                   
                   <div className="space-y-6">
                       <div>
                           <h4 className="text-xs uppercase font-bold text-indigo-300 mb-2">{t.themesObserved}</h4>
                           <ul className="space-y-2">
                               {latestQuarterlyAnalysis.themes.map((theme, i) => (
                                   <li key={i} className="flex items-start gap-2 text-slate-200 text-sm">
                                       <span className="text-indigo-400 mt-1">•</span> {theme}
                                   </li>
                               ))}
                           </ul>
                       </div>
                       
                       <div>
                           <h4 className="text-xs uppercase font-bold text-green-400 mb-2">{t.growthTrajectory}</h4>
                           <p className="text-slate-200 text-sm leading-relaxed border-l-2 border-green-500/50 pl-4">
                               {latestQuarterlyAnalysis.growthTrajectory}
                           </p>
                       </div>

                       <div>
                           <h4 className="text-xs uppercase font-bold text-yellow-400 mb-2">{t.nextQuarterFocus}</h4>
                           <div className="bg-slate-800/50 p-4 rounded-lg border border-yellow-500/30 text-white font-medium text-lg">
                               {latestQuarterlyAnalysis.nextQuarterFocus}
                           </div>
                       </div>
                   </div>
              </div>
          )}

          <div className="mt-12 text-left">
              <h3 className="text-lg font-semibold text-white mb-4">{t.pastCheckIns}</h3>
              {userData.quarterlyCheckIns.length > 0 ? (
                  <div className="space-y-4">
                      {userData.quarterlyCheckIns.map(q => (
                          <div key={q.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg hover:border-slate-600 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="text-xs text-slate-500">{new Date(q.date).toLocaleDateString()}</div>
                                  {q.aiAnalysis && <span className="bg-indigo-900/50 text-indigo-300 text-[10px] px-2 py-0.5 rounded border border-indigo-500/30">{t.analyzedTag}</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><span className="text-primary-400">Shifted:</span> <span className="text-slate-300">{q.shifted}</span></div>
                                  <div><span className="text-primary-400">Flow:</span> <span className="text-slate-300">{q.creatingFlow}</span></div>
                              </div>
                              {q.aiAnalysis && (
                                  <div className="mt-3 pt-3 border-t border-slate-800">
                                      <p className="text-xs text-yellow-500 font-medium">Focus: {q.aiAnalysis.nextQuarterFocus}</p>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-slate-500 italic">{t.noPastCheckIns}</p>
              )}
          </div>
     </div>
  );
  };

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

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-6 right-6 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl border border-primary-500 flex items-center gap-2 animate-bounce-in z-50">
          <CheckCircle2 className="text-primary-500" size={18} />
          {notification}
        </div>
      )}

      {/* AI Coach */}
      <Coach 
        userData={userData} 
        setUserData={setUserData} 
        language={language} 
        triggerPrompt={coachTrigger}
        onCloseTrigger={() => setCoachTrigger(undefined)}
      />
    </Layout>
  );
}
