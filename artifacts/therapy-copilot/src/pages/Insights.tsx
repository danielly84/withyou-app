import { motion } from "framer-motion";
import { useGetInsights } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, Activity, Hash, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Insights() {
  const { data: insights, isLoading, isError } = useGetInsights();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load insights. Please try again later.
      </div>
    );
  }

  if (insights.totalEntries === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <Activity className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-display font-medium text-foreground mb-2">No insights yet</h2>
        <p className="text-muted-foreground max-w-sm">
          Write a few journal entries to start seeing patterns in your emotional landscape.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8"
    >
      <div>
        <h1 className="text-3xl font-display font-medium text-foreground">Your Emotional Landscape</h1>
        <p className="text-muted-foreground mt-2">Patterns and reflections from your journey.</p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-border/50 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Entries</p>
            <p className="text-3xl font-display font-semibold text-foreground">{insights.totalEntries}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-border/50 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Most Frequent</p>
            <p className="text-2xl font-display font-semibold text-foreground capitalize">
              {insights.mostCommonEmotion || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-border/50">
        <h3 className="font-semibold text-lg text-foreground mb-6">Emotion Frequency</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={insights.emotionCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="emotion" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {insights.emotionCounts.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.emotion === insights.mostCommonEmotion ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Entries Overview */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Recent Glimpses
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {insights.recentEntries.map((entry) => (
            <div key={entry.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">"{entry.userText}"</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(entry.createdAt), "MMM d, yyyy")} • {entry.emotion}
                  </p>
                </div>
              </div>
              <div className="shrink-0 hidden sm:block">
                <FileText className="w-4 h-4 text-muted-foreground/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
