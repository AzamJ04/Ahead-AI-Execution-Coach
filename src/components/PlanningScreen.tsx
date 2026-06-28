import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Task, ExecutionPlan } from '../types';

interface PlanningScreenProps {
  brainDumpText: string;
  userRole: string | null;
  onFinish: (generatedTasks: Task[], executionPlan: ExecutionPlan) => void;
}

const planningSteps = [
  "Understanding your tasks",
  "Identifying deadlines",
  "Breaking work into smaller tasks",
  "Prioritizing your workload",
  "Checking for scheduling conflicts",
  "Building your personalized schedule",
  "Calculating deadline risk",
  "Finalizing your execution plan"
];

export default function PlanningScreen({ brainDumpText, userRole, onFinish }: PlanningScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<ExecutionPlan | null>(null);

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const findTaskForSession = (session: any, tasks: Task[]) => {
    const sessionText = normalize(`${session.taskTitle || ''} ${session.subtask || ''}`);
    return tasks.find(task => {
      const title = normalize(task.title);
      const compactTaskWords = title.split(' ').filter(word => word.length > 3);
      return title.includes(sessionText) ||
        sessionText.includes(title) ||
        compactTaskWords.some(word => sessionText.includes(word)) ||
        task.subtasks.some(st => sessionText.includes(normalize(st.title)));
    });
  };

  useEffect(() => {
    let active = true;
    async function fetchPlan() {
      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            brainDump: brainDumpText,
            userRole: userRole
          })
        });
        if (!response.ok) {
          throw new Error("Failed to generate plan");
        }
        const data = await response.json();
        if (active) {
          const tasks: Task[] = (data.tasks || []).map((raw: any) => {
            const taskId = Math.random().toString(36).substring(2, 11);
            return {
              id: taskId,
              title: raw.title,
              description: raw.description,
              category: raw.category,
              deadline: raw.deadline || raw.dueDate,
              priority: raw.priority,
              estimatedMinutes: raw.estimatedMinutes || 60,
              estimatedHours: raw.estimatedHours || Math.round(((raw.estimatedMinutes || 60) / 60) * 10) / 10,
              status: raw.status || 'Pending',
              recurring: raw.recurring || raw.dueDate === 'Daily' || raw.deadline === 'Daily',
              recurrence: raw.recurrence || raw.recurringPattern || (raw.dueDate === 'Daily' || raw.deadline === 'Daily' ? 'Daily' : undefined),
              scheduledTime: raw.scheduledTime,
              progress: 0,
              subtasks: (raw.subtasks || []).map((st: any) => ({
                id: Math.random().toString(36).substring(2, 11),
                title: st.title,
                completed: false,
                estimatedMinutes: st.estimatedMinutes
              }))
            };
          });

          // Ensure plan has stable subtask/session mapping
          let currentHour = 9;
          let currentMinute = 0;
          const formatTimeStr = (h: number, m: number) => {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          };

          const calculatedSessions = tasks.map(t => {
            const duration = t.estimatedMinutes || 60;
            const startH = currentHour;
            const startM = currentMinute;
            
            let endH = startH;
            let endM = startM + duration;
            if (endM >= 60) {
              endH += Math.floor(endM / 60);
              endM = endM % 60;
            }

            const startTime = formatTimeStr(startH, startM);
            const endTime = formatTimeStr(endH, endM);

            // Update next start time with a 15-minute buffer
            let nextH = endH;
            let nextM = endM + 15;
            if (nextM >= 60) {
              nextH += Math.floor(nextM / 60);
              nextM = nextM % 60;
            }
            currentHour = nextH;
            currentMinute = nextM;

            return {
              id: Math.random().toString(36).substring(2, 11),
              taskId: t.id,
              taskTitle: t.title,
              startTime,
              endTime,
              duration,
              date: new Date().toISOString().split('T')[0],
              estimatedMinutes: duration,
              completed: false
            };
          });

          const plan: ExecutionPlan = data.executionPlan || {
            days: [
              {
                dayName: "Today",
                sessions: calculatedSessions
              }
            ],
            dashboardData: {
              todaysMission: tasks[0]?.title || "Focus Day",
              novaRecommendation: "Stick to your goals today to stay ahead of schedule.",
              highestRiskTask: tasks[0]?.title || "None",
              upcomingDeadlines: tasks.map(t => ({ title: t.title, category: t.category || "General", dueDate: t.deadline || "This Week", priority: t.priority })),
              todaysTimeline: calculatedSessions.map(s => ({
                time: s.startTime,
                title: s.taskTitle,
                subtitle: "Deep Work Session",
                category: tasks.find(t => t.id === s.taskId)?.category || "General"
              }))
            }
          };

          // Link session ids or create clean ones
          const sanitizedDays = plan.days.map(d => ({
            ...d,
            sessions: d.sessions.map(s => {
              // Try to find the actual task matching this session title to link the taskId properly
              const matchedTask = findTaskForSession(s, tasks);
              return {
                ...s,
                id: s.id || Math.random().toString(36).substring(2, 11),
                taskId: s.taskId || matchedTask?.id || tasks[0]?.id || "",
                subtask: s.subtask,
                date: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                duration: s.duration || s.estimatedMinutes,
                status: s.status || (s.completed ? 'completed' : 'planned'),
                source: s.source || 'nova',
                completed: s.completed || false
              };
            })
          }));

          setGeneratedTasks(tasks);
          setGeneratedPlan({
            ...plan,
            days: sanitizedDays,
            sessions: sanitizedDays.flatMap(day => day.sessions.map(session => ({
              ...session,
              dayName: day.dayName
            })))
          });
        }
      } catch (err: any) {
        console.error("Plan generation API failed, using fallback task:", err);
        if (active) {
          // Smart fallback tasks
          const fallbackTasks: Task[] = [
            {
              id: Math.random().toString(36).substring(2, 11),
              title: 'Complete Data Science Assignment',
              description: brainDumpText || 'My initial weekly target from brain dump',
              category: 'Academics',
              deadline: 'Monday',
              priority: 'High',
              estimatedMinutes: 360,
              progress: 0,
              subtasks: [
                { id: Math.random().toString(36).substring(2, 11), title: 'Research & Requirements gathering', completed: false },
                { id: Math.random().toString(36).substring(2, 11), title: 'Data Cleaning & Preprocessing', completed: false },
                { id: Math.random().toString(36).substring(2, 11), title: 'Model Building & Initial Training', completed: false },
                { id: Math.random().toString(36).substring(2, 11), title: 'Model Testing & Evaluation', completed: false },
                { id: Math.random().toString(36).substring(2, 11), title: 'Report Writing & Analysis', completed: false },
                { id: Math.random().toString(36).substring(2, 11), title: 'Final Submission & Validation', completed: false }
              ]
            }
          ];

          const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const today = new Date();
          const dayNames: string[] = [];
          for (let i = 0; i < 5; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            dayNames.push(daysOfWeek[d.getDay()]);
          }

          const fallbackPlan: ExecutionPlan = {
            days: [
              {
                dayName: dayNames[0],
                sessions: [
                  { id: Math.random().toString(36).substring(2, 11), taskId: fallbackTasks[0].id, taskTitle: "Assignment Research", startTime: "09:00", endTime: "10:30", duration: 90, date: new Date().toISOString().split('T')[0], status: "Planned", source: "Nova", completed: false },
                  { id: Math.random().toString(36).substring(2, 11), taskId: fallbackTasks[0].id, taskTitle: "Solve DSA Questions", startTime: "11:00", endTime: "12:30", duration: 90, date: new Date().toISOString().split('T')[0], status: "Planned", source: "Nova", completed: false }
                ]
              },
              {
                dayName: dayNames[1],
                sessions: [
                  { id: Math.random().toString(36).substring(2, 11), taskId: fallbackTasks[0].id, taskTitle: "Data Cleaning", startTime: "09:00", endTime: "11:00", duration: 120, date: new Date().toISOString().split('T')[0], status: "Planned", source: "Nova", completed: false }
                ]
              }
            ],
            dashboardData: {
              todaysMission: "Complete Data Cleaning",
              novaRecommendation: "Completing today's assignment session keeps you comfortably ahead of Monday's deadline.",
              highestRiskTask: "Complete Data Science Assignment",
              upcomingDeadlines: [
                { title: "Complete Data Science Assignment", category: "Academics", dueDate: "Monday", priority: "High" }
              ],
              todaysTimeline: [
                { time: "9:00 AM", title: "Assignment Research", subtitle: "Deep Work Block", category: "Academics" },
                { time: "11:00 AM", title: "Solve DSA Questions", subtitle: "Execution Block", category: "Work" }
              ]
            }
          };

          setGeneratedTasks(fallbackTasks);
          setGeneratedPlan(fallbackPlan);
        }
      }
    }
    fetchPlan();
    return () => {
      active = false;
    };
  }, [brainDumpText, userRole]);

  useEffect(() => {
    // Process steps one by one
    if (currentStepIndex < planningSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 700); // 700ms per step
      return () => clearTimeout(timer);
    } else {
      setIsCompleted(true);
      // Auto-transition to next screen after showing "Your execution plan is ready"
      const transitionTimer = setTimeout(() => {
        if (generatedPlan) {
          onFinish(generatedTasks, generatedPlan);
        }
      }, 1600);
      return () => clearTimeout(transitionTimer);
    }
  }, [currentStepIndex, onFinish, generatedTasks, generatedPlan]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center m-0 p-0 overflow-hidden font-sans text-[#1e293b]">
      <div className="flex flex-col items-center justify-center w-full max-w-3xl px-8" id="main-content">
        
        {/* Top Status Title */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h2 className="text-lg text-slate-600 font-bold tracking-wide flex items-center justify-center gap-2">
            <span className="animate-spin text-[#10b981]">✨</span>
            <span>Nova is building your plan...</span>
          </h2>
        </motion.div>

        {/* Dynamic Center AI Core Graphic animation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-36 h-36 sm:w-40 sm:h-40 mb-8 flex items-center justify-center bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px]"
        >
          {/* Subtle background radial gradient pulse */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#10b981]/5 via-[#a78bfa]/5 to-transparent animate-pulse rounded-[21px]" />
          
          {/* Pulsing AI core orbits */}
          <div className="absolute inset-3 rounded-full border border-dashed border-[#1e293b]/10 animate-[spin_30s_linear_infinite]" />
          <div className="absolute inset-6 rounded-full border border-dashed border-[#1e293b]/15 animate-[spin_15s_linear_infinite_reverse]" />
          
          {/* Orbital planetary nodes */}
          <div className="absolute inset-3 animate-[spin_8s_linear_infinite]">
            <div className="w-2 h-2 rounded-full bg-[#a78bfa] border border-[#1e293b] absolute -top-1 left-1/2 -translate-x-1/2" />
          </div>
          <div className="absolute inset-6 animate-[spin_6s_linear_infinite_reverse]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] border border-[#1e293b] absolute -bottom-1/2 left-1/2 -translate-x-1/2" />
          </div>

          {/* Fluid rotating gradient arc loader */}
          <svg className="w-[84px] h-[84px] absolute animate-[spin_2.5s_linear_infinite]" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="60%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              stroke="url(#loader-grad)" 
              strokeWidth="6" 
              strokeLinecap="round" 
              fill="transparent" 
              strokeDasharray="160 120"
            />
          </svg>

          {/* Central dual-icon core */}
          <div className="w-14 h-14 rounded-full bg-white border-2 border-[#1e293b] flex items-center justify-center text-white shadow-clay-badge relative z-10">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#10b981] animate-spin absolute" />
              <Sparkles className="w-3.5 h-3.5 text-[#a78bfa] animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Live Thinking Steps container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`w-full max-w-md bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px] p-6 text-[#1e293b] transition-all duration-1000 ${
            isCompleted ? 'opacity-40' : ''
          }`}
        >
          <ul className="space-y-3.5" id="steps-list">
            {planningSteps.map((step, index) => {
              const isVisible = index <= currentStepIndex;
              const isStepDone = index < currentStepIndex;
              const isStepActive = index === currentStepIndex;

              return (
                <AnimatePresence key={index}>
                  {isVisible && (
                    <motion.li 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        {isStepDone ? (
                          <div className="w-5 h-5 bg-[#a7f3d0] border border-[#1e293b] text-[#065f46] rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : isStepActive ? (
                          <div className="w-3 h-3 bg-[#10b981] border border-[#1e293b] rounded-full animate-ping" />
                        ) : (
                          <div className="w-2.5 h-2.5 bg-slate-100 border border-[#1e293b]/20 rounded-full" />
                        )}
                      </div>
                      <span className={`text-sm font-bold transition-colors duration-300 ${
                        isStepActive 
                          ? 'text-[#1e293b]' 
                          : isStepDone 
                            ? 'text-slate-400' 
                            : 'text-slate-300'
                      }`}>
                        {step}
                      </span>
                    </motion.li>
                  )}
                </AnimatePresence>
              );
            })}
          </ul>
        </motion.div>

        {/* Final Message with required ID (MUST contains "Your execution plan is ready") */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div 
              id="final-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 text-center"
            >
              <h1 className="font-display text-2xl sm:text-3xl font-black text-[#1e293b] tracking-tight">
                Your execution plan is ready
              </h1>
              <p className="text-sm text-slate-500 font-bold mt-1">Redirecting you to the dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
