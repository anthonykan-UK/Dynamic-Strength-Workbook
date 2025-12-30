
import React, { useState, useRef, useEffect } from 'react';
import { UserData, Language, Story, TERRITORIES, ViewState } from '../types';
import { TRANSLATIONS } from '../translations';
import { streamCoachResponse } from '../services/ai';
import { MessageCircle, X, Send, Sparkles, Loader2, Save, Check, Award, BookOpen, Anchor, Compass, Scale, ShieldAlert, BatteryWarning } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GenerateContentResponse } from '@google/genai';

interface CoachProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>; // Now can update data
  language: Language;
  triggerPrompt?: string; // Allow external triggering
  onCloseTrigger?: () => void;
  // Navigation Props for Smart Close
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
  
  // Track if user saved anything in this session
  const [hasSavedData, setHasSavedData] = useState(false);

  // Initialize or handle external trigger
  useEffect(() => {
     if (messages.length === 0) {
         setMessages([{ role: 'model', text: t.coachWelcome }]);
     }
  }, [language, t.coachWelcome]);

  useEffect(() => {
      if (triggerPrompt) {
          setIsOpen(true);
          // Small delay to ensure render
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
  }, [messages, isOpen]);

  const handleClose = () => {
      setIsOpen(false);
      // Smart Close: If user saved data in early stages, jump to Phase 1
      if (hasSavedData && (currentView === 'welcome' || currentView === 'discovery')) {
          onViewChange('phase1');
          onNotify(t.notifications.jumpingToPhase1);
      }
      setHasSavedData(false); // Reset session tracking
  };

  const handleToolAction = (index: number, action: 'save' | 'dismiss') => {
      const msg = messages[index];
      if (!msg.toolCall) return;

      if (action === 'save') {
          setHasSavedData(true); // Mark session as productive
          const { name, args } = msg.toolCall;
          
          // Execute the update based on tool name
          if (name === 'proposeStrength') {
              const newStrengths = [...userData.assessmentStrengths];
              const emptyIdx = newStrengths.findIndex(s => !s);
              if (emptyIdx !== -1) newStrengths[emptyIdx] = args.strength;
              else newStrengths.push(args.strength);
              
              setUserData(prev => ({...prev, assessmentStrengths: newStrengths.slice(0, 5)})); 
          } 
          else if (name === 'proposeStory') {
              const newStory: Story = {
                  id: crypto.randomUUID(),
                  text: args.text,
                  pattern: args.pattern
              };
              setUserData(prev => ({...prev, externalStories: [...prev.externalStories, newStory]}));
          }
          else if (name === 'proposeInternalAudit') {
              // Append to existing text with a newline if it exists
              const type = args.type as 'momentum' | 'draining';
              setUserData(prev => {
                  const currentText = prev.internalAudit[type];
                  const newText = currentText ? `${currentText}\n\n- ${args.insight}` : `- ${args.insight}`;
                  return {
                      ...prev,
                      internalAudit: {
                          ...prev.internalAudit,
                          [type]: newText
                      }
                  };
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
                      // Append to the first slot if it exists, or set it
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
    
    // Optimistic UI for User Message
    const userMsgObj: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);

    try {
      // We pass text content to AI
      const history = messages.filter(m => m.text).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const stream = await streamCoachResponse(textToSend, userData, history, language);
      
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        
        // Manual Text Extraction to avoid "non-text parts" warning from SDK getter
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

        // Handle Function Calls (Tools)
        for (const part of parts) {
            if (part.functionCall) {
                const fc = part.functionCall;
                // Add a SEPARATE message for the tool card
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

  // --- Render Helper for Tool Cards ---
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
              <div className={`bg-slate-800 border-2 ${colorClass} rounded-xl p-4 w-[85%] shadow-lg relative overflow-hidden`}>
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
                          <Save size={16} /> Save to Workbook
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
        <button onClick={handleClose} className="hover:bg-primary-500 p-1 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.map((msg, idx) => {
            if (msg.toolCall) return renderToolCard(msg, idx);
            if (!msg.text) return null; // Skip empty text placeholders

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
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-lg rounded-bl-none border border-slate-700">
              <Loader2 className="animate-spin text-primary-500" size={16} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-primary-600 rounded-full text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
