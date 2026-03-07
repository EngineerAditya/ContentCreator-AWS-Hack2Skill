import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function History() {
  const { historyPosts } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-[480px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <Zap size={22} className="text-primary" />
        <h1 className="text-lg font-bold text-gradient">History</h1>
      </motion.div>

      {historyPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Clock size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No accepted posts yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Accept drafts from the dashboard to see them here</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {historyPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass card-shadow rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.date.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      post.status === "Approved"
                        ? "bg-success/20 text-success"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {post.status}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform duration-300 ${
                      expandedId === post.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              <AnimatePresence>
                {expandedId === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-border/50 pt-3">
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
