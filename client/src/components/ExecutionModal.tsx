import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateExecution } from "@/hooks/use-executions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Local schema since we just need simple inputs for the modal
const formSchema = z.object({
  executionType: z.enum(["buy", "sell"]),
});

type FormValues = z.infer<typeof formSchema>;

export function ExecutionModal({ trendId, trendName }: { trendId: number; trendName: string }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateExecution();
  const { toast } = useToast();
  
  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      executionType: "buy"
    }
  });

  const onSubmit = (data: FormValues) => {
    mutate(
      { trendId, executionType: data.executionType },
      {
        onSuccess: () => {
          toast({
            title: "Execution Submitted",
            description: `Successfully submitted ${data.executionType} order for ${trendName}`,
          });
          setOpen(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to submit execution",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          Execute Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Execute Trade: {trendName}</DialogTitle>
          <DialogDescription>
            Submit a trade execution. This will be logged on-chain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-4">
            <Label>Action Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input 
                  type="radio" 
                  value="buy" 
                  className="peer sr-only"
                  {...register("executionType")}
                />
                <div className="flex items-center justify-center p-4 rounded-lg border-2 border-border bg-secondary/50 peer-checked:border-green-500 peer-checked:bg-green-500/10 peer-checked:text-green-500 hover:bg-secondary transition-all">
                  <span className="font-bold">BUY</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input 
                  type="radio" 
                  value="sell" 
                  className="peer sr-only"
                  {...register("executionType")}
                />
                <div className="flex items-center justify-center p-4 rounded-lg border-2 border-border bg-secondary/50 peer-checked:border-red-500 peer-checked:bg-red-500/10 peer-checked:text-red-500 hover:bg-secondary transition-all">
                  <span className="font-bold">SELL</span>
                </div>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Execution"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
