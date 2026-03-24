import { motion } from "framer-motion";
import { useGetInsights } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, Activity, Sparkles, Clock } from "lucide-react";
import { format } from "date-fns";

function generateNoticing(
  mostCommon: string,
  emotionCounts: { emotion: string; count: number }[],
  totalEntries: number,
): string {
  const top = emotionCounts[0];
  const second = emotionCounts[1];
  const freq = top ? Math.round((top.count / totalEntries) * 100) : 0;

  const emotionSentences: Record<string, string> = {
    anxious:
      "Anxiety shows up a lot in your reflections — often in moments where there's uncertainty or a feeling that something is at risk. It's less about catastrophe and more about needing more control over what's ahead.",
    overwhelmed:
      "Overwhelm comes up frequently for you. It tends to surface not from one big thing, but from the weight of many small things building up at once — the mental load of keeping everything in motion.",
    stressed:
      "Stress is a recurring theme. It often seems tied to external pressures and high-stakes moments, where you feel like a lot is riding on how things go.",
    sad:
      "Sadness appears regularly in what you share. It seems to come in waves — sometimes linked to specific moments, sometimes harder to pin down, like a quiet undercurrent.",
    grateful:
      "Gratitude shows up often in your reflections, which is meaningful. You seem to notice the good, even when things aren't perfect — that's worth recognising.",
    calm:
      "A sense of calm comes through in many of your entries. You seem to be finding more moments of steadiness, even if it isn't always easy to hold onto them.",
    stuck:
      "Feeling stuck is something you return to. It often sounds less like you don't know what to do, and more like the path forward feels blocked or unclear — like momentum is the missing piece.",
    hopeful:
      "Hopefulness appears across your reflections. You often find a way to orient toward what's possible, even when things feel uncertain.",
  };

  const emotionText =
    emotionSentences[mostCommon] ??
    `${mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1)} is the emotion that comes up most in your reflections. It seems to be something worth paying attention to.`;

  if (second && second.count > 1) {
    return `${emotionText} ${second.emotion.charAt(0).toUpperCase() + second.emotion.slice(1)} also surfaces regularly — these two often travel together.`;
  }

  return emotionText;
}

function generateSuggestion(mostCommon: string): string {
  const suggestions: Record<string, string> = {
    anxious:
      "On days when anxiety feels close, try naming the one specific thing you're most uncertain about. Writing it out — even just a sentence — can take it from background noise to something you can actually look at.",
    overwhelmed:
      "When everything feels like too much, try writing down everything competing for your attention. Getting it out of your head and onto a page often makes the load feel lighter and more manageable.",
    stressed:
      "Before your next high-pressure moment, take 60 seconds to write down what you actually control versus what you don't. It's a small act, but it tends to reorient your focus in a useful way.",
    sad:
      "On hard days, try giving yourself permission to feel it without rushing to fix it. Even writing one sentence about what's there — without trying to make sense of it — can be a small act of self-compassion.",
    grateful:
      "You already notice the good things — keep that going. Try sharing one thing you're grateful for with someone you care about. Gratitude tends to compound when it moves outward.",
    calm:
      "Your calm moments are worth building on. Try noticing what conditions helped create them — time of day, what you did beforehand, who you were with — so you can return to them more intentionally.",
    stuck:
      "When you feel stuck, try asking: what's the smallest possible next step — not the right step, just any step. Movement, even sideways, tends to unstick things.",
    hopeful:
      "Your sense of hope is worth protecting. On harder days, revisit what you were hopeful about in a past reflection. Sometimes your own words are the best reminder that things can shift.",
  };

  return (
    suggestions[mostCommon] ??
    `When ${mostCommon} comes up, try taking a few minutes to write about it without trying to solve anything. Sometimes understanding the feeling is the first step.`
  );
}

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
        <h2 className="text-2xl font-display font-medium text-foreground mb-2">No patterns yet</h2>
        <p className="text-muted-foreground max-w-sm">
          Write a few entries to start seeing patterns in how you think and feel over time.
        </p>
      </div>
    );
  }

  const mostCommon = insights.mostCommonEmotion ?? "reflective";
  const top2 = insights.emotionCounts.slice(0, 2);
  const chartInterpretation =
    top2.length >= 2
      ? `${top2[0]!.emotion.charAt(0).toUpperCase() + top2[0]!.emotion.slice(1)} and ${top2[1]!.emotion} show up most often in your reflections.`
      : top2.length === 1
      ? `${top2[0]!.emotion.charAt(0).toUpperCase() + top2[0]!.emotion.slice(1)} is the emotion that comes up most in your reflections.`
      : null;

  const noticingText = generateNoticing(mostCommon, insights.emotionCounts, insights.totalEntries);
  const suggestionText = generateSuggestion(mostCommon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-2xl mx-auto"
    >
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-display font-medium text-foreground">Your Patterns</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">What your reflections reveal over time.</p>
      </div>

      {/* "What I'm noticing" — emotional centerpiece */}
      <div className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60 mb-3">
          What I'm noticing
        </p>
        <p className="text-[15px] text-foreground/80 leading-[1.75]">
          {noticingText}
        </p>
      </div>

      {/* Humanised metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">
            Check-ins
          </p>
          <p className="text-2xl font-display font-semibold text-foreground">
            {insights.totalEntries}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {insights.totalEntries === 1
              ? "You've checked in once so far"
              : `You've checked in ${insights.totalEntries} times`}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">
            Most often
          </p>
          <p className="text-2xl font-display font-semibold text-foreground capitalize">
            {mostCommon}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            You've been feeling {mostCommon} most often
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-border/50">
        <h3 className="font-semibold text-base text-foreground mb-5">How your feelings are distributed</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={insights.emotionCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="emotion"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {insights.emotionCounts.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.emotion === mostCommon
                        ? "hsl(var(--primary))"
                        : "hsl(var(--accent))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {chartInterpretation && (
          <p className="text-[13px] text-muted-foreground/70 mt-4 leading-relaxed">
            {chartInterpretation}
          </p>
        )}
      </div>

      {/* Recent reflections */}
      <div>
        <h3 className="font-medium text-base text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground/50" />
          Recent reflections
        </h3>
        <div className="flex flex-col gap-2.5">
          {insights.recentEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/80 shadow-sm flex items-start gap-3"
            >
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-foreground line-clamp-1">"{entry.userText}"</p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">
                  {format(new Date(entry.createdAt), "MMM d, yyyy")} · Feeling {entry.emotion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Something to try */}
      <div className="bg-accent/20 rounded-2xl p-6 border border-accent/30">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-2.5 h-2.5 text-primary/60" />
          Something to try
        </p>
        <p className="text-[14px] text-foreground/75 leading-[1.7]">
          {suggestionText}
        </p>
      </div>
    </motion.div>
  );
}
