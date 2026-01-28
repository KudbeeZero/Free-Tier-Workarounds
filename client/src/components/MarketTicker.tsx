import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

export function MarketTicker() {
  const { data: assets, isLoading } = useQuery<CryptoAsset[]>({
    queryKey: ["/api/market/top-assets"],
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) return <div className="h-12 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>;

  if (!Array.isArray(assets)) {
    return <div className="h-12 flex items-center justify-center text-xs text-muted-foreground italic px-4">Market data temporarily unavailable (Rate limit)</div>;
  }

  return (
    <div className="w-full overflow-hidden bg-card/30 border-y border-border/50 py-3 backdrop-blur-sm">
      <div className="flex animate-scroll whitespace-nowrap gap-8 px-4">
        {assets?.map((asset) => (
          <div key={asset.id} className="flex items-center gap-3">
            <img src={asset.image} alt={asset.name} className="w-5 h-5 rounded-full" />
            <span className="font-bold text-sm uppercase">{asset.symbol}</span>
            <span className="font-mono text-sm">${asset.current_price.toLocaleString()}</span>
            <Badge 
              variant="outline" 
              className={`text-[10px] border-none flex items-center gap-0.5 ${asset.price_change_percentage_24h >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}
            >
              {asset.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(asset.price_change_percentage_24h).toFixed(2)}%
            </Badge>
          </div>
        ))}
        {/* Duplicate for infinite loop effect if needed, or just standard flex */}
      </div>
    </div>
  );
}
