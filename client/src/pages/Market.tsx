import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  market_cap_rank: number;
}

export default function Market() {
  const [search, setSearch] = useState("");
  const { data: assets, isLoading } = useQuery<CryptoAsset[]>({
    queryKey: ["/api/market/top-assets", { per_page: 100 }],
    queryFn: async () => {
      const res = await fetch("/api/market/top-assets?per_page=100");
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const filteredAssets = assets?.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Global Markets</h1>
          <p className="text-muted-foreground">Top 100 assets by market cap (Live from CoinGecko)</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search assets..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets?.map((asset) => (
            <Card key={asset.id} className="p-4 bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <h3 className="font-bold text-sm leading-none">{asset.name}</h3>
                    <span className="text-xs text-muted-foreground uppercase">{asset.symbol}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">${asset.current_price.toLocaleString()}</div>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] border-none px-0 flex items-center justify-end gap-0.5 ${asset.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {asset.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(asset.price_change_percentage_24h).toFixed(2)}%
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest pt-2 border-t border-border/20">
                <span>Rank #{asset.market_cap_rank}</span>
                <span>MCap: ${(asset.market_cap / 1e9).toFixed(2)}B</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
