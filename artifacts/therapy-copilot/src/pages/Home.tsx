import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Heart, AlertTriangle, RefreshCcw } from "lucide-react";
import { useCreateEntry, getGetEntriesQueryKey, getGetInsightsQueryKey, type Entry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const MOODS = [
  { label: "Stressed", emoji: "😰" },
  { label: "Overwhelmed", emoji: "🌊" },
  { label: "Anxious", emoji: "😟" },
  { label: "Stuck", emoji: "🧱" },
  { label: "Grateful", emoji: "🙏" },
  { label: "Sad", emoji: "😢" },
  { label: "Calm", emoji: "🌿" },
  { label: "Hopeful", emoji: "✨" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const visited = localStorage.getItem("therapy_copilot_visited");
    if (!visited) {
      setIsFirstVisit(true);
      localStorage.setItem("therapy_copilot_visited", "true");
    }
  }, []);

  const createMutation = useCreateEntry({
    mutation: {
      onSuccess: (data) => {
        setActiveEntry(data);
        queryClient.invalidateQueries({ queryKey: getGetEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInsightsQueryKey() });
      },
    }
  });

  const handleSubmit = () => {
    if (!text.trim() || createMutation.isPending) return;
    createMutation.mutate({ data: { userText: text } });
  };

  const handleMoodClick = (label: string) => {
    if (selectedMood === label) {
      setSelectedMood(null);
      setText("");
    } else {
      setSelectedMood(label);
      setText("Feeling " + label.toLowerCase() + "... ");
    }
  };

  const reset = () => {
    setActiveEntry(null);
    setText("");
    setSelectedMood(null);
    createMutation.reset();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
      {/* Header Image */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-48 sm:h-56 rounded-3xl overflow-hidden relative shadow-soft border border-white/40"
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/calm-abstract.png`} 
          alt="Calm abstract background" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-6 left-6 sm:left-8">
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground">
            {activeEntry ? "Your Reflection" : "How are you feeling today?"}
          </h1>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!activeEntry ? (
          <motion.div
            key="input-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {isFirstVisit && (
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-primary/10 shadow-sm flex gap-4 items-start">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Welcome to Therapy Copilot</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    This is your safe space to reflect. Write down whatever is on your mind, and our AI will offer gentle perspective and supportive suggestions.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {MOODS.map(({ label, emoji }) => {
                const isSelected = selectedMood === label;
                return (
                  <button
                    key={label}
                    onClick={() => handleMoodClick(label)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all active:scale-95 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-md"
                        : "bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:shadow-md"
                    }`}
                  >
                    <span>{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="relative group">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pour your thoughts out here..."
                className="w-full min-h-[240px] p-6 rounded-3xl bg-white shadow-soft border border-border/50 text-lg font-sans resize-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 placeholder:text-muted-foreground/40 leading-relaxed"
              />
              
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || createMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-white font-medium hover:bg-primary hover:shadow-floating transition-all duration-300 disabled:opacity-50 disabled:hover:bg-foreground disabled:hover:shadow-none disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      Reflecting...
                    </>
                  ) : (
                    <>
                      Reflect
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {createMutation.isError && (
              <div className="p-4 text-sm text-crisis bg-crisis/10 rounded-2xl border border-crisis/20">
                Sorry, something went wrong while processing your entry. Please try again.
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-6"
          >
            {activeEntry.emotion.toLowerCase() === "crisis" ? (
              <div className="bg-crisis/5 border-2 border-crisis/30 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-crisis">
                  <AlertTriangle className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">Important Support</h2>
                </div>
                <p className="text-foreground text-lg leading-relaxed mb-6">
                  {activeEntry.reflection}
                </p>
                <div className="bg-white rounded-2xl p-5 border border-crisis/20">
                  <p className="font-medium text-foreground mb-2">Please reach out for help right now:</p>
                  <a href="tel:988" className="inline-block bg-crisis text-white font-bold px-6 py-3 rounded-xl hover:bg-crisis/90 transition-colors">
                    Call or Text 988 (Suicide & Crisis Lifeline)
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-floating border border-primary/10">
                <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                  Detected emotion: {activeEntry.emotion}
                </div>
                
                <p className="text-xl md:text-2xl font-display text-foreground leading-relaxed mb-8">
                  "{activeEntry.reflection}"
                </p>

                <div className="bg-accent/30 rounded-2xl p-6 border border-accent/50">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    A thought for today
                  </h4>
                  <p className="text-foreground/80 leading-relaxed">
                    {activeEntry.suggestion}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center mt-4">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-white transition-all font-medium"
              >
                <RefreshCcw className="w-4 h-4" />
                Reflect again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Therapy Copilot is for reflection and wellness support only. It is not a crisis or medical service. If you are in immediate danger, please call emergency services.
        </p>
      </div>
    </div>
  );
}
