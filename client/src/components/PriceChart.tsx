import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PriceSnapshot } from "@shared/routes";
import { format } from "date-fns";

interface PriceChartProps {
  data: PriceSnapshot[];
  isLoading: boolean;
}

export function PriceChart({ data, isLoading }: PriceChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-secondary/10 rounded-xl border border-dashed border-border">
        <div className="text-muted-foreground animate-pulse">Loading market data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-secondary/10 rounded-xl border border-dashed border-border">
        <div className="text-muted-foreground">No price history available</div>
      </div>
    );
  }

  // Transform string timestamps to date objects
  const chartData = data.map(d => ({
    ...d,
    time: new Date(d.recordedAt).getTime(),
    value: parseFloat(d.price)
  })).sort((a, b) => a.time - b.time);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="time" 
            tickFormatter={(time) => format(time, "HH:mm")}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--popover-foreground))'
            }}
            labelFormatter={(label) => format(label, "PP HH:mm")}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
