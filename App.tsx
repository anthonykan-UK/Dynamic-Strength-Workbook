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
import { Constellation } from './components/Constellation';
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
  Compass,
  Download,
  Upload,
  Copy,
  Database,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';

export default function App() {
  // --- State ---
  const [userData, setUserData] = useState<UserData>(() => {
    // 1. Try New Key
    const saved = localStorage.getItem('dsw_strength_data');
    if (saved) {
        try {
             return JSON.parse(saved);
        } catch(e) { console.error("Parse error", e); return INITIAL_USER_DATA; }
    }

    // 2. Fallback: Migration from Old "Inkspire" Key
    const legacy = localStorage.getItem('inkspire_strength_data');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            console.log("Migrating data from Inkspire to DSW...");
            return {
                ...INITIAL_USER_DATA,
                ...parsed,
                internalAudit: { ...INITIAL_USER_DATA.internalAudit, ...(parsed.internalAudit || {}) }
            };
        } catch(e) {
            console.error("Legacy migration error", e);
        }
    }
    
    return INITIAL_USER_DATA;
  });
  
  const [view, setView] = useState<ViewState>('welcome');
  const [privacyMode, setPrivacyMode] = useState(false);
  
  // Initialize language with migration check
  const [language, setLanguage] = useState<Language>(() => {
      const saved = localStorage.getItem('dsw_language');
      if (saved) return saved as Language;
      
      const legacy = localStorage.getItem('inkspire_language');
      if (legacy) return legacy as Language;
      
      return 'en-GB';
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
    localStorage.setItem('dsw_strength_data', JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    localStorage.setItem('dsw_language', language);
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
  
  const handleTogglePrivacy = () => {
      const newState = !privacyMode;
      setPrivacyMode(newState);
      showNotification(newState ? t.privacyOn : t.privacyOff);
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

  // --- Settings Handlers ---

  const handleExportData = () => {
      const dataStr = JSON.stringify(userData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dsw_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const importedData = JSON.parse(e.target?.result as string);
              // Basic validation check
              if (importedData.assessmentStrengths && Array.isArray(importedData.dailyLogs)) {
                 if (window.confirm(t.restoreWarning)) {
                     // Merge carefully or replace? Replace is safer for "Restore"
                     setUserData(importedData);
                     showNotification(t.importSuccess);
                 }
              } else {
                  showNotification(t.importError);
              }
          } catch (error) {
              showNotification(t.importError);
          }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
  };

  const handleCopyManifesto = () => {
      const strengths = userData.assessmentStrengths.filter(Boolean).join(", ");
      const anchors = userData.coreAnchors.filter(Boolean).join(", ");
      const stories = userData.externalStories.map(s => `- ${s.pattern}: "${s.text}"`).join("\n");
      
      const manifesto = `
# MY STRENGTH MANIFESTO

**Directional Intention:**
${userData.yearlyTheme || "Not defined yet"}

**Top Strength Hypotheses:**
${strengths}

**Core Anchors:**
${anchors}

**Evidence Bank:**
${stories}

*Generated by Dynamic Strength Workbook*
      `.trim();
      
      navigator.clipboard.writeText(manifesto);
      showNotification(t.manifestoCopied);
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
                                <div className="relative flex-1">
                                    <textarea 
                                        value={discoveryReflection}
                                        onChange={(e) => setDiscoveryReflection(e.target.value)}
                                        className="w-full h-full min-h-[120px] bg-slate-800 border border-slate-700 rounded p-3 text-white text-base focus:ring-1 focus:ring-primary-500 mb-3 leading-relaxed resize-none"
                                    />
                                </div>
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
                   <div className="relative">
                       <label className="block text-sm font-medium text-green-400 mb-2">{t.momentumLabel}</label>
                       <textarea 
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-green-500 h-32"
                           placeholder={t.momentumHelp}
                           value={userData.internalAudit.momentum}
                           onChange={e => setUserData({...userData, internalAudit: {...userData.internalAudit, momentum: e.target.value}})}
                       />
                   </div>
                   <div className="relative">
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

        {/* Constellation Visualizer */}
        <Constellation userData={userData} language={language} />

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
                         <div className="relative">
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
                         <div className="relative">
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
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t.phase3Title}</h2>
        <p className="text-slate-400 text-base">{t.phase3Subtitle}</p>
      </div>

      <div className="space-y-6">
        {userData.shifts.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
             <p className="text-slate-500 mb-4">{t.noActiveShifts}</p>
             <button onClick={addShift} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-500">
               {t.addNewShift}
             </button>
          </div>
        )}

        {userData.shifts.map((shift, index) => (
          <div key={shift.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative group">
            <button 
              onClick={() => deleteShift(shift.id)} 
              className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>

            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.territory}</label>
                      <select 
                        value={shift.territory}
                        onChange={(e) => updateShift(shift.id, 'territory', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-primary-500"
                      >
                          {Object.values(TERRITORIES).map(terr => (
                              <option key={terr} value={terr}>{terr}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.poweringAnchor}</label>
                      <select 
                        value={shift.anchorId}
                        onChange={(e) => updateShift(shift.id, 'anchorId', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-primary-500"
                      >
                          <option value="">{t.selectAnchor}</option>
                          {userData.coreAnchors.filter(Boolean).map(a => (
                              <option key={a} value={a}>{a}</option>
                          ))}
                      </select>
                  </div>
               </div>

               <div className="space-y-4">
                   <div className="flex justify-between items-center">
                       <label className="block text-xs font-bold text-green-400 uppercase tracking-wider">{t.shiftAction}</label>
                       <button 
                         onClick={() => handleSuggestShifts(shift.id, shift.territory, shift.anchorId)}
                         disabled={suggestingShiftId === shift.id}
                         className="text-xs text-primary-400 hover:text-white flex items-center gap-1"
                       >
                           {suggestingShiftId === shift.id ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} {t.suggestIdeas}
                       </button>
                   </div>
                   
                   {shiftSuggestions[shift.id] && (
                       <div className="space-y-2 mb-2">
                           <p className="text-xs text-slate-500">{t.selectIdea}</p>
                           {shiftSuggestions[shift.id].map((s, i) => (
                               <button 
                                 key={i} 
                                 onClick={() => applySuggestion(shift.id, s)}
                                 className="block w-full text-left text-xs bg-slate-800 hover:bg-slate-700 p-2 rounded text-slate-300 border border-slate-700"
                               >
                                 {s}
                               </button>
                           ))}
                       </div>
                   )}

                   <textarea 
                       value={shift.practice}
                       onChange={(e) => updateShift(shift.id, 'practice', e.target.value)}
                       placeholder={t.practicePlaceholder}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-green-500 h-24 resize-none"
                   />
               </div>
            </div>
          </div>
        ))}
        
        {userData.shifts.length > 0 && (
            <button onClick={addShift} className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} /> {t.addNewShift}
            </button>
        )}
      </div>
      
      <div className="flex justify-end pt-6 border-t border-slate-800">
         <button 
            onClick={() => setView('dashboard')}
            className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
         >
            {t.goToDashboard} <ArrowRight size={18} />
         </button>
      </div>
    </div>
  );

  const renderDashboardView = () => (
    <div className="space-y-8 animate-fade-in max-w-5xl">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <h2 className="text-2xl font-bold text-white mb-2">{t.dailyDashboard}</h2>
               <p className="text-slate-400 text-base">{t.consistentSteps}</p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
                <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
                    <Activity size={16} className="text-primary-500"/>
                    {userData.dailyLogs.length} {t.totalEntries}
                </div>
            </div>
       </header>

       <div className="grid md:grid-cols-3 gap-8">
            {/* Left Col: Shifts & Logging */}
            <div className="md:col-span-2 space-y-8">
                 {/* Active Shifts Card */}
                 <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={120} /></div>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-white flex items-center gap-2"><Target className="text-red-400" size={18}/> {t.activeShifts}</h3>
                          <button onClick={() => setView('phase3')} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-slate-300 transition-colors">
                              {t.editShifts}
                          </button>
                      </div>
                      
                      {userData.shifts.length === 0 ? (
                          <div className="text-slate-500 text-sm italic">{t.noActiveShifts}</div>
                      ) : (
                          <div className="space-y-3 relative z-10">
                              {userData.shifts.map(s => (
                                  <div key={s.id} className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                      <div className="mt-1"><CheckCircle2 size={16} className="text-green-500" /></div>
                                      <div>
                                          <div className="text-white text-sm font-medium">{s.practice}</div>
                                          <div className="text-xs text-slate-500">{s.territory} • {s.anchorId}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                 </div>

                 {/* Logging Area */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Sun className="text-yellow-500" size={18}/> {t.todaysLog}</h3>
                      
                      <div className="space-y-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">{t.anchorUsed}</label>
                              <select 
                                  value={todayLog.anchor}
                                  onChange={(e) => setTodayLog({...todayLog, anchor: e.target.value})}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-primary-500"
                              >
                                  <option value="">Select Anchor...</option>
                                  {userData.coreAnchors.filter(Boolean).map(a => (
                                      <option key={a} value={a}>{a}</option>
                                  ))}
                              </select>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">{t.reflectionShifted}</label>
                              <textarea 
                                  value={todayLog.reflection}
                                  onChange={(e) => setTodayLog({...todayLog, reflection: e.target.value})}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none focus:ring-1 focus:ring-primary-500"
                              />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-3">{t.energyLabel}</label>
                              <div className="flex items-center gap-4">
                                  <span className="text-xs text-slate-500">{t.energyLow}</span>
                                  <div className="flex-1 flex justify-between bg-slate-800 p-2 rounded-full border border-slate-700">
                                      {[1, 2, 3, 4, 5].map(v => (
                                          <button
                                              key={v}
                                              onClick={() => setTodayLog({...todayLog, energy: v})}
                                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                                  todayLog.energy === v 
                                                  ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg scale-110' 
                                                  : 'text-slate-500 hover:bg-slate-700'
                                              }`}
                                          >
                                              {v}
                                          </button>
                                      ))}
                                  </div>
                                  <span className="text-xs text-slate-500">{t.energyHigh}</span>
                              </div>
                          </div>

                          <button 
                             onClick={handleLogSubmit}
                             disabled={isLogging || !todayLog.anchor || !todayLog.reflection}
                             className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isLogging ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                              {t.logEntry}
                          </button>
                      </div>
                 </div>
            </div>

            {/* Right Col: Feedback & History */}
            <div className="space-y-6">
                 {/* Spark Feedback */}
                 {lastSpark && (
                     <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 p-6 rounded-2xl animate-fade-in relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-2 opacity-20"><Zap size={80} className="text-yellow-500"/></div>
                         <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2 text-sm uppercase tracking-wide">
                             <Sparkles size={16} /> {t.strengthSpark}
                         </div>
                         <p className="text-white text-lg font-medium leading-relaxed italic">
                             "{lastSpark}"
                         </p>
                     </div>
                 )}

                 {/* Recent Entries */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit max-h-[600px] overflow-y-auto custom-scrollbar">
                     <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><History size={18} className="text-slate-400"/> {t.recentEntries}</h3>
                     <div className="space-y-4">
                         {userData.dailyLogs.slice(0, 10).map(log => (
                             <div key={log.id} className="border-l-2 border-slate-700 pl-4 py-1 relative">
                                 <div className="text-xs text-slate-500 mb-1">{new Date(log.date).toLocaleDateString()}</div>
                                 <div className="text-white text-sm font-medium mb-1">{log.anchorUsed}</div>
                                 <div className="text-slate-400 text-xs line-clamp-2">{log.reflection}</div>
                                 <div className="absolute right-0 top-1">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                          log.energyLevel >= 4 ? 'bg-green-900 text-green-300' : 
                                          log.energyLevel <= 2 ? 'bg-red-900 text-red-300' : 'bg-slate-800 text-slate-300'
                                      }`}>
                                          ⚡ {log.energyLevel}
                                      </span>
                                 </div>
                             </div>
                         ))}
                         {userData.dailyLogs.length === 0 && (
                             <div className="text-slate-500 text-sm">{t.noEntries}</div>
                         )}
                     </div>
                 </div>
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
          </header>

          <div className="grid md:grid-cols-3 gap-8">
              {/* Context Column */}
              <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t.contextLast7Days}</h3>
                      {userData.dailyLogs.length === 0 ? (
                          <div className="text-slate-500 text-sm">{t.noLogsThisWeek}</div>
                      ) : (
                          <div className="space-y-3">
                              {userData.dailyLogs.slice(0, 7).map(log => (
                                  <div key={log.id} className="text-sm border-b border-slate-800 pb-2 last:border-0">
                                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                                          <span>{new Date(log.date).toLocaleDateString()}</span>
                                          <span className={log.energyLevel >= 4 ? 'text-green-400' : ''}>⚡ {log.energyLevel}</span>
                                      </div>
                                      <div className="text-white font-medium mb-1">{log.anchorUsed}</div>
                                      <div className="text-slate-400 text-xs line-clamp-2">{log.reflection}</div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* Reflection Form */}
              <div className="md:col-span-2 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-semibold text-white">{t.keyMoments}</h3>
                          <button 
                             onClick={handleAutoDraft}
                             disabled={isSummarizing || userData.dailyLogs.length === 0}
                             className="text-xs bg-indigo-900 hover:bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                          >
                              {isSummarizing ? <Loader2 className="animate-spin" size={12}/> : <Wand2 size={12}/>} {t.autoDraft}
                          </button>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-green-400 mb-2">{t.winsLabel}</label>
                              <textarea 
                                  value={weeklyData.wins}
                                  onChange={(e) => setWeeklyData({...weeklyData, wins: e.target.value})}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 focus:ring-1 focus:ring-green-500"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-orange-400 mb-2">{t.challengesLabel}</label>
                              <textarea 
                                  value={weeklyData.challenges}
                                  onChange={(e) => setWeeklyData({...weeklyData, challenges: e.target.value})}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 focus:ring-1 focus:ring-orange-500"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-purple-400 mb-2">{t.themeLabel}</label>
                                  <input 
                                      value={weeklyData.theme}
                                      onChange={(e) => setWeeklyData({...weeklyData, theme: e.target.value})}
                                      placeholder={t.weeklyThemePlaceholder}
                                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-purple-500"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-blue-400 mb-2">{t.nextQuarterFocus} (Next Week)</label>
                                  <input 
                                      value={weeklyData.focus}
                                      onChange={(e) => setWeeklyData({...weeklyData, focus: e.target.value})}
                                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500"
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                          <button 
                             onClick={saveWeeklyReflection}
                             className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                          >
                              <Save size={18} /> {t.weeklySaved.replace('!', '')}
                          </button>
                      </div>
                  </div>
                  
                  {/* Past Reflections List */}
                  {userData.weeklyReflections.length > 0 && (
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                          <h3 className="font-semibold text-white mb-4">{t.recentEntries}</h3>
                          <div className="space-y-4">
                              {userData.weeklyReflections.slice(0, 3).map(w => (
                                  <div key={w.id} className="border-b border-slate-800 last:border-0 pb-4">
                                      <div className="flex justify-between text-sm text-slate-500 mb-1">
                                          <span>{new Date(w.date).toLocaleDateString()}</span>
                                          {w.theme && <span className="text-purple-400 font-medium">{w.theme}</span>}
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div><span className="text-green-500 font-bold">Wins:</span> <span className="text-slate-300">{w.wins}</span></div>
                                          <div><span className="text-orange-500 font-bold">Adj:</span> <span className="text-slate-300">{w.challenges}</span></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderQuarterlyView = () => {
      // Calculate Stats
      const recentLogs = userData.dailyLogs.slice(0, 90); // Approx 3 months
      const avgEnergy = recentLogs.length 
        ? (recentLogs.reduce((a, b) => a + b.energyLevel, 0) / recentLogs.length).toFixed(1) 
        : '0';
      
      const anchorCounts: Record<string, number> = {};
      recentLogs.forEach(l => {
          anchorCounts[l.anchorUsed] = (anchorCounts[l.anchorUsed] || 0) + 1;
      });
      const topAnchor = Object.entries(anchorCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Graph Data
      const graphData = recentLogs.slice(0, 14).reverse().map(l => ({
          name: new Date(l.date).getDate(),
          energy: l.energyLevel
      }));

      return (
        <div className="space-y-8 animate-fade-in max-w-5xl">
            <header>
                <h2 className="text-2xl font-bold text-white mb-2">{t.quarterlyTitle}</h2>
                <p className="text-slate-400 text-base">{t.quarterlyDesc}</p>
            </header>

            <div className="grid md:grid-cols-3 gap-8">
                 {/* Left: Stats Panel */}
                 <div className="space-y-6">
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t.quarterlyRewind}</h3>
                         
                         <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-slate-800 p-3 rounded-lg">
                                 <div className="text-xs text-slate-500">{t.totalLogs}</div>
                                 <div className="text-xl font-bold text-white">{recentLogs.length}</div>
                             </div>
                             <div className="bg-slate-800 p-3 rounded-lg">
                                 <div className="text-xs text-slate-500">{t.avgEnergy}</div>
                                 <div className="text-xl font-bold text-yellow-400">{avgEnergy}</div>
                             </div>
                         </div>
                         
                         <div className="mb-6">
                             <div className="text-xs text-slate-500 mb-1">{t.topAnchor}</div>
                             <div className="text-lg font-bold text-primary-400">{topAnchor}</div>
                         </div>

                         <div className="h-32 w-full">
                             <div className="text-xs text-slate-500 mb-2">{t.trendLine}</div>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={graphData}>
                                    <Line type="monotone" dataKey="energy" stroke="#818cf8" strokeWidth={2} dot={false} />
                                    <YAxis domain={[1, 5]} hide />
                                </LineChart>
                             </ResponsiveContainer>
                         </div>
                     </div>
                 </div>

                 {/* Center/Right: Questions */}
                 <div className="md:col-span-2 space-y-6">
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                         <h3 className="font-semibold text-white mb-6">Strategic Check-In</h3>
                         
                         <div className="space-y-5">
                             {[
                                 { l: t.q_shifted, h: t.q_shifted_help, k: 'shifted' },
                                 { l: t.q_flow, h: t.q_flow_help, k: 'creatingFlow' },
                                 { l: t.q_adjust, h: t.q_adjust_help, k: 'needsAdjustment' },
                                 { l: t.q_emerging, h: t.q_emerging_help, k: 'emerging' }
                             ].map((q, i) => (
                                 <div key={i}>
                                     <label className="block text-sm font-bold text-white mb-1">{q.l}</label>
                                     <p className="text-xs text-slate-400 mb-2">{q.h}</p>
                                     <textarea 
                                         // @ts-ignore
                                         value={quarterlyData[q.k]}
                                         // @ts-ignore
                                         onChange={(e) => setQuarterlyData({...quarterlyData, [q.k]: e.target.value})}
                                         className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-20 focus:ring-1 focus:ring-primary-500 resize-none"
                                     />
                                 </div>
                             ))}
                         </div>

                         <div className="mt-8 flex justify-end">
                             <button 
                                onClick={saveAndAnalyzeQuarterly}
                                disabled={isAnalyzingQuarter}
                                className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
                             >
                                {isAnalyzingQuarter ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                {t.saveAndAnalyze}
                             </button>
                         </div>
                     </div>

                     {/* Analysis Result Display */}
                     {latestQuarterlyAnalysis && (
                         <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 rounded-xl animate-fade-in">
                             <h3 className="font-bold text-indigo-300 flex items-center gap-2 mb-4">
                                 <Sparkles size={18} /> {t.strategicOutlook}
                             </h3>
                             <div className="space-y-4">
                                 <div>
                                     <h4 className="text-sm font-bold text-white mb-2">{t.themesObserved}</h4>
                                     <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                                         {latestQuarterlyAnalysis.themes.map((th, i) => <li key={i}>{th}</li>)}
                                     </ul>
                                 </div>
                                 <div>
                                     <h4 className="text-sm font-bold text-white mb-1">{t.growthTrajectory}</h4>
                                     <p className="text-slate-300 text-sm leading-relaxed">{latestQuarterlyAnalysis.growthTrajectory}</p>
                                 </div>
                                 <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-500/20">
                                     <h4 className="text-sm font-bold text-indigo-200 mb-1">{t.nextQuarterFocus}</h4>
                                     <p className="text-white text-base font-medium">{latestQuarterlyAnalysis.nextQuarterFocus}</p>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* Past Check-ins */}
                     {userData.quarterlyCheckIns.length > 0 && (
                         <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                              <h3 className="font-semibold text-white mb-4">{t.pastCheckIns}</h3>
                              <div className="space-y-4">
                                  {userData.quarterlyCheckIns.map(q => (
                                      <div key={q.id} className="border-b border-slate-800 pb-4 last:border-0">
                                          <div className="flex justify-between items-center mb-2">
                                              <span className="text-sm text-slate-400">{new Date(q.date).toLocaleDateString()}</span>
                                              {q.aiAnalysis && <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">{t.analyzedTag}</span>}
                                          </div>
                                          <p className="text-white text-sm line-clamp-2">{q.shifted}</p>
                                      </div>
                                  ))}
                              </div>
                         </div>
                     )}
                 </div>
            </div>
        </div>
      );
  };

  const renderSettingsView = () => (
      <div className="space-y-8 animate-fade-in max-w-3xl">
          <header>
              <h2 className="text-2xl font-bold text-white mb-2">{t.settingsTitle}</h2>
              <p className="text-slate-400 text-base">{t.settingsTitle} - {t.dataVault}</p>
          </header>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Database size={20} className="text-blue-400" /> {t.backupTitle}</h3>
              <p className="text-slate-400 text-sm mb-6">{t.backupDesc}</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                     onClick={handleExportData}
                     className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                  >
                      <Download size={18} /> {t.downloadBackup}
                  </button>
                  <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                      <Upload size={18} /> {t.restoreBackup}
                      <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  </label>
              </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
               <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BookOpen size={20} className="text-primary-400" /> {t.manifestoTitle}</h3>
               <p className="text-slate-400 text-sm mb-6">{t.manifestoDesc}</p>

               <button 
                  onClick={handleCopyManifesto}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
               >
                   <Copy size={18} /> {t.copyManifesto}
               </button>
          </div>
          
          <div className="text-center text-slate-600 text-xs mt-8">
              <p>Dynamic Strength Workbook v2.0</p>
              <p>Local Storage Persistence Active</p>
          </div>
      </div>
  );

  return (
    <Layout 
        currentView={view} 
        setView={setView} 
        language={language} 
        setLanguage={setLanguage}
        privacyMode={privacyMode}
        togglePrivacyMode={handleTogglePrivacy}
    >
        {/* Inject Global Styles for Privacy Mode */}
        <style>{`
          .privacy-blur textarea, 
          .privacy-blur input[type="text"] {
             filter: blur(8px);
             transition: filter 0.3s ease;
             cursor: pointer;
          }
          .privacy-blur textarea:hover, 
          .privacy-blur input[type="text"]:focus,
          .privacy-blur input[type="text"]:hover {
             filter: none;
          }
          /* Custom Scrollbar update */
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #1e293b; }
          ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #64748b; }
        `}</style>

      {view === 'welcome' && renderWelcomeView()}
      {view === 'discovery' && renderDiscoveryView()}
      {view === 'phase1' && renderPhase1View()}
      {view === 'phase2' && renderPhase2View()}
      {view === 'phase3' && renderPhase3View()}
      {view === 'dashboard' && renderDashboardView()}
      {view === 'weekly' && renderWeeklyView()}
      {view === 'quarterly' && renderQuarterlyView()}
      {view === 'settings' && renderSettingsView()}
      
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