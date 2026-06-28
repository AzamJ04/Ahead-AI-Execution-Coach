import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Brain, 
  Compass, 
  Briefcase, 
  Globe, 
  Calendar,
  Coffee,
  CheckCircle2,
  Lightbulb,
  Clock,
  RefreshCw
} from 'lucide-react';
import Sidebar from './Sidebar';
import { ScreenType, Task, UserProfile, ExecutionPlan } from '../types';

interface ExecutionPlanScreenProps {
  user: UserProfile;
  setScreen: (screen: ScreenType) => void;
  tasks: Task[];
  executionPlan: ExecutionPlan | null;
  onReplan: (reason: string) => Promise<ExecutionPlan | null>;
  onSignOut?: () => void;
  onSignIn?: () => void;
  onAddTaskClick?: () => void;
}

export default function ExecutionPlanScreen({ 
  user, 
  setScreen, 
  tasks, 
  executionPlan, 
  onReplan, 
  onSignOut,
  onSignIn,
  onAddTaskClick
}: ExecutionPlanScreenProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanMessage, setReplanMessage] = useState('Reviewing your progress...');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const incompleteTasks = tasks.filter(t => (t.progress || 0) < 100);
  const totalMinutes = incompleteTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const totalTasksCount = incompleteTasks.length;
  
  const formattedDeepWorkTime = totalMinutes > 0 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
    : '0h 0m';

  // Dynamic days extracted from execution plan, or standard fallback
  const days = executionPlan?.days || [];
  const hasPlanDays = days.length > 0;
  const activeDay = hasPlanDays ? days[selectedDayIndex] || days[0] : null;

  // Search filter
  const filterQuery = searchQuery.toLowerCase();

  const handleReplanClick = async () => {
    setIsReplanning(true);
    setReplanMessage("Reviewing your progress...");
    
    const messages = [
      "Reviewing your progress...",
      "Checking deadlines...",
      "Redistributing unfinished work...",
      "Optimizing your week...",
      "Almost done..."
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, messages.length - 1);
      setReplanMessage(messages[msgIdx]);
    }, 1500);

    try {
      await onReplan("Replan My Week based on latest progress and deadlines");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    } catch (err) {
      console.error("Replan failed:", err);
    } finally {
      clearInterval(interval);
      setIsReplanning(false);
    }
  };

  // Helper for generating clean time slots starting at 9:00 AM (for fallback view)
  let fallbackHour = 9;
  let fallbackMinute = 0;
  const formatFallbackTime = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const displayMinute = m.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  return (
    <div className="font-sans text-[#1e293b] bg-background min-h-screen flex antialiased">
      {/* Sidebar Navigation */}
      <Sidebar currentScreen="execution_plan" setScreen={setScreen} user={user} onAddTaskClick={onAddTaskClick} onSignOut={onSignOut} onSignIn={onSignIn} />

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 flex flex-col lg:flex-row min-h-screen bg-background">
        
        {/* Center Timeline Area */}
        <div className="flex-1 px-6 md:px-10 py-8 max-w-4xl mx-auto w-full flex flex-col gap-10">
          
          {/* Plan Info Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-[3px] border-[#1e293b] shadow-[4px_4px_0px_#1e293b] text-[#1e293b] rounded-xl mb-2 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#10b981] font-black flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981] animate-pulse" />
                <span>Plan fully optimized by Nova AI Coach.</span>
              </span>
              {executionPlan && (
                <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">Active Session</span>
              )}
            </div>
          </div>

          {/* Heading */}
          <header className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-3xl font-black text-[#1e293b] tracking-tight mb-2">Execution Plan</h2>
              <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#10b981] fill-[#10b981]/10 animate-pulse" />
                <span>Nova has distributed your work load to avoid burnout and hit deadlines.</span>
              </p>
            </div>

            {/* Quick links testing xpath selectors */}
            <div className="flex gap-4 border-b border-[#1e293b]/10 pb-2">
              <a 
                href="#dashboard"
                onClick={(e) => { e.preventDefault(); setScreen('dashboard'); }}
                className="text-sm font-bold text-slate-500 hover:text-[#10b981] transition-colors flex items-center gap-1.5"
              >
                Dashboard
              </a>
              <a 
                href="#tasks"
                onClick={(e) => { e.preventDefault(); setScreen('tasks'); }}
                className="text-sm font-bold text-slate-500 hover:text-[#10b981] transition-colors flex items-center gap-1.5"
              >
                Tasks
              </a>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-white border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-2xl">
              {/* Day selection pill tabs */}
              <div className="flex p-0.5 bg-slate-100 border border-[#1e293b]/20 rounded-xl gap-1">
                {hasPlanDays ? (
                  days.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        selectedDayIndex === idx 
                          ? 'text-white bg-[#10b981] border border-[#1e293b] shadow-[1px_1px_0px_#1e293b]' 
                          : 'text-slate-500 hover:text-[#10b981]'
                      }`}
                    >
                      {day.dayName}
                    </button>
                  ))
                ) : (
                  <>
                    <button className="px-4 py-2 text-xs font-black text-white bg-[#10b981] border border-[#1e293b] rounded-lg shadow-[1px_1px_0px_#1e293b]">Today</button>
                    <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#10b981] rounded-lg transition-colors">Tomorrow</button>
                    <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#10b981] rounded-lg transition-colors">This Week</button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
                {/* Search */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find session..." 
                    className="w-44 pl-10 pr-4 py-2 bg-white border-2 border-[#1e293b] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-inner placeholder:text-slate-400"
                  />
                </div>
                {/* Replan */}
                <button 
                  onClick={handleReplanClick}
                  disabled={isReplanning}
                  className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isReplanning ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Replan My Week</span>
                </button>
              </div>
            </div>
          </header>

          {/* Vertical Timeline list */}
          <div className="relative flex flex-col pb-16">
            {/* Timeline center line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[#1e293b]/10" />

            {/* If we have dynamic execution plan days */}
            {hasPlanDays && activeDay ? (
              (() => {
                const filteredSessions = activeDay.sessions.filter(s => 
                  s.taskTitle.toLowerCase().includes(filterQuery)
                );

                if (filteredSessions.length === 0) {
                  return (
                    <div className="bg-white border-2 border-dashed border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 relative z-10">
                      <Search className="w-10 h-10 text-slate-400" />
                      <h3 className="text-sm font-bold text-slate-500">No sessions match search query</h3>
                    </div>
                  );
                }

                return filteredSessions.map((session, idx) => {
                  const relatedTask = tasks.find(t => t.id === session.taskId || t.title === session.taskTitle);
                  const isHigh = relatedTask?.priority === 'High';

                  return (
                    <div key={session.id || `session-${idx}`} className="relative flex gap-6 mb-8 items-start group">
                      <div className="flex flex-col items-center shrink-0 w-12 z-10">
                        <div className={`w-12 h-12 rounded-full border-2 border-[#1e293b] flex items-center justify-center shadow-[1px_1px_0px_#1e293b] mb-1.5 ${
                          isHigh ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-white text-[#1e293b]'
                        }`}>
                          {relatedTask?.category === 'Work' ? <Briefcase className="w-5 h-5" /> : <Brain className="w-5 h-5 fill-teal-400/10" />}
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap">{session.startTime} - {session.endTime}</span>
                        <span className="text-[9px] text-slate-500 font-bold">{session.duration}m</span>
                      </div>

                      <div className="flex-1 bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px] p-6 text-[#1e293b] transition-all duration-300 relative overflow-hidden">
                        {isHigh && <div className="absolute top-0 left-0 w-1 h-full bg-red-400 border-r border-[#1e293b]" />}
                        {session.completed && (
                          <div className="absolute top-3 right-3 bg-[#e0f2fe] border border-[#1e293b] px-2.5 py-1 rounded-lg text-[9px] font-black text-[#0369a1] flex items-center gap-1 uppercase tracking-wide shadow-[1px_1px_0px_#1e293b]">
                            <CheckCircle2 className="w-3 h-3 text-[#0369a1]" />
                            <span>Done</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="bg-slate-100 border border-[#1e293b] text-slate-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_#1e293b]">
                                <Sparkles className="w-2.5 h-2.5" />
                                Coach Scheduled
                              </span>
                              {relatedTask && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-[1px_1px_0px_#1e293b] ${
                                  isHigh ? 'bg-[#fee2e2] border-[#1e293b] text-[#991b1b]' : 'bg-slate-100 border-[#1e293b] text-slate-500'
                                }`}>
                                  {relatedTask.priority} Priority
                                </span>
                              )}
                            </div>
                            <h3 className={`text-lg font-black text-[#1e293b] transition-colors ${
                              session.completed ? 'line-through text-slate-400' : ''
                            }`}>
                              {session.taskTitle}
                            </h3>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Duration</span>
                            <span className="text-sm font-black text-[#1e293b]">{session.estimatedMinutes} min</span>
                          </div>
                        </div>
                        {relatedTask?.description && !relatedTask.description.includes("Action plan to complete") && (
                          <p className="text-xs text-slate-500 leading-relaxed font-bold mb-6 max-w-lg">
                            {relatedTask.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <span>Category: {relatedTask?.category || "Focus"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            ) : incompleteTasks.length > 0 ? (
              // Fallback listing (determinitic keyword timeline)
              incompleteTasks.map((t, idx) => {
                const timeStr = formatFallbackTime(fallbackHour, fallbackMinute);
                const durationMin = t.estimatedMinutes || 60;
                
                // Advance time
                fallbackMinute += durationMin;
                fallbackHour += Math.floor(fallbackMinute / 60);
                fallbackMinute = fallbackMinute % 60;

                const isHigh = t.priority === "High";

                return (
                  <div key={t.id || `fallback-${idx}`} className="relative flex gap-6 mb-8 items-start group">
                    <div className="flex flex-col items-center shrink-0 w-12 z-10">
                      <div className={`w-12 h-12 rounded-full border-2 border-[#1e293b] flex items-center justify-center shadow-[1px_1px_0px_#1e293b] mb-1.5 ${
                        isHigh ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-white text-[#1e293b]'
                      }`}>
                        {t.category === 'Work' ? <Briefcase className="w-5 h-5" /> : <Brain className="w-5 h-5 fill-teal-400/10" />}
                      </div>
                      <span className="text-[10px] text-slate-655 font-bold whitespace-nowrap">{timeStr}</span>
                      <span className="text-[9px] text-slate-500 font-bold">{durationMin}m</span>
                    </div>

                    <div className="flex-1 bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px] p-6 text-[#1e293b] transition-all duration-300 relative overflow-hidden">
                      {isHigh && <div className="absolute top-0 left-0 w-1 h-full bg-red-400 border-r border-[#1e293b]" />}
                      
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="bg-slate-100 border border-[#1e293b] text-slate-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_#1e293b]">
                              <Sparkles className="w-2.5 h-2.5" />
                              Nova Optimized
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-[1px_1px_0px_#1e293b] ${
                              isHigh ? 'bg-[#fee2e2] border-[#1e293b] text-[#991b1b]' : 'bg-slate-100 border-[#1e293b] text-slate-500'
                            }`}>
                              {t.priority} Priority
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-[#1e293b]">
                            {t.title}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Est. Duration</span>
                          <span className="text-sm font-black text-[#1e293b]">{durationMin} min</span>
                        </div>
                      </div>
                      {t.description && !t.description.includes("Action plan to complete") && (
                        <p className="text-xs text-slate-500 leading-relaxed font-bold mb-6 max-w-lg">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <span>Category: {t.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border-2 border-dashed border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 relative z-10">
                <Brain className="w-12 h-12 text-slate-400 fill-slate-100" />
                <div>
                  <h3 className="text-base font-black text-[#1e293b]">No sessions scheduled</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">Once you submit a brain dump or manually insert tasks, Nova will construct your optimized execution plan.</p>
                </div>
                <button 
                  onClick={() => setScreen('brain_dump')}
                  className="bg-white border-2 border-[#1e293b] text-[#1e293b] shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-y-[2px] active:shadow-none font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Go to Brain Dump
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Sidebar: Today's Summary */}
        <aside className="w-full lg:w-80 bg-slate-50 border-t-2 lg:border-t-0 lg:border-l-2 border-[#1e293b] p-6 flex flex-col gap-8 h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto text-[#1e293b]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-black text-[#1e293b]">Today's Summary</h3>
            <span className="text-xs font-bold text-slate-500">Today</span>
          </div>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border-2 border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b]">
              <div className="text-[#a78bfa] mb-2">
                <Brain className="w-5 h-5 fill-[#a78bfa]/10" />
              </div>
              <div className="text-lg md:text-xl font-black text-[#1e293b]">{formattedDeepWorkTime}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Deep Work</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b]">
              <div className="text-[#10b981] mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-lg md:text-xl font-black text-[#1e293b]">{totalTasksCount}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Tasks Sched.</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b]">
              <div className="text-[#ef4444] mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-lg md:text-xl font-black text-[#1e293b]">{incompleteTasks.length > 0 ? '1' : '0'}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Cal Events</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b]">
              <div className="text-[#f59e0b] mb-2">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="text-lg md:text-xl font-black text-[#1e293b]">2h 00m</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Free Time</div>
            </div>
          </div>

          {/* Nova Insight Suggestion Box */}
          <div className="bg-[#f3e8ff] rounded-[24px] p-5 border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-3 relative z-10">
              <Lightbulb className="w-4.5 h-4.5 text-[#a78bfa] fill-[#a78bfa]/10" />
              <span className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest">Nova Insight</span>
            </div>
            <p className="text-xs text-slate-655 font-bold relative z-10 leading-relaxed text-slate-600">
              {incompleteTasks.length > 0 ? (
                <span>
                  If you complete the <strong className="text-[#1e293b] font-black">"{incompleteTasks[0].title}"</strong> session first, you will build amazing momentum for the rest of your day.
                </span>
              ) : (
                <span>Provide a brain dump or manual task entries to activate your high-efficiency personalized Nova insights.</span>
              )}
            </p>
          </div>
        </aside>

      </main>

      {/* Replan Loading Modal */}
      {isReplanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1e293b]/85 backdrop-blur-sm transition-opacity duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px] p-8 max-w-sm w-full text-center flex flex-col items-center gap-6"
          >
            {/* Spinning Loader */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#1e293b]/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#10b981] border-t-transparent animate-spin"></div>
              <Sparkles className="w-6 h-6 text-[#10b981] animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display text-lg font-black text-[#1e293b]">Replanning Your Week</h3>
              <p className="text-sm text-slate-500 font-bold min-h-[20px] transition-all duration-350">
                {replanMessage}
              </p>
            </div>

            {/* Micro steps indicator */}
            <div className="flex gap-1.5 justify-center w-full">
              {["Reviewing progress", "Checking deadlines", "Redistributing work", "Optimizing week", "Almost done"].map((step, idx) => {
                const messages = [
                  "Reviewing your progress...",
                  "Checking deadlines...",
                  "Redistributing unfinished work...",
                  "Optimizing your week...",
                  "Almost done..."
                ];
                const activeIdx = messages.indexOf(replanMessage);
                return (
                  <div 
                    key={step} 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx <= activeIdx ? 'bg-[#10b981] w-8 border border-[#1e293b]' : 'bg-slate-200 w-2.5 border border-transparent'
                    }`} 
                  />
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#ecfdf5] border-[3px] border-[#1e293b] shadow-[4px_4px_0px_#10b981] rounded-2xl py-4 px-6 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-[#10b981] border border-[#1e293b] flex items-center justify-center text-white shrink-0 font-black shadow-sm">
            ✓
          </div>
          <span className="text-sm text-[#1e293b] font-black">
            ✨ Nova optimized your week based on your latest progress.
          </span>
        </div>
      )}
    </div>
  );
}
