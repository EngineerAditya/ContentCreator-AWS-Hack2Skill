import { useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, Loader2, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import FlipCard from "@/components/FlipCard";

export default function NewsToPost() {
  const [news, setNews] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const { generateDraftFromNews, drafts } = useApp();

  const handleGenerate = async () => {
    if (!news.trim()) return;
    setLoading(true);
    const draft = await generateDraftFromNews(news.trim());
    setGeneratedId(draft.id);
    setLoading(false);
  };

  const generatedDraft = drafts.find((d) => d.id === generatedId);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-[480px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-6">
        <Zap size={22} className="text-primary" />
        <h1 className="text-lg font-bold text-gradient">News to Post</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass card-shadow rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Newspaper size={18} className="text-primary" />
          <p className="text-sm font-medium text-foreground">Turn news into a LinkedIn insight post</p>
        </div>
        <textarea
          value={news}
          onChange={(e) => setNews(e.target.value)}
          placeholder="Paste a news headline or summarize the news...&#10;&#10;e.g. OpenAI released a new model that can reason like humans."
          className="w-full min-h-[140px] bg-secondary/50 rounded-xl p-4 text-sm text-foreground resize-none border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !news.trim()}
          className="w-full mt-3 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98] glow-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (<><Loader2 size={16} className="animate-spin" /> Generating...</>) : "Generate Insight Post 📰"}
        </button>
      </motion.div>

      {generatedDraft && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <FlipCard draft={generatedDraft} />
        </motion.div>
      )}
    </div>
  );
}
