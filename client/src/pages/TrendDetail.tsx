import { useRoute } from "wouter";
import { useTrend, useTrendPrices, useTrendHashes } from "@/hooks/use-trends";
import { PriceChart } from "@/components/PriceChart";
import { ExecutionModal } from "@/components/ExecutionModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Activity, ShieldCheck, Link as LinkIcon, ExternalLink } from "lucide-react";

export default function TrendDetail() {
  const [, params] = useRoute("/trends/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: trend, isLoading: trendLoading } = useTrend(id);
  const { data: prices, isLoading: pricesLoading } = useTrendPrices(id);
  const { data: hashes, isLoading: hashesLoading } = useTrendHashes(id);

  if (trendLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!trend) return <div>Trend not found</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-border/50 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-xs tracking-wider">{trend.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-green-500 font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Active
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            {trend.name}
          </h1>
          <div className="flex flex-wrap gap-4 mb-4">
            {trend.sourcePlatform && (
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Source</span>
                <span className="text-sm font-semibold">{trend.sourcePlatform}</span>
              </div>
            )}
            {trend.estimatedMargin && (
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Margin</span>
                <span className="text-sm font-semibold text-green-500">{trend.estimatedMargin}</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-6">
            {trend.description}
          </p>
          {trend.productUrl && (
            <Button variant="outline" asChild className="gap-2">
              <a href={trend.productUrl} target="_blank" rel="noopener noreferrer">
                View Original Product <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 min-w-[200px]">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Trend Score</div>
              <div className="text-3xl font-mono font-bold text-foreground">{trend.trendScore}</div>
            </div>
          </div>
          <ExecutionModal trendId={trend.id} trendName={trend.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display">Price Action</h3>
              <div className="flex gap-2">
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary">24h</Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary">7d</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">30d</Badge>
              </div>
            </div>
            <PriceChart data={prices || []} isLoading={pricesLoading} />
          </Card>

          {/* About Section */}
          <Card className="p-6 border-border/50">
            <h3 className="text-lg font-bold font-display mb-4">Analysis</h3>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
              <p>
                This trend has demonstrated significant momentum over the last measuring period. 
                Correlated with on-chain volume spikes and social sentiment analysis.
                The anchoring hash verifies the data integrity on the Algorand blockchain.
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar Column - Blockchain Hashes */}
        <div className="space-y-6">
          <Card className="p-6 border-border/50 h-full max-h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold font-display">Proof of Trend</h3>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              Immutable data anchors stored on Algorand.
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin">
              {hashesLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)
              ) : hashes?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No anchors yet</div>
              ) : (
                hashes?.map((hash) => (
                  <div key={hash.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(hash.timestamp), "MMM d, HH:mm")}
                      </span>
                      <a 
                        href={`https://algoexplorer.io/tx/${hash.blockchainTxId}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View Tx <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <LinkIcon className="w-3 h-3 mt-1 text-muted-foreground" />
                      <code className="text-[10px] break-all text-foreground/80 font-mono leading-relaxed">
                        {hash.hash}
                      </code>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
