import React, { useState } from 'react';
import { 
  Check, 
  Trash2, 
  Plus, 
  Tag, 
  AlertCircle,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import Sidebar from './Sidebar';
import { ScreenType, Task, UserProfile } from '../types';

interface TasksScreenProps {
  user: UserProfile;
  setScreen: (screen: ScreenType) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onCreateTaskWithNova?: (taskInput: {
    title: string;
    description: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    estimatedMinutes: number;
  }) => Promise<{ task?: Partial<Task>; executionPlan?: any } | null>;
  setExecutionPlan?: (plan: any) => void;
  onDeleteTaskWithReplan?: (task: Task, scope: 'today' | 'all') => Promise<{ success: boolean; message: string }>;
  onSignOut?: () => void;
  onSignIn?: () => void;
  onAddTaskClick?: () => void;
}

export default function TasksScreen({ user, setScreen, tasks, setTasks, onCreateTaskWithNova, setExecutionPlan, onDeleteTaskWithReplan, onSignOut, onSignIn, onAddTaskClick }: TasksScreenProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newCategory, setNewCategory] = useState('Academics');
  const [newDuration, setNewDuration] = useState('60');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [pendingDeleteTask, setPendingDeleteTask] = useState<Task | null>(null);
  const [deleteScope, setDeleteScope] = useState<'today' | 'all'>('all');
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [novaStatusMessage, setNovaStatusMessage] = useState('');

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(st => {
          if (st.id === subtaskId) return { ...st, completed: !st.completed };
          return st;
        });
        const completedCount = updatedSubtasks.filter(st => st.completed).length;
        const progress = Math.round((completedCount / updatedSubtasks.length) * 100) || 0;
        return {
          ...t,
          subtasks: updatedSubtasks,
          progress,
          status: progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Pending'
        };
      }
      return t;
    }));
  };

  const generateSafeId = () => Math.random().toString(36).substring(2, 11);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      setIsAddingTask(true);
      const taskInput = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        category: newCategory.trim() || 'General',
        estimatedMinutes: parseInt(newDuration) || 60,
      };

      const novaResult = onCreateTaskWithNova ? await onCreateTaskWithNova(taskInput) : null;
      const generatedTask = novaResult?.task;
      const newTask: Task = {
        id: generatedTask?.id || generateSafeId(),
        title: generatedTask?.title || taskInput.title,
        description: generatedTask?.description || taskInput.description || 'No description provided.',
        priority: (generatedTask?.priority as Task['priority']) || taskInput.priority,
        category: generatedTask?.category || taskInput.category,
        deadline: '3 Days',
        ...generatedTask,
        estimatedMinutes: generatedTask?.estimatedMinutes || taskInput.estimatedMinutes,
        progress: 0,
        subtasks: generatedTask?.subtasks?.length 
          ? generatedTask.subtasks.map(st => ({
              id: st.id || generateSafeId(),
              title: st.title,
              completed: st.completed || false
            }))
          : [
              { id: generateSafeId(), title: 'Clarify the outcome', completed: false },
              { id: generateSafeId(), title: 'Complete the main work block', completed: false },
              { id: generateSafeId(), title: 'Review and finish', completed: false }
            ]
      };
      setTasks(prev => [newTask, ...prev]);
      if (novaResult?.executionPlan && setExecutionPlan) {
        setExecutionPlan(novaResult.executionPlan);
      }
      setNewTitle('');
      setNewDesc('');
      setShowAddForm(false);
      setIsAddingTask(false);
    }
  };

  const isRecurringTask = (task: Task) => {
    const recurringText = `${task.title} ${task.description} ${task.deadline}`.toLowerCase();
    return (task as any).recurring || recurringText.includes('daily') ||
      recurringText.includes('every day') ||
      recurringText.includes('everyday') ||
      recurringText.includes('recurring') ||
      task.deadline?.toLowerCase() === 'daily';
  };

  const requestDeleteTask = (task: Task) => {
    setDeleteScope(isRecurringTask(task) ? 'today' : 'all');
    setPendingDeleteTask(task);
  };

  const closeDeleteDialog = () => {
    if (isDeletingTask) return;
    setPendingDeleteTask(null);
    setDeleteScope('all');
  };

  const confirmDeleteTask = async () => {
    if (!pendingDeleteTask) return;
    setIsDeletingTask(true);

    try {
      if (onDeleteTaskWithReplan) {
        const result = await onDeleteTaskWithReplan(pendingDeleteTask, deleteScope);
        setNovaStatusMessage(result.message);
      } else {
        setTasks(prev => prev.filter(t => t.id !== pendingDeleteTask.id));
        setNovaStatusMessage(`Nova updated your execution plan after removing "${pendingDeleteTask.title}".`);
      }
      setPendingDeleteTask(null);
      setDeleteScope('all');
    } finally {
      setIsDeletingTask(false);
    }
  };

  return (
    <div className="font-sans text-[#1e293b] bg-background min-h-screen flex overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar currentScreen="tasks" setScreen={setScreen} user={user} onAddTaskClick={onAddTaskClick} onSignOut={onSignOut} onSignIn={onSignIn} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 h-screen overflow-y-auto relative pb-24 bg-background">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b-2 border-[#1e293b] px-6 py-4 flex justify-between items-center sticky top-0 z-40">
          <span className="font-display text-xl font-black text-[#1e293b]">Ahead</span>
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-8 h-8 rounded-full bg-[#10b981] border border-[#1e293b] text-white flex items-center justify-center shadow-[1px_1px_0px_#1e293b] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </header>

        {/* Content Container */}
        <div className="pt-8 pb-20 px-6 md:px-10 max-w-5xl mx-auto space-y-8">
          
          {/* Section title */}
          <div>
            <h2 className="font-display text-3xl font-black text-[#1e293b] tracking-tight mb-2">My Tasks</h2>
            <p className="text-slate-500 font-bold">Manage and run focused blocks for your milestones.</p>
          </div>

          {novaStatusMessage && (
            <div className="bg-white border-[3px] border-[#1e293b] shadow-[4px_4px_0px_#1e293b] text-[#1e293b] rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-[#10b981] border border-[#1e293b] flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-[#059669] uppercase tracking-wider">Nova updated your plan</h4>
                <p className="text-sm text-[#1e293b] font-bold mt-1">{novaStatusMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setNovaStatusMessage('')}
                className="text-slate-500 hover:text-red-500 text-xs font-black"
              >
                Dismiss
              </button>
            </div>
          )}

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
              href="#execution_plan"
              onClick={(e) => { e.preventDefault(); setScreen('execution_plan'); }}
              className="text-sm font-bold text-slate-500 hover:text-[#10b981] transition-colors flex items-center gap-1.5"
            >
              Execution Plan
            </a>
          </div>

          {/* Quick Add Form drawer state */}
          {showAddForm && (
            <div className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-2xl p-6 relative animate-fade-in text-[#1e293b]">
              <h3 className="text-base font-black text-[#1e293b] mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#10b981] animate-pulse" />
                <span>Quick Add Task</span>
              </h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Title</label>
                    <input 
                      type="text" 
                      required
                      value={newTitle} 
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. DBMS Assignment"
                      className="w-full bg-white border-2 border-[#1e293b] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.06),_2px_2px_0px_#1e293b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                    <input 
                      type="text" 
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Academics, Work, Personal"
                      className="w-full bg-white border-2 border-[#1e293b] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.06),_2px_2px_0px_#1e293b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short summary of what needs to be done..."
                    className="w-full h-20 bg-white border-2 border-[#1e293b] rounded-xl p-4 text-sm font-bold text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.06),_2px_2px_0px_#1e293b] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                    <select 
                      value={newPriority} 
                      onChange={(e) => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                      className="w-full bg-white border-2 border-[#1e293b] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1e293b] focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.06),_2px_2px_0px_#1e293b]"
                    >
                      <option value="High" className="bg-white text-[#1e293b]">High Priority</option>
                      <option value="Medium" className="bg-white text-[#1e293b]">Medium Priority</option>
                      <option value="Low" className="bg-white text-[#1e293b]">Low Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (mins)</label>
                    <input 
                      type="number" 
                      value={newDuration} 
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-white border-2 border-[#1e293b] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1e293b] focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.06),_2px_2px_0px_#1e293b]"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button 
                      type="submit"
                      disabled={isAddingTask}
                      className="w-full bg-[#10b981] hover:bg-[#059669] text-white text-sm font-black h-[42px] border-2 border-[#1e293b] rounded-xl shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isAddingTask ? 'Nova Planning...' : 'Save Task'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="w-full bg-slate-100 border-2 border-[#1e293b] text-[#1e293b] text-sm font-bold h-[42px] rounded-xl shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Tasks List Grid layout */}
          <div className="space-y-6">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden transition-all duration-300"
              >
                {/* Priority colored sidebar decoration strip */}
                <div className={`absolute top-0 left-0 w-1.5 h-full border-r border-[#1e293b] ${
                  task.priority === 'High' 
                    ? 'bg-red-400' 
                    : task.priority === 'Medium' 
                      ? 'bg-[#10b981]' 
                      : 'bg-slate-300'
                }`} />

                {/* Task Header row */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="bg-slate-100 border border-[#1e293b] text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                        {task.category}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 border rounded-md uppercase tracking-wider font-mono shadow-[1px_1px_0px_#1e293b] ${
                        task.priority === 'High' 
                          ? 'bg-[#fee2e2] text-[#991b1b] border-[#1e293b]' 
                          : task.priority === 'Medium' 
                            ? 'bg-[#e0f2fe] text-[#0369a1] border-[#1e293b]' 
                            : 'bg-slate-100 text-slate-500 border-[#1e293b]'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-[#1e293b] tracking-tight leading-tight">{task.title}</h3>
                    {task.description && !task.description.includes("Action plan to complete") && (
                      <p className="text-sm text-slate-500 font-bold max-w-2xl leading-relaxed">{task.description}</p>
                    )}
                  </div>

                  {/* Task Actions side */}
                  <div className="flex items-center gap-3 w-full md:w-auto md:self-center justify-end">
                    <button 
                      onClick={() => requestDeleteTask(task)}
                      className="p-2.5 bg-white border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] text-[#1e293b] hover:text-red-500 hover:bg-red-50 active:translate-y-[1px] active:shadow-[1px_1px_0px_#1e293b] rounded-xl transition-all cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators block */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Task Progress</span>
                    <span className="text-[#1e293b] font-black">{task.progress}% Completed</span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-[#1e293b] p-0.5">
                    <div 
                      className="h-full bg-[#10b981] border border-[#1e293b] rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Subtasks checklist area */}
                <div className="border-t-2 border-[#1e293b]/10 pt-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                    <Check className="w-4 h-4 text-[#10b981] stroke-[3]" />
                    <span>Subtasks Checklist</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {task.subtasks.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => toggleSubtask(task.id, st.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 group cursor-pointer ${
                          st.completed 
                            ? 'bg-slate-50 border-[#1e293b]/30 text-slate-400 line-through' 
                            : 'bg-white border-[#1e293b] text-[#1e293b] hover:bg-slate-50 shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                          st.completed 
                            ? 'bg-[#10b981] border-[#1e293b] text-white shadow-[1px_1px_0px_#1e293b]' 
                            : 'border-[#1e293b] group-hover:border-[#10b981]'
                        }`}>
                          {st.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                        </div>
                        <span className="text-xs font-bold">{st.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-16 bg-white border-2 border-dashed border-[#1e293b] shadow-[3px_3px_0px_#1e293b] rounded-3xl">
                <p className="text-slate-500 text-sm font-bold mb-2">No tasks remaining today.</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="text-[#10b981] font-black text-xs hover:text-[#059669] cursor-pointer"
                >
                  Create a new task to start
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {pendingDeleteTask && (
        <div className="fixed inset-0 z-[80] bg-[#1e293b]/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-2xl p-6 animate-fade-in text-[#1e293b]">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 border border-[#1e293b] text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1e293b]">
                  {isRecurringTask(pendingDeleteTask) ? 'Delete recurring task?' : `Delete "${pendingDeleteTask.title}"?`}
                </h3>
                <p className="text-sm text-slate-500 font-bold mt-1 leading-relaxed">
                  This will remove related execution sessions and Nova will update your execution plan.
                </p>
              </div>
            </div>

            {isRecurringTask(pendingDeleteTask) && (
              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  deleteScope === 'today' ? 'bg-[#bfdbfe] border-[#1e293b] shadow-[1px_1px_0px_#1e293b] translate-y-[1px]' : 'bg-white border-[#1e293b] shadow-[2px_2px_0px_#1e293b]'
                }`}>
                  <input
                    type="radio"
                    name="delete-scope"
                    checked={deleteScope === 'today'}
                    onChange={() => setDeleteScope('today')}
                    className="accent-[#10b981] border-[#1e293b]"
                  />
                  <span className="text-sm font-bold text-[#1e293b]">Only today's session</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  deleteScope === 'all' ? 'bg-[#bfdbfe] border-[#1e293b] shadow-[1px_1px_0px_#1e293b] translate-y-[1px]' : 'bg-white border-[#1e293b] shadow-[2px_2px_0px_#1e293b]'
                }`}>
                  <input
                    type="radio"
                    name="delete-scope"
                    checked={deleteScope === 'all'}
                    onChange={() => setDeleteScope('all')}
                    className="accent-[#10b981] border-[#1e293b]"
                  />
                  <span className="text-sm font-bold text-[#1e293b]">This and all future sessions</span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeletingTask}
                className="px-5 py-2.5 rounded-xl bg-slate-100 border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] text-[#1e293b] text-sm font-bold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-y-[2px] active:shadow-none disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                disabled={isDeletingTask}
                className="px-5 py-2.5 rounded-xl bg-red-500 border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] text-white text-sm font-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-y-[2px] active:shadow-none disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDeletingTask && <Sparkles className="w-4 h-4 animate-spin text-white" />}
                <span>{isRecurringTask(pendingDeleteTask) ? 'Delete' : 'Delete & Replan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
