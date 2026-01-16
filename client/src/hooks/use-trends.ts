import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertTrend } from "@shared/schema";

// Helper to handle API responses correctly
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "An error occurred");
  }
  return res.json();
}

export function useTrends(filters?: { category?: string; search?: string }) {
  const queryKey = [api.trends.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(window.location.origin + api.trends.list.path);
      if (filters?.category) url.searchParams.append("category", filters.category);
      if (filters?.search) url.searchParams.append("search", filters.search);
      return api.trends.list.responses[200].parse(await fetcher(url.toString()));
    },
  });
}

export function useTrend(id: number) {
  return useQuery({
    queryKey: [api.trends.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.trends.get.path, { id });
      return api.trends.get.responses[200].parse(await fetcher(url));
    },
    enabled: !!id,
  });
}

export function useTrendPrices(id: number) {
  return useQuery({
    queryKey: [api.trends.getPrices.path, id],
    queryFn: async () => {
      const url = buildUrl(api.trends.getPrices.path, { id });
      return api.trends.getPrices.responses[200].parse(await fetcher(url));
    },
    enabled: !!id,
  });
}

export function useTrendHashes(id: number) {
  return useQuery({
    queryKey: [api.trends.getHashes.path, id],
    queryFn: async () => {
      const url = buildUrl(api.trends.getHashes.path, { id });
      return api.trends.getHashes.responses[200].parse(await fetcher(url));
    },
    enabled: !!id,
  });
}

export function useCreateTrend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTrend) => {
      const res = await fetch(api.trends.create.path, {
        method: api.trends.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create trend");
      return api.trends.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trends.list.path] });
    },
  });
}
