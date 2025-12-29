
import React, { useState } from 'react';
import { TRANSLATIONS } from '../translations';
import { Language } from '../types';
import { X, BookOpen, GitBranch, Key, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HelpGuideProps {
    language: Language;
    onClose: () => void;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ language, onClose }) => {
    const t = TRANSLATIONS[language];
    const [activeTab, setActiveTab] = useState<'start' | 'phases' | 'glossary'>('start');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-primary-500" size={24} />
                        {t.helpTitle}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900/50">
                    <button 
                        onClick={() => setActiveTab('start')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'start' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                       <CheckCircle2 size={16} /> {t.helpTabs.start}
                    </button>
                    <button 
                        onClick={() => setActiveTab('phases')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'phases' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                       <GitBranch size={16} /> {t.helpTabs.phases}
                    </button>
                    <button 
                        onClick={() => setActiveTab('glossary')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'glossary' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                       <Key size={16} /> {t.helpTabs.glossary}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-900 custom-scrollbar">
                    
                    {activeTab === 'start' && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-2">{t.helpTabs.start}</h3>
                            <div className="space-y-3">
                                {t.helpContent.start.map((line, i) => (
                                    <div key={i} className="text-slate-300 leading-relaxed text-sm bg-slate-800/50 p-4 rounded-lg border border-slate-800">
                                        <ReactMarkdown 
                                            components={{
                                                strong: ({node, ...props}) => <span className="text-primary-400 font-bold" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc pl-4 mt-2 space-y-1" {...props} />,
                                                li: ({node, ...props}) => <li className="text-slate-400" {...props} />
                                            }}
                                        >
                                            {line}
                                        </ReactMarkdown>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'phases' && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-2">{t.helpTabs.phases}</h3>
                            <div className="relative border-l-2 border-slate-700 ml-3 space-y-8 pl-8 py-2">
                                {t.helpContent.phases.map((phase, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-slate-900 border-2 border-primary-500 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-primary-500 rounded-full" />
                                        </div>
                                        <h4 className="text-white font-bold text-sm mb-1">{phase.title}</h4>
                                        <p className="text-slate-400 text-xs leading-relaxed max-w-md">{phase.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'glossary' && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-2">{t.helpTabs.glossary}</h3>
                            <div className="grid gap-3">
                                {t.definitions.map((def, i) => (
                                    <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                        <div className="text-primary-400 font-bold text-sm mb-1 uppercase tracking-wide">{def.term}</div>
                                        <div className="text-slate-300 text-sm leading-relaxed">{def.def}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {t.helpClose}
                    </button>
                </div>
            </div>
        </div>
    );
};
