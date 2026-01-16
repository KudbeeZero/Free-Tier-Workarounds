import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "./use-auth";

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (walletAddress: string) => {
      const res = await fetch(api.auth.updateWallet.path, {
        method: api.auth.updateWallet.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update wallet");
      return api.auth.updateWallet.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Refresh the user profile
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}
