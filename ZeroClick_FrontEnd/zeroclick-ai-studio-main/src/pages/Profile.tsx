import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, Target, Pen, LogOut, Zap, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const STYLES = ["Professional", "Witty", "Storytelling", "Educational"];
const INTERESTS = ["Tech", "AI", "Startups", "Career", "Finance", "Marketing", "Leadership", "Productivity"];

export default function Profile() {
  const { userProfile, updateUserProfile, logout } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: userProfile?.fullName || "",
    role: userProfile?.role || "",
    industry: userProfile?.industry || "",
    writingStyle: userProfile?.writingStyle || "Professional",
    interests: userProfile?.interests || [],
  });

  if (!userProfile) {
    navigate("/");
    return null;
  }

  const toggleInterest = (i: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i],
    }));
  };

  const handleSave = () => {
    updateUserProfile(form);
    setEditing(false);
    toast({ title: "Profile updated ✅" });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const inputClass =
    "w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300";

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-[480px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-6">
        <Zap size={22} className="text-primary" />
        <h1 className="text-lg font-bold text-gradient">Profile</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass card-shadow rounded-2xl p-6">
        <AnimatePresence mode="wait">
          {!editing ? (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <User size={28} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{userProfile.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{userProfile.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p className="text-sm text-foreground">{userProfile.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Target Audience</p>
                    <p className="text-sm text-foreground">{userProfile.targetAudience}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Pen size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Writing Style</p>
                    <p className="text-sm text-foreground">{userProfile.writingStyle}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {userProfile.interests.map((i) => (
                      <span key={i} className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary">{i}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button onClick={() => setEditing(true)}
                  className="w-full py-3 rounded-xl bg-secondary text-foreground text-sm font-medium transition-all duration-200 hover:bg-secondary/80 active:scale-[0.98] flex items-center justify-center gap-2">
                  <Edit2 size={16} /> Edit Profile
                </button>
                <button onClick={handleLogout}
                  className="w-full py-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium transition-all duration-200 hover:bg-destructive/20 active:scale-[0.98] flex items-center justify-center gap-2">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Edit Profile</h3>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" className={inputClass} />
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Role / Profession" className={inputClass} />
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Industry" className={inputClass} />

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

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] glow-primary">Save</button>
                <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl bg-secondary text-foreground text-sm font-medium transition-all duration-200 hover:bg-secondary/80 active:scale-[0.98]">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
