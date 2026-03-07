import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface UserProfile {
  fullName: string;
  role: string;
  industry: string;
  experience: string;
  targetAudience: string;
  writingStyle: string;
  interests: string[];
}

export interface Draft {
  id: string;
  topic: string;
  content: string;
  tone: string;
  engagement: string;
  createdAt: Date;
}

export interface HistoryPost {
  id: string;
  title: string;
  content: string;
  date: Date;
  status: "Approved" | "Edited";
}

interface AppState {
  userProfile: UserProfile | null;
  drafts: Draft[];
  historyPosts: HistoryPost[];
  selectedTopic: string;
  selectedTone: string;
  isOnboarded: boolean;
}

interface AppContextType extends AppState {
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setSelectedTopic: (topic: string) => void;
  setSelectedTone: (tone: string) => void;
  generateDraft: (topic: string) => Promise<Draft>;
  regenerateDraft: (id: string, tone?: string) => Promise<Draft>;
  acceptDraft: (id: string) => void;
  rejectDraft: (id: string) => void;
  generateFromVoice: (transcript: string) => Promise<Draft>;
  generateDraftFromIdea: (idea: string) => Promise<Draft>;
  generateDraftFromNews: (news: string) => Promise<Draft>;
  updateDraft: (id: string, content: string) => void;
  logout: () => void;
}

const MOCK_POSTS: Record<string, string[]> = {
  Tech: [
    "The future of software isn't about writing more code—it's about writing less. AI-assisted development is changing how we build, ship, and iterate. The teams that embrace this shift will move 10x faster. Those that don't? They'll be debugging while others are deploying. 🚀",
    "Hot take: Most tech debt isn't technical—it's organizational. When teams don't communicate, code becomes a mirror of their dysfunction. Fix the people problems first, and the code follows.",
    "I've been building software for 15 years. The biggest lesson? Ship fast, learn faster. Your users don't care about your perfect architecture. They care about solving their problems today.",
  ],
  AI: [
    "AI won't replace you. A person using AI will. The question isn't whether AI is coming for your job. The question is: are you learning to work WITH it? The most dangerous position is standing still. 🤖",
    "Everyone's talking about AI agents. But here's what nobody's saying: the real revolution isn't autonomous AI—it's augmented humans. The best results come from human judgment + AI speed.",
    "I tested 50 AI tools last month. 47 were just GPT wrappers. 3 genuinely changed how I work. The difference? They solved a specific problem brilliantly instead of trying to do everything.",
  ],
  Startups: [
    "Year 1: \"We need to raise money.\"\nYear 2: \"We need to find product-market fit.\"\nYear 3: \"We need to survive.\"\nYear 4: \"Wait... we're profitable?\"\n\nThe startup journey is never linear. Keep building. 💪",
    "Stop building features nobody asked for. I wasted 6 months building the 'perfect' product. Then I talked to users. They wanted something completely different. Talk to your customers first.",
  ],
  Career: [
    "Your career isn't a ladder. It's a jungle gym. Sometimes you move sideways. Sometimes you jump to a completely different structure. The best career moves I've made looked like lateral moves at the time. 🎯",
    "Unpopular opinion: Your network isn't your net worth. Your SKILLS are your net worth. Networks open doors, but skills keep you in the room.",
  ],
  Finance: [
    "The best investment advice I ever got: \"Invest in what you understand.\" Sounds simple. But 90% of people invest in things they can't explain to a 10-year-old. Start simple. Stay consistent. 📈",
    "Financial freedom isn't about making more money. It's about needing less. I doubled my income and felt no different. Then I cut my expenses by 30% and everything changed.",
  ],
  Marketing: [
    "Content marketing in 2026: Stop creating content FOR your audience. Start creating content WITH your audience. The brands winning right now are the ones turning customers into co-creators. 📣",
    "Your brand isn't your logo. It's not your colors. It's how people FEEL when they interact with you. Every touchpoint is a brand moment. Make them count.",
  ],
  Leadership: [
    "The best leaders don't have all the answers. They ask the best questions. Leadership isn't about authority—it's about influence. And influence comes from trust, not titles. 🏆",
    "I managed a team of 50 people. The #1 lesson? Your team's performance is a mirror of your communication. Be clear. Be consistent. Be human.",
  ],
  Productivity: [
    "I deleted 12 apps from my phone last week. My productivity doubled. The problem isn't that we lack tools—it's that we have too many. Simplify ruthlessly. ⚡",
    "The most productive people I know don't work more hours. They protect their focus. Block your calendar. Say no more often. Deep work > busy work.",
  ],
};

