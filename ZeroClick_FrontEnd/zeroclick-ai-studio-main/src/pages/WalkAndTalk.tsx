import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Zap, Trash2, Pencil } from "lucide-react";
import { useApp } from "@/context/AppContext";
import FlipCard from "@/components/FlipCard";

const MOCK_TRANSCRIPTS = [
  "AI tools are changing how professionals write content. I think creators should focus more on ideas than formatting. The future belongs to those who can think clearly, not just write well.",
  "I think the future of work is about flexibility and trust, not surveillance and micromanagement. Companies that embrace remote-first culture will attract the best talent.",
  "The best leaders I've worked with are the ones who ask questions instead of giving orders. Leadership is about influence, not authority.",
];

export default function WalkAndTalk() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const { generateFromVoice, drafts } = useApp();

  const startRecording = () => {
    setRecording(true);
    setTranscript("");
    setGeneratedDraft(null);
    setIsEditing(false);

    setTimeout(() => {
      setRecording(false);
      const t = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
      setTranscript(t);
    }, 3000);
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    const draft = await generateFromVoice(transcript);
    setGeneratedDraft(draft.id);
    setLoading(false);
  };

  const handleClear = () => {
    setTranscript("");
    setGeneratedDraft(null);
    setIsEditing(false);
  };

  const voiceDraft = drafts.find((d) => d.id === generatedDraft);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-[480px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-8">
        <Zap size={22} className="text-primary" />
        <h1 className="text-lg font-bold text-gradient">Walk & Talk</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Speak your thoughts. We'll turn them into a LinkedIn post.
        </p>

        <button
          onClick={startRecording}
          disabled={recording}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 mb-8 ${
            recording
              ? "bg-destructive/20 text-destructive animate-mic-pulse"
              : "bg-primary/20 text-primary hover:bg-primary/30 glow-mic"
          }`}
        >
          {recording ? <MicOff size={40} /> : <Mic size={40} />}
        </button>

        <AnimatePresence>
          {recording && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 mb-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1 bg-primary rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s`, height: "8px" }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-muted-foreground mb-6">
          {recording ? "Listening..." : transcript ? "Recording complete" : "Tap to start recording"}
        </p>

        {/* Transcript Area */}
        <AnimatePresence>
          {transcript && !generatedDraft && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full glass card-shadow rounded-2xl p-5 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Transcribed Text</p>
              {isEditing ? (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full min-h-[120px] bg-secondary/50 rounded-xl p-3 text-sm text-foreground resize-none border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              ) : (
                <p className="text-sm text-foreground leading-relaxed">"{transcript}"</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98] glow-primary flex items-center justify-center gap-2"
                >
                  {loading ? (<><Loader2 size={16} className="animate-spin" /> Generating...</>) : "Generate LinkedIn Post ⚡"}
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary/50 text-foreground text-sm font-medium transition-all duration-200 hover:bg-secondary/70 active:scale-95 border border-border/50"
                >
                  <Pencil size={14} /> {isEditing ? "Done Editing" : "Edit Transcript"}
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive/20 text-destructive text-sm font-medium transition-all duration-200 hover:bg-destructive/30 active:scale-95"
                >
                  <Trash2 size={14} /> Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {voiceDraft && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <FlipCard draft={voiceDraft} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
