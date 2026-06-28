export type ScreenType =
  | 'welcome'
  | 'continue_modal'
  | 'onboarding'
  | 'brain_dump'
  | 'planning'
  | 'dashboard'
  | 'tasks'
  | 'execution_plan';

export interface UserProfile {
  name?: string;
  firstName?: string;
  email?: string | null;
  role: 'student' | 'professional' | 'entrepreneur' | null | string;
  isGuest?: boolean;
  signedIn?: boolean;
  calendarConnected?: boolean;
  latestBrainDump?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SubTask {
  id?: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface Task {
  id: string; // Document ID
  userId?: string;
  title: string;
  description?: string; // Additional context
  category?: string; // Optional tagging
  deadline?: string | null; // e.g. timestamp or ISO string, nullable
  priority: 'High' | 'Medium' | 'Low' | string;
  status?: 'Pending' | 'In Progress' | 'Completed' | string;
  progress: number;
  estimatedHours?: number;
  estimatedMinutes?: number; // Backwards compatible with existing AI logic
  recurring?: boolean;
  recurrence?: 'Daily' | 'Weekly' | 'Monthly' | string | null;
  recurrenceTime?: string | null;
  novaRecommendation?: string;
  subtasks: SubTask[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ExecutionPlanSession {
  id?: string;
  taskId: string;
  taskTitle: string;
  subtask?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  status: 'Planned' | 'Completed' | 'Skipped' | string;
  source: 'Nova' | 'Google Calendar' | string;
  completed?: boolean; // Keep for backward compatibility with UI checkboxes
  estimatedMinutes?: number;
}

export interface DashboardData {
  todaysMission: string;
  novaRecommendation: string;
  highestRiskTask: string;
  upcomingDeadlines: { title: string; category: string; dueDate: string; priority: string }[];
  todaysTimeline: { time: string; title: string; subtitle: string; category: string }[];
}

export interface ExecutionPlan {
  id?: string;
  userId?: string;
  lastGenerated?: any;
  sessions?: ExecutionPlanSession[];
  days?: {
    dayName: string;
    sessions: ExecutionPlanSession[];
  }[];
  novaNotification?: string;
  dashboardData?: DashboardData; // Ephemeral/AI-generated metadata
  createdAt?: any;
  updatedAt?: any;
}

export interface ChatMessage {
  sender: 'nova' | 'user';
  text: string;
  timestamp: Date;
}
