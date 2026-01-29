import { Link } from "wouter";
import { Trend } from "@shared/routes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Activity, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface TrendCardProps {
  trend: Trend;
}

export function TrendCard({ trend }: TrendCardProps) {
  const { data: marketData } = useQuery({
    queryKey: ["/api/trends", trend.id, "prices"],
  });

  const analytics = marketData?.intelligence;

  return (
    <Link href={`/trends/${trend.id}`} className="block group">
      <Card className="h-full bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden relative">
        {/* Hover Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="p-6 relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] tracking-wider uppercase opacity-70">
                  {trend.category}
                </Badge>
                {trend.sourcePlatform && (
                  <Badge variant="secondary" className="text-[10px] tracking-wider uppercase bg-primary/10 text-primary border-none">
                    {trend.sourcePlatform}
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold font-display group-hover:text-primary transition-colors line-clamp-1">
                {trend.name}
              </h3>
              {trend.estimatedMargin && (
                <span className="text-xs text-green-500 font-mono">
                  Est. Margin: {trend.estimatedMargin}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold font-mono text-primary flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {trend.trendScore}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Trend Score</span>
            </div>
          </div>

          {trend.imageUrl && (
            <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-muted">
              <img src={trend.imageUrl} alt={trend.name} className="w-full h-full object-cover" />
            </div>
          )}
          
          <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
            {trend.description}
          </p>

          {analytics && (
            <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Historical Low</span>
                <span className="text-sm font-mono font-bold">${analytics.lowestPrice}</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Prediction</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-mono font-bold text-primary">${analytics.predictedPrice}</span>
                  <TrendingUp className="w-3 h-3 text-primary" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <Link href="/compare" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                <BarChart3 className="w-3.5 h-3.5" />
                Compare
              </Button>
            </Link>
          </div>
          
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
