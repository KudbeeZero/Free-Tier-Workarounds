import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl font-display font-bold mb-4">404 Page Not Found</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        The trend you are looking for has either expired or never existed.
      </p>
      <Link href="/">
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
