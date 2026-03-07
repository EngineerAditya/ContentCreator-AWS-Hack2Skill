import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import FlipCard from "@/components/FlipCard";

export default function Dashboard() {
  const { drafts, selectedTopic, setSelectedTopic, generateDraft, userProfile } = useApp();
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only show topics the user selected as interests
  const topics = userProfile?.interests?.length ? userProfile.interests : ["Tech", "AI", "Startups"];

  const handleGenerate = async () => {
    setLoading(true);
    await generateDraft(selectedTopic);
    setLoading(false);
  };

  useEffect(() => {
    // Set initial topic to first interest if current isn't in list
    if (!topics.includes(selectedTopic)) {
      setSelectedTopic(topics[0]);
    }
  }, [topics]);

  useEffect(() => {
    if (drafts.length === 0) {
      handleGenerate();
    }
  }, []);

  const topicDrafts = drafts.filter((d) => d.topic === selectedTopic);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-[480px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap size={22} className="text-primary" />
          <h1 className="text-lg font-bold text-gradient">ZeroClick</h1>
        </div>
        <span className="text-xs text-muted-foreground">Hi, {userProfile?.fullName?.split(" ")[0] || "Creator"} 👋</span>
      </motion.div>

      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {topics.map((topic) => (
          <button key={topic} onClick={() => setSelectedTopic(topic)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${selectedTopic === topic ? "bg-primary text-primary-foreground tab-glow" : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/50"}`}>
            {topic}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {topicDrafts.map((draft) => (<FlipCard key={draft.id} draft={draft} />))}
        {topicDrafts.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">No drafts for "{selectedTopic}" yet</p>
          </motion.div>
        )}
      </div>

      <motion.button whileTap={{ scale: 0.95 }} onClick={handleGenerate} disabled={loading}
        className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:ml-[200px] z-40 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center card-shadow glow-primary transition-all duration-300 disabled:opacity-50">
        {loading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
      </motion.button>
    </div>
  );
}
