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

const MODE_COPY = {
  listen: {
    helper: "Write whatever's on your mind…",
    placeholder: "Write whatever's on your mind…",
  },
  reflect: {
    helper: "Share what's on your mind. I'll ask you one question.",
    placeholder: "Share what's on your mind…",
  },
};

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
    const visited = localStorage.getItem("clarity_visited");
    if (!visited) {
      setIsFirstVisit(true);
      localStorage.setItem("clarity_visited", "true");
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
      setText("Feeling " + label.toLowerCase() + "… ");
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

  return (
    <div className="w-full max-w-[560px] mx-auto flex flex-col gap-4 pb-10">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden relative border border-white/30 shadow-sm"
      >
        <img
          src={`${import.meta.env.BASE_URL}images/calm-abstract.png`}
          alt=""
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute bottom-4 left-5 sm:left-6">
          <AnimatePresence mode="wait">
            <motion.h1
              key={stage === "done" ? "done" : "default"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[1.6rem] sm:text-3xl font-display font-medium text-foreground leading-tight"
            >
              {stage === "done" ? "Your reflection" : "How are you feeling today?"}
            </motion.h1>
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── INPUT STAGE ── */}
        {stage === "input" && (
          <motion.div
            key="input-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-4"
          >
            {/* First-visit welcome */}
            {isFirstVisit && (
              <div className="flex gap-3 items-start bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-primary/10">
                <div className="p-1.5 bg-primary/10 rounded-full text-primary mt-0.5 shrink-0">
                  <Heart className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A calm space to reflect, process, and understand what's on your mind — no judgment, no agenda.
                </p>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground/70 font-medium px-0.5">
                What do you need right now?
              </span>
              <div className="flex bg-white border border-border/70 rounded-xl p-[3px] shadow-sm">
                {(["listen", "reflect"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`
                      flex-1 rounded-[9px] px-3 py-2 text-sm font-medium leading-tight
                      transition-all duration-200 ease-in-out
                      ${mode === m
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {m === "listen" ? "Just listen" : "Talk it through"}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea + CTA */}
            <div className="flex flex-col gap-1.5">
              {/* Animated helper label */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={mode}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 3 }}
                  transition={{ duration: 0.15 }}
                  className="text-[13px] text-muted-foreground/80 px-0.5"
                >
                  {MODE_COPY[mode].helper}
                </motion.span>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.textarea
                  key={`textarea-${mode}`}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={MODE_COPY[mode].placeholder}
                  className="w-full min-h-[190px] px-5 py-4 rounded-xl bg-white shadow-sm border border-border/60 text-[15px] font-sans resize-none transition-shadow duration-200 focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/25 placeholder:text-muted-foreground/30 leading-relaxed"
                />
              </AnimatePresence>

              {/* CTA — tight to textarea */}
              <div className="flex justify-end mt-0.5">
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-foreground text-white text-sm font-semibold tracking-[-0.01em] hover:bg-primary transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      {mode === "reflect" ? "Thinking…" : "Reflecting…"}
                    </>
                  ) : (
                    <>
                      Share
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mood chips */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted-foreground/50 font-medium px-0.5 tracking-wide">
                Start with a feeling
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map(({ label, emoji }) => {
                  const isSelected = selectedMood === label;
                  return (
                    <button
                      key={label}
                      onClick={() => handleMoodClick(label)}
                      className={`
                        px-3 py-1.5 rounded-full text-[12px] font-medium border
                        transition-all duration-150 active:scale-95 flex items-center gap-1
                        ${isSelected
                          ? "bg-primary/90 border-primary/80 text-white"
                          : "bg-white/70 border-border/50 text-muted-foreground hover:border-primary/20 hover:text-foreground hover:bg-white"
                        }
                      `}
                    >
                      <span className="text-[11px]">{emoji}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(createMutation.isError || questionMutation.isError) && (
              <p className="text-[13px] text-crisis/80 px-0.5">
                Something went wrong. Please try again.
              </p>
            )}
          </motion.div>
        )}

        {/* ── FOLLOWUP STAGE ── */}
        {stage === "followup" && reflectQuestion && (
          <motion.div
            key="followup-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-white rounded-xl px-6 py-5 border border-primary/10 shadow-sm">
              <p className="text-[13px] text-foreground/60 leading-relaxed mb-3">
                {reflectQuestion.reflection}
              </p>
              <p className="text-[15px] font-medium text-foreground leading-snug">
                {reflectQuestion.question}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-muted-foreground/70 px-0.5">Take your time…</span>
              <textarea
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
                placeholder="Your answer…"
                autoFocus
                className="w-full min-h-[150px] px-5 py-4 rounded-xl bg-white shadow-sm border border-border/60 text-[15px] font-sans resize-none transition-shadow duration-200 focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/25 placeholder:text-muted-foreground/30 leading-relaxed"
              />

              <div className="flex justify-between items-center mt-0.5">
                <button
                  onClick={reset}
                  className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors px-1"
                >
                  Start over
                </button>
                <button
                  onClick={handleFollowupSubmit}
                  disabled={!followupText.trim() || createMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-foreground text-white text-sm font-semibold tracking-[-0.01em] hover:bg-primary transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Reflecting…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-[13px] text-crisis/80 px-0.5">Something went wrong. Please try again.</p>
            )}
          </motion.div>
        )}

        {/* ── DONE STAGE ── */}
        {stage === "done" && activeEntry && (
          <motion.div
            key="result-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            {activeEntry.emotion.toLowerCase() === "crisis" ? (
              <div className="bg-crisis/5 border-2 border-crisis/25 rounded-2xl p-6">
                <div className="flex items-center gap-2.5 mb-3 text-crisis">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="text-base font-semibold">Important Support</h2>
                </div>
                <p className="text-[15px] text-foreground leading-relaxed mb-5">
                  {activeEntry.reflection}
                </p>
                <div className="bg-white rounded-xl p-4 border border-crisis/15">
                  <p className="text-sm font-medium text-foreground mb-3">Please reach out for help right now:</p>
                  <a
                    href="tel:988"
                    className="inline-block bg-crisis text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-crisis/90 transition-colors text-sm"
                  >
                    Call or Text 988
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">

                {/* Emotion intro */}
                <div className="px-6 pt-6 pb-5 border-b border-border/30">
                  <p className="text-[13px] text-primary/80 font-medium mb-3">
                    It sounds like you're feeling{" "}
                    <span className="font-semibold">{activeEntry.emotion}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 font-medium tracking-wide uppercase mb-2">
                    Here's what I'm hearing
                  </p>
                  <p className="text-[15px] sm:text-base font-display text-foreground leading-[1.75]">
                    {activeEntry.reflection}
                  </p>
                </div>

                {/* Insight */}
                {activeEntry.insight && (
                  <div className="px-6 py-5 border-b border-border/30">
                    <p className="text-[11px] font-medium text-muted-foreground/50 tracking-wide uppercase mb-2">
                      What this might mean
                    </p>
                    <p className="text-sm text-foreground/75 leading-relaxed">
                      {activeEntry.insight}
                    </p>
                  </div>
                )}

                {/* Action */}
                <div className="px-6 py-5 bg-accent/20">
                  <p className="text-[11px] font-medium text-muted-foreground/50 tracking-wide uppercase mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-2.5 h-2.5 text-primary/60" />
                    Something to try today
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {activeEntry.suggestion}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2 pb-1">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-muted-foreground/60 hover:text-foreground hover:bg-white border border-transparent hover:border-border/50 transition-all font-medium"
              >
                <RefreshCcw className="w-3 h-3" />
                Write another reflection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-muted-foreground/40 max-w-xs mx-auto leading-relaxed pt-1">
        Clarity is for reflection and wellness support only. It is not a medical, crisis, or therapy service. If you are in immediate danger, please call emergency services.
      </p>
    </div>
  );
}
