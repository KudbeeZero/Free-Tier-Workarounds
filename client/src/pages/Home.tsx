import { useTrends } from "@/hooks/use-trends";
import { TrendCard } from "@/components/TrendCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: trends, isLoading } = useTrends({ search, category });
  const { user } = useAuth();

  const categories = ["All", "DeFi", "NFT", "GameFi", "Infrastructure", "Meme"];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Market Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-driven trend detection anchored on Algorand.
          </p>
        </div>
        
        {/* Mock Create Button - functional if we had the form, but just visual for now or links to a create page */}
        {user?.role === 'admin' && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Trend
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === "All" ? undefined : cat)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${(cat === "All" && !category) || category === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search trends..."
            className="pl-9 bg-background border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Trends Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : trends?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold font-display">No trends found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trends?.map((trend) => (
            <TrendCard key={trend.id} trend={trend} />
          ))}
        </div>
      )}
    </div>
  );
}
