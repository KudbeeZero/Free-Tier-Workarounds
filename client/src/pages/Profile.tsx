import { useAuth } from "@/hooks/use-auth";
import { useExecutions } from "@/hooks/use-executions";
import { WalletConnect } from "@/components/WalletConnect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: executions, isLoading: execLoading } = useExecutions(user?.id);

  if (authLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto mt-20" />;
  if (!user) return <div className="text-center mt-20">Please log in to view profile.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-3xl">
            {user.firstName?.[0] || user.email?.[0] || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">{user.firstName || user.email}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Wallet Status</h3>
          <WalletConnect />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-border bg-card/50">
          <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Executions</h3>
          <div className="text-3xl font-mono font-bold">{executions?.length || 0}</div>
        </Card>
        <Card className="p-6 border-border bg-card/50">
          <h3 className="text-muted-foreground text-sm font-medium mb-1">Account Role</h3>
          <div className="text-3xl font-display font-bold capitalize">{user.role}</div>
        </Card>
        <Card className="p-6 border-border bg-card/50">
          <h3 className="text-muted-foreground text-sm font-medium mb-1">Member Since</h3>
          <div className="text-xl font-mono pt-2">{format(new Date(user.createdAt || new Date()), "MMM yyyy")}</div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-display">Execution History</h2>
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Trend ID</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {execLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading history...</td>
                  </tr>
                ) : executions?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No executions yet.</td>
                  </tr>
                ) : (
                  executions?.map((exec) => (
                    <tr key={exec.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {format(new Date(exec.createdAt), "yyyy-MM-dd HH:mm")}
                      </td>
                      <td className="px-6 py-4">Trend #{exec.trendId}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={exec.executionType === 'buy' ? 'default' : 'destructive'} 
                          className="uppercase text-[10px]"
                        >
                          {exec.executionType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">CONFIRMED</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
