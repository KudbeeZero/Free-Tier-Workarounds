import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateWallet } from "@/hooks/use-user-profile";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Loader2, Check } from "lucide-react";
import { useState } from "react";

export function WalletConnect() {
  const { user } = useAuth();
  const { mutate, isPending } = useUpdateWallet();
  const { toast } = useToast();
  const [mockConnecting, setMockConnecting] = useState(false);

  const handleConnect = () => {
    setMockConnecting(true);
    // Simulate wallet popup delay
    setTimeout(() => {
      // Mock Algorand address
      const mockAddress = "ALGO" + Math.random().toString(36).substring(2, 12).toUpperCase() + "X7Y";
      
      mutate(mockAddress, {
        onSuccess: () => {
          toast({ title: "Wallet Connected", description: `Connected to ${mockAddress}` });
          setMockConnecting(false);
        },
        onError: () => {
          toast({ title: "Connection Failed", variant: "destructive" });
          setMockConnecting(false);
        }
      });
    }, 1500);
  };

  if (!user) return null;

  if (user.walletAddress) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
        <Check className="w-4 h-4" />
        <span className="text-sm font-mono">{user.walletAddress}</span>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isPending || mockConnecting}
      variant="outline"
      className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
    >
      {(isPending || mockConnecting) ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      Connect Algorand Wallet
    </Button>
  );
}
