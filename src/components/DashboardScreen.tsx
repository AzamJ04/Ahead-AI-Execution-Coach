// import React from 'react';
// import { 
//   Play, 
//   Lightbulb, 
//   Calendar, 
//   Clock, 
//   FileText, 
//   Code, 
//   FileEdit, 
//   AlertTriangle,
//   Flame,
//   Plus
// } from 'lucide-react';
// import Sidebar from './Sidebar';
// import { ScreenType, Task, UserProfile, ExecutionPlan } from '../types';

// interface DashboardScreenProps {
//   user: UserProfile;
//   setScreen: (screen: ScreenType) => void;
//   tasks: Task[];
//   executionPlan: ExecutionPlan | null;
//   onReplan: (reason: string) => Promise<ExecutionPlan | null>;
//   onAddTaskClick: () => void;
//   onSignOut?: () => void;
//   onSignIn?: () => void;
// }

// export default function DashboardScreen({ user, setScreen, tasks, executionPlan, onReplan, onAddTaskClick, onSignOut, onSignIn }: DashboardScreenProps) {
//   const incompleteTasks = tasks.filter(t => (t.progress || 0) < 100);

//   // Utilize the dynamic, AI-generated DashboardData when available
//   const planData = executionPlan?.dashboardData;

//   const upcomingDeadlines = planData?.upcomingDeadlines 
//     ? planData.upcomingDeadlines.slice(0, 3)
//     : incompleteTasks.slice(0, 3).map(t => ({
//         title: t.title,
//         category: t.category || "General",
//         dueDate: t.deadline || "This Week",
//         priority: t.priority
//       }));

//   const highestRiskTitle = planData?.highestRiskTask || 
//     (incompleteTasks.find(t => t.priority === 'High') || incompleteTasks[0])?.title || "None";
//   const highestRiskTask = tasks.find(t => t.title === highestRiskTitle) || incompleteTasks.find(t => t.priority === 'High') || incompleteTasks[0] || null;

//   const timelineEvents = planData?.todaysTimeline 
//     ? planData.todaysTimeline 
//     : incompleteTasks.slice(0, 3).map((t, idx) => {
//         const times = ["10:00 AM", "2:00 PM", "6:00 PM"];
//         const blocks = ["Deep Work Block", "Execution Block", "Wind-down Review"];
//         return {
//           time: times[idx] || "4:00 PM",
//           title: t.title,
//           subtitle: blocks[idx] || "Focus session",
//           category: t.category
//         };
//       });

//   const novaRecommendation = planData?.novaRecommendation || 
//     (tasks.length > 0 
//       ? `Completing your "${activeFocusTask?.title || 'tasks'}" today will reduce your deadline risk and build momentum.` 
//       : "Writing down your brain dump helps release mental load and transforms chaos into structured action items.");

//   return (
//     <div className="font-sans text-slate-200 bg-background min-h-screen flex overflow-hidden">
//       {/* Sidebar Navigation */}
//       <Sidebar currentScreen="dashboard" setScreen={setScreen} user={user} onAddTaskClick={onAddTaskClick} onSignOut={onSignOut} onSignIn={onSignIn} />

//       {/* Main Content Area */}
//       <main className="flex-1 md:ml-64 h-screen overflow-y-auto relative pb-20 bg-immersive-gradient bg-attachment-fixed">

//         {/* Mobile Header */}
//         <header className="md:hidden bg-[#08080c]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/5 sticky top-0 z-40">
//           <div className="flex items-center gap-2">
//             <span className="font-display text-xl font-bold text-white">Ahead</span>
//           </div>
//           <img 
//             alt="User profile" 
//             className="w-8 h-8 rounded-full object-cover border border-white/10 shadow-sm"
//             src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhOw3swYZ_-MAwCBFTGH3XfDjxPHHWphxepIfv-Lt9w0whcZH6u0HFtB5T8xdstzfHMY-yBqs18MFzhz1bBBjh-gjx92dC8pf1JODa0U3neaC_SezzJAzJ8LCLpZQfkZrCs8-PZLMscxT7S6BBQV9NQxhkR2PsPMJZz4aKt2CDfFPmT2a5S1mxgucjrAMI6cOYL9UwfSviE5DwU9qlnG8-DGvm1Ph8vmrwARno4IQamTirDdtn0LC2otvsEpfccUp2Eqpowusl_kU"
//           />
//         </header>