const ENGAGEMENTS = ["~2.4K impressions", "~5.1K impressions", "~1.8K impressions", "~3.7K impressions", "~6.2K impressions"];

function randomId() {
  return Math.random().toString(36).substring(2, 9);
}

function randomEngagement() {
  return ENGAGEMENTS[Math.floor(Math.random() * ENGAGEMENTS.length)];
}

function getRandomPost(topic: string): string {
  const posts = MOCK_POSTS[topic] || MOCK_POSTS["Tech"];
  return posts[Math.floor(Math.random() * posts.length)];
}

const STORAGE_KEY = "zeroclick_state";

function loadPersistedState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.historyPosts) {
      parsed.historyPosts = parsed.historyPosts.map((p: any) => ({ ...p, date: new Date(p.date) }));
    }
    return parsed;
  } catch {
    return {};
  }
}

function persistState(state: AppState) {
  const { drafts, ...rest } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const persisted = loadPersistedState();
    return {
      userProfile: persisted.userProfile || null,
      drafts: [],
      historyPosts: persisted.historyPosts || [],
      selectedTopic: persisted.selectedTopic || "Tech",
      selectedTone: persisted.selectedTone || "Professional",
      isOnboarded: persisted.isOnboarded || false,
    };
  });

  useEffect(() => {
    persistState(state);
  }, [state]);

  const setUserProfile = useCallback((profile: UserProfile) => {
    setState((s) => ({ ...s, userProfile: profile, isOnboarded: true }));
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setState((s) => {
      if (!s.userProfile) return s;
      return { ...s, userProfile: { ...s.userProfile, ...updates } };
    });
  }, []);

  const setSelectedTopic = useCallback((topic: string) => {
    setState((s) => ({ ...s, selectedTopic: topic }));
  }, []);

  const setSelectedTone = useCallback((tone: string) => {
    setState((s) => ({ ...s, selectedTone: tone }));
  }, []);

  const generateDraft = useCallback(async (topic: string): Promise<Draft> => {
    await new Promise((r) => setTimeout(r, 800));
    const draft: Draft = {
      id: randomId(),
      topic,
      content: getRandomPost(topic),
      tone: "Professional",
      engagement: randomEngagement(),
      createdAt: new Date(),
    };
    setState((s) => ({ ...s, drafts: [draft, ...s.drafts] }));
    return draft;
  }, []);

  const regenerateDraft = useCallback(async (id: string, tone?: string): Promise<Draft> => {
    await new Promise((r) => setTimeout(r, 600));
    setState((s) => {
      const idx = s.drafts.findIndex((d) => d.id === id);
      if (idx === -1) return s;
      const old = s.drafts[idx];
      const updated: Draft = {
        ...old,
        content: getRandomPost(old.topic),
        tone: tone || old.tone,
        engagement: randomEngagement(),
      };
      const newDrafts = [...s.drafts];
      newDrafts[idx] = updated;
      return { ...s, drafts: newDrafts };
    });
    return {} as Draft;
  }, []);

  const acceptDraft = useCallback((id: string) => {
    setState((s) => {
      const draft = s.drafts.find((d) => d.id === id);
      if (!draft) return s;
      const historyPost: HistoryPost = {
        id: randomId(),
        title: draft.topic + " Post",
        content: draft.content,
        date: new Date(),
        status: "Approved",
      };
      return {
        ...s,
        drafts: s.drafts.filter((d) => d.id !== id),
        historyPosts: [historyPost, ...s.historyPosts],
      };
    });
  }, []);

  const rejectDraft = useCallback((id: string) => {
    setState((s) => ({ ...s, drafts: s.drafts.filter((d) => d.id !== id) }));
  }, []);

  const generateFromVoice = useCallback(async (transcript: string): Promise<Draft> => {
    await new Promise((r) => setTimeout(r, 1500));
    const draft: Draft = {
      id: randomId(),
      topic: "Voice",
      content: `Based on your thoughts:\n\n"${transcript}"\n\nHere's a polished LinkedIn post:\n\n${transcript.charAt(0).toUpperCase() + transcript.slice(1)}. This is something I've been thinking about a lot lately. The more I reflect on it, the clearer it becomes—we need to talk about this more openly in our industry.\n\nWhat are your thoughts? Drop a comment below. 👇`,
      tone: "Professional",
      engagement: randomEngagement(),
      createdAt: new Date(),
    };
    setState((s) => ({ ...s, drafts: [draft, ...s.drafts] }));
    return draft;
  }, []);

  const generateDraftFromIdea = useCallback(async (idea: string): Promise<Draft> => {
    await new Promise((r) => setTimeout(r, 1800));
    const hooks = [
      "This might be controversial, but hear me out.",
      "I've been thinking about this for weeks.",
      "Most people won't agree with this. And that's okay.",
      "Here's something nobody is talking about:",
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    const draft: Draft = {
      id: randomId(),
      topic: "Idea",
      content: `${hook}\n\n${idea.charAt(0).toUpperCase() + idea.slice(1)}.\n\nHere's why this matters:\n\n1️⃣ The landscape is shifting faster than most realize\n2️⃣ Early adopters will have a massive advantage\n3️⃣ Ignoring this trend isn't an option anymore\n\nThe question isn't IF this will happen. It's WHEN.\n\nAnd the answer is: sooner than you think.\n\nWhat's your take? Agree or disagree? 👇`,
      tone: "Professional",
      engagement: randomEngagement(),
      createdAt: new Date(),
    };
    setState((s) => ({ ...s, drafts: [draft, ...s.drafts] }));
    return draft;
  }, []);

  const generateDraftFromNews = useCallback(async (news: string): Promise<Draft> => {
    await new Promise((r) => setTimeout(r, 2000));
    const draft: Draft = {
      id: randomId(),
      topic: "News",
      content: `🔔 Breaking: ${news}\n\nHere's why this matters for your career:\n\nThe industry is at an inflection point. This news isn't just a headline—it's a signal.\n\n🔹 What happened: ${news}\n🔹 Why it matters: This shifts the power dynamics in ways most people haven't considered yet.\n🔹 My take: We're entering a new era. The professionals who adapt NOW will lead tomorrow.\n\nDon't just read the news. Understand what it means for YOUR next move.\n\nThoughts? Let's discuss. 💬`,
      tone: "Professional",
      engagement: randomEngagement(),
      createdAt: new Date(),
    };
    setState((s) => ({ ...s, drafts: [draft, ...s.drafts] }));
    return draft;
  }, []);

  const updateDraft = useCallback((id: string, content: string) => {
    setState((s) => ({
      ...s,
      drafts: s.drafts.map((d) => (d.id === id ? { ...d, content } : d)),
    }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      userProfile: null,
      drafts: [],
      historyPosts: [],
      selectedTopic: "Tech",
      selectedTone: "Professional",
      isOnboarded: false,
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setUserProfile,
        updateUserProfile,
        setSelectedTopic,
        setSelectedTone,
        generateDraft,
        regenerateDraft,
        acceptDraft,
        rejectDraft,
        generateFromVoice,
        generateDraftFromIdea,
        generateDraftFromNews,
        updateDraft,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
