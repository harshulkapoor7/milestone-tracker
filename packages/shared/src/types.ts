import type { TaskType } from "./constants";

// The shapes the API sends back as JSON. Dates arrive as strings over the wire.
// The API's own tests check it really returns these; the web app relies on them.

export interface Task {
  id: string;
  dayId: string;
  type: TaskType;
  text: string;
  minutes: number;
  position: number;
  doneAt: string | null; // ISO timestamp, or null when not done
}

export interface Day {
  id: string;
  planId: string;
  phaseId: string | null;
  position: number;
  title: string;
  note: string;
}

export interface Phase {
  id: string;
  planId: string;
  name: string;
  position: number;
}

export interface Plan {
  id: string;
  userId: string;
  title: string;
  startDate: string; // "YYYY-MM-DD"
  createdAt: string;
}

// GET /plans/:id
export interface PlanDetail extends Plan {
  phases: Phase[];
  days: (Day & { tasks: Task[] })[];
}

// GET /me, POST /auth/login, POST /auth/register
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// GET /plans/:id/stats
export interface PlanStats {
  totals: {
    tasks: number;
    tasksDone: number;
    minutes: number;
    minutesDone: number;
    days: number;
    daysDone: number;
  };
  byType: { type: TaskType; total: number; done: number }[];
  byPhase: { phaseId: string; days: number; daysDone: number }[];
  streak: {
    current: number; // consecutive days with ≥1 task done, ending today or yesterday
    longest: number;
    activeToday: boolean;
  };
  activity: { date: string; tasksDone: number }[]; // "YYYY-MM-DD" in the given time zone
}
