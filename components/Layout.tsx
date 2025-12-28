import React from 'react';
import { ViewState } from '../types';
import { 
  BookOpen, 
  Target, 
  Compass, 
  LayoutDashboard, 
  Calendar, 
  BarChart,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="text-primary-500" />
            Dynamic Strength
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-4">Setup</div>
          <NavItem view="welcome" icon={BookOpen} label="Introduction" />
          <NavItem view="phase1" icon={Target} label="Phase 1: Externalize" />
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">Core Workbook</div>
          <NavItem view="phase2" icon={Compass} label="Phase 2: Resources" />
          <NavItem view="phase3" icon={LayoutDashboard} label="Phase 3: Landscape" />
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">Ongoing System</div>
          <NavItem view="dashboard" icon={LayoutDashboard} label="Daily Dashboard" />
          <NavItem view="weekly" icon={Calendar} label="Weekly Reflection" />
          <NavItem view="quarterly" icon={BarChart} label="Quarterly Check-In" />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between p-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
           <Compass className="text-primary-500" size={20}/> Dynamic Strength
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-200">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-30 pt-20 px-4 space-y-2 md:hidden">
            <NavItem view="welcome" icon={BookOpen} label="Introduction" />
            <NavItem view="phase1" icon={Target} label="Phase 1: Externalize" />
            <NavItem view="phase2" icon={Compass} label="Phase 2: Resources" />
            <NavItem view="phase3" icon={LayoutDashboard} label="Phase 3: Landscape" />
            <NavItem view="dashboard" icon={LayoutDashboard} label="Daily Dashboard" />
            <NavItem view="weekly" icon={Calendar} label="Weekly Reflection" />
            <NavItem view="quarterly" icon={BarChart} label="Quarterly Check-In" />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-20 md:pt-0 p-6 md:p-12 max-w-5xl mx-auto w-full scroll-smooth">
        {children}
      </main>
    </div>
  );
};