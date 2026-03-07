import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RefreshCw, X, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { Draft, useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const TONES = ["Professional", "Funny", "Sarcastic", "Storytelling", "Bold", "Minimal"];

interface FlipCardProps {
  draft: Draft;
}

export default function FlipCard({ draft }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAcceptOptions, setShowAcceptOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editContent, setEditContent] = useState(draft.content);
  const [selectedTone, setSelectedTone] = useState(draft.tone);
  const { acceptDraft, rejectDraft, regenerateDraft, updateDraft } = useApp();
  const { toast } = useToast();

  const handleAccept = () => {
    setShowAcceptOptions(true);
  };

  const handleCopyToClipboard = async () => {
    await navigator.clipboard?.writeText(draft.content).catch(() => {});
    toast({ title: "Post copied to clipboard 🚀", description: "Saved to history" });
    setIsAccepting(true);
    setTimeout(() => acceptDraft(draft.id), 400);
  };

  const handleUploadToLinkedIn = () => {
    toast({ title: "Opening LinkedIn post creator 🚀" });
    acceptDraft(draft.id);
    window.open("https://www.linkedin.com/feed/", "_blank");
  };

  const handleReject = () => {
    setIsRejecting(true);
    setTimeout(() => rejectDraft(draft.id), 400);
  };

  const handleRegenerate = async () => {
    setLoading(true);
    await regenerateDraft(draft.id);
    setLoading(false);
  };

  const handleRegenerateWithTone = async () => {
    setLoading(true);
    await regenerateDraft(draft.id, selectedTone);
    setLoading(false);
    setIsFlipped(false);
  };

  const handleSave = () => {
    updateDraft(draft.id, editContent);
    setIsFlipped(false);
    toast({ title: "Draft updated ✏️" });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isRejecting ? 0 : isAccepting ? 0 : 1,
          x: isRejecting ? -300 : 0,
          y: isAccepting ? -20 : 0,
          scale: isAccepting ? 0.95 : 1,
        }}
        transition={{ duration: 0.4 }}
        className="flip-card w-full"
      >
        <div className={`flip-card-inner relative w-full ${isFlipped ? "flipped" : ""}`}>
          {/* FRONT */}
          <div className="flip-card-front w-full" style={{ backfaceVisibility: "hidden" }}>
            <div className="glass card-shadow rounded-2xl p-5 cursor-pointer hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300" onClick={() => !showAcceptOptions && setIsFlipped(true)}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary">{draft.topic}</span>
                <span className="text-xs text-muted-foreground ml-auto">{draft.engagement}</span>
              </div>
              <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed mb-4">{draft.content}</p>

              {!showAcceptOptions ? (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleAccept(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/20 text-success text-sm font-medium transition-all duration-200 hover:bg-success/30 active:scale-95">
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleRegenerate(); }} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-warning/20 text-warning text-sm font-medium transition-all duration-200 hover:bg-warning/30 active:scale-95 disabled:opacity-50">
                      <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Regen
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleReject(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive/20 text-destructive text-sm font-medium transition-all duration-200 hover:bg-destructive/30 active:scale-95">
                      <X size={16} /> Reject
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-3">Tap card to see full draft →</p>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground text-center mb-2">Choose an action:</p>
                  <button onClick={handleCopyToClipboard}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success/20 text-success text-sm font-medium transition-all duration-200 hover:bg-success/30 active:scale-95">
                    <Copy size={16} /> Copy to Clipboard
                  </button>
                  <button onClick={handleUploadToLinkedIn}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/20 text-primary text-sm font-medium transition-all duration-200 hover:bg-primary/30 active:scale-95">
                    <ExternalLink size={16} /> Upload to LinkedIn
                  </button>
                  <button onClick={() => setShowAcceptOptions(false)}
                    className="w-full text-xs text-muted-foreground py-1.5 hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* BACK */}
          <div className="flip-card-back absolute inset-0 w-full" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="glass card-shadow rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary">Full Draft</span>
                <button onClick={() => setIsFlipped(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
              </div>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[160px] bg-secondary/50 rounded-xl p-3 text-sm text-foreground resize-none border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" />
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)}
                    className="w-full appearance-none bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50 pr-8">
                    {TONES.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-200 hover:bg-primary/90 active:scale-95">Save Changes</button>
                <button onClick={handleRegenerateWithTone} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-warning/20 text-warning text-sm font-medium transition-all duration-200 hover:bg-warning/30 active:scale-95 disabled:opacity-50">
                  {loading ? "Generating..." : "Regen w/ Tone"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