//         {/* Desktop Navbar Spacer */}
//         <div className="hidden md:block h-6" />

//         {/* Content Container */}
//         <div className="pt-6 pb-24 px-6 md:px-10 max-w-7xl mx-auto space-y-12">

//           {/* Greeting & Execution Score Header */}
//           <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
//             <div>
//               <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-2 text-gradient-glow">
//                 Good Morning, {user.firstName || 'Alex'} 👋
//               </h2>
//               <p className="text-slate-400 font-medium">
//                 {planData?.todaysMission || (tasks.length > 0 ? "Nova has organized your day." : "Ready to plan your day? Start with a brain dump!")}
//               </p>
//             </div>
//           </section>

//           {/* Quick links container specifically for testing xpath triggers */}
//           <div className="flex gap-4 border-b border-white/5 pb-2">
//             <a 
//               href="#tasks"
//               onClick={(e) => { e.preventDefault(); setScreen('tasks'); }}
//               className="text-sm font-semibold text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5"
//             >
//               Tasks
//             </a>
//             <a 
//               href="#execution_plan"
//               onClick={(e) => { e.preventDefault(); setScreen('execution_plan'); }}
//               className="text-sm font-semibold text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5"
//             >
//               Schedule
//             </a>
//           </div>

//           {executionPlan?.novaNotification && (
//             <div className="bg-teal-950/35 border border-teal-500/25 rounded-2xl p-5 flex items-start gap-4.5 shadow-[0_0_30px_rgba(139,92,246,0.08)] animate-fade-in">
//               <div className="w-9 h-9 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
//                 ✨
//               </div>
//               <div className="flex-1">
//                 <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider font-mono">Nova Active Coach Replan</h4>
//                 <p className="text-sm text-slate-200 font-semibold mt-1.5 leading-relaxed">
//                   {executionPlan.novaNotification}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Bento Grid Layout */}
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

//             {/* Left Column - Focus & Insights */}
//             <div className="lg:col-span-8 flex flex-col gap-8">



//               {/* Nova Insight Callout card */}
//               <div className="bg-white/[0.02] backdrop-blur-md rounded-[20px] p-6 flex items-start gap-4 border border-white/5 shadow-sm transition-transform duration-300 hover:translate-y-[-2px] hover:border-white/10">
//                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-teal-400">
//                   <Lightbulb className="w-5 h-5 fill-teal-400/10" />
//                 </div>
//                 <div>
//                   <h4 className="text-xs font-bold font-mono tracking-widest text-teal-400 mb-1">NOVA INSIGHT</h4>
//                   <p className="text-sm font-medium text-slate-300 leading-relaxed">
//                     {novaRecommendation}
//                   </p>
//                 </div>
//               </div>

