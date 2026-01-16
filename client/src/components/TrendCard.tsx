import { Link } from "wouter";
import { Trend } from "@shared/routes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TrendCardProps {
  trend: Trend;
}

export function TrendCard({ trend }: TrendCardProps) {
  return (
    <Link href={`/trends/${trend.id}`} className="block group">
      <Card className="h-full bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden relative">
        {/* Hover Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="p-6 relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="w-fit mb-1 text-[10px] tracking-wider uppercase opacity-70">
                {trend.category}
              </Badge>
              <h3 className="text-xl font-bold font-display group-hover:text-primary transition-colors">
                {trend.name}
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold font-mono text-primary flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {trend.trendScore}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Trend Score</span>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
            {trend.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live Anchor</span>
            </div>
            <span className="font-mono">
              Detected {formatDistanceToNow(new Date(trend.detectedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
