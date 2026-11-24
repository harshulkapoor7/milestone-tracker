import type {
  CreateDayInput,
  CreateTaskInput,
  Day,
  Plan,
  PlanDetail,
  Task,
  UpdateDayInput,
  UpdatePlanInput,
  UpdateTaskInput,
} from "@milestone/shared";

// Every request goes to /api/... on our own origin; Vite's proxy forwards it.
const BASE = "/api";

// The error shape our API's error handler sends: { error: { code, message } }
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { code: string; message: string };
    } | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? `Request failed (${res.status})`,
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

// One function per API route (see the API table in README.md).
export const api = {
  listPlans: () => request<Plan[]>("/plans"),
  getPlan: (id: string) => request<PlanDetail>(`/plans/${id}`),
  updatePlan: (id: string, input: UpdatePlanInput) =>
    send<Plan>("PATCH", `/plans/${id}`, input),

  createDay: (planId: string, input: CreateDayInput) =>
    send<Day>("POST", `/plans/${planId}/days`, input),
  updateDay: (id: string, input: UpdateDayInput) =>
    send<Day>("PATCH", `/days/${id}`, input),
  deleteDay: (id: string) => send<void>("DELETE", `/days/${id}`),

  createTask: (dayId: string, input: CreateTaskInput) =>
    send<Task>("POST", `/days/${dayId}/tasks`, input),
  updateTask: (id: string, input: UpdateTaskInput) =>
    send<Task>("PATCH", `/tasks/${id}`, input),
  deleteTask: (id: string) => send<void>("DELETE", `/tasks/${id}`),
};
