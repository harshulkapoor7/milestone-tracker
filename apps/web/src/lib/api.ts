import type {
  Day,
  Plan,
  PlanDetail,
  Task,
  UpdateDayInput,
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

export const api = {
  listPlans: () => request<Plan[]>("/plans"),
  getPlan: (id: string) => request<PlanDetail>(`/plans/${id}`),
  updateDay: (id: string, input: UpdateDayInput) =>
    request<Day>(`/days/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updateTask: (id: string, input: UpdateTaskInput) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
