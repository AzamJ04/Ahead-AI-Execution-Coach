import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  TrendingUp, 
  Plus, 
  Rocket,
  LogOut
} from 'lucide-react';
import { ScreenType, UserProfile } from '../types';

interface SidebarProps {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  user: UserProfile;
  onAddTaskClick?: () => void;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

export default function Sidebar({ currentScreen, setScreen, user, onAddTaskClick, onSignOut, onSignIn }: SidebarProps) {
  return (
    <nav className="hidden md:flex flex-col h-full py-8 px-4 w-64 h-screen fixed left-0 top-0 bg-white border-r-[3px] border-[#1e293b] z-50">
      {/* Brand */}
      <div className="px-4 mb-8 flex items-center gap-4">
        <img
          alt="Ahead logo"
          src="/app-logo.png"
          className="w-14 h-14 rounded-2xl object-cover shadow-[3px_3px_0px_#1e293b] border-2 border-[#1e293b]"
        />
        <div>
          <h1 className="font-display text-2xl font-black text-[#1e293b] leading-none">Ahead</h1>
          <p className="text-xs text-[#10b981] font-mono tracking-widest mt-1.5 uppercase font-black">Stay Ahead</p>
        </div>
      </div>

      {/* Quick Add CTA */}
      <div className="px-2 mb-6">
        <button 
          onClick={onAddTaskClick}
          className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-black border-2 border-[#1e293b] shadow-clay-btn hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b] active:shadow-clay-btn-active active:translate-x-[2px] active:translate-y-[2px] rounded-xl py-3 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="text-sm">Quick Add</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-2.5 px-2">
        <button
          onClick={() => setScreen('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer border-2 ${
            currentScreen === 'dashboard'
              ? 'bg-[#bfdbfe] text-[#1e293b] border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b] font-black'
              : 'bg-transparent border-transparent text-[#475569] hover:text-[#1e293b] hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 group-hover:scale-110 transition-transform duration-300 ${currentScreen === 'dashboard' ? 'text-[#1e293b] stroke-[2.5]' : ''}`} />
          <span className="text-sm">Dashboard</span>
        </button>

        <button
          onClick={() => setScreen('tasks')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer border-2 ${
            currentScreen === 'tasks'
              ? 'bg-[#bfdbfe] text-[#1e293b] border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b] font-black'
              : 'bg-transparent border-transparent text-[#475569] hover:text-[#1e293b] hover:bg-slate-50'
          }`}
        >
          <CheckSquare className={`w-5 h-5 group-hover:scale-110 transition-transform duration-300 ${currentScreen === 'tasks' ? 'text-[#1e293b] stroke-[2.5]' : ''}`} />
          <span className="text-sm">Tasks</span>
        </button>

        <button
          onClick={() => setScreen('execution_plan')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer border-2 ${
            currentScreen === 'execution_plan'
              ? 'bg-[#bfdbfe] text-[#1e293b] border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b] font-black'
              : 'bg-transparent border-transparent text-[#475569] hover:text-[#1e293b] hover:bg-slate-50'
          }`}
        >
          <TrendingUp className={`w-5 h-5 group-hover:scale-110 transition-transform duration-300 ${currentScreen === 'execution_plan' ? 'text-[#1e293b] stroke-[2.5]' : ''}`} />
          <span className="text-sm">Execution Plan</span>
        </button>
      </div>

      {/* User profile */}
      <div className="flex flex-col gap-2">
        <div className="p-3 bg-white border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] rounded-2xl flex items-center justify-between mx-2">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              alt="User Profile" 
              className="w-10 h-10 rounded-full object-cover border-2 border-[#1e293b] shadow-sm shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhOw3swYZ_-MAwCBFTGH3XfDjxPHHWphxepIfv-Lt9w0whcZH6u0HFtB5T8xdstzfHMY-yBqs18MFzhz1bBBjh-gjx92dC8pf1JODa0U3neaC_SezzJAzJ8LCLpZQfkZrCs8-PZLMscxT7S6BBQV9NQxhkR2PsPMJZz4aKt2CDfFPmT2a5S1mxgucjrAMI6cOYL9UwfSviE5DwU9qlnG8-DGvm1Ph8vmrwARno4IQamTirDdtn0LC2otvsEpfccUp2Eqpowusl_kU"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-[#1e293b] truncate">{user.firstName || 'Alex Doe'}</span>
              <span className="text-[9px] text-[#065f46] bg-[#a7f3d0] border border-[#1e293b] shadow-[1px_1px_0px_#1e293b] px-2 py-0.5 rounded-full font-black w-fit mt-0.5 uppercase tracking-wide">
                {user.role || 'Pro Plan'}
              </span>
            </div>
          </div>
          {user.signedIn && onSignOut && (
            <button 
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg border-2 border-[#1e293b] bg-white text-[#1e293b] hover:text-red-500 hover:bg-red-50 hover:shadow-[1px_1px_0px_#1e293b] transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
        {!user.signedIn && onSignIn && (
          <div className="px-2">
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] text-[#1e293b] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span className="text-xs font-black">Sign In with Google</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
