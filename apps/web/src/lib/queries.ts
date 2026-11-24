import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanDetail, UpdateDayInput } from "@milestone/shared";
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
