
import React, { useState, useRef, useEffect } from 'react';
import { UserData, Language, Story, TERRITORIES, ViewState } from '../types';
import { TRANSLATIONS } from '../translations';
import { streamCoachResponse } from '../services/ai';
import { LiveClient } from '../services/live';
import { MessageCircle, X, Send, Sparkles, Loader2, Save, Check, Award, BookOpen, Anchor, Compass, Scale, ShieldAlert, BatteryWarning, Headphones, Mic, MicOff, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GenerateContentResponse } from '@google/genai';

// --- FEATURE FLAG ---
// Set to TRUE only when Voice AI is fully tested and native-sounding.
// Currently disabled to prevent poor UX (interruptions, robotic tone).
const VOICE_MODE_ENABLED = false;

interface CoachProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>; 
  language: Language;
  triggerPrompt?: string; 
  onCloseTrigger?: () => void;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  onNotify: (msg: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text?: string;
  toolCall?: {
      id: string;
      name: string;
      args: any;
      status: 'pending' | 'saved' | 'dismissed';
  };
}

export const Coach: React.FC<CoachProps> = ({ userData, setUserData, language, triggerPrompt, onCloseTrigger, currentView, onViewChange, onNotify }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const t = TRANSLATIONS[language];
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasSavedData, setHasSavedData] = useState(false);

  // --- Voice Mode State ---
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'connecting' | 'active' | 'error' | null>(null);
  const liveClientRef = useRef<LiveClient | null>(null);

  // Initialize Default Message
  useEffect(() => {
     if (messages.length === 0) {
         setMessages([{ role: 'model', text: t.coachWelcome }]);
     }
  }, [language, t.coachWelcome]);

  // Handle Trigger
  useEffect(() => {
      if (triggerPrompt) {
          setIsOpen(true);
          // If triggered, we default to TEXT mode for consistency
          setIsVoiceMode(false);
          setTimeout(() => {
              handleSend(triggerPrompt);
              if(onCloseTrigger) onCloseTrigger();
          }, 100);
      }
  }, [triggerPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isVoiceMode]);

  // --- Voice Mode Logic (Dormant when VOICE_MODE_ENABLED is false) ---
  const toggleVoiceMode = async () => {
      if (!VOICE_MODE_ENABLED) return;

      if (isVoiceMode) {
          // Turn OFF
          if (liveClientRef.current) {
              liveClientRef.current.disconnect(() => {});
              liveClientRef.current = null;
          }
          setIsVoiceMode(false);
          setVoiceStatus(null);
      } else {
          // Turn ON
          setIsVoiceMode(true);
          setVoiceStatus('connecting');
          
          if (!liveClientRef.current) {
              liveClientRef.current = new LiveClient();
          }

          try {
              await liveClientRef.current.connect(
                  userData,
                  language,
                  // onMessage (Transcript)
                  (text, isFinal) => {
                      // Optional: Show transcript as it comes in
                  },
                  // onToolCall
                  (toolCall) => {
                      setMessages(prev => [...prev, {
                          role: 'model',
                          toolCall: {
                              id: toolCall.id,
                              name: toolCall.name,
                              args: toolCall.args,
                              status: 'pending'
                          }
                      }]);
                  },
                  // onStatusChange
                  (isActive) => setVoiceStatus(isActive ? 'active' : null)
              );
          } catch (e) {
              setVoiceStatus('error');
              setTimeout(() => {
                  setIsVoiceMode(false);
                  setVoiceStatus(null);
                  onNotify("Microphone access needed for Voice Mode");
              }, 3000);
          }
      }
  };

  // Cleanup on unmount or close
  useEffect(() => {
      return () => {
          if (liveClientRef.current) {
              liveClientRef.current.disconnect(() => {});
          }
      };
  }, []);

  const handleClose = () => {
      setIsOpen(false);
      // Clean up voice if active
      if (isVoiceMode) toggleVoiceMode();
      
      if (hasSavedData && (currentView === 'welcome' || currentView === 'discovery')) {
          onViewChange('phase1');
          onNotify(t.notifications.jumpingToPhase1);
      }
      setHasSavedData(false);
  };

  // --- SHARED TOOL LOGIC ---
  const handleToolAction = (index: number, action: 'save' | 'dismiss') => {
      const msg = messages[index];
      if (!msg.toolCall) return;

      if (action === 'save') {
          setHasSavedData(true);
          const { name, args } = msg.toolCall;
          
          if (name === 'proposeStrength') {
              const strength = args.strength;
              setUserData(prev => {
                  if (prev.strengthPool.includes(strength)) return prev;
                  return { ...prev, strengthPool: [...prev.strengthPool, strength] };
              });
          } 
          else if (name === 'proposeStory') {
              const newStory: Story = {
                  id: crypto.randomUUID(),
                  text: args.text,
                  pattern: args.pattern,
                  action: args.action,
                  feeling: args.feeling
              };
              setUserData(prev => ({...prev, evidenceBank: [...prev.evidenceBank, newStory]}));
          }
          else if (name === 'proposeInternalAudit') {
              const type = args.type as 'momentum' | 'draining';
              setUserData(prev => {
                  const currentText = prev.internalAudit[type];
                  const newText = currentText ? `${currentText}\n\n- ${args.insight}` : `- ${args.insight}`;
                  return { ...prev, internalAudit: { ...prev.internalAudit, [type]: newText } };
              });
          }
          else if (name === 'proposeAnchor') {
              const newAnchors = [...userData.coreAnchors];
              const emptyIdx = newAnchors.findIndex(a => !a);
              if (emptyIdx !== -1) newAnchors[emptyIdx] = args.anchor;
              else newAnchors.push(args.anchor);
              setUserData(prev => ({...prev, coreAnchors: newAnchors.slice(0, 5)}));
          }
          else if (name === 'proposeBoundary') {
              const { type, content } = args;
              if (type === 'pattern') {
                  setUserData(prev => {
                      const current = prev.drainingPatterns[0];
                      const newP = current ? `${current}\n- ${content}` : content;
                      const newArr = [...prev.drainingPatterns];
                      newArr[0] = newP;
                      return { ...prev, drainingPatterns: newArr };
                  });
              } else {
                  setUserData(prev => {
                      const current = prev.reframedBoundaries[0];
                      const newB = current ? `${current}\n- ${content}` : content;
                      const newArr = [...prev.reframedBoundaries];
                      newArr[0] = newB;
                      return { ...prev, reframedBoundaries: newArr };
                  });
              }
          }
          else if (name === 'proposeShift') {
              const newShift = {
                  id: crypto.randomUUID(),
                  territory: args.territory || TERRITORIES[0],
                  practice: args.practice,
                  anchorId: args.anchorId || ''
              };
              setUserData(prev => ({...prev, shifts: [...prev.shifts, newShift]}));
          }

          setMessages(prev => prev.map((m, i) => i === index ? { ...m, toolCall: { ...m.toolCall!, status: 'saved' } } : m));
      } else {
          setMessages(prev => prev.map((m, i) => i === index ? { ...m, toolCall: { ...m.toolCall!, status: 'dismissed' } } : m));
      }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    if (!overrideInput) setInput('');
    
    const userMsgObj: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.text).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const stream = await streamCoachResponse(textToSend, userData, history, language);
      
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const parts = c.candidates?.[0]?.content?.parts || [];
        let chunkText = "";
        
        for (const part of parts) {
            if (part.text) chunkText += part.text;
        }

        if (chunkText) {
            fullResponse += chunkText;
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg.role === 'model') {
                    lastMsg.text = fullResponse;
                }
                return newMsgs;
            });
        }

        for (const part of parts) {
            if (part.functionCall) {
                const fc = part.functionCall;
                setMessages(prev => [...prev, {
                    role: 'model',
                    toolCall: {
                        id: crypto.randomUUID(),
                        name: fc.name,
                        args: fc.args,
                        status: 'pending'
                    }
                }]);
            }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: t.coachError }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Tool Card ---
  const renderToolCard = (msg: ChatMessage, index: number) => {
      if (!msg.toolCall) return null;
      const { name, args, status } = msg.toolCall;
      
      let title = "";
      let icon = null;
      let content = "";
      let colorClass = "border-primary-500/50";
      let iconColor = "text-primary-400";

      if (name === 'proposeStrength') {
          title = "Strength Discovered";
          icon = <Award size={20}/>;
          content = args.strength;
      } else if (name === 'proposeStory') {
          title = "Evidence Story";
          icon = <BookOpen size={20}/>;
          content = `"${args.text.substring(0, 50)}..."`;
          iconColor = "text-blue-400";
          colorClass = "border-blue-500/50";
      } else if (name === 'proposeInternalAudit') {
          if (args.type === 'momentum') {
              title = "Momentum (Internal Audit)";
              icon = <Scale size={20}/>;
              content = args.insight;
              iconColor = "text-green-400";
              colorClass = "border-green-500/50";
          } else {
              title = "Energy Drain (Internal Audit)";
              icon = <BatteryWarning size={20}/>;
              content = args.insight;
              iconColor = "text-red-400";
              colorClass = "border-red-500/50";
          }
      } else if (name === 'proposeAnchor') {
          title = "Core Anchor Identified";
          icon = <Anchor size={20}/>;
          content = args.anchor;
          iconColor = "text-yellow-400";
          colorClass = "border-yellow-500/50";
      } else if (name === 'proposeBoundary') {
          if (args.type === 'pattern') {
              title = "Draining Pattern";
              icon = <ShieldAlert size={20}/>;
              content = args.content;
              iconColor = "text-orange-400";
              colorClass = "border-orange-500/50";
          } else {
              title = "Reframed Boundary";
              icon = <Check size={20}/>;
              content = args.content;
              iconColor = "text-teal-400";
              colorClass = "border-teal-500/50";
          }
      } else if (name === 'proposeShift') {
          title = "5% Shift Action";
          icon = <Compass size={20}/>;
          content = `${args.practice} (${args.territory})`;
          iconColor = "text-green-400";
          colorClass = "border-green-500/50";
      }

      if (status === 'saved') {
          return (
              <div key={index} className="flex justify-start w-full animate-fade-in my-2">
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 flex items-center gap-3 text-base text-green-200">
                      <Check size={18} /> Saved: <strong>{content.substring(0, 30)}{content.length > 30 ? '...' : ''}</strong>
                  </div>
              </div>
          );
      }

      if (status === 'dismissed') return null;

      return (
          <div key={index} className="flex justify-start w-full animate-fade-in my-2">
              <div className={`bg-slate-800 border-2 ${colorClass} rounded-xl p-4 w-[90%] shadow-lg relative overflow-hidden z-20`}>
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Sparkles size={40}/></div>
                  <div className={`flex items-center gap-2 mb-2 ${iconColor} font-semibold text-base uppercase tracking-wide`}>
                      {React.cloneElement(icon as React.ReactElement<any>, { className: iconColor })} {title}
                  </div>
                  <div className="text-white text-base font-medium mb-3 leading-relaxed">
                      {content}
                  </div>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => handleToolAction(index, 'dismiss')}
                          className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 transition-colors"
                      >
                          Dismiss
                      </button>
                      <button 
                          onClick={() => handleToolAction(index, 'save')}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 transition-colors flex items-center justify-center gap-2"
                      >
                          <Save size={16} /> Save
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary-600 hover:bg-primary-500 rounded-full shadow-lg flex items-center justify-center transition-all z-50 text-white"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-850 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h3 className="font-semibold text-base">{t.strengthCoachTitle}</h3>
        </div>
        <div className="flex items-center gap-2">
            {VOICE_MODE_ENABLED && (
                <button 
                    onClick={toggleVoiceMode}
                    className={`p-2 rounded-lg transition-colors ${isVoiceMode ? 'bg-white text-primary-600' : 'hover:bg-primary-500 text-white'}`}
                    title={isVoiceMode ? t.textMode : t.voiceMode}
                >
                    {isVoiceMode ? <Mic size={18} className="animate-pulse" /> : <Headphones size={18} />}
                </button>
            )}
            <button onClick={handleClose} className="hover:bg-primary-500 p-1 rounded">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 relative">
        {/* VOICE MODE VISUALIZER OVERLAY */}
        {isVoiceMode && VOICE_MODE_ENABLED && (
            <div className="absolute inset-0 z-10 bg-slate-900/90 backdrop-blur flex flex-col items-center justify-center text-center p-6 space-y-6">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                    voiceStatus === 'active' ? 'bg-primary-500/20 shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse' : 'bg-slate-800'
                }`}>
                    {voiceStatus === 'connecting' && <Loader2 size={40} className="text-primary-400 animate-spin" />}
                    {voiceStatus === 'active' && <Mic size={40} className="text-primary-400" />}
                    {voiceStatus === 'error' && <AlertCircle size={40} className="text-red-400" />}
                </div>
                
                <div className="space-y-2">
                    <h4 className="text-lg font-bold text-white">
                        {voiceStatus === 'connecting' ? t.voiceConnecting : 
                         voiceStatus === 'active' ? t.voiceActive : 
                         voiceStatus === 'error' ? "Connection Error" : "Ready"}
                    </h4>
                    <p className="text-sm text-slate-400 max-w-[200px] mx-auto">
                        {voiceStatus === 'active' ? "Speak naturally. I'll listen for strengths." : "Connecting to Gemini Live..."}
                    </p>
                </div>

                <button 
                    onClick={toggleVoiceMode}
                    className="px-6 py-2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                    {t.voiceStop}
                </button>
            </div>
        )}

        {/* Regular Chat Messages (Underneath or Visible if Text Mode) */}
        {messages.map((msg, idx) => {
            if (msg.toolCall) return renderToolCard(msg, idx);
            if (!msg.text) return null;

            return (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 text-base leading-relaxed ${
                    msg.role === 'user' 
                        ? 'bg-primary-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                </div>
            );
        })}
        {isLoading && !isVoiceMode && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-lg rounded-bl-none border border-slate-700">
              <Loader2 className="animate-spin text-primary-500" size={16} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Hidden if Voice Mode is Active */}
      {!isVoiceMode && (
          <div className="p-3 bg-slate-850 border-t border-slate-700">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.askGuidance}
                className="w-full bg-slate-900 border border-slate-700 rounded-full py-3 px-4 pr-12 text-base text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                 <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-primary-600 rounded-full text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed w-8 h-8 flex items-center justify-center"
                 >
                    <Send size={14} />
                 </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};
