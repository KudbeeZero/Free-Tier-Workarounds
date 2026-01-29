import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trend } from "@shared/routes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X, BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function CompareTrends() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const { data: trends, isLoading } = useQuery<Trend[]>({
    queryKey: ["/api/trends"],
  });

  const { data: allPriceData } = useQuery({
    queryKey: ["/api/trends/all-prices"],
    queryFn: async () => {
      if (!selectedIds.length) return [];
      const results = await Promise.all(
        selectedIds.map(async (id) => {
          const res = await fetch(`/api/trends/${id}/prices`);
          const data = await res.json();
          return { id, ...data };
        })
      );
      return results;
    },
    enabled: selectedIds.length > 0,
  });

  const toggleTrend = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  const comparisonData = selectedIds.map(id => {
    const trend = trends?.find(t => t.id === id);
    const intelligence = allPriceData?.find(d => d.id === id)?.intelligence;
    return {
      name: trend?.name || "Unknown",
      current: intelligence ? parseFloat(intelligence.currentPrice) : 0,
      predicted: intelligence ? parseFloat(intelligence.predictedPrice) : 0,
      lowest: intelligence ? parseFloat(intelligence.lowestPrice) : 0,
    };
  });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Compare Trends</h1>
        <p className="text-muted-foreground">Select up to 4 items to compare price intelligence and growth metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends?.map((trend) => (
          <Card 
            key={trend.id} 
            className={`cursor-pointer transition-all ${selectedIds.includes(trend.id) ? 'border-primary ring-1 ring-primary' : 'border-border/50 opacity-70'}`}
            onClick={() => toggleTrend(trend.id)}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold truncate pr-2">{trend.name}</CardTitle>
              <Checkbox checked={selectedIds.includes(trend.id)} />
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedIds.length > 0 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Price Intelligence Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="lowest" name="Historical Low" fill="#22c55e" />
                  <Bar dataKey="current" name="Current Price" fill="#3b82f6" />
                  <Bar dataKey="predicted" name="Predicted Price" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonData.map((data, idx) => (
              <Card key={idx} className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{data.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Est. Growth</span>
                    <span className="text-sm font-bold text-green-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {((data.predicted - data.current) / data.current * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Price</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {data.current}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-xl">
          <Plus className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Select products above to start comparing</p>
        </div>
      )}
    </div>
  );
}
