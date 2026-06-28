import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Edit3, 
  X, 
  Send, 
  Sparkles,
  RefreshCw,
  Slash
} from 'lucide-react';
import { Task, ChatMessage, ExecutionPlan } from '../types';

interface FocusModeScreenProps {
  task: Task | null;
  tasks: Task[];
  setTasks: (action: React.SetStateAction<Task[]>) => void;
  executionPlan: ExecutionPlan | null;
  setExecutionPlan: (plan: ExecutionPlan | null) => void;
  onReplan: (reason: string) => Promise<ExecutionPlan | null>;
  userRole: string | null;
  brainDump: string;
  onBackToDashboard: () => void;
}

export default function FocusModeScreen({ 
  task, 
  tasks, 
  setTasks, 
  executionPlan, 
  setExecutionPlan, 
  onReplan, 
  userRole,
  brainDump,
  onBackToDashboard 
}: FocusModeScreenProps) {
  // Extract subtasks dynamically from active task, or fall back to standard steps
  const steps = task && task.subtasks && task.subtasks.length > 0
    ? task.subtasks.map(st => st.title)
    : ["Analyze task requirements", "Define execution plan", "Work on active item", "Review and verify", "Complete task"];

  // Initialize progress dynamically to the first uncompleted subtask or 0
  const initialIndex = (() => {
    if (!task || !task.subtasks) return 0;
    const firstUncompleted = task.subtasks.findIndex(st => !st.completed);
    return firstUncompleted >= 0 ? firstUncompleted : 0;
  })();

  const [currentStepIndex, setCurrentStepIndex] = useState(initialIndex);
  const [notes, setNotes] = useState('');
  const [isNovaDrawerOpen, setIsNovaDrawerOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isNovaThinking, setIsNovaThinking] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const taskName = task ? task.title : "your task";
    return [
      { 
        sender: 'nova', 
        text: `Hi! I'm Nova, your executive function coach. Let's focus on completing "${taskName}". Where are you currently starting, and how can I help you break it down?`, 
        timestamp: new Date() 
      }
    ];
  });

  const taskTitle = task ? task.title : "Active Focus Session";
  const currentSubtaskEstimate = task?.subtasks?.[currentStepIndex]?.estimatedMinutes;
  const progressPercent = steps.length > 0 ? Math.round((currentStepIndex / steps.length) * 100) : 0;

  const handleCompleteStep = () => {
    if (!task) return;
    
    // Update subtask completion status
    const updatedSubtasks = task.subtasks ? task.subtasks.map((st, sidx) => {
      if (sidx === currentStepIndex) {
        return { ...st, completed: true };
      }
      return st;
    }) : [];

    // Calculate new progress percent
    const totalSubtasks = updatedSubtasks.length;
    const completedSubtasks = updatedSubtasks.filter(st => st.completed).length;
    const newProgressPercent = totalSubtasks > 0 
      ? Math.round((completedSubtasks / totalSubtasks) * 100) 
      : 0;

    const updatedTask = {
      ...task,
      subtasks: updatedSubtasks,
      progress: newProgressPercent,
      status: newProgressPercent === 100 ? 'Completed' as const : 'In Progress' as const
    };

    // Central tasks mutator updates Firestore & LocalStorage
    setTasks(prevTasks => prevTasks.map(t => t.id === task.id ? updatedTask : t));

    // Also update session completion status in the execution plan if present
    if (executionPlan) {
      const updatedDays = executionPlan.days.map(day => {
        const updatedSessions = day.sessions.map(sess => {
          if (sess.taskId === task.id || sess.taskTitle === task.title) {
            return { ...sess, completed: newProgressPercent === 100, status: newProgressPercent === 100 ? 'completed' as const : sess.status || 'planned' };
          }
          return sess;
        });
        return { ...day, sessions: updatedSessions };
      });
      setExecutionPlan({
        ...executionPlan,
        days: updatedDays
      });
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      alert(`Fantastic work! You have finished all steps for "${task.title}".`);
      onBackToDashboard();
    }
  };

  const handleSkipStep = async () => {
    if (!task) return;
    const skippedStep = steps[currentStepIndex];
    setIsAdjusting(true);

    // Dynamic coach active replan message triggers '/api/replan'
    const reason = `I completed earlier steps, but I want to skip "${skippedStep}" for this session of "${task.title}".`;
    
    const newPlan = await onReplan(reason);
    setIsAdjusting(false);

    if (newPlan) {
      alert(`Nova AI Coach: "I noticed today's session wasn't completed. I've moved '${skippedStep}' and rescheduled your day so you still finish your targets on time."`);
      onBackToDashboard();
    } else {
      // Offline fallback shift
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        onBackToDashboard();
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: chatInput.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsNovaThinking(true);

    try {
      const response = await fetch('/api/nova', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg.text,
          userRole,
          brainDump,
          task,
          currentSubtask: steps[currentStepIndex],
          notes,
          executionPlan,
          tasks
        })
      });

      if (!response.ok) {
        throw new Error('Nova response failed');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, {
        sender: 'nova',
        text: data.reply || "Stay with this step. I can help you break it down further if you need.",
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error("Nova chat failed:", err);
      setChatHistory(prev => [...prev, {
        sender: 'nova',
        text: `Let's stay focused on "${steps[currentStepIndex]}". Break it into the smallest next action, write down anything uncertain in notes, then complete that one action before switching context.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsNovaThinking(false);
    }
  };

  return (
    <div className="min-h-screen text-[#1e293b] bg-background flex flex-col antialiased">
      {/* Workspace Header toolbar */}
      <header className="w-full px-6 py-4 flex justify-between items-center border-b-2 border-[#1e293b] bg-white sticky top-0 z-30">
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#1e293b] text-[#1e293b] shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-y-[2px] active:shadow-none transition-all font-bold rounded-xl cursor-pointer text-xs"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-black text-[#1e293b]">Focus Session</span>
        </div>
      </header>

      {/* Main split work area */}
      <main className="flex-grow flex flex-col md:flex-row relative">
        {/* Left Side: Focused step work board */}
        <div className="flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8">
          {/* Active task details */}
          <div className="space-y-4">
            <h1 className="font-display text-3xl md:text-4xl font-black text-[#1e293b] leading-tight">
              {taskTitle}
            </h1>
            
            {/* Immersive progress bar */}
            <div className="w-full max-w-md">
              <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Progress</span>
                <span>{progressPercent}% ({currentStepIndex} of {steps.length} steps completed)</span>
              </div>
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-[#1e293b] p-0.5">
                <div 
                  className="h-full bg-[#10b981] rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Focus Card */}
          <div className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[28px] p-6 sm:p-8 relative overflow-hidden group text-[#1e293b]">
            {/* Highlighted edge */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#10b981] border-r border-[#1e293b]" />
            
            <span className="text-[10px] font-black text-[#10b981] uppercase tracking-widest block mb-2 font-mono">CURRENT SUBTASK</span>
            <h2 className="font-display text-xl sm:text-2xl font-black text-[#1e293b] mb-2 leading-tight">
              {steps[currentStepIndex]}
            </h2>

            <div className="flex items-center gap-2 mb-5 text-xs text-slate-500 font-bold">
              <Target className="w-4 h-4 text-[#10b981] stroke-[2.5]" />
              <span>Goal: Execute current step with deep focus and zero distractions.</span>
            </div>

            {/* Estimations metadata */}
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Estimated: {currentSubtaskEstimate ? `${currentSubtaskEstimate} mins` : task ? `${task.estimatedMinutes} mins` : "45 mins"}</span>
              </span>
              <span className={`flex items-center gap-1.5 border px-2 py-0.5 rounded-lg font-mono shadow-[1px_1px_0px_#1e293b] ${
                task?.priority === "High" 
                  ? "bg-[#fee2e2] text-[#991b1b] border-[#1e293b]" 
                  : task?.priority === "Medium" 
                    ? "bg-[#fffbeb] text-[#b45309] border-[#1e293b]" 
                    : "bg-[#e0f2fe] text-[#0369a1] border-[#1e293b]"
              }`}>
                <AlertTriangle className="w-4 h-4" />
                <span>Priority: {task ? task.priority : "Medium"}</span>
              </span>
            </div>

            {/* Complete step button & Skip step option */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleCompleteStep}
                disabled={isAdjusting}
                className="flex-1 bg-[#10b981] hover:bg-[#059669] border-2 border-[#1e293b] shadow-clay-btn text-white font-black py-4 rounded-2xl active:scale-[0.98] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b] active:shadow-clay-btn-active active:translate-x-[2px] active:translate-y-[2px] transition-all flex justify-center items-center gap-2 text-base shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span>Complete Current Step</span>
                <CheckCircle className="w-5 h-5 fill-white/10 stroke-[2.5]" />
              </button>
              
              <button 
                onClick={handleSkipStep}
                disabled={isAdjusting}
                className="bg-slate-100 border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] text-[#1e293b] hover:text-red-500 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-bold py-4 px-6 rounded-2xl cursor-pointer disabled:opacity-50"
              >
                {isAdjusting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Slash className="w-4 h-4" />
                )}
                <span>Skip / Adjust Plan</span>
              </button>
            </div>
          </div>

          {/* Workspace Notes */}
          <div className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px] p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-[#1e293b] uppercase tracking-wider font-mono">
              <Edit3 className="w-4 h-4 text-[#10b981] stroke-[2.5]" />
              <span>Workspace Notes</span>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 resize-none border-none focus:ring-0 bg-transparent text-sm font-bold text-[#1e293b] placeholder:text-slate-400 p-0 leading-relaxed focus:outline-none" 
              placeholder="Jot down quick thoughts, formulas, table designs, or findings here..."
            />
          </div>

          {/* Ask Nova Callout card widget */}
          <div className="bg-[#f3e8ff] border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#a78bfa] border border-[#1e293b] flex items-center justify-center text-white shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 fill-white/10" />
              </div>
              <div>
                <div className="text-sm font-black text-[#1e293b] leading-tight">Ask Nova</div>
                <div className="text-xs text-slate-600 font-bold">Ask Nova whenever you're stuck or need guidance.</div>
              </div>
            </div>
            <button 
              id="toggle-nova"
              onClick={() => setIsNovaDrawerOpen(!isNovaDrawerOpen)}
              className="w-full sm:w-auto bg-[#a78bfa] hover:bg-[#8b5cf6] text-white px-5 py-2.5 rounded-xl text-xs font-black border-2 border-[#1e293b] shadow-clay-btn hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b] active:shadow-clay-btn-active active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white/10" />
              <span>Ask Nova</span>
            </button>
          </div>

        </div>
      </main>

      {/* Persistent Chat Drawer (Saves state, slides on top of right side) */}
      <AnimatePresence>
        {isNovaDrawerOpen && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-[400px] bg-white border-l-[3px] border-[#1e293b] shadow-clay-card z-40 flex flex-col pt-16"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b-2 border-[#1e293b] flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-sm font-black text-[#1e293b] uppercase tracking-wider font-mono">
                <div className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-pulse border border-[#1e293b] mr-1" />
                <span>Nova AI Advisor</span>
              </div>
              <button 
                id="close-nova"
                onClick={() => setIsNovaDrawerOpen(false)}
                className="text-slate-500 hover:text-red-500 transition-all p-1.5 rounded-xl border border-transparent hover:border-[#1e293b] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Chat conversation list */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#fffdf9] font-sans">
              {chatHistory.map((msg, index) => {
                const isNova = msg.sender === 'nova';
                return (
                  <div 
                    key={index} 
                    className={`flex gap-3 max-w-[85%] ${!isNova ? 'self-end flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
                      isNova ? 'bg-[#a78bfa] border border-[#1e293b] shadow-[1px_1px_0px_#1e293b]' : 'bg-slate-100 border border-[#1e293b] text-[#1e293b]'
                    }`}>
                      {isNova ? <Sparkles className="w-4 h-4 fill-white/10" /> : <span className="text-[10px] font-black">ME</span>}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs font-bold leading-relaxed shadow-[2px_2px_0px_#1e293b] border-2 border-[#1e293b] ${
                      isNova 
                        ? 'bg-white text-[#1e293b] rounded-tl-none' 
                        : 'bg-[#bfdbfe] text-[#1e293b] rounded-tr-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {isNovaThinking && (
                <div className="flex gap-3 max-w-[85%] animate-pulse">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white bg-[#a78bfa] border border-[#1e293b]">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3.5 rounded-2xl text-xs font-bold leading-relaxed shadow-[2px_2px_0px_#1e293b] border-2 border-[#1e293b] bg-white text-[#1e293b] rounded-tl-none">
                    Nova is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Message input area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-[#1e293b] bg-slate-50">
              <div className="relative">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Nova a question..."
                  className="w-full bg-white border-2 border-[#1e293b] rounded-full py-3.5 pl-4 pr-12 text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-4 focus:ring-[#10b981]/15 focus:border-[#10b981] shadow-inner placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={isNovaThinking}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#10b981] hover:bg-[#059669] border border-[#1e293b] text-white flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
}
