import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetEntries, useDeleteEntry, getGetEntriesQueryKey, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Trash2, Book, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function History() {
  const { user } = useAuth();
  const userId = user!.id.toString();
  const { data: entries, isLoading } = useGetEntries({ userId });
  const deleteMutation = useDeleteEntry();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetEntriesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetInsightsQueryKey() });
          }
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-soft mb-6 rotate-3">
          <Book className="w-10 h-10 text-primary/40" />
        </div>
        <h2 className="text-2xl font-display font-medium text-foreground mb-2">Blank pages</h2>
        <p className="text-muted-foreground max-w-sm">
          Your history is empty. Go to the Journal tab to write your first reflection.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-medium text-foreground">Your History</h1>
          <p className="text-muted-foreground mt-2">All your past reflections in one place.</p>
        </div>
        <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-lg">
          {entries.length} entries
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary capitalize">
                        {entry.emotion}
                      </span>
                    </div>
                    
                    <p className={`text-foreground leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}>
                      {entry.userText}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0">
                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-muted-foreground hover:text-crisis hover:bg-crisis/10 rounded-full transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-muted-foreground bg-muted/50 hover:bg-muted rounded-full transition-colors hidden sm:block">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 bg-background/50"
                    >
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What I heard</h4>
                          <p className="text-foreground/90 leading-relaxed bg-white p-4 rounded-2xl border border-border/50">
                            {entry.reflection}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Something to try</h4>
                          <p className="text-foreground/90 leading-relaxed bg-accent/20 p-4 rounded-2xl border border-accent/30">
                            {entry.suggestion}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