//               {/* Upcoming Deadlines Cards section */}
//               <div>
//                 <h3 className="font-display text-xl font-extrabold text-white mb-4 flex items-center gap-2">
//                   <Flame className="w-5 h-5 text-orange-400 fill-orange-400/10" />
//                   <span>Upcoming Deadlines</span>
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   {upcomingDeadlines.length > 0 ? (
//                     upcomingDeadlines.map((t, idx) => {
//                       const isHigh = t.priority === "High";
//                       return (
//                         <div key={idx} className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-5 border border-white/5 shadow-sm flex flex-col gap-3 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(139,92,246,0.05)]">
//                           <div className="flex justify-between items-start">
//                             {t.category === 'Academics' ? (
//                               <FileText className="w-5 h-5 text-slate-400" />
//                             ) : t.category === 'Work' ? (
//                               <Code className="w-5 h-5 text-slate-400" />
//                             ) : (
//                               <FileEdit className="w-5 h-5 text-slate-400" />
//                             )}
//                             <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide border ${
//                               isHigh 
//                                 ? 'bg-red-500/10 text-red-400 border-red-500/10' 
//                                 : 'bg-white/10 text-slate-400 border-white/10'
//                             }`}>
//                               {t.deadline || 'This Week'}
//                             </span>
//                           </div>
//                           <div>
//                             <h4 className="text-sm font-bold text-slate-200 truncate">{t.title}</h4>
//                             <p className="text-xs text-slate-400 font-semibold mt-1">{t.category}</p>
//                           </div>
//                         </div>
//                       );
//                     })
//                   ) : (
//                     <div className="md:col-span-3 bg-white/[0.01] backdrop-blur-md rounded-2xl p-8 border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-2">
//                       <p className="text-sm font-bold text-slate-400">No upcoming deadlines.</p>
//                       <button 
//                         onClick={() => setScreen('brain_dump')}
//                         className="text-xs font-bold text-teal-400 hover:text-teal-300"
//                       >
//                         Generate tasks with Brain Dump &rarr;
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>

//             </div>

//             {/* Right Column - Timeline & Risk */}
//             <div className="lg:col-span-4 flex flex-col gap-8 h-auto">

//               {/* Today's Timeline Panel */}
//               <div className="bg-white/[0.02] backdrop-blur-md rounded-[24px] p-6 border border-white/5 shadow-sm">
//                 <h3 className="font-display text-lg font-extrabold text-white mb-6 flex items-center gap-2">
//                   <Calendar className="w-5 h-5 text-teal-400" />
//                   <span>Today's Timeline</span>
//                 </h3>

//                 {/* Vertical Timeline Items chain */}
//                 <div className="relative border-l border-white/5 ml-3.5 space-y-8 pb-4">
//                   {timelineEvents.length > 0 ? (
//                     timelineEvents.map((evt, idx) => (
//                       <div key={idx} className="relative pl-6">
//                         <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ring-4 ring-[#050508] ${
//                           idx === 0 ? 'bg-teal-500' : 'bg-white/10'
//                         }`} />
//                         <div className={`text-xs font-bold mb-1 flex items-center gap-1 ${
//                           idx === 0 ? 'text-teal-400' : 'text-slate-400'
//                         }`}>
//                           <Clock className="w-3 h-3" />
//                           <span>{evt.time}</span>
//                         </div>
//                         <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
//                           <h4 className="text-xs font-bold text-slate-200">{evt.title}</h4>
//                           <p className="text-[10px] text-slate-400 font-semibold mt-1">{evt.subtitle}</p>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <>
//                       {/* Empty state timeline events */}
//                       <div className="relative pl-6">
//                         <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white/10 ring-4 ring-[#050508]" />
//                         <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
//                           <Clock className="w-3 h-3" />
//                           <span>10:00 AM</span>
//                         </div>
//                         <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
//                           <h4 className="text-xs font-bold text-slate-500">Workspace Clear</h4>
//                           <p className="text-[10px] text-slate-600 font-semibold mt-1">Ready for input</p>
//                         </div>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </div>

//               {/* Highest Risk Callout Panel */}
//               <div className="bg-white/[0.02] backdrop-blur-md rounded-[20px] p-6 border border-white/5 shadow-sm relative overflow-hidden">
//                 <div className="absolute top-0 left-0 w-1 h-full bg-orange-600" />
//                 <div className="flex justify-between items-start mb-3">
//                   <h4 className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">HIGHEST RISK</h4>
//                   <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/10 px-2 py-0.5 rounded">
//                     {highestRiskTask ? 'Needs attention' : 'Clear'}
//                   </span>
//                 </div>
//                 <h3 className="text-sm font-bold text-slate-200 mb-1">
//                   {highestRiskTask ? highestRiskTask.title : "All Clean!"}
//                 </h3>
//                 <p className="text-xs text-slate-400 font-semibold mb-4">
//                   {highestRiskTask 
//                     ? `Only a few free hours remain before the deadline.` 
//                     : "No high-risk deadlines on your radar."}
//                 </p>
//                 {highestRiskTask && (
//                   <button 
//                     onClick={() => setScreen('execution_plan')}
//                     className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95"
//                   >
//                     Replan My Week
//                   </button>
//                 )}
//               </div>

//             </div>
//           </div>
//         </div>

//         {/* Floating Action Button (FAB) */}
//         <button 
//           onClick={onAddTaskClick}
//           className="fixed bottom-10 right-8 w-14 h-14 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-full shadow-lg shadow-teal-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 z-40 group"
//         >
//           <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
//         </button>

//       </main>
//     </div>
//   );
// }














import React from 'react';
import {
  Play,
  Lightbulb,
  Calendar,
  Clock,
  FileText,
  Code,
  FileEdit,
  AlertTriangle,
  Flame,
  Plus,
  Sparkles
} from 'lucide-react';
import Sidebar from './Sidebar';
import { ScreenType, Task, UserProfile, ExecutionPlan } from '../types';

interface DashboardScreenProps {
  user: UserProfile;
  setScreen: (screen: ScreenType) => void;
  tasks: Task[];
  executionPlan: ExecutionPlan | null;
  onReplan: (reason: string) => Promise<ExecutionPlan | null>;
  onStartFocus?: () => void;
  onAddTaskClick: () => void;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

export default function DashboardScreen({ user, setScreen, tasks, executionPlan, onReplan, onStartFocus, onAddTaskClick, onSignOut, onSignIn }: DashboardScreenProps) {
  const incompleteTasks = tasks.filter(t => (t.progress || 0) < 100);
  const activeFocusTask = incompleteTasks.find(t => t.priority === 'High') || incompleteTasks[0] || tasks[0] || null;

  const totalSubtasks = activeFocusTask?.subtasks?.length || 0;
  const completedSubtasks = activeFocusTask?.subtasks?.filter(st => st.completed).length || 0;
  const activeProgressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Utilize the dynamic, AI-generated DashboardData when available
  const planData = executionPlan?.dashboardData;

  const upcomingDeadlines = planData?.upcomingDeadlines
    ? planData.upcomingDeadlines.slice(0, 3)
    : incompleteTasks.slice(0, 3).map(t => ({
      title: t.title,
      category: t.category || "General",
      dueDate: t.deadline || "This Week",
      priority: t.priority
    }));

  const highestRiskTitle = planData?.highestRiskTask ||
    (incompleteTasks.find(t => t.priority === 'High') || incompleteTasks[0])?.title || "None";
  const highestRiskTask = tasks.find(t => t.title === highestRiskTitle) || incompleteTasks.find(t => t.priority === 'High') || incompleteTasks[0] || null;

  const timelineEvents = planData?.todaysTimeline
    ? planData.todaysTimeline
    : incompleteTasks.slice(0, 3).map((t, idx) => {
      const times = ["10:00 AM", "2:00 PM", "6:00 PM"];
      const blocks = ["Deep Work Block", "Execution Block", "Wind-down Review"];
      return {
        time: times[idx] || "4:00 PM",
        title: t.title,
        subtitle: blocks[idx] || "Focus session",
        category: t.category
      };
    });

  const novaRecommendation = planData?.novaRecommendation ||
    (tasks.length > 0
      ? `Completing your "${activeFocusTask?.title || 'tasks'}" today will reduce your deadline risk and build momentum.`
      : "Writing down your brain dump helps release mental load and transforms chaos into structured action items.");

  return (
    <div className="font-sans text-[#1e293b] bg-background min-h-screen flex overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar currentScreen="dashboard" setScreen={setScreen} user={user} onAddTaskClick={onAddTaskClick} onSignOut={onSignOut} onSignIn={onSignIn} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 h-screen overflow-y-auto relative pb-24 bg-background">

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b-2 border-[#1e293b] px-6 py-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-black text-[#1e293b]">Ahead</span>
          </div>
          <img
            alt="User profile"
            className="w-8 h-8 rounded-full object-cover border-2 border-[#1e293b]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhOw3swYZ_-MAwCBFTGH3XfDjxPHHWphxepIfv-Lt9w0whcZH6u0HFtB5T8xdstzfHMY-yBqs18MFzhz1bBBjh-gjx92dC8pf1JODa0U3neaC_SezzJAzJ8LCLpZQfkZrCs8-PZLMscxT7S6BBQV9NQxhkR2PsPMJZz4aKt2CDfFPmT2a5S1mxgucjrAMI6cOYL9UwfSviE5DwU9qlnG8-DGvm1Ph8vmrwARno4IQamTirDdtn0LC2otvsEpfccUp2Eqpowusl_kU"
          />
        </header>

        {/* Desktop Navbar Spacer */}
        <div className="hidden md:block h-6" />

        {/* Content Container */}
        <div className="pt-6 pb-28 px-6 md:px-10 max-w-7xl mx-auto space-y-12">

          {/* Greeting & Execution Score Header */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-black mb-2 text-[#1e293b]">
                Good Morning, {user.firstName || 'Alex'} 👋
              </h2>
              <p className="text-slate-500 font-bold">
                {planData?.todaysMission || (tasks.length > 0 ? "Nova has organized your day." : "Ready to plan your day? Start with a brain dump!")}
              </p>
            </div>
          </section>

          {/* Quick links container specifically for testing xpath triggers */}
          <div className="flex gap-4 border-b border-[#1e293b]/10 pb-2">
            <a
              href="#tasks"
              onClick={(e) => { e.preventDefault(); setScreen('tasks'); }}
              className="text-sm font-black text-slate-500 hover:text-[#10b981] transition-colors flex items-center gap-1.5"
            >
              Tasks
            </a>
            <a
              href="#execution_plan"
              onClick={(e) => { e.preventDefault(); setScreen('execution_plan'); }}
              className="text-sm font-black text-slate-500 hover:text-[#10b981] transition-colors flex items-center gap-1.5"
            >
              Execution Plan
            </a>
          </div>

          {executionPlan?.novaNotification && (
            <div className="bg-white border-[3px] border-[#1e293b] shadow-[4px_4px_0px_#1e293b] rounded-2xl p-5 flex items-start gap-4.5 animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-[#10b981] border border-[#1e293b] flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                ✨
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-[#059669] uppercase tracking-wider font-mono">Nova Active Coach Replan</h4>
                <p className="text-sm text-[#1e293b] font-bold mt-1.5 leading-relaxed">
                  {executionPlan.novaNotification}
                </p>
              </div>
            </div>
          )}

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column - Focus & Insights */}
            <div className="lg:col-span-8 flex flex-col gap-8">

              {/* Focus Active Card */}
              <div className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[28px] p-8 relative overflow-hidden text-[#1e293b]">
                {/* Abstract geometric circle decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  {/* Info details */}
                  <div className="flex-1 flex flex-col items-start gap-4">
                    <span className="inline-block px-3 py-1 bg-[#bfdbfe] text-[#1d4ed8] border-2 border-[#1e293b] shadow-[1.5px_1.5px_0px_#1e293b] rounded-full text-xs font-black uppercase tracking-wider">
                      🎯 Focus Now
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl font-black leading-tight tracking-tight text-[#1e293b]">
                      {activeFocusTask ? activeFocusTask.title.toUpperCase() : "READY TO PLAN YOUR TASKS?"}
                    </h3>
                    {activeFocusTask && activeFocusTask.description && !activeFocusTask.description.includes("Action plan to complete") && (
                      <p className="text-sm text-slate-500 font-bold line-clamp-2">
                        {activeFocusTask.description}
                      </p>
                    )}
                    {activeFocusTask && (
                      <div className="bg-[#f8fafc] border-2 border-[#1e293b] rounded-2xl p-4 w-full my-2 flex flex-col gap-1.5 shadow-[2px_2px_0px_#1e293b]">
                        <div className="flex items-center gap-2 text-[#a78bfa] font-black text-xs uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 fill-current stroke-[2.5]" />
                          <span>Nova Recommendation</span>
                        </div>
                        <p className="text-sm md:text-[15px] font-bold text-slate-700 leading-relaxed">
                          {activeFocusTask.novaRecommendation || (() => {
                            const titleLower = activeFocusTask.title.toLowerCase();
                            const category = activeFocusTask.category;
                            if (category === "Health" || titleLower.includes("gym") || titleLower.includes("workout")) {
                              return "Consistency beats intensity. Complete today's workout to maintain your streak.";
                            } else if (titleLower.includes("dsa") || titleLower.includes("quiz")) {
                              return "Finish Arrays and Time Complexity first. Completing this today keeps you on track for Tuesday's quiz.";
                            } else if (titleLower.includes("portfolio") || titleLower.includes("website") || titleLower.includes("app")) {
                              return "Finish the landing page layout before adding complex animations. You'll build momentum faster.";
                            } else if (titleLower.includes("assignment") || titleLower.includes("project")) {
                              return "Complete the initial draft or data cleaning section first. It unlocks the rest of your assignment.";
                            }
                            return "Start with the smallest, most actionable task first to build focus momentum.";
                          })()}
                        </p>
                      </div>
                    )}
                    {activeFocusTask && onStartFocus && (
                      <button
                        onClick={onStartFocus}
                        className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 border-2 border-[#1e293b] shadow-clay-btn hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b] active:shadow-clay-btn-active active:translate-x-[2px] active:translate-y-[2px] font-black transition-all flex items-center gap-2 text-sm cursor-pointer mt-2 rounded-xl"
                      >
                        <Play className="w-4 h-4 fill-white stroke-[2.5]" />
                        <span>Start Focus Mode</span>
                      </button>
                    )}
                    {!activeFocusTask && (
                      <button
                        onClick={() => setScreen('brain_dump')}
                        className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-3.5 border-2 border-[#1e293b] shadow-clay-btn hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b] active:shadow-clay-btn-active active:translate-x-[2px] active:translate-y-[2px] font-black transition-all flex items-center gap-2 text-sm cursor-pointer rounded-2xl"
                      >
                        <span>Brain Dump My Day</span>
                      </button>
                    )}
                  </div>

                  {/* Circular Gauge */}
                  {activeFocusTask && (
                    <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center bg-[#fffdf5] border-2 border-[#1e293b] shadow-inner rounded-full">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                        {/* Background ring */}
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          className="stroke-slate-100"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* Foreground progress ring */}
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          className="stroke-[#10b981]"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 50}
                          strokeDashoffset={2 * Math.PI * 50 * (1 - activeProgressPercent / 100)}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dashoffset 0.8s ease-in-out',
                          }}
                        />
                      </svg>
                      {/* Percent overlay text */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="font-display text-2xl font-black text-[#1e293b]">{activeProgressPercent}%</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Done</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nova Insight Callout card */}
              <div className="bg-[#fffbeb] border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-[20px] p-6 flex items-start gap-4 transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="w-10 h-10 rounded-full bg-amber-100 border border-[#1e293b] flex items-center justify-center shrink-0 text-amber-700 shadow-sm">
                  <Lightbulb className="w-5 h-5 fill-amber-500/10 animate-pulse stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black font-mono tracking-widest text-[#b45309] mb-1">NOVA INSIGHT</h4>
                  <p className="text-sm font-bold text-[#1e293b] leading-relaxed">
                    {novaRecommendation}
                  </p>
                </div>
              </div>

              {/* Upcoming Deadlines Cards section */}
              <div>
                <h3 className="font-display text-xl font-black text-[#1e293b] mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#ea580c]" />
                  <span>Upcoming Deadlines</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((t, idx) => {
                      const isHigh = t.priority === "High";
                      return (
                        <div key={idx} className="bg-white border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-2xl p-5 flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#1e293b]">
                          <div className="flex justify-between items-start">
                            {t.category === 'Academics' ? (
                              <div className="p-2 rounded-lg bg-slate-100 border border-[#1e293b] text-slate-700"><FileText className="w-4 h-4" /></div>
                            ) : t.category === 'Work' ? (
                              <div className="p-2 rounded-lg bg-slate-100 border border-[#1e293b] text-slate-700"><Code className="w-4 h-4" /></div>
                            ) : (
                              <div className="p-2 rounded-lg bg-slate-100 border border-[#1e293b] text-slate-700"><FileEdit className="w-4 h-4" /></div>
                            )}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border ${isHigh
                                ? 'bg-[#fee2e2] text-[#991b1b] border-[#1e293b] shadow-[1px_1px_0px_#1e293b]'
                                : 'bg-slate-100 text-slate-500 border-[#1e293b]'
                              }`}>
                              {t.dueDate || 'This Week'}
                            </span>
                          </div>
                          <div className="mt-4">
                            <h4 className="text-sm font-black text-[#1e293b] truncate">{t.title}</h4>
                            <p className="text-xs text-slate-500 font-bold mt-1">{t.category}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="md:col-span-3 bg-white border-2 border-[#1e293b] border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 shadow-[2px_2px_0px_#1e293b]">
                      <p className="text-sm font-bold text-slate-500">No upcoming deadlines.</p>
                      <button
                        onClick={() => setScreen('brain_dump')}
                        className="text-xs font-black text-[#10b981] hover:text-[#059669] cursor-pointer"
                      >
                        Generate tasks with Brain Dump &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column - Timeline & Risk */}
            <div className="lg:col-span-4 flex flex-col gap-8 h-auto">

              {/* Today's Timeline Panel */}
              <div className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px] p-6">
                <h3 className="font-display text-lg font-black text-[#1e293b] mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#10b981]" />
                  <span>Today's Timeline</span>
                </h3>

                {/* Vertical Timeline Items chain */}
                <div className="relative border-l-2 border-[#1e293b]/10 ml-3.5 space-y-6 pb-2">
                  {timelineEvents.length > 0 ? (
                    timelineEvents.map((evt, idx) => (
                      <div key={idx} className="relative pl-6 group/item">
                        <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-[#1e293b] transition-all duration-300 group-hover/item:scale-110 ${idx === 0 ? 'bg-[#10b981]' : 'bg-slate-200'
                          }`} />
                        <div className={`text-[11px] font-black mb-1 flex items-center gap-1 ${idx === 0 ? 'text-[#10b981]' : 'text-slate-500'
                          }`}>
                          <Clock className="w-3 h-3 stroke-[2.5]" />
                          <span>{evt.time}</span>
                        </div>
                        <div className="bg-[#fffdf5] border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] rounded-xl p-3 transition-all duration-300 group-hover/item:translate-x-1">
                          <h4 className="text-xs font-black text-[#1e293b]">{evt.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">{evt.subtitle}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Empty state timeline events */}
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-[#1e293b]" />
                        <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>10:00 AM</span>
                        </div>
                        <div className="bg-white border-2 border-[#1e293b] rounded-xl p-3">
                          <h4 className="text-xs font-black text-slate-400">Workspace Clear</h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">Ready for input</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Highest Risk Callout Panel */}
              <div className="bg-white border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-[20px] p-6 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ea580c]" />
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[10px] font-black tracking-widest text-[#red-500] uppercase font-mono">HIGHEST RISK</h4>
                  <span className="text-[9px] font-black text-red-700 bg-red-100 border border-[#1e293b] shadow-[1px_1px_0px_#1e293b] px-2 py-0.5 rounded">
                    {highestRiskTask ? 'Needs attention' : 'Clear'}
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#1e293b] mb-1">
                  {highestRiskTask ? highestRiskTask.title : "All Clean!"}
                </h3>
                <p className="text-xs text-slate-500 font-bold mb-4 leading-relaxed">
                  {highestRiskTask
                    ? `Only a few free hours remain before the deadline.`
                    : "No high-risk deadlines on your radar."}
                </p>
                {highestRiskTask && (
                  <button
                    onClick={() => setScreen('execution_plan')}
                    className="w-full bg-white hover:bg-slate-50 border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] text-[#1e293b] text-xs font-black py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    Replan My Week
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Floating Action Button (FAB) */}
        <button
          onClick={onAddTaskClick}
          className="fixed bottom-20 right-8 w-14 h-14 bg-[#10b981] hover:bg-[#059669] text-white border-[3px] border-[#1e293b] shadow-clay-card hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all duration-300 z-40 group cursor-pointer rounded-full"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300 stroke-[3]" />
        </button>

        {/* AI Execution Coach Persistent Bottom Status Indicator Bar */}
        <div className="fixed bottom-4 left-6 right-6 md:left-[280px] md:right-8 bg-white border-[3px] border-[#1e293b] shadow-[4px_4px_0px_#1e293b] py-3 px-6 rounded-2xl flex justify-center items-center z-40 max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5 text-[#1e293b]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-[#1e293b] animate-pulse" />
            <span className="text-xs font-bold">Focus mode suggested: Disable notifications for the next 2 hours.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
