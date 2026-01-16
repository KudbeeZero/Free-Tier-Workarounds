import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertExecutionLog } from "@shared/schema";

export function useExecutions(userId?: string) {
  return useQuery({
    queryKey: [api.executions.listByUser.path, userId],
    queryFn: async () => {
      if (!userId) return [];
      const url = buildUrl(api.executions.listByUser.path, { id: userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch executions");
      return api.executions.listByUser.responses[200].parse(await res.json());
    },
    enabled: !!userId,
  });
}

export function useCreateExecution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertExecutionLog, "userId">) => {
      const res = await fetch(api.executions.create.path, {
        method: api.executions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit execution");
      return api.executions.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate the specific user's execution list if we knew the ID, but global list is okay for now or specific keys
      queryClient.invalidateQueries({ queryKey: [api.executions.listByUser.path] });
    },
  });
}
