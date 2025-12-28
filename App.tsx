import React, { useState, useEffect } from 'react';
import { 
  UserData, 
  ViewState, 
  Language,
  INITIAL_USER_DATA, 
  Story, 
  TERRITORIES, 
  DailyLog,
  COMMON_STRENGTHS 
} from './types';
import { TRANSLATIONS } from './translations';
import { analyzeStoryWithAI, suggestShiftsWithAI, discoverStrengthsWithAI, generateDailySpark, summarizeWeek } from './services/ai';
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
  Wand2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  
  // Discovery View State
  const [discoveryReflection, setDiscoveryReflection] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedDiscoveryStrengths, setSelectedDiscoveryStrengths] = useState<string[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);

  // Phase 2 Definitions Toggle
  const [showDefinitions, setShowDefinitions] = useState(false);

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

  const handleDiscoverySubmit = async () => {
      if(!discoveryReflection.trim()) return;
      setIsDiscovering(true);
      try {
          const suggestions = await discoverStrengthsWithAI(discoveryReflection, language);
          // Auto-select the first 5 suggested, or merge with existing
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
      // Pad with empty strings if less than 5
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

  const [quarterlyData, setQuarterlyData] = useState({
      shifted: '',
      creatingFlow: '',
      needsAdjustment: '',
      emerging: ''
  });
  
  const saveQuarterly = () => {
      const newQ: any = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          ...quarterlyData
      };
      setUserData(prev => ({
          ...prev,
          quarterlyCheckIns: [newQ, ...prev.quarterlyCheckIns]
      }));
      setQuarterlyData({ shifted: '', creatingFlow: '', needsAdjustment: '', emerging: '' });
      showNotification(t.notifications.quarterlySaved);
  };

  // --- Render Views ---

  const WelcomeView = () => (
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

  const DiscoveryView = () => (
      <div className="space-y-8 max-w-4xl">
        <header className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white mb-2">{t.discoveryTitle}</h2>
            <p className="text-slate-400">{t.discoverySubtitle}</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
            {/* AI Assist Column */}
            <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="text-primary-500" size={18} /> {t.aiReflectionGuide}
                    </h3>
                    
                    {/* Interactive Prompt Carousel */}
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

                    <p className="text-sm text-slate-500 mb-2">
                        {t.jotDown}
                    </p>
                    <textarea 
                        value={discoveryReflection}
                        onChange={(e) => setDiscoveryReflection(e.target.value)}
                        className="w-full h-48 bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm focus:ring-1 focus:ring-primary-500 mb-3 leading-relaxed"
                    />
                    <button 
                        onClick={handleDiscoverySubmit}
                        disabled={isDiscovering || !discoveryReflection}
                        className="bg-slate-800 hover:bg-slate-700 text-primary-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 w-full justify-center border border-slate-700"
                    >
                        {isDiscovering ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {t.analyzeSuggest}
                    </button>
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

  const Phase1View = () => (
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
              placeholder={`Strength #${idx + 1}`}
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
                placeholder={`"You were amazing when you..."`}
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
              No stories added yet. Click "Add Evidence" to begin.
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

  const Phase2View = () => (
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
           <label className="block text-sm text-primary-300 mb-1">{t.yearlyThemeLabel}</label>
           <p className="text-xs text-slate-400 mb-3">{t.yearlyThemeHelp}</p>
           <input 
              type="text"
              value={userData.yearlyTheme || ''}
              onChange={(e) => setUserData({...userData, yearlyTheme: e.target.value})}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded p-3 focus:ring-2 focus:ring-primary-500 font-medium text-lg"
              placeholder="e.g., Deepening Expertise, Building Community..."
           />
      </section>

      {/* Story Deconstruction */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-white">{t.deconstruct}</h3>
        {userData.externalStories.length === 0 && <p className="text-yellow-500">Please add stories in Phase 1 first.</p>}
        
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
                  {['Yes', 'No', 'Mostly'].map(opt => (
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

      {/* Boundary Check */}
      <section className="bg-slate-900 p-8 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
            <BatteryWarning size={20} />
            {t.boundaryCheck}
        </h3>
        <p className="text-slate-400 mb-6 max-w-2xl">{t.boundaryCheckIntro}</p>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Drain Column */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-red-500/20">
                <label className="block text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} /> {t.drainingPattern}
                </label>
                <div className="mb-4">
                     <p className="text-xs text-slate-400 mb-2 font-medium uppercase">Reflection Triggers:</p>
                     <ul className="space-y-1">
                         {t.drainPrompts.map((p, i) => (
                             <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                                 <span className="text-red-500/50">•</span> {p}
                             </li>
                         ))}
                     </ul>
                </div>
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
            <div className="bg-slate-800/50 p-6 rounded-lg border border-green-500/20">
                <label className="block text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                    <ShieldCheck size={16} /> {t.reframedBoundary}
                </label>
                <div className="mb-4">
                     <p className="text-xs text-slate-400 mb-2">
                        Set a boundary that protects your capacity. It doesn't mean stopping work, but changing <i>how</i> you engage.
                     </p>
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

      {/* Final Anchors */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-850 p-8 rounded-xl border border-primary-500/30">
        <h3 className="text-lg font-semibold text-primary-400 mb-2 flex items-center gap-2">
            <Anchor size={20} />
            {t.finalAnchors}
        </h3>
        
        {/* Anchor Education Block */}
        <div className="bg-primary-900/20 border-l-4 border-primary-500 p-4 mb-6 rounded-r">
             <h4 className="font-bold text-white text-sm mb-1">What is an Anchor?</h4>
             <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                 {t.anchorDefinition}
             </p>
             <p className="text-xs text-primary-300 italic">
                 {t.anchorContext}
             </p>
        </div>

        <p className="text-sm text-slate-400 mb-6">{t.finalAnchorsDesc}</p>
        
        <div className="grid gap-3">
          {userData.coreAnchors.map((anchor, idx) => (
            <div key={idx} className="flex items-center gap-3">
               <span className="text-slate-500 font-mono text-sm w-6">0{idx + 1}</span>
               <input
                type="text"
                value={anchor}
                onChange={(e) => updateAnchor(idx, e.target.value)}
                placeholder={`Core Anchor #${idx + 1}`}
                className="flex-1 bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-semibold"
              />
            </div>
          ))}
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

  const Phase3View = () => (
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
                            {TERRITORIES.map(tr => <option key={tr} value={tr}>{tr}</option>)}
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

  const DashboardView = () => {
    // Process data for the momentum chart
    const data = userData.dailyLogs.slice(0, 14).reverse().map(log => ({
        name: new Date(log.date).toLocaleDateString(undefined, {weekday: 'short'}),
        energy: log.energyLevel || 3,
        anchor: log.anchorUsed
    }));

    const [todayLog, setTodayLog] = useState({
        anchor: '',
        reflection: '',
        energy: 3
    });
    
    const [isLogging, setIsLogging] = useState(false);
    const [lastSpark, setLastSpark] = useState<string | null>(null);

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
                         <div className="flex-1 w-full min-h-0">
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
                            )) : <div className="text-slate-500 text-sm">No active shifts defined.</div>}
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

  const WeeklyView = () => {
    const [weeklyData, setWeeklyData] = useState({
        wins: '',
        challenges: '',
        theme: '',
        focus: ''
    });
    const [isSummarizing, setIsSummarizing] = useState(false);

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

    return (
      <div className="max-w-3xl mx-auto text-center py-12 animate-fade-in">
          <div className="flex justify-center mb-4">
               <div className="bg-slate-800 p-4 rounded-full">
                   <Calendar size={40} className="text-primary-500" />
               </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t.weeklyTitle}</h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-left space-y-6 mt-8 relative">
                
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
                      placeholder="e.g. The Week of Persistence"
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
  const QuarterlyView = () => (
     <div className="max-w-3xl mx-auto text-center py-12 animate-fade-in">
          <TrendingUp size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t.quarterlyTitle}</h2>
          <p className="text-slate-400 mb-8">{t.quarterlyDesc}</p>
          
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
                        onClick={saveQuarterly} 
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} /> {t.saveQuarterly}
                    </button>
               </div>
          </div>

          <div className="mt-8 text-left">
              <h3 className="text-lg font-semibold text-white mb-4">Past Check-Ins</h3>
              {userData.quarterlyCheckIns.length > 0 ? (
                  <div className="space-y-4">
                      {userData.quarterlyCheckIns.map(q => (
                          <div key={q.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                              <div className="text-xs text-slate-500 mb-2">{new Date(q.date).toLocaleDateString()}</div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><span className="text-primary-400">Shifted:</span> <span className="text-slate-300">{q.shifted}</span></div>
                                  <div><span className="text-primary-400">Flow:</span> <span className="text-slate-300">{q.creatingFlow}</span></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-slate-500 italic">No past check-ins recorded.</p>
              )}
          </div>
      </div>
  );


  return (
    <Layout currentView={view} setView={setView} language={language} setLanguage={setLanguage}>
      {view === 'welcome' && <WelcomeView />}
      {view === 'discovery' && <DiscoveryView />}
      {view === 'phase1' && <Phase1View />}
      {view === 'phase2' && <Phase2View />}
      {view === 'phase3' && <Phase3View />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'weekly' && <WeeklyView />}
      {view === 'quarterly' && <QuarterlyView />}

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-6 right-6 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl border border-primary-500 flex items-center gap-2 animate-bounce-in z-50">
          <CheckCircle2 className="text-primary-500" size={18} />
          {notification}
        </div>
      )}

      {/* AI Coach */}
      <Coach userData={userData} language={language} />
    </Layout>
  );
}