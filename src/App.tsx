import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { ScreenType, UserProfile, Task, ExecutionPlan } from './types';

// Firebase imports
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';

const sanitizePayload = (payload: any): any => {
  return JSON.parse(JSON.stringify(payload, (key, value) => value === undefined ? null : value));
};
// Importing screens
import WelcomeScreen from './components/WelcomeScreen';
import ContinueModal from './components/ContinueModal';
import OnboardingScreen from './components/OnboardingScreen';
import BrainDumpScreen from './components/BrainDumpScreen';
import PlanningScreen from './components/PlanningScreen';
import DashboardScreen from './components/DashboardScreen';
import TasksScreen from './components/TasksScreen';
import ExecutionPlanScreen from './components/ExecutionPlanScreen';

// No default tasks stored initially to respect user intent of an empty workspace before Brain Dump.
const initialTasks: Task[] = [];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('welcome');
  const [user, setUser] = useState<UserProfile>({
    firstName: '',
    role: null,
    signedIn: false,
    latestBrainDump: ''
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [brainDumpText, setBrainDumpText] = useState('');
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [isProcessingQuickAdd, setIsProcessingQuickAdd] = useState(false);

  const loadUserProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setUser({
        firstName: '',
        role: null,
        signedIn: false,
        latestBrainDump: ''
      });
      setTasks([]);
      setBrainDumpText('');
      setCurrentScreen('welcome');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUser({
          firstName: profileData.firstName || profileData.name || firebaseUser.displayName?.split(' ')[0] || '',
          name: profileData.name || profileData.firstName || firebaseUser.displayName?.split(' ')[0] || '',
          email: profileData.email || firebaseUser.email || null,
          role: profileData.role || null,
          signedIn: true,
          latestBrainDump: profileData.latestBrainDump || '',
          isGuest: profileData.isGuest || false,
          calendarConnected: profileData.calendarConnected || false
        });
        setBrainDumpText(profileData.latestBrainDump || '');
        setCurrentScreen('dashboard');
      } else {
        setUser({
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          name: firebaseUser.displayName?.split(' ')[0] || '',
          email: firebaseUser.email || null,
          role: null,
          signedIn: true,
          latestBrainDump: '',
          isGuest: false,
          calendarConnected: false
        });
        setCurrentScreen('onboarding');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
      setUser({
        firstName: firebaseUser.displayName?.split(' ')[0] || '',
        name: firebaseUser.displayName?.split(' ')[0] || '',
        email: firebaseUser.email || null,
        role: null,
        signedIn: true,
        latestBrainDump: '',
        isGuest: false,
        calendarConnected: false
      });
      setCurrentScreen('onboarding');
    }
  }, []);

  // 1. Authentication State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, loadUserProfile);
    return unsubscribe;
  }, [loadUserProfile]);

  // 2. Real-time User Workspace Sync from Firestore (Only when signed in)
  useEffect(() => {
    if (user.signedIn && auth.currentUser) {
      const userId = auth.currentUser.uid;
      
      // Listener for User Profile
      const userDocRef = doc(db, 'users', userId);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          if (profileData.latestBrainDump) {
            setBrainDumpText(profileData.latestBrainDump);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      });

      // Listener for Tasks
      const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
      const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
        setTasks(fetchedTasks);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `tasks`);
      });

      // Listener for Execution Plan (we just take the first matching plan for MVP)
      const planQuery = query(collection(db, 'executionPlans'), where('userId', '==', userId), limit(1));
      const unsubscribePlan = onSnapshot(planQuery, (snapshot) => {
        if (!snapshot.empty) {
          const planDoc = snapshot.docs[0];
          setExecutionPlan({ ...planDoc.data(), id: planDoc.id } as ExecutionPlan);
        } else {
          setExecutionPlan(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `executionPlans`);
      });

      return () => {
        unsubscribeUser();
        unsubscribeTasks();
        unsubscribePlan();
      };
    }
  }, [user.signedIn]);

  // 2c. Guest State Persistence Loader
  useEffect(() => {
    if (!user.signedIn) {
      const storedBrainDump = localStorage.getItem('guest_brain_dump');
      if (storedBrainDump) {
        setBrainDumpText(storedBrainDump);
      }
      const storedPlan = localStorage.getItem('guest_execution_plan');
      if (storedPlan) {
        try {
          const plan = JSON.parse(storedPlan);
          if (plan && plan.days && plan.days.length > 0) {
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const today = new Date();
            const currentDayName = daysOfWeek[today.getDay()];
            
            // If the loaded plan's first day name does not match today's day name, shift all days to start from today
            if (plan.days[0].dayName !== currentDayName) {
              const dayNames: string[] = [];
              for (let i = 0; i < 5; i++) {
                const d = new Date();
                d.setDate(today.getDate() + i);
                dayNames.push(daysOfWeek[d.getDay()]);
              }
              
              plan.days = plan.days.map((day: any, idx: number) => ({
                ...day,
                dayName: dayNames[idx] || day.dayName,
                sessions: (day.sessions || []).map((session: any) => ({
                  ...session,
                  date: dayNames[idx] || day.dayName
                }))
              }));
              
              // Also update sessions array if present in the plan root
              if (plan.sessions && plan.sessions.length > 0) {
                plan.sessions = plan.days.flatMap((day: any) => 
                  (day.sessions || []).map((s: any) => ({ ...s, dayName: day.dayName }))
                );
              }
              
              localStorage.setItem('guest_execution_plan', JSON.stringify(plan));
            }
          }
          setExecutionPlan(plan);
        } catch (e) {
          console.error("Failed to parse guest execution plan:", e);
        }
      }
      const storedTasks = localStorage.getItem('guest_tasks');
      if (storedTasks) {
        try {
          setTasks(JSON.parse(storedTasks));
        } catch (e) {
          console.error("Failed to parse guest tasks:", e);
        }
      }
    }
  }, [user.signedIn]);

  // No seeding needed; start with a completely empty database on first sign-in.

  // Navigations & Core Actions
  const handleStartPlanning = () => {
    setCurrentScreen('continue_modal');
  };

  const handleContinueGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await loadUserProfile(userCredential.user);
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      const userId = firebaseUser.uid;

      // 1. Get or create user doc
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};

      // Prepare user profile data
      const firstName = existingData.firstName || firebaseUser.displayName?.split(' ')[0] || user.firstName || 'Alex';
      const name = existingData.name || existingData.firstName || firebaseUser.displayName?.split(' ')[0] || user.firstName || 'Alex';
      const email = existingData.email || firebaseUser.email || user.email || null;
      const role = existingData.role || user.role || 'professional';
      const latestBrainDump = brainDumpText || existingData.latestBrainDump || user.latestBrainDump || '';
      
      const userPayload = sanitizePayload({
        firstName,
        name,
        email,
        role,
        signedIn: true,
        isGuest: false,
        calendarConnected: existingData.calendarConnected || user.calendarConnected || false,
        latestBrainDump,
        ...(userDoc.exists() ? {} : { createdAt: new Date().toISOString() })
      });

      // 2. Batch write everything (profile, tasks, execution plan)
      const batch = writeBatch(db);
      
      batch.set(userDocRef, {
        ...userPayload,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Save tasks if there are any
      if (tasks.length > 0) {
        tasks.forEach(task => {
          const taskId = task.id || doc(collection(db, 'tasks')).id;
          const taskRef = doc(db, 'tasks', taskId);
          const taskPayload = sanitizePayload({
            ...task,
            id: taskId,
            userId,
            createdAt: task.createdAt || new Date().toISOString()
          });
          batch.set(taskRef, { ...taskPayload, updatedAt: serverTimestamp() }, { merge: true });
        });
      }

      // Save execution plan if there is one
      if (executionPlan) {
        const planId = executionPlan.id || doc(collection(db, 'executionPlans')).id;
        const planRef = doc(db, 'executionPlans', planId);
        const planPayload = sanitizePayload({
          ...executionPlan,
          id: planId,
          userId,
          lastGenerated: executionPlan.lastGenerated || new Date().toISOString()
        });
        batch.set(planRef, { ...planPayload, updatedAt: serverTimestamp() }, { merge: true });
      }

      await batch.commit();

      // Clear guest local storage
      localStorage.removeItem('guest_brain_dump');
      localStorage.removeItem('guest_execution_plan');
      localStorage.removeItem('guest_tasks');

      // Update state
      setUser({
        firstName,
        name,
        email,
        role,
        signedIn: true,
        isGuest: false,
        calendarConnected: userPayload.calendarConnected,
        latestBrainDump
      });

      setCurrentScreen('dashboard');
    } catch (err) {
      console.error("Google login and merge failed:", err);
    }
  };

  const handleContinueGuest = () => {
    setUser({
      firstName: '',
      role: null,
      signedIn: false,
      latestBrainDump: brainDumpText
    });
    setCurrentScreen('onboarding');
  };

  const handleOnboardingSubmit = async (profile: UserProfile) => {
    setUser(profile);
    if (profile.signedIn && auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        const userDocRef = doc(db, 'users', userId);
        const existingUserDoc = await getDoc(userDocRef);
        const payload = sanitizePayload({
          firstName: profile.firstName || '',
          name: profile.name || profile.firstName || '',
          email: auth.currentUser.email || profile.email || null,
          role: profile.role || '',
          signedIn: true,
          isGuest: false,
          calendarConnected: profile.calendarConnected || false,
          latestBrainDump: profile.latestBrainDump || brainDumpText || '',
          ...(existingUserDoc.exists() ? {} : { createdAt: new Date().toISOString() })
        });
        
        await setDoc(userDocRef, {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      }
    }
    setCurrentScreen('brain_dump');
  };

  const handleBrainDumpSubmit = async (text: string) => {
    setBrainDumpText(text);
    setUser(prev => ({ ...prev, latestBrainDump: text }));
    if (user.signedIn && auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        const payload = sanitizePayload({
          firstName: user.firstName || '',
          name: user.name || user.firstName || '',
          email: auth.currentUser.email || user.email || null,
          role: user.role || '',
          signedIn: true,
          isGuest: false,
          calendarConnected: user.calendarConnected || false,
          latestBrainDump: text
        });

        await setDoc(doc(db, 'users', userId), {
          ...payload,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      }
    } else {
      localStorage.setItem('guest_brain_dump', text);
    }
    setCurrentScreen('planning');
  };

  const handleSetExecutionPlan = async (plan: ExecutionPlan | null) => {
    const planWithSessions = plan ? {
      ...plan,
      sessions: plan.sessions || (plan as any).days?.flatMap((day: any) => day.sessions?.map((session: any) => ({
        ...session,
        date: session.date || new Date().toISOString().split('T')[0],
        duration: session.duration || session.estimatedMinutes || 60,
        status: session.status || (session.completed ? 'completed' : 'planned'),
        source: session.source || 'nova'
      }))) || []
    } : null;
    setExecutionPlan(planWithSessions);
    if (user.signedIn && auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        if (planWithSessions) {
          const planId = planWithSessions.id || doc(collection(db, 'executionPlans')).id;
          const payload = sanitizePayload({
            ...planWithSessions,
            id: planId,
            userId,
            lastGenerated: new Date().toISOString()
          });
          
          await setDoc(doc(db, 'executionPlans', planId), {
            ...payload,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } else {
          // If null, we might want to delete the active plan, but for MVP let's just clear it from state
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `executionPlans`);
      }
    } else {
      if (planWithSessions) {
        localStorage.setItem('guest_execution_plan', JSON.stringify(planWithSessions));
      } else {
        localStorage.removeItem('guest_execution_plan');
      }
    }
  };

  const handlePlanningFinish = async (generatedTasks: Task[], generatedPlan: ExecutionPlan) => {
    const planWithSessions = {
      ...generatedPlan,
      sessions: generatedPlan.sessions || (generatedPlan as any).days?.flatMap((day: any) => day.sessions?.map((session: any) => ({
        ...session,
        date: session.date || new Date().toISOString().split('T')[0],
        duration: session.duration || session.estimatedMinutes || 60,
        status: session.status || (session.completed ? 'completed' : 'planned'),
        source: session.source || 'nova'
      }))) || []
    };
    const tasksWithTimestamps = generatedTasks.map(task => ({
      ...task,
      userId: auth.currentUser?.uid,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setTasks(tasksWithTimestamps);
    setExecutionPlan(planWithSessions);

    if (user.signedIn && auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        const batch = writeBatch(db);
        
        // Write each task
        tasksWithTimestamps.forEach(task => {
          const taskId = task.id || doc(collection(db, 'tasks')).id;
          const taskRef = doc(db, 'tasks', taskId);
          const taskPayload = sanitizePayload({ ...task, id: taskId, userId });
          batch.set(taskRef, { ...taskPayload, updatedAt: serverTimestamp() }, { merge: true });
        });

        // Write execution plan
        const planId = planWithSessions.id || doc(collection(db, 'executionPlans')).id;
        const planRef = doc(db, 'executionPlans', planId);
        const planPayload = sanitizePayload({
          ...planWithSessions,
          id: planId,
          userId,
          lastGenerated: new Date().toISOString()
        });
        batch.set(planRef, { ...planPayload, updatedAt: serverTimestamp() }, { merge: true });

        // Update user brain dump
        const userRef = doc(db, 'users', userId);
        batch.set(userRef, { 
          latestBrainDump: brainDumpText || user.latestBrainDump || '',
          updatedAt: serverTimestamp()
        }, { merge: true });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspace`);
      }
    } else {
      localStorage.setItem('guest_tasks', JSON.stringify(tasksWithTimestamps));
      localStorage.setItem('guest_execution_plan', JSON.stringify(planWithSessions));
    }

    setCurrentScreen('dashboard');
  };

  const handleCreateTaskWithNova = async (taskInput: {
    title: string;
    description: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    estimatedMinutes: number;
  }) => {
    try {
      const response = await fetch('/api/add-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskInput,
          tasks,
          currentPlan: executionPlan,
          userRole: user.role,
          brainDump: brainDumpText || user.latestBrainDump || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          task: data.task,
          executionPlan: data.executionPlan || null
        };
      }
    } catch (err) {
      console.error("Nova task generation failed:", err);
    }

    return null;
  };

  const handleReplan = async (reason: string) => {
    return requestReplan(reason, tasks, executionPlan);
  };

  const requestReplan = async (
    reason: string,
    tasksForReplan: Task[],
    planForReplan: ExecutionPlan | null
  ) => {
    try {
      const response = await fetch('/api/replan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tasks: tasksForReplan,
          currentPlan: planForReplan,
          reason,
          userRole: user.role
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.executionPlan) {
          handleSetExecutionPlan(data.executionPlan);
          return data.executionPlan;
        }
      }
    } catch (err) {
      console.error("Replanning failed:", err);
    }
    return null;
  };

  const removeSessionsForTask = (
    plan: ExecutionPlan | null,
    task: Task,
    scope: 'today' | 'all'
  ): ExecutionPlan | null => {
    if (!plan) return null;
    let removedToday = false;

    const days = plan.days.map(day => {
      const relatedSessions = day.sessions.filter(session => (
        session.taskId === task.id ||
        session.taskTitle === task.title ||
        session.taskTitle.toLowerCase().includes(task.title.toLowerCase()) ||
        task.title.toLowerCase().includes(session.taskTitle.toLowerCase())
      ));

      if (scope === 'today') {
        if (removedToday || relatedSessions.length === 0) {
          return day;
        }
        removedToday = true;
      }

      return {
        ...day,
        sessions: day.sessions.filter(session => !(
          session.taskId === task.id ||
          session.taskTitle === task.title ||
          session.taskTitle.toLowerCase().includes(task.title.toLowerCase()) ||
          task.title.toLowerCase().includes(session.taskTitle.toLowerCase())
        ))
      };
    });

    return {
      ...plan,
      days,
      dashboardData: {
        ...plan.dashboardData,
        todaysTimeline: plan.dashboardData.todaysTimeline.filter(item => !(
          item.title === task.title ||
          item.title.toLowerCase().includes(task.title.toLowerCase()) ||
          task.title.toLowerCase().includes(item.title.toLowerCase())
        )),
        upcomingDeadlines: scope === 'all'
          ? plan.dashboardData.upcomingDeadlines.filter(item => item.title !== task.title)
          : plan.dashboardData.upcomingDeadlines,
        highestRiskTask: plan.dashboardData.highestRiskTask === task.title
          ? tasks.find(t => t.id !== task.id && (t.progress || 0) < 100)?.title || 'None'
          : plan.dashboardData.highestRiskTask,
        novaRecommendation: scope === 'all'
          ? `I removed "${task.title}" and recalculated your remaining plan.`
          : `I removed today's "${task.title}" session and adjusted the rest of your day.`
      },
      novaNotification: scope === 'all'
        ? `Nova updated your execution plan after removing "${task.title}".`
        : `Nova updated your execution plan after removing today's "${task.title}" session.`
    };
  };

  const handleDeleteTaskWithReplan = async (
    task: Task,
    scope: 'today' | 'all'
  ) => {
    const remainingTasks = scope === 'all'
      ? tasks.filter(t => t.id !== task.id)
      : tasks;
    const prunedPlan = removeSessionsForTask(executionPlan, task, scope);

    if (scope === 'all') {
      await handleSetTasks(remainingTasks);
    }

    await handleSetExecutionPlan(prunedPlan);
    const replannedPlan = await requestReplan(
      scope === 'all'
        ? `Task "${task.title}" was deleted. Remove all sessions for that task and optimize the remaining schedule.`
        : `Only today's session for recurring task "${task.title}" was deleted. Keep future sessions and optimize today's remaining schedule.`,
      remainingTasks,
      prunedPlan
    );

    if (!replannedPlan && prunedPlan) {
      await handleSetExecutionPlan(prunedPlan);
    }

    return {
      success: true,
      message: scope === 'all'
        ? `Nova updated your execution plan after removing "${task.title}".`
        : `Nova updated your execution plan after removing today's "${task.title}" session.`
    };
  };

  const handleAddTaskClick = () => {
    setShowQuickAddModal(true);
  };

  const handleQuickAddBrainDump = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessingQuickAdd(true);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          brainDump: text,
          userRole: user.role || 'professional'
        })
      });
      if (!response.ok) {
        throw new Error("Failed to process brain dump");
      }
      const data = await response.json();
      
      // 1. Map and sanitize new tasks
      const newTasks: Task[] = (data.tasks || []).map((raw: any) => {
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

      // 2. Merge Tasks
      const mergedTasks = [...tasks, ...newTasks];

      // 3. Merge Execution Plan
      let mergedPlan = executionPlan;
      if (data.executionPlan) {
        const newPlan: ExecutionPlan = data.executionPlan;
        
        if (!mergedPlan) {
          // If there was no plan before, use the new one directly
          mergedPlan = {
            ...newPlan,
            sessions: newPlan.days?.flatMap(d => d.sessions || []) || []
          };
        } else {
          // Merge days
          const daysMap = new Map<string, any>();
          mergedPlan.days.forEach(day => {
            daysMap.set(day.dayName, { ...day, sessions: [...(day.sessions || [])] });
          });

          (newPlan.days || []).forEach(newDay => {
            if (daysMap.has(newDay.dayName)) {
              const existingDay = daysMap.get(newDay.dayName);
              // Link taskIds for new sessions to matched tasks in newTasks
              const updatedNewSessions = (newDay.sessions || []).map((s: any) => {
                const matchedTask = newTasks.find(t => t.title === s.taskTitle || (s.taskTitle && t.title.toLowerCase().includes(s.taskTitle.toLowerCase())));
                return {
                  ...s,
                  id: s.id || Math.random().toString(36).substring(2, 11),
                  taskId: matchedTask?.id || tasks[0]?.id || "",
                  completed: s.completed || false,
                  status: s.status || 'planned',
                  source: s.source || 'nova'
                };
              });
              existingDay.sessions = [...existingDay.sessions, ...updatedNewSessions];
            } else {
              // Add new day if not exists
              daysMap.set(newDay.dayName, {
                ...newDay,
                sessions: (newDay.sessions || []).map((s: any) => {
                  const matchedTask = newTasks.find(t => t.title === s.taskTitle || (s.taskTitle && t.title.toLowerCase().includes(s.taskTitle.toLowerCase())));
                  return {
                    ...s,
                    id: s.id || Math.random().toString(36).substring(2, 11),
                    taskId: matchedTask?.id || tasks[0]?.id || "",
                    completed: s.completed || false,
                    status: s.status || 'planned',
                    source: s.source || 'nova'
                  };
                })
              });
            }
          });

          const mergedDays = Array.from(daysMap.values());
          const mergedSessions = mergedDays.flatMap(d => d.sessions || []);

          // Merge dashboard data
          const mergedDeadlines = [
            ...(mergedPlan.dashboardData?.upcomingDeadlines || []),
            ...newTasks.map(t => ({ title: t.title, category: t.category || "General", dueDate: t.deadline || "This Week", priority: t.priority }))
          ];

          // Re-sort or take unique deadlines
          const uniqueDeadlines = Array.from(new Map(mergedDeadlines.map(item => [item.title, item])).values());

          // Merge today's timeline
          const todayName = mergedPlan.days[0]?.dayName || "Today";
          const todaySessions = daysMap.get(todayName)?.sessions || [];
          const mergedTimeline = todaySessions.map((s: any) => ({
            time: s.startTime || "9:00 AM",
            title: s.taskTitle,
            subtitle: s.subtask || "Focus Session",
            category: newTasks.find(t => t.title === s.taskTitle)?.category || tasks.find(t => t.title === s.taskTitle)?.category || "Focus"
          }));

          mergedPlan = {
            ...mergedPlan,
            days: mergedDays,
            sessions: mergedSessions,
            dashboardData: {
              ...mergedPlan.dashboardData,
              upcomingDeadlines: uniqueDeadlines,
              todaysTimeline: mergedTimeline,
              novaRecommendation: `I added ${newTasks.length} new task(s) and updated your execution plan.`,
              todaysMission: mergedPlan.dashboardData?.todaysMission || (newTasks[0] ? `Complete focus sessions for ${newTasks[0].title}` : "Focus Day")
            }
          };
        }
      }

      // Save to Firestore/LocalStorage
      await handleSetTasks(mergedTasks);
      await handleSetExecutionPlan(mergedPlan);
      
      setQuickAddText('');
      setShowQuickAddModal(false);
    } catch (err) {
      console.error("Failed to quick add via brain dump:", err);
      alert("Nova could not process the brain dump. Please try again.");
    } finally {
      setIsProcessingQuickAdd(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      localStorage.removeItem('guest_brain_dump');
      localStorage.removeItem('guest_execution_plan');
      localStorage.removeItem('guest_tasks');
      setUser({
        firstName: '',
        role: null,
        signedIn: false,
        latestBrainDump: ''
      });
      setTasks([]);
      setBrainDumpText('');
      setExecutionPlan(null);
      setCurrentScreen('welcome');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 3. Centralized Task mutator that writes back to Firestore & updates UI state
  const handleSetTasks = async (action: React.SetStateAction<Task[]>) => {
    let newTasks: Task[];
    if (typeof action === 'function') {
      newTasks = action(tasks);
    } else {
      newTasks = action;
    }

    // Instant local state update for buttery-smooth user response
    setTasks(newTasks);

    if (user.signedIn && auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        const batch = writeBatch(db);
        const existingTasksById = new Map(tasks.map(t => [t.id, t]));
        
        newTasks.forEach(task => {
          const oldTask = existingTasksById.get(task.id);
          const taskId = task.id || doc(collection(db, 'tasks')).id;
          const taskRef = doc(db, 'tasks', taskId);
          const taskPayload = sanitizePayload({
            ...task,
            id: taskId,
            userId,
            createdAt: oldTask?.createdAt || task.createdAt || new Date().toISOString(),
          });
          batch.set(taskRef, { ...taskPayload, updatedAt: serverTimestamp() }, { merge: true });
        });

        // Delete tasks that were removed
        const newTaskIds = new Set(newTasks.map(t => t.id));
        tasks.forEach(task => {
          if (!newTaskIds.has(task.id)) {
            batch.delete(doc(db, 'tasks', task.id));
          }
        });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tasks`);
      }
    } else {
      localStorage.setItem('guest_tasks', JSON.stringify(newTasks));
    }
  };

  return (
    <div className="bg-background min-h-screen text-slate-800 antialiased overflow-x-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeScreen onStartPlanning={handleStartPlanning} />
          </motion.div>
        )}

        {currentScreen === 'continue_modal' && (
          <motion.div
            key="continue_modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md"
          >
            <WelcomeScreen onStartPlanning={handleStartPlanning} />
            <ContinueModal 
              onContinueGoogle={handleContinueGoogle} 
              onContinueGuest={handleContinueGuest}
              onClose={() => setCurrentScreen('welcome')}
            />
          </motion.div>
        )}

        {currentScreen === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <OnboardingScreen 
              onSubmit={handleOnboardingSubmit} 
              initialProfile={user} 
            />
          </motion.div>
        )}

        {currentScreen === 'brain_dump' && (
          <motion.div
            key="brain_dump"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <BrainDumpScreen 
              firstName={user.firstName} 
              onSubmit={handleBrainDumpSubmit} 
            />
          </motion.div>
        )}

        {currentScreen === 'planning' && (
          <motion.div
            key="planning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <PlanningScreen 
              brainDumpText={brainDumpText}
              userRole={user.role}
              onFinish={handlePlanningFinish} 
            />
          </motion.div>
        )}

        {currentScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DashboardScreen 
              user={user} 
              setScreen={setCurrentScreen} 
              tasks={tasks}
              executionPlan={executionPlan}
              onReplan={handleReplan}
              onAddTaskClick={handleAddTaskClick}
              onSignOut={handleSignOut}
              onSignIn={handleGoogleSignIn}
            />
          </motion.div>
        )}

        {currentScreen === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0 }}
          >
            <TasksScreen 
              user={user} 
              setScreen={setCurrentScreen} 
              tasks={tasks}
              setTasks={handleSetTasks}
              onCreateTaskWithNova={handleCreateTaskWithNova}
              setExecutionPlan={handleSetExecutionPlan}
              onDeleteTaskWithReplan={handleDeleteTaskWithReplan}
              onSignOut={handleSignOut}
              onSignIn={handleGoogleSignIn}
              onAddTaskClick={handleAddTaskClick}
            />
          </motion.div>
        )}

        {currentScreen === 'execution_plan' && (
          <motion.div
            key="execution_plan"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0 }}
          >
            <ExecutionPlanScreen 
              user={user} 
              setScreen={setCurrentScreen} 
              tasks={tasks}
              executionPlan={executionPlan}
              onReplan={handleReplan}
              onSignOut={handleSignOut}
              onSignIn={handleGoogleSignIn}
              onAddTaskClick={handleAddTaskClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Brain Dump Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-[#1e293b]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-2xl p-8 max-w-lg w-full relative overflow-hidden animate-fade-in text-left text-[#1e293b]">
            <h3 className="text-xl font-black text-[#1e293b] mb-2 flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#10b981] stroke-[3]" />
              <span>Quick Add via Brain Dump</span>
            </h3>
            <p className="text-xs text-slate-500 font-bold mb-6">
              Enter any new tasks, habits, or projects. Nova AI will automatically analyze them, generate subtasks, and schedule them into your execution plan.
            </p>
            
            <textarea 
              value={quickAddText} 
              onChange={(e) => setQuickAddText(e.target.value)}
              placeholder="Example: gym everyday, dsa quiz on monday, prepare for coding interview..."
              className="w-full h-32 bg-white border-2 border-[#1e293b] rounded-xl p-4 text-sm font-bold text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-inner transition-all resize-none mb-6"
              disabled={isProcessingQuickAdd}
            />

            <div className="flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => {
                  setQuickAddText('');
                  setShowQuickAddModal(false);
                }}
                className="bg-slate-100 border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] text-[#1e293b] text-sm font-bold px-5 py-2.5 rounded-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                disabled={isProcessingQuickAdd}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => handleQuickAddBrainDump(quickAddText)}
                disabled={isProcessingQuickAdd || !quickAddText.trim()}
                className="bg-[#10b981] hover:bg-[#059669] text-white border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] text-sm font-black px-6 py-2.5 rounded-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isProcessingQuickAdd ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1e293b]/30 border-t-[#1e293b] rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Add to Plan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
