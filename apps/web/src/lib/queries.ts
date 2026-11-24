import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateDayInput,
  CreateTaskInput,
  PlanDetail,
  UpdateDayInput,
  UpdatePlanInput,
  UpdateTaskInput,
} from "@milestone/shared";
import { api } from "./api";

// Query keys name each piece of cached data, like labels on storage boxes.
export const keys = {
  plans: ["plans"] as const,
  plan: (id: string) => ["plans", id] as const,
};

export function usePlans() {
  return useQuery({ queryKey: keys.plans, queryFn: api.listPlans });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: keys.plan(id ?? ""),
    queryFn: () => api.getPlan(id!),
    enabled: Boolean(id), // wait until we know which plan to load
  });
}

// Ticking a task updates the screen instantly ("optimistic update"),
// then asks the server. If the server says no, we roll back.
export function useToggleTask(planId: string) {
  const queryClient = useQueryClient();
  const key = keys.plan(planId);

  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) =>
      api.updateTask(taskId, { done }),

    onMutate: async ({ taskId, done }) => {
      await queryClient.cancelQueries({ queryKey: key }); // don't let an old fetch overwrite us
      const previous = queryClient.getQueryData<PlanDetail>(key);
      queryClient.setQueryData<PlanDetail>(
        key,
        (plan) =>
          plan && {
            ...plan,
            days: plan.days.map((day) => ({
              ...day,
              tasks: day.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, doneAt: done ? new Date().toISOString() : null }
                  : task,
              ),
            })),
          },
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    // Either way, re-sync with the server's truth (e.g. its exact doneAt).
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

// Saves day fields (e.g. the note). On success we copy the server's version of the
// day into the cache, instead of refetching the whole 60-day plan for every save.
export function useUpdateDay(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dayId, input }: { dayId: string; input: UpdateDayInput }) =>
      api.updateDay(dayId, input),

    onSuccess: (saved) => {
      queryClient.setQueryData<PlanDetail>(
        keys.plan(planId),
        (plan) =>
          plan && {
            ...plan,
            days: plan.days.map((day) =>
              day.id === saved.id ? { ...day, ...saved } : day,
            ),
          },
      );
    },
  });
}

// Edit-mode actions. Edits are rare and change structure (new rows, new positions),
// so instead of patching the cache by hand we simply refetch the plan afterwards.
// onSettled runs on success AND failure, so a rejected edit also snaps back.
function useEditMutation<TVars, TData>(fn: (vars: TVars) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // keys.plans = ["plans"] also matches ["plans", id]: list and detail both refresh.
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.plans }),
  });
}

export function usePlanEditor(planId: string) {
  return {
    updatePlan: useEditMutation((input: UpdatePlanInput) =>
      api.updatePlan(planId, input),
    ),
    addDay: useEditMutation((input: CreateDayInput) =>
      api.createDay(planId, input),
    ),
    updateDay: useEditMutation(
      ({ dayId, input }: { dayId: string; input: UpdateDayInput }) =>
        api.updateDay(dayId, input),
    ),
    deleteDay: useEditMutation((dayId: string) => api.deleteDay(dayId)),
    addTask: useEditMutation(
      ({ dayId, input }: { dayId: string; input: CreateTaskInput }) =>
        api.createTask(dayId, input),
    ),
    updateTask: useEditMutation(
      ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
        api.updateTask(taskId, input),
    ),
    deleteTask: useEditMutation((taskId: string) => api.deleteTask(taskId)),
  };
}

export type PlanEditor = ReturnType<typeof usePlanEditor>;
