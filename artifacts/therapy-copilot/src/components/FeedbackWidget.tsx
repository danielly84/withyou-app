import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const REASONS = ["Too generic", "Not accurate", "Not helpful", "Other"];

interface FeedbackWidgetProps {
  entryId: number;
  userId: string;
}

export default function FeedbackWidget({ entryId, userId }: FeedbackWidgetProps) {
  const [state, setState] = useState<"idle" | "yes" | "picking" | "done">("idle");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  async function submitFeedback(helpful: boolean, reason?: string) {
    try {
      await fetch(`/api/entries/${entryId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, helpful, reason: reason ?? null }),
      });
    } catch {
      // Feedback is best-effort — never block the user
    }
  }

  const handleYes = async () => {
    setState("yes");
    await submitFeedback(true);
  };

  const handleNo = () => {
    setState("picking");
    submitFeedback(false);
  };

  const handleReason = async (reason: string) => {
    setSelectedReason(reason);
    setState("done");
    await submitFeedback(false, reason);
  };

  return (
    <div className="flex flex-col items-center gap-2.5 py-1">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-3"
          >
            <span className="text-[12px] text-muted-foreground/50 font-medium">
              Was this helpful?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleYes}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] text-muted-foreground/60 border border-border/40 bg-white/60 hover:border-primary/25 hover:text-primary hover:bg-primary/5 transition-all duration-150"
              >
                <ThumbsUp className="w-3 h-3" />
                Yes
              </button>
              <button
                onClick={handleNo}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] text-muted-foreground/60 border border-border/40 bg-white/60 hover:border-border hover:text-foreground hover:bg-muted/30 transition-all duration-150"
              >
                <ThumbsDown className="w-3 h-3" />
                Not really
              </button>
            </div>
          </motion.div>
        )}

        {state === "yes" && (
          <motion.p
            key="thanks-yes"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="text-[12px] text-muted-foreground/50"
          >
            Glad that helped.
          </motion.p>
        )}

        {state === "picking" && (
          <motion.div
            key="reasons"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[11px] text-muted-foreground/40">
              What felt off? <span className="italic">(optional)</span>
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReason(reason)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-border/40 bg-white/60 text-muted-foreground/60 hover:border-border hover:text-foreground hover:bg-muted/20 transition-all duration-150"
                >
                  {reason}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {state === "done" && (
          <motion.p
            key="thanks-no"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="text-[12px] text-muted-foreground/50"
          >
            Thanks for letting us know.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
