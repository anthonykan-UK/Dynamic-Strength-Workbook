import React from 'react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { 
  BookOpen, 
  Target, 
  Compass, 
  LayoutDashboard, 
  Calendar, 
  BarChart,
  Menu,
  X,
  Search,
  Globe
} from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, language, setLanguage, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const t = TRANSLATIONS[language];

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
        currentView === view
          ? 'bg-primary-600/10 text-primary-400 border-l-4 border-primary-500'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const LanguageToggle = () => (
    <div className="px-4 py-3 mb-2 flex items-center justify-between bg-slate-800 rounded-lg mx-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Globe size={16} />
        <span>{language === 'en-GB' ? 'Language' : '語言'}</span>
      </div>
      <div className="flex bg-slate-900 rounded p-1">
         <button 
           onClick={() => setLanguage('en-GB')}
           className={`px-2 py-1 text-xs rounded transition-colors ${language === 'en-GB' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
         >
           EN
         </button>
         <button 
           onClick={() => setLanguage('zh-HK')}
           className={`px-2 py-1 text-xs rounded transition-colors ${language === 'zh-HK' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
         >
           繁
         </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="text-primary-500" />
            {t.title}
          </h1>
        </div>
        
        {/* Language Toggle - Moved to Upper Left */}
        <div className="pt-6">
             <LanguageToggle />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-4">{t.setup}</div>
          <NavItem view="welcome" icon={BookOpen} label={t.intro} />
          <NavItem view="discovery" icon={Search} label={t.discovery} />
          <NavItem view="phase1" icon={Target} label={t.phase1} />
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">{t.workbook}</div>
          <NavItem view="phase2" icon={Compass} label={t.phase2} />
          <NavItem view="phase3" icon={LayoutDashboard} label={t.phase3} />
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">{t.system}</div>
          <NavItem view="dashboard" icon={LayoutDashboard} label={t.dashboard} />
          <NavItem view="weekly" icon={Calendar} label={t.weekly} />
          <NavItem view="quarterly" icon={BarChart} label={t.quarterly} />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between p-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
           <Compass className="text-primary-500" size={20}/> {t.title}
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-200">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-30 pt-20 px-4 space-y-2 md:hidden">
            <LanguageToggle />
            <NavItem view="welcome" icon={BookOpen} label={t.intro} />
            <NavItem view="discovery" icon={Search} label={t.discovery} />
            <NavItem view="phase1" icon={Target} label={t.phase1} />
            <NavItem view="phase2" icon={Compass} label={t.phase2} />
            <NavItem view="phase3" icon={LayoutDashboard} label={t.phase3} />
            <NavItem view="dashboard" icon={LayoutDashboard} label={t.dashboard} />
            <NavItem view="weekly" icon={Calendar} label={t.weekly} />
            <NavItem view="quarterly" icon={BarChart} label={t.quarterly} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-24 md:pt-12 p-6 md:p-12 max-w-5xl mx-auto w-full scroll-smooth">
        {children}
      </main>
    </div>
  );
};