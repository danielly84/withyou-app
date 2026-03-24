import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Heart, AlertTriangle, RefreshCcw } from "lucide-react";
import {
  useCreateEntry,
  useGetReflectQuestion,
  getGetEntriesQueryKey,
  getGetInsightsQueryKey,
  type Entry,
} from "@workspace/api-client-react";
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

type Mode = "listen" | "reflect";
type Stage = "input" | "followup" | "done";

export default function Home() {
  const [text, setText] = useState("");
  const [followupText, setFollowupText] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("listen");
  const [stage, setStage] = useState<Stage>("input");
  const [reflectQuestion, setReflectQuestion] = useState<{ reflection: string; question: string } | null>(null);
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
        setStage("done");
        queryClient.invalidateQueries({ queryKey: getGetEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInsightsQueryKey() });
      },
    },
  });

  const questionMutation = useGetReflectQuestion({
    mutation: {
      onSuccess: (data) => {
        setReflectQuestion(data);
        setStage("followup");
      },
    },
  });

  const handleSubmit = () => {
    if (!text.trim()) return;
    if (mode === "listen") {
      createMutation.mutate({ data: { userText: text, mode: "listen" } });
    } else {
      questionMutation.mutate({ data: { userText: text } });
    }
  };

  const handleFollowupSubmit = () => {
    if (!followupText.trim()) return;
    createMutation.mutate({ data: { userText: text, mode: "reflect", followupText } });
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
    setFollowupText("");
    setSelectedMood(null);
    setStage("input");
    setReflectQuestion(null);
    createMutation.reset();
    questionMutation.reset();
  };

  const isPending = createMutation.isPending || questionMutation.isPending;

  const helperText =
    mode === "listen"
      ? "Write whatever's on your mind…"
      : "Share what's on your mind. I'll ask you one question.";

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 pb-12">

      {/* Hero — welcoming intro, not dominant */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-36 sm:h-40 rounded-2xl overflow-hidden relative border border-white/40 shadow-sm"
      >
        <img
          src={`${import.meta.env.BASE_URL}images/calm-abstract.png`}
          alt=""
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
        <div className="absolute bottom-5 left-5 sm:left-6">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-foreground">
            {stage === "done" ? "Your reflection" : "How are you feeling today?"}
          </h1>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── INPUT STAGE ── */}
        {stage === "input" && (
          <motion.div
            key="input-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            {/* First-visit welcome */}
            {isFirstVisit && (
              <div className="flex gap-3 items-start bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-primary/10 shadow-sm">
                <div className="p-1.5 bg-primary/10 rounded-full text-primary mt-0.5 shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This is your safe space to reflect. Write whatever is on your mind — our AI will offer gentle perspective and a small suggestion.
                </p>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
                What do you need right now?
              </span>
              <div className="flex bg-white border border-border rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setMode("listen")}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    mode === "listen"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Just listen
                </button>
                <button
                  onClick={() => setMode("reflect")}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    mode === "reflect"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Help me think this through
                </button>
              </div>
            </div>

            {/* Text input — primary action */}
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={mode}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm text-muted-foreground px-1"
                >
                  {helperText}
                </motion.span>
              </AnimatePresence>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start writing…"
                className="w-full min-h-[200px] p-5 rounded-2xl bg-white shadow-soft border border-border/60 text-base font-sans resize-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 placeholder:text-muted-foreground/30 leading-relaxed"
              />

              {/* CTA */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isPending}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-white text-sm font-semibold hover:bg-primary hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      {mode === "reflect" ? "Thinking…" : "Reflecting…"}
                    </>
                  ) : (
                    <>
                      Share
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mood chips — de-emphasised, below textarea */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs text-muted-foreground/70 px-0.5">Start with a feeling</span>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map(({ label, emoji }) => {
                  const isSelected = selectedMood === label;
                  return (
                    <button
                      key={label}
                      onClick={() => handleMoodClick(label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 flex items-center gap-1 ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "bg-white/80 border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <span>{emoji}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(createMutation.isError || questionMutation.isError) && (
              <p className="text-sm text-crisis px-1">
                Something went wrong. Please try again.
              </p>
            )}
          </motion.div>
        )}

        {/* ── FOLLOWUP STAGE ── */}
        {stage === "followup" && reflectQuestion && (
          <motion.div
            key="followup-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            <div className="bg-white rounded-2xl p-6 border border-primary/10 shadow-soft">
              <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                {reflectQuestion.reflection}
              </p>
              <p className="text-base font-medium text-foreground leading-snug">
                {reflectQuestion.question}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground px-1">Take your time…</span>
              <textarea
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
                placeholder="Your answer…"
                autoFocus
                className="w-full min-h-[160px] p-5 rounded-2xl bg-white shadow-soft border border-border/60 text-base font-sans resize-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 placeholder:text-muted-foreground/30 leading-relaxed"
              />

              <div className="flex justify-between items-center">
                <button
                  onClick={reset}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
                >
                  Start over
                </button>
                <button
                  onClick={handleFollowupSubmit}
                  disabled={!followupText.trim() || createMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-white text-sm font-semibold hover:bg-primary hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Reflecting…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-sm text-crisis px-1">Something went wrong. Please try again.</p>
            )}
          </motion.div>
        )}

        {/* ── DONE STAGE ── */}
        {stage === "done" && activeEntry && (
          <motion.div
            key="result-view"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-5"
          >
            {activeEntry.emotion.toLowerCase() === "crisis" ? (
              <div className="bg-crisis/5 border-2 border-crisis/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4 text-crisis">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Important Support</h2>
                </div>
                <p className="text-foreground leading-relaxed mb-5">
                  {activeEntry.reflection}
                </p>
                <div className="bg-white rounded-xl p-4 border border-crisis/20">
                  <p className="text-sm font-medium text-foreground mb-3">Please reach out for help right now:</p>
                  <a
                    href="tel:988"
                    className="inline-block bg-crisis text-white font-bold px-5 py-2.5 rounded-lg hover:bg-crisis/90 transition-colors"
                  >
                    Call or Text 988
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-floating border border-primary/10 flex flex-col gap-5">
                <div className="inline-flex">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
                    {activeEntry.emotion}
                  </span>
                </div>

                <p className="text-lg sm:text-xl font-display text-foreground leading-relaxed">
                  "{activeEntry.reflection}"
                </p>

                {activeEntry.insight && (
                  <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Insight</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{activeEntry.insight}</p>
                  </div>
                )}

                <div className="bg-accent/30 rounded-xl p-4 border border-accent/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    A small step
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{activeEntry.suggestion}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-white transition-all font-medium"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reflect again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground/60 max-w-sm mx-auto leading-relaxed pt-2">
        Therapy Copilot is for reflection and wellness support only. It is not a crisis or medical service. If you are in immediate danger, please call emergency services.
      </p>
    </div>
  );
}
