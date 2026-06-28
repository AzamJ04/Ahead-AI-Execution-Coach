import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// High-fidelity fallback scheduling system that dynamically mimics our AI scheduling behavior locally
function generateSmartFallbackSystem(brainDump: string, userRole: string | null) {
  // 1. Clean and split the brain dump into individual task candidate strings
  const lines = brainDump
    .split(/[\n.;•]|,\s+/)
    .map(line => line.replace(/^[\s-–—*•\d+.)]+/, "").trim()) // Remove lists, numbers, bullets
    .filter(line => line.length >= 3); // Must be a reasonable length to be a task

  // If no valid lines extracted, fallback to the original query as a single task
  const taskTexts = lines.length > 0 ? lines : [brainDump.trim()];

  const subtask = (title: string, estimatedMinutes: number) => ({ title, estimatedMinutes });

  const tasks: any[] = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const dayNames: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    dayNames.push(daysOfWeek[d.getDay()]);
  }

  const daysWithSessions: { [day: string]: any[] } = {};
  const nextAvailableTimeForDay: { [day: string]: { hour: number; minute: number } } = {};
  dayNames.forEach(name => {
    daysWithSessions[name] = [];
    nextAvailableTimeForDay[name] = { hour: 9, minute: 0 };
  });

  taskTexts.forEach((text) => {
    const lower = text.toLowerCase();
    
    // Priority heuristics
    let priority: "High" | "Medium" | "Low" = "Medium";
    if (lower.includes("urgent") || lower.includes("asap") || lower.includes("priority") || lower.includes("important") || lower.includes("quiz") || lower.includes("test") || lower.includes("exam")) {
      priority = "High";
    } else if (lower.includes("low") || lower.includes("someday") || lower.includes("maybe")) {
      priority = "Low";
    }

    // Category heuristics
    let category = "General";
    if (lower.includes("gym") || lower.includes("workout") || lower.includes("exercise") || lower.includes("run") || lower.includes("walk") || lower.includes("sport") || lower.includes("yoga")) {
      category = "Health";
    } else if (lower.includes("quiz") || lower.includes("test") || lower.includes("exam") || lower.includes("assignment") || lower.includes("homework") || lower.includes("study") || lower.includes("dsa") || lower.includes("dbms") || lower.includes("class")) {
      category = "Academics";
    } else if (lower.includes("work") || lower.includes("project") || lower.includes("milestone") || lower.includes("client") || lower.includes("meeting") || lower.includes("code") || lower.includes("dev")) {
      category = "Work";
    } else if (lower.includes("buy") || lower.includes("shop") || lower.includes("clean") || lower.includes("laundry") || lower.includes("bill") || lower.includes("grocery")) {
      category = "Personal";
    }

    // Deadline/DueDate heuristics
    let dueDate = "This Week";
    let deadlineDay = "Monday"; // Default deadline day
    const matchDay = lower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (matchDay) {
      dueDate = matchDay[0].charAt(0).toUpperCase() + matchDay[0].slice(1);
      deadlineDay = dueDate;
    } else if (lower.includes("tomorrow")) {
      dueDate = "Tomorrow";
      deadlineDay = "Saturday";
    }

    // Estimated duration heuristics
    let estimatedMinutes = 60;
    const matchMin = lower.match(/(\d+)\s*(m|min|minute)/);
    const matchHr = lower.match(/(\d+)\s*(h|hr|hour)/);
    if (matchMin) {
      estimatedMinutes = parseInt(matchMin[1], 10);
    } else if (matchHr) {
      estimatedMinutes = parseInt(matchHr[1], 10) * 60;
    } else if (category === "Health" || lower.includes("gym") || lower.includes("workout")) {
      estimatedMinutes = 60;
    } else if (category === "Academics" && (lower.includes("quiz") || lower.includes("test") || lower.includes("exam"))) {
      estimatedMinutes = 180; // quiz prep default to 3 hours
    } else if (lower.includes("assignment") || lower.includes("project")) {
      estimatedMinutes = 240; // assignments default to 4 hours
    } else if (lower.includes("interview") || lower.includes("prepare")) {
      estimatedMinutes = 180; // interview prep default to 3 hours
    }

    const isRecurring = lower.includes("daily") || lower.includes("every day") || lower.includes("everyday") || lower.includes("every evening") || lower.includes("every morning") || lower.includes("weekly");
    const recurringPattern = (lower.includes("daily") || lower.includes("every day") || lower.includes("everyday") || lower.includes("every evening") || lower.includes("every morning")) 
      ? "Daily" 
      : lower.includes("weekly") ? "Weekly" : undefined;

    // Subtasks generation
    let subtasks: any[] = [];
    if (category === "Health" || lower.includes("gym") || lower.includes("workout") || lower.includes("exercise") || lower.includes("run") || isRecurring) {
      // Habits and health tasks shouldn't be split into prep/review steps.
      subtasks = [
        subtask(text, estimatedMinutes)
      ];
    } else if (estimatedMinutes <= 60) {
      subtasks = [
        subtask(text, estimatedMinutes)
      ];
    } else {
      // Split into at least 45 minute blocks
      const part1 = Math.max(45, Math.round(estimatedMinutes * 0.25));
      const part3 = Math.max(45, Math.round(estimatedMinutes * 0.25));
      const part2 = Math.max(45, estimatedMinutes - part1 - part3);
      subtasks = [
        subtask(`Research and plan: ${text}`, part1),
        subtask(`Core execution: ${text}`, part2),
        subtask(`Review and finalize: ${text}`, part3)
      ];
    }

    // Coach recommendation heuristics
    let novaRecommendation = `Let's make progress on ${text} today to stay ahead of schedule.`;
    if (category === "Health") {
      novaRecommendation = `Consistency beats intensity. Complete today's workout to maintain your streak.`;
    } else if (category === "Academics" && (lower.includes("quiz") || lower.includes("test") || lower.includes("exam"))) {
      const topicMatch = lower.match(/(?:for|on)\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+at|\s+this|\s*,$|$)/);
      const topic = topicMatch ? topicMatch[1].trim() : "this subject";
      novaRecommendation = `Finish study review first. Completing this today keeps you on track for your ${topic} quiz.`;
    } else if (category === "Academics") {
      novaRecommendation = `Complete the core research section first. It unlocks the rest of your assignment.`;
    } else if (lower.includes("dsa") || lower.includes("quiz")) {
      novaRecommendation = `Finish Arrays and Time Complexity first. Completing this today keeps you on track for Tuesday's quiz.`;
    } else if (lower.includes("portfolio") || lower.includes("website") || lower.includes("app")) {
      novaRecommendation = `Finish the landing page layout before adding complex animations. You'll build momentum faster.`;
    } else if (lower.includes("assignment") || lower.includes("project")) {
      novaRecommendation = `Complete the initial draft or data cleaning section first. It unlocks the rest of your assignment.`;
    }

    tasks.push({
      title: text,
      description: `Action plan to complete: "${text}". Created dynamically from brain dump.`,
      category,
      dueDate,
      deadline: dueDate,
      priority,
      estimatedMinutes,
      estimatedHours: Math.round((estimatedMinutes / 60) * 10) / 10,
      status: "Pending",
      recurring: isRecurring,
      recurringPattern,
      novaRecommendation,
      subtasks
    });

    // Distribute subtasks as sessions across days leading up to the deadline
    let endDayIndex = dayNames.indexOf(deadlineDay);
    if (endDayIndex === -1) endDayIndex = dayNames.length - 1; // default to the last day of the plan

    const formatTime = (h: number, m: number) => {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    if (isRecurring) {
      // Schedule the task on every single day of the plan
      dayNames.forEach((targetDay) => {
        const start = nextAvailableTimeForDay[targetDay] || { hour: 9, minute: 0 };
        const sessionDuration = estimatedMinutes;

        let endHour = start.hour;
        let endMinute = start.minute + sessionDuration;
        if (endMinute >= 60) {
          endHour += Math.floor(endMinute / 60);
          endMinute = endMinute % 60;
        }

        const startTime = formatTime(start.hour, start.minute);
        const endTime = formatTime(endHour, endMinute);

        // Add a 15-minute buffer between tasks to prevent tight overlap
        let nextHour = endHour;
        let nextMinute = endMinute + 15;
        if (nextMinute >= 60) {
          nextHour += Math.floor(nextMinute / 60);
          nextMinute = nextMinute % 60;
        }
        nextAvailableTimeForDay[targetDay] = { hour: nextHour, minute: nextMinute };

        daysWithSessions[targetDay].push({
          taskTitle: text,
          subtask: text,
          date: targetDay,
          startTime,
          endTime,
          timeSlot: `${startTime} - ${endTime}`,
          duration: sessionDuration,
          estimatedMinutes: sessionDuration,
          status: "planned",
          source: "calendar",
          completed: false
        });
      });
    } else {
      // Non-recurring task, distribute subtasks
      subtasks.forEach((st, stIdx) => {
        const targetDayIndex = Math.min(stIdx, endDayIndex);
        const targetDay = dayNames[targetDayIndex] || dayNames[0];
        
        const start = nextAvailableTimeForDay[targetDay] || { hour: 9, minute: 0 };
        const sessionDuration = st.estimatedMinutes || 30;

        let endHour = start.hour;
        let endMinute = start.minute + sessionDuration;
        if (endMinute >= 60) {
          endHour += Math.floor(endMinute / 60);
          endMinute = endMinute % 60;
        }

        const startTime = formatTime(start.hour, start.minute);
        const endTime = formatTime(endHour, endMinute);

        // Add a 15-minute buffer between tasks to prevent tight overlap
        let nextHour = endHour;
        let nextMinute = endMinute + 15;
        if (nextMinute >= 60) {
          nextHour += Math.floor(nextMinute / 60);
          nextMinute = nextMinute % 60;
        }
        nextAvailableTimeForDay[targetDay] = { hour: nextHour, minute: nextMinute };

        daysWithSessions[targetDay].push({
          taskTitle: text,
          subtask: st.title,
          date: targetDay,
          startTime,
          endTime,
          timeSlot: `${startTime} - ${endTime}`,
          duration: sessionDuration,
          estimatedMinutes: sessionDuration,
          status: "planned",
          source: "nova",
          completed: false
        });
      });
    }
  });

  const days = dayNames.map(dayName => ({
    dayName,
    sessions: daysWithSessions[dayName]
  }));

  const mainTask = tasks[0];
  const dashboardData = {
    todaysMission: mainTask ? `Complete focus sessions for ${mainTask.title}` : "Focus Day",
    novaRecommendation: mainTask 
      ? `Stick to your sessions for "${mainTask.title}" to stay comfortable and ahead of schedule.` 
      : "Start with the highest-priority session to create momentum before the deadline.",
    highestRiskTask: mainTask ? mainTask.title : "None",
    upcomingDeadlines: tasks.filter(t => !t.recurring).map(t => ({
      title: t.title,
      category: t.category,
      dueDate: t.dueDate,
      priority: t.priority
    })),
    todaysTimeline: (days[0].sessions || []).map((s: any) => ({
      time: s.startTime,
      title: s.subtask || s.taskTitle,
      subtitle: s.taskTitle,
      category: tasks.find(t => t.title === s.taskTitle)?.category || "Focus"
    }))
  };

  return {
    tasks,
    executionPlan: {
      days,
      dashboardData,
      sessions: days.flatMap(day => day.sessions.map((s: any) => ({ ...s, dayName: day.dayName })))
    }
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Unified endpoint to parse brain dump and generate complete productivity system
  app.post("/api/plan", async (req: express.Request, res: express.Response) => {
    try {
      const { brainDump, userRole } = req.body;
      if (!brainDump) {
        return res.status(400).json({ error: "brainDump is required" });
      }

      // Check if API Key is missing and trigger smart fallback immediately to prevent 403 scope error
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not defined, generating smart local fallback productivity system...");
        const fallbackSystem = generateSmartFallbackSystem(brainDump, userRole);
        return res.json({ ...fallbackSystem, apiKeyMissing: true });
      }

      const today = new Date();
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = daysOfWeek[today.getDay()];
      const currentDateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const prompt = `Analyze this brain dump: "${brainDump}". 
Create a complete productivity system for a ${userRole || 'professional'}.
Today is ${currentDateString} (${currentDayName}).
Follow these instructions precisely:
1. Extract recurring habits separately from deadline tasks. Detect phrases like "every day", "daily", "every evening", and fixed times like "6 PM".
2. Treat comma-separated lists of actions or goals (e.g., "dsa quiz on tuesday, gym everyday") as separate, independent tasks rather than a single merged task.
3. Extract deadlines and set priority based on deadline pressure.
4. Estimate effort in both estimatedMinutes and estimatedHours. Use realistic defaults: gym 60 minutes, 5 DSA questions 90 minutes, major assignment 6 hours, quiz preparation 3 hours. Do not allot less than 60 minutes for gym or workout tasks, and do not allot less than 45 minutes for assignment, research, or study tasks.
5. For any large task, generate concrete subtasks with estimatedMinutes. Ensure each subtask's estimatedMinutes is realistic and never less than 45 minutes (for assignments, study, work, or preparation). Users should never have to create subtasks manually.
6. Generate an Execution Plan that distributes subtasks across 5 consecutive days starting from today (${currentDayName}) and the next 4 upcoming days. Do not hardcode static days like Friday, Saturday, Sunday, Monday unless they are part of these 5 days.
7. For recurring tasks like Gym or DSA, schedule them consistently on every relevant day. Use source "calendar" for fixed-time calendar-like habits and "nova" for Nova-planned work.
8. Each work session must include taskTitle, subtask, date/day label, startTime, endTime, duration, status "planned", and source. Ensure the duration / estimatedMinutes for each work session is realistic: gym/workout/health sessions must be at least 60 minutes long; academic, assignment, exam, quiz prep, and interview prep sessions must be at least 45 minutes long.
9. Generate Dashboard Data matching the resulting schedule:
   - todaysMission: A brief focus mission representing the main goal of today.
   - novaRecommendation: A personalized, encouraging executive coaching recommendation.
   - highestRiskTask: The title of the task with the highest urgency or risk.
   - upcomingDeadlines: A summary list of the main milestones/tasks and their deadlines.
   - todaysTimeline: Today's chronological agenda (e.g., sessions starting at 9:00 AM, 11:00 AM, 6:00 PM).
10. For each task, generate a dynamic, friendly, expert executive coaching recommendation inside the task's \`novaRecommendation\` field (e.g. 'Finish Arrays and Time Complexity first. Completing this today keeps you on track for Tuesday's quiz.'). It should feel like a personal coach giving actionable advice, not a system notification.
11. Absolutely avoid short 10-20 minute sessions for tasks. Ensure gym/workout is at least 60 minutes and assignments or study blocks are at least 45 minutes.

Format the output strictly according to the specified JSON schema. Do not include any text outside the JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are Nova, an expert personal productivity assistant and executive coach. Your goal is to parse messy user brain dumps, organize them into clear actionable tasks with automated detailed subtasks, distribute their sessions realistically over a multi-day timeline, and output a complete productivity system.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    dueDate: { type: Type.STRING },
                    deadline: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                    estimatedHours: { type: Type.NUMBER },
                    status: { type: Type.STRING },
                    recurring: { type: Type.BOOLEAN },
                    recurringPattern: { type: Type.STRING },
                    scheduledTime: { type: Type.STRING },
                    novaRecommendation: { type: Type.STRING },
                    subtasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          estimatedMinutes: { type: Type.INTEGER }
                        },
                        required: ["title"]
                      }
                    }
                  },
                  required: ["title", "description", "category", "dueDate", "priority", "estimatedMinutes", "novaRecommendation", "subtasks"]
                }
              },
              executionPlan: {
                type: Type.OBJECT,
                properties: {
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayName: { type: Type.STRING },
                        sessions: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              taskTitle: { type: Type.STRING },
                              subtask: { type: Type.STRING },
                              date: { type: Type.STRING },
                              startTime: { type: Type.STRING },
                              endTime: { type: Type.STRING },
                              timeSlot: { type: Type.STRING },
                              duration: { type: Type.INTEGER },
                              estimatedMinutes: { type: Type.INTEGER },
                              status: { type: Type.STRING },
                              source: { type: Type.STRING }
                            },
                            required: ["taskTitle", "timeSlot", "estimatedMinutes"]
                          }
                        }
                      },
                      required: ["dayName", "sessions"]
                    }
                  },
                  dashboardData: {
                    type: Type.OBJECT,
                    properties: {
                      todaysMission: { type: Type.STRING },
                      novaRecommendation: { type: Type.STRING },
                      highestRiskTask: { type: Type.STRING },
                      upcomingDeadlines: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            category: { type: Type.STRING },
                            dueDate: { type: Type.STRING },
                            priority: { type: Type.STRING }
                          },
                          required: ["title", "category", "dueDate", "priority"]
                        }
                      },
                      todaysTimeline: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            time: { type: Type.STRING },
                            title: { type: Type.STRING },
                            subtitle: { type: Type.STRING },
                            category: { type: Type.STRING }
                          },
                          required: ["time", "title", "subtitle", "category"]
                        }
                      }
                    },
                    required: ["todaysMission", "novaRecommendation", "highestRiskTask", "upcomingDeadlines", "todaysTimeline"]
                  }
                },
                required: ["days", "dashboardData"]
              }
            },
            required: ["tasks", "executionPlan"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text from Gemini");
      }

      const systemData = JSON.parse(responseText.trim());
      res.json({ ...systemData, apiKeyMissing: false });
    } catch (error: any) {
      console.error("Gemini Unified Plan Error, falling back to smart local scheduler:", error);
      try {
        const fallbackSystem = generateSmartFallbackSystem(req.body.brainDump || "", req.body.userRole || null);
        res.json({ ...fallbackSystem, apiKeyMissing: true, errorMsg: error.message });
      } catch (fallbackError) {
        res.status(500).json({ error: "Failed to parse brain dump or generate fallback system" });
      }
    }
  });

  // Re-planning endpoint to implement Agentic Behavior
  app.post("/api/replan", async (req: express.Request, res: express.Response) => {
    try {
      const { tasks, currentPlan, reason, userRole } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        // High fidelity mock replanning message and rescheduling when local/fallback
        console.warn("GEMINI_API_KEY is not defined, using mock replanning engine...");
        const lowerReason = (reason || "").toLowerCase();

        if (lowerReason.includes("deleted") || lowerReason.includes("removing") || lowerReason.includes("removed")) {
          return res.json({
            executionPlan: {
              ...(currentPlan || { days: [], dashboardData: {} }),
              novaNotification: "Nova updated your execution plan after removing the task."
            },
            apiKeyMissing: true
          });
        }
        
        // Find first incomplete task in user's tasks
        const incompleteTask = tasks?.find((t: any) => t.status !== "Completed" && t.status !== "completed");
        const taskTitle = incompleteTask?.title || tasks?.[0]?.title || "tasks";

        const notification = `I noticed some of your sessions for "${taskTitle}" weren't completed. I've rescheduled them to the next available block to keep you on track.`;
        
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = new Date();
        const dayNames: string[] = [];
        for (let i = 0; i < 5; i++) {
          const d = new Date();
          d.setDate(today.getDate() + i);
          dayNames.push(daysOfWeek[d.getDay()]);
        }

        const originalDays = currentPlan?.days || [];
        const updatedDays = originalDays.map((d: any, idx: number) => {
          return {
            ...d,
            dayName: dayNames[idx] || d.dayName,
            sessions: (d.sessions || []).map((s: any) => ({
              ...s,
              date: dayNames[idx] || d.dayName
            }))
          };
        });

        const updatedDashboardData = {
          ...(currentPlan?.dashboardData || {}),
          todaysMission: `Focus on completing sessions for ${taskTitle}`,
          novaRecommendation: `We rescheduled incomplete sessions for "${taskTitle}". Stay focused to stay on track!`
        };

        return res.json({
          executionPlan: {
            days: updatedDays,
            dashboardData: updatedDashboardData,
            novaNotification: notification
          },
          apiKeyMissing: true
        });
      }

      const today = new Date();
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = daysOfWeek[today.getDay()];
      const currentDateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const prompt = `The user skipped, missed, or didn't finish some sessions.
Reason: "${reason || 'Session skipped or uncompleted'}".
Today is ${currentDateString} (${currentDayName}).
Here is their current Task list (with completions): ${JSON.stringify(tasks)}
Here is their current Execution Plan: ${JSON.stringify(currentPlan)}

Please update their Execution Plan intelligently. 
1. Reschedule uncompleted/skipped sessions to the next available day/time.
2. Shorten other less critical sessions (e.g. general exercise or practice) if needed to keep them on schedule to meet high-priority deadlines.
3. Write an encouraging executive-function coach notification explaining exactly what was shifted and why (e.g. 'I noticed today's assignment session wasn't completed. I've moved Model Building to tomorrow morning and shortened your DSA practice so you'll still finish before Monday.'). Make this message warm, friendly, and helpful.
4. Output the updated Execution Plan and the coaching notification.
5. Ensure the execution plan starts from today (${currentDayName}) and covers the next 4 upcoming days, shifting all sessions and dayNames to match.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are Nova, an executive function coach. Your job is to automatically replan the user's schedule when they fall behind or skip sessions, keeping them comfortable and focused on finishing before their deadlines.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executionPlan: {
                type: Type.OBJECT,
                properties: {
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayName: { type: Type.STRING },
                        sessions: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              taskTitle: { type: Type.STRING },
                              timeSlot: { type: Type.STRING },
                              estimatedMinutes: { type: Type.INTEGER }
                            },
                            required: ["taskTitle", "timeSlot", "estimatedMinutes"]
                          }
                        }
                      },
                      required: ["dayName", "sessions"]
                    }
                  },
                  dashboardData: {
                    type: Type.OBJECT,
                    properties: {
                      todaysMission: { type: Type.STRING },
                      novaRecommendation: { type: Type.STRING },
                      highestRiskTask: { type: Type.STRING },
                      upcomingDeadlines: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            category: { type: Type.STRING },
                            dueDate: { type: Type.STRING },
                            priority: { type: Type.STRING }
                          },
                          required: ["title", "category", "dueDate", "priority"]
                        }
                      },
                      todaysTimeline: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            time: { type: Type.STRING },
                            title: { type: Type.STRING },
                            subtitle: { type: Type.STRING },
                            category: { type: Type.STRING }
                          },
                          required: ["time", "title", "subtitle", "category"]
                        }
                      }
                    },
                    required: ["todaysMission", "novaRecommendation", "highestRiskTask", "upcomingDeadlines", "todaysTimeline"]
                  },
                  novaNotification: { type: Type.STRING }
                },
                required: ["days", "dashboardData", "novaNotification"]
              }
            },
            required: ["executionPlan"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text from Gemini");
      }

      const replannedData = JSON.parse(responseText.trim());
      res.json({ ...replannedData, apiKeyMissing: false });
    } catch (error: any) {
      console.error("Replan Error:", error);
      res.status(500).json({ error: "Failed to replan" });
    }
  });

  app.post("/api/add-task", async (req: express.Request, res: express.Response) => {
    try {
      const { taskInput, tasks = [], currentPlan, userRole, brainDump } = req.body;
      if (!taskInput?.title) {
        return res.status(400).json({ error: "taskInput.title is required" });
      }

      // Coach recommendation heuristics for fallback
      let fallbackRecommendation = `Break this down into small blocks. Focus on completing the first block first to build momentum.`;
      const titleLower = taskInput.title.toLowerCase();
      if (taskInput.category === "Health" || titleLower.includes("gym")) {
        fallbackRecommendation = `Consistency beats intensity. Complete today's workout to maintain your streak.`;
      } else if (titleLower.includes("quiz") || titleLower.includes("dsa")) {
        fallbackRecommendation = `Finish Arrays and Time Complexity first. Completing this today keeps you on track for Tuesday's quiz.`;
      } else if (titleLower.includes("portfolio") || titleLower.includes("website") || titleLower.includes("app")) {
        fallbackRecommendation = `Finish the landing page layout before adding complex animations. You'll build momentum faster.`;
      } else if (titleLower.includes("assignment") || titleLower.includes("project")) {
        fallbackRecommendation = `Complete the initial draft or data cleaning section first. It unlocks the rest of your assignment.`;
      }

      const fallbackTask = {
        id: Math.random().toString(36).substring(2, 11),
        title: taskInput.title,
        description: taskInput.description || `Complete ${taskInput.title} with a focused execution block.`,
        category: taskInput.category || "General",
        dueDate: taskInput.dueDate || "3 Days",
        priority: taskInput.priority || "Medium",
        estimatedMinutes: taskInput.estimatedMinutes || 60,
        progress: 0,
        novaRecommendation: fallbackRecommendation,
        subtasks: [
          { id: Math.random().toString(36).substring(2, 11), title: "Clarify the outcome", completed: false },
          { id: Math.random().toString(36).substring(2, 11), title: "Complete the main work block", completed: false },
          { id: Math.random().toString(36).substring(2, 11), title: "Review and finish", completed: false }
        ]
      };

      const fallbackPlan = currentPlan ? {
        ...currentPlan,
        days: currentPlan.days?.length ? currentPlan.days.map((day: any, index: number) => {
          if (index !== 0) return day;
          return {
            ...day,
            sessions: [
              ...(day.sessions || []),
              {
                id: Math.random().toString(36).substring(2, 11),
                taskId: fallbackTask.id,
                taskTitle: fallbackTask.title,
                timeSlot: "4:00 PM - 5:00 PM",
                estimatedMinutes: fallbackTask.estimatedMinutes,
                completed: false
              }
            ]
          };
        }) : [
          {
            dayName: "Today",
            sessions: [
              {
                id: Math.random().toString(36).substring(2, 11),
                taskId: fallbackTask.id,
                taskTitle: fallbackTask.title,
                timeSlot: "4:00 PM - 5:00 PM",
                estimatedMinutes: fallbackTask.estimatedMinutes,
                completed: false
              }
            ]
          }
        ],
        dashboardData: {
          ...(currentPlan.dashboardData || {}),
          novaRecommendation: `I added "${fallbackTask.title}" to your plan and placed it into the next available focus block.`
        },
        novaNotification: `I added "${fallbackTask.title}" and updated your execution plan.`
      } : null;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ task: fallbackTask, executionPlan: fallbackPlan, apiKeyMissing: true });
      }

      const today = new Date();
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = daysOfWeek[today.getDay()];
      const currentDateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const prompt = `The user added a new task to Ahead.
User role: ${userRole || "professional"}
Original brain dump context: ${brainDump || "Not provided"}
Existing tasks: ${JSON.stringify(tasks)}
Current execution plan: ${JSON.stringify(currentPlan)}
New task input: ${JSON.stringify(taskInput)}
Today is ${currentDateString} (${currentDayName}).

Act as Nova, an AI execution coach. Convert the new task into a complete task object with useful subtasks. Include a dynamic, friendly, expert executive coaching recommendation inside the task's 'novaRecommendation' field (e.g. 'Finish Arrays and Time Complexity first. Completing this today keeps you on track for Tuesday's quiz.'). If an execution plan exists, update it by adding the new work into a sensible available block without overloading the day.
Ensure that the task, its subtasks, and the scheduled sessions in the execution plan have realistic, non-trivial durations:
- Physical habits/workouts (gym, exercise) MUST be allocated at least 60 minutes.
- Focus sessions for academic assignments, exam study, interview prep, or work projects MUST be at least 45 minutes long.
- Do not schedule short 10-20 minute blocks for tasks that require real focus or physical preparation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are Nova, an AI execution coach. Return only JSON. Create practical subtasks and update the execution plan to help the user finish before deadlines.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              task: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  novaRecommendation: { type: Type.STRING },
                  subtasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }
                      },
                      required: ["title"]
                    }
                  }
                },
                required: ["title", "description", "category", "dueDate", "priority", "estimatedMinutes", "novaRecommendation", "subtasks"]
              },
              executionPlan: {
                type: Type.OBJECT,
                properties: {
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayName: { type: Type.STRING },
                        sessions: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              taskTitle: { type: Type.STRING },
                              timeSlot: { type: Type.STRING },
                              estimatedMinutes: { type: Type.INTEGER },
                              completed: { type: Type.BOOLEAN }
                            },
                            required: ["taskTitle", "timeSlot", "estimatedMinutes"]
                          }
                        }
                      },
                      required: ["dayName", "sessions"]
                    }
                  },
                  dashboardData: {
                    type: Type.OBJECT,
                    properties: {
                      todaysMission: { type: Type.STRING },
                      novaRecommendation: { type: Type.STRING },
                      highestRiskTask: { type: Type.STRING },
                      upcomingDeadlines: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            category: { type: Type.STRING },
                            dueDate: { type: Type.STRING },
                            priority: { type: Type.STRING }
                          },
                          required: ["title", "category", "dueDate", "priority"]
                        }
                      },
                      todaysTimeline: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            time: { type: Type.STRING },
                            title: { type: Type.STRING },
                            subtitle: { type: Type.STRING },
                            category: { type: Type.STRING }
                          },
                          required: ["time", "title", "subtitle", "category"]
                        }
                      }
                    },
                    required: ["todaysMission", "novaRecommendation", "highestRiskTask", "upcomingDeadlines", "todaysTimeline"]
                  },
                  novaNotification: { type: Type.STRING }
                },
                required: ["days", "dashboardData"]
              }
            },
            required: ["task"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text from Gemini");
      }

      const result = JSON.parse(responseText.trim());
      const taskId = Math.random().toString(36).substring(2, 11);
      const task = {
        ...result.task,
        id: taskId,
        progress: 0,
        subtasks: (result.task.subtasks || []).map((st: any) => ({
          id: Math.random().toString(36).substring(2, 11),
          title: st.title,
          completed: false
        }))
      };
      const executionPlan = result.executionPlan ? {
        ...result.executionPlan,
        days: result.executionPlan.days.map((day: any) => ({
          ...day,
          sessions: day.sessions.map((session: any) => ({
            ...session,
            id: session.id || Math.random().toString(36).substring(2, 11),
            taskId: session.taskId || (session.taskTitle === task.title ? taskId : ""),
            completed: session.completed || false
          }))
        }))
      } : fallbackPlan;

      res.json({ task, executionPlan, apiKeyMissing: false });
    } catch (error: any) {
      console.error("Add Task Error:", error);
      res.status(500).json({ error: "Failed to add task" });
    }
  });

  app.post("/api/nova", async (req: express.Request, res: express.Response) => {
    try {
      const { message, userRole, brainDump, task, currentSubtask, notes, executionPlan, tasks } = req.body;
      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          reply: `For "${currentSubtask || task?.title || "this step"}", start by naming the exact output you need, then work in one small block before checking anything else. Based on your notes, keep the answer practical and tied to the current task.`,
          apiKeyMissing: true
        });
      }

      const prompt = `User question: ${message}

Current context:
- User role: ${userRole || "professional"}
- Original brain dump: ${brainDump || "Not provided"}
- Current task: ${JSON.stringify(task)}
- Current subtask: ${currentSubtask || "Not provided"}
- Workspace notes: ${notes || "None"}
- Execution plan: ${JSON.stringify(executionPlan)}
- All tasks: ${JSON.stringify(tasks)}

Answer as Nova, an intelligent executive assistant inside Focus Mode. Be concise, useful, and context-aware. Help the user complete the current step without sending them away from the page.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are Nova, Ahead's AI execution coach. You are not a generic chatbot. You know the user's current work context and help them finish the active task.",
        }
      });

      res.json({ reply: response.text || "Stay with the current step and complete the smallest useful next action.", apiKeyMissing: false });
    } catch (error: any) {
      console.error("Nova Chat Error:", error);
      res.status(500).json({ error: "Failed to answer Nova chat" });
    }
  });

  // Serve assets with Vite in development, or standard express static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
