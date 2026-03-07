import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";

const AUDIENCES = ["Founders", "Developers", "Marketers", "Executives", "Students", "Creators"];
const STYLES = ["Professional", "Witty", "Storytelling", "Educational"];
const INTERESTS = ["Tech", "AI", "Startups", "Career", "Finance", "Marketing", "Leadership", "Productivity"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUserProfile } = useApp();
  const [form, setForm] = useState({
    fullName: "",
    role: "",
    industry: "",
    experience: "",
    targetAudience: "Founders",
    writingStyle: "Professional",
    interests: [] as string[],
  });

  const toggleInterest = (i: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile(form);
    navigate("/dashboard");
  };

  const inputClass =
    "w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center px-5 py-8 pb-12"
    >
      <div className="w-full max-w-[480px]">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap size={32} className="text-primary" />
            <h1 className="text-2xl font-bold text-gradient">ZeroClick</h1>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Create Better LinkedIn Content Effortlessly
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px] mx-auto">
            ZeroClick turns voice, ideas, and news into high-quality LinkedIn posts in seconds.
            <br />
            <span className="text-foreground/60">No blank pages. No writer's block. Just ideas → posts.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-6"
        >
          <h3 className="text-base font-semibold text-foreground mb-0.5">Create Your Creator Profile</h3>
          <p className="text-xs text-muted-foreground">Tell us about yourself to personalize your AI drafts</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass card-shadow rounded-2xl p-6 space-y-4"
        >
          <input required placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
          <input required placeholder="Role / Profession" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass} />
          <input required placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputClass} />
          <input required placeholder="Years of Experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className={inputClass} />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Audience</label>
            <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className={inputClass}>
              {AUDIENCES.map((a) => (<option key={a} value={a}>{a}</option>))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Writing Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, writingStyle: s })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${form.writingStyle === s ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button key={i} type="button" onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${form.interests.includes(i) ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/50"}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:bg-primary/90 active:scale-[0.98] glow-primary mt-2">
            Create My AI Profile ⚡
          </button>
        </motion.form>
      </div>
    </motion.div>
  );
}
