import React, { useState, useEffect } from 'react';
import { 
  UserData, 
  ViewState, 
  INITIAL_USER_DATA, 
  Story, 
  TERRITORIES, 
  DailyLog 
} from './types';
import { analyzeStoryWithAI, suggestShiftsWithAI } from './services/ai';
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
  Lightbulb
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function App() {
  // --- State ---
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('inkspire_strength_data');
    return saved ? JSON.parse(saved) : INITIAL_USER_DATA;
  });
  const [view, setView] = useState<ViewState>('welcome');
  const [notification, setNotification] = useState<string | null>(null);
  
  // Local loading states for AI operations
  const [analyzingStoryId, setAnalyzingStoryId] = useState<string | null>(null);
  const [suggestingShiftId, setSuggestingShiftId] = useState<string | null>(null);
  const [shiftSuggestions, setShiftSuggestions] = useState<Record<string, string[]>>({});

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('inkspire_strength_data', JSON.stringify(userData));
  }, [userData]);

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
      const result = await analyzeStoryWithAI(story.text);
      const newStories = userData.externalStories.map(s => 
        s.id === story.id ? { 
          ...s, 
          action: result.action, 
          feeling: result.feeling, 
          pattern: result.pattern 
        } : s
      );
      setUserData({ ...userData, externalStories: newStories });
      showNotification("Story analyzed!");
    } catch (e) {
      showNotification("Failed to analyze. Try again.");
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
       showNotification("Select Territory and Anchor first.");
       return;
    }
    setSuggestingShiftId(shiftId);
    try {
        const suggestions = await suggestShiftsWithAI(territory, anchorId);
        setShiftSuggestions(prev => ({ ...prev, [shiftId]: suggestions }));
    } catch (e) {
        showNotification("Could not generate suggestions.");
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

  const addDailyLog = (log: DailyLog) => {
    setUserData(prev => ({
      ...prev,
      dailyLogs: [log, ...prev.dailyLogs]
    }));
    showNotification('Daily entry logged successfully!');
  };

  // --- Render Views ---

  const WelcomeView = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-br from-primary-600 to-indigo-800 p-8 rounded-2xl shadow-xl text-white">
        <h2 className="text-3xl font-bold mb-4">Welcome to Your Strength Journey</h2>
        <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
          This isn't about fixing what's broken. It's about amplifying what works. 
          You are about to embark on a guided process to discover your Core Strengths, 
          set clear boundaries, and design small "5% Shifts" that create momentum.
        </p>
        <button 
          onClick={() => setView('phase1')}
          className="mt-8 bg-white text-primary-600 px-6 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
        >
          Begin Phase 1 <ArrowRight size={18} />
        </button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: "Externalize", desc: "We start with evidence, not assumptions. Gather stories from peers." },
          { title: "Anchor", desc: "Identify the patterns that fuel your best work and well-being." },
          { title: "Shift", desc: "Create small, actionable 5% shifts to bring your strengths to life." }
        ].map((item, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-primary-400 mb-2">{item.title}</h3>
            <p className="text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const Phase1View = () => (
    <div className="space-y-8 max-w-3xl">
      <header className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Phase 1: Externalize Discovery</h2>
        <p className="text-slate-400">We are prone to self-doubt. To combat this, we anchor in evidence from others.</p>
      </header>

      {/* Assessment Results */}
      <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center gap-2">
          <Award size={20} /> Top 5 Initial Strengths (Hypothesis)
        </h3>
        <p className="text-sm text-slate-500 mb-4">Enter results from your StrengthFinder, VIA, or similar assessment.</p>
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

      {/* External Stories */}
      <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary-400">External Stories</h3>
          <button onClick={addStory} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <Plus size={16} /> Add Story
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Ask 3-5 people: "When have you seen me at my best?" Record their quotes <strong>verbatim</strong> below.
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
              No stories added yet. Click "Add Story" to begin.
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end pt-6">
        <button 
          onClick={() => { showNotification('Progress saved'); setView('phase2'); }}
          className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
        >
          Save & Continue to Phase 2 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const Phase2View = () => (
    <div className="space-y-8">
      <header className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Phase 2: Mining for Resources</h2>
        <p className="text-slate-400">Analyze your evidence to find patterns and set boundaries.</p>
      </header>

      {/* Story Deconstruction */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Deconstruct Your Stories</h3>
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
                <label className="text-xs uppercase font-bold text-slate-500">Echo Check</label>
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
                        placeholder="Action: What did you actually do?" 
                        value={story.action || ''}
                        onChange={(e) => updateStory(story.id, 'action', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                 </div>
                 <input 
                    placeholder="Feeling: How did it feel?" 
                    value={story.feeling || ''}
                    onChange={(e) => updateStory(story.id, 'feeling', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                 />
                 <input 
                    placeholder="Pattern: What is the underlying strength?" 
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
      <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold text-red-400 mb-4">Boundary Check</h3>
        <p className="text-sm text-slate-500 mb-4">Identify a pattern that drains you, then reframe it.</p>
        <div className="grid md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-slate-400 mb-1">Draining Pattern</label>
                <textarea 
                    value={userData.drainingPatterns[0] || ''}
                    onChange={(e) => {
                        const newP = [...userData.drainingPatterns];
                        newP[0] = e.target.value;
                        setUserData({...userData, drainingPatterns: newP});
                    }}
                    className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-red-500 outline-none"
                    placeholder="e.g., Over-explaining when I feel insecure..."
                />
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Reframed Boundary</label>
                <textarea 
                    value={userData.reframedBoundaries[0] || ''}
                    onChange={(e) => {
                        const newB = [...userData.reframedBoundaries];
                        newB[0] = e.target.value;
                        setUserData({...userData, reframedBoundaries: newB});
                    }}
                    className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-green-500 outline-none"
                    placeholder="e.g., I will pause before answering to check my energy..."
                />
            </div>
        </div>
      </section>

      {/* Final Anchors */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 rounded-xl border border-primary-500/30">
        <h3 className="text-lg font-semibold text-primary-400 mb-4">Final Core Anchors</h3>
        <p className="text-sm text-slate-400 mb-4">Based on your story patterns, name your 3-5 unique Core Strengths.</p>
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
          onClick={() => { showNotification('Anchors Locked In'); setView('phase3'); }}
          className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
        >
          Proceed to Phase 3 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const Phase3View = () => (
    <div className="space-y-8">
      <header className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Phase 3: 5% Shift Practices</h2>
        <p className="text-slate-400">Don't overhaul your life. Shift it by 5% using your Anchors.</p>
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
                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Territory</label>
                        <select 
                            value={shift.territory}
                            onChange={(e) => updateShift(shift.id, 'territory', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:ring-1 focus:ring-primary-500"
                        >
                            {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Powering Anchor</label>
                        <select 
                             value={shift.anchorId}
                             onChange={(e) => updateShift(shift.id, 'anchorId', e.target.value)}
                             className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:ring-1 focus:ring-primary-500"
                        >
                            <option value="">Select an Anchor...</option>
                            {userData.coreAnchors.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs uppercase font-bold text-primary-400">The 5% Shift (Action)</label>
                        <button 
                             onClick={() => handleSuggestShifts(shift.id, shift.territory, shift.anchorId)}
                             disabled={suggestingShiftId === shift.id || !shift.territory || !shift.anchorId}
                             className="text-xs flex items-center gap-1 text-primary-400 hover:text-primary-300 disabled:opacity-50"
                        >
                             {suggestingShiftId === shift.id ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}
                             Suggest Ideas
                        </button>
                    </div>
                    
                    {/* Suggestions Area */}
                    {shiftSuggestions[shift.id] && (
                        <div className="mb-3 flex flex-col gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                             <span className="text-xs text-slate-500 flex items-center gap-1"><Lightbulb size={12}/> Select an idea:</span>
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
                        placeholder="What is the small, observable action you will take?"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>
        ))}

        <button 
            onClick={addShift}
            className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-primary-400 hover:border-primary-500/50 transition-colors flex justify-center items-center gap-2"
        >
            <Plus size={20} /> Add New Shift Practice
        </button>
      </div>

       <div className="flex justify-end pt-6">
        <button 
          onClick={() => { showNotification('System Ready'); setView('dashboard'); }}
          className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors flex items-center gap-2"
        >
          Go to Dashboard <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const DashboardView = () => {
    // Simple data for the chart
    const data = userData.dailyLogs.slice(0, 7).reverse().map(log => ({
        name: new Date(log.date).toLocaleDateString(undefined, {weekday: 'short'}),
        logged: 1
    }));

    const [todayLog, setTodayLog] = useState({
        anchor: '',
        reflection: ''
    });

    const handleLogSubmit = () => {
        if(!todayLog.anchor || !todayLog.reflection) return;
        addDailyLog({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            anchorUsed: todayLog.anchor,
            reflection: todayLog.reflection
        });
        setTodayLog({ anchor: '', reflection: '' });
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Daily Dashboard</h2>
                    <p className="text-slate-400 text-sm">Consistent small steps create momentum.</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-primary-400">{userData.dailyLogs.length}</div>
                    <div className="text-xs text-slate-500 uppercase">Total Entries</div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Input */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Sun size={20} className="text-yellow-500" /> Today's Log
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Which Anchor did you lean on today?</label>
                            <select 
                                value={todayLog.anchor}
                                onChange={(e) => setTodayLog({...todayLog, anchor: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2"
                            >
                                <option value="">Select Anchor...</option>
                                {userData.coreAnchors.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Reflection: What shifted?</label>
                            <textarea 
                                value={todayLog.reflection}
                                onChange={(e) => setTodayLog({...todayLog, reflection: e.target.value})}
                                className="w-full h-32 bg-slate-800 border border-slate-700 text-white rounded p-3 resize-none focus:ring-1 focus:ring-primary-500"
                                placeholder="I noticed that when I used this anchor..."
                            />
                        </div>
                        <button 
                            onClick={handleLogSubmit}
                            disabled={!todayLog.anchor || !todayLog.reflection}
                            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
                        >
                            Log Entry
                        </button>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Active Shifts Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="font-semibold text-white mb-4 text-sm uppercase text-slate-500">Active Shifts</h3>
                        <div className="space-y-3">
                            {userData.shifts.length > 0 ? userData.shifts.slice(0, 3).map(shift => (
                                <div key={shift.id} className="text-sm border-l-2 border-primary-500 pl-3">
                                    <div className="text-slate-200">{shift.practice}</div>
                                    <div className="text-xs text-slate-500 mt-1">{shift.territory}</div>
                                </div>
                            )) : <div className="text-slate-500 text-sm">No active shifts defined.</div>}
                        </div>
                    </div>

                    {/* Simple Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-48">
                         <h3 className="font-semibold text-white mb-2 text-sm uppercase text-slate-500">Momentum</h3>
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.length ? data : [{name: 'Today', logged: 0}]}>
                                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#fff'}}
                                    cursor={{fill: '#334155', opacity: 0.2}}
                                />
                                <Bar dataKey="logged" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Recent Entries</h3>
                <div className="space-y-4">
                    {userData.dailyLogs.length > 0 ? userData.dailyLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-primary-400 font-medium text-sm">{log.anchorUsed}</span>
                                <span className="text-slate-500 text-xs">{new Date(log.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-300 text-sm">{log.reflection}</p>
                        </div>
                    )) : <div className="text-slate-500 text-center py-4">No entries yet. Start today!</div>}
                </div>
            </div>
        </div>
    );
  };

  // Simple Weekly View Placeholder
  const WeeklyView = () => (
      <div className="max-w-2xl mx-auto text-center py-12">
          <Calendar size={48} className="mx-auto text-primary-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Weekly Reflection</h2>
          <p className="text-slate-400 mb-8">Take a moment to look back at the week. What patterns emerged?</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-left space-y-4">
               {['What were my wins?', 'What drained me?', 'What do I need to focus on next week?'].map((q, i) => (
                   <div key={i}>
                       <label className="block text-sm text-slate-400 mb-2">{q}</label>
                       <textarea className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" />
                   </div>
               ))}
               <button onClick={() => showNotification("Weekly reflection saved.")} className="w-full bg-primary-600 text-white py-2 rounded">Save Reflection</button>
          </div>
      </div>
  );

  // Simple Quarterly View Placeholder
  const QuarterlyView = () => (
     <div className="max-w-2xl mx-auto text-center py-12">
          <TrendingUp size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Quarterly Check-In</h2>
          <p className="text-slate-400 mb-8">Review your trajectory. Are your anchors still holding?</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-left space-y-4">
               {['What has shifted significantly?', 'Where am I creating flow?', 'What needs adjustment?'].map((q, i) => (
                   <div key={i}>
                       <label className="block text-sm text-slate-400 mb-2">{q}</label>
                       <textarea className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-3 text-white focus:ring-1 focus:ring-primary-500" />
                   </div>
               ))}
               <button onClick={() => showNotification("Quarterly check-in saved.")} className="w-full bg-primary-600 text-white py-2 rounded">Save Check-In</button>
          </div>
      </div>
  );


  return (
    <Layout currentView={view} setView={setView}>
      {view === 'welcome' && <WelcomeView />}
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
      <Coach userData={userData} />
    </Layout>
  );
}