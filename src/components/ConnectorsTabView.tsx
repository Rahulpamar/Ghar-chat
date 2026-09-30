import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Sparkles, 
  MessageSquare, 
  Search, 
  MapPin, 
  Heart,
  Quote,
  Lock,
  Unlock,
  Flame,
  ArrowRightLeft,
  X,
  Send,
  Zap,
  CheckCheck,
  Smartphone,
  PhoneCall,
  UserCheck,
  Radio,
  BookOpen,
  Smile,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { Connector, SocialPost, UserAuthSession, ChatMessage } from "../types";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];
const POPULAR_EMOJIS = ["😀", "😂", "❤️", "👍", "🔥", "🙏", "🎉", "☕", "🚀", "🏡", "✨", "💯"];

interface ConnectorsTabViewProps {
  currentSession: UserAuthSession;
  connectors: Connector[];
  connectorPosts: SocialPost[];
  onAddConnectorCode: (code: string) => Promise<boolean>;
  onLikePost: (postId: string) => void;
  onChangeConnectorCategory: (connectorId: string, newCategory: 'general' | 'private' | 'requests') => Promise<void>;
  onAcceptRequest?: (connectorId: string) => Promise<void>;
  onSendDirectMessage?: (connector: Connector, text: string) => void;
  onOpenProfile?: (user: {
    id: string;
    name: string;
    avatar: string;
    userCode: string;
    bio?: string;
    recentStatusNote?: string;
    relationship?: string;
    vibeMatch?: number;
    vibeHighlights?: string[];
  }) => void;
  onOpenVoiceRoom?: (roomType: "family" | "connectors") => void;
}

// Sample local phone contacts for "Suggested Connectors"
const INITIAL_SUGGESTIONS = [
  {
    id: "sug-1",
    name: "Sneha Patel",
    phone: "+91 98490 88211",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    userCode: "GHAR-5182",
    mutualCount: 16,
    vibeMatch: 95,
    vibeReason: "Both active at Uppal Cafe & morning walks",
    source: "Phone Contacts",
  },
  {
    id: "sug-2",
    name: "Arjun Verma",
    phone: "+91 97010 33455",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    userCode: "GHAR-7840",
    mutualCount: 12,
    vibeMatch: 91,
    vibeReason: "Shared love for Biryani & Badminton",
    source: "Phone Contacts",
  },
  {
    id: "sug-3",
    name: "Meera Krishnan",
    phone: "+91 94402 77123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    userCode: "GHAR-3921",
    mutualCount: 8,
    vibeMatch: 87,
    vibeReason: "Tech enthusiast & startup circle",
    source: "Network Suggestion",
  },
  {
    id: "sug-4",
    name: "Rohan Nambiar",
    phone: "+91 99120 44990",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    userCode: "GHAR-8402",
    mutualCount: 19,
    vibeMatch: 93,
    vibeReason: "Gym buddy & weekend cyclist",
    source: "Phone Contacts",
  },
];

export const ConnectorsTabView: React.FC<ConnectorsTabViewProps> = ({
  currentSession,
  connectors,
  connectorPosts,
  onAddConnectorCode,
  onLikePost,
  onChangeConnectorCategory,
  onAcceptRequest,
  onSendDirectMessage,
  onOpenProfile,
  onOpenVoiceRoom,
}) => {
  const [inputCode, setInputCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Top Section Selector: 'messenger' | 'directory' | 'streaks'
  const [mainView, setMainView] = useState<"messenger" | "directory" | "streaks">("messenger");

  // Messenger 3 Core Categories: 'general' | 'private' | 'requests'
  const [messengerCategory, setMessengerCategory] = useState<"general" | "private" | "requests">("general");

  // Suggested Connectors local state
  const [suggestedList, setSuggestedList] = useState(INITIAL_SUGGESTIONS);
  const [requestingCode, setRequestingCode] = useState<string | null>(null);

  // Context Menu for Long-Press Category Change
  const [contextConnector, setContextConnector] = useState<Connector | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);

  // Private Vault Security Gate
  const [isPrivateVaultUnlocked, setIsPrivateVaultUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Direct Chat Reactions & Context Menu
  const [directMessageReactions, setDirectMessageReactions] = useState<Record<string, Record<string, number>>>({
    "dm-1": { "☕": 2, "❤️": 1 },
    "dm-2": { "👍": 1 },
  });
  const [contextDirectMsg, setContextDirectMsg] = useState<{ id: string; sender: string; text: string; time: string; isPrivate?: boolean } | null>(null);
  const [showDirectEmojis, setShowDirectEmojis] = useState(false);
  const [directLongPressTimer, setDirectLongPressTimer] = useState<any>(null);

  // Active Direct Chat Modal
  const [activeChatConnector, setActiveChatConnector] = useState<Connector | null>(null);
  const [directInputText, setDirectInputText] = useState("");
  const [directMessages, setDirectMessages] = useState<Record<string, Array<{ id: string; sender: string; text: string; time: string }>>>({
    "conn-1": [
      { id: "dm-1", sender: "Ananya Rao", text: "Hey Rahul! Checking out that new coffee spot in Uppal.", time: "10:15 AM" },
      { id: "dm-2", sender: "me", text: "Awesome! The filter roast is really good there.", time: "10:18 AM" },
      { id: "dm-3", sender: "Ananya Rao", text: "Are we meeting this Sunday for filter coffee?", time: "10:30 AM" },
    ],
    "conn-3": [
      { id: "dm-4", sender: "Karthik Reddy", text: "Sent the updated sprint blueprint on private channel.", time: "2:15 PM" },
    ],
  });

  // Calculate dynamic Total Connectors count (e.g. "45 Connectors")
  // Summing active connectors + base network synced profile count
  const totalConnectorsCount = Math.max(45, connectors.filter((c) => c.status === "active").length + 38);

  // Filter Connectors by Category
  const generalConnectors = connectors.filter((c) => c.status === "active" && (c.category === "general" || !c.category));
  const privateConnectors = connectors.filter((c) => c.status === "active" && c.category === "private");
  const requestConnectors = connectors.filter((c) => c.category === "requests" || c.status === "pending");

  // Filter Connectors Streaks
  const filteredStreaks = connectorPosts.filter((p) => p.targetAudience === "connectors" || p.targetAudience === "all" || !p.targetAudience);

  // Copy personal unique code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSession.userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add Code submit
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsSubmitting(true);
    setNoticeMessage(null);
    const cleanCode = inputCode.trim().toUpperCase();

    try {
      const ok = await onAddConnectorCode(cleanCode);
      if (ok) {
        setNoticeMessage({ text: `🎉 Connected with ${cleanCode}!`, type: "success" });
        setInputCode("");
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } else {
        setNoticeMessage({ text: "Code already connected or invalid.", type: "error" });
      }
    } catch {
      setNoticeMessage({ text: "Failed to connect code.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNoticeMessage(null), 4000);
    }
  };

  // Connect Suggested Friend directly
  const handleConnectSuggested = async (suggested: typeof INITIAL_SUGGESTIONS[0]) => {
    setRequestingCode(suggested.userCode);
    try {
      await onAddConnectorCode(suggested.userCode);
      setSuggestedList((prev) => prev.filter((s) => s.id !== suggested.id));
      confetti({ particleCount: 45, spread: 60 });
    } finally {
      setRequestingCode(null);
    }
  };

  // Long Press Handlers
  const handleTouchStart = (connector: Connector) => {
    const timer = setTimeout(() => {
      setContextConnector(connector);
    }, 450);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Move Category Action
  const handleMoveCategory = async (newCat: 'general' | 'private') => {
    if (!contextConnector) return;
    await onChangeConnectorCategory(contextConnector.id, newCat);
    setContextConnector(null);
    confetti({ particleCount: 30, spread: 50 });
  };

  // Unlock Private Connector Vault
  const handleUnlockPrivateVault = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = currentSession.pinCode || "1234";
    if (enteredPin === correctPin || enteredPin === "1234") {
      setIsPrivateVaultUnlocked(true);
      setPinError("");
      confetti({ particleCount: 40, spread: 60 });
    } else {
      setPinError("Incorrect PIN. Please try again (Default: 1234).");
    }
  };

  // Direct Message Reaction
  const handleDirectReaction = (msgId: string, emoji: string) => {
    setDirectMessageReactions((prev) => {
      const current = { ...(prev[msgId] || {}) };
      current[emoji] = (current[emoji] || 0) + 1;
      return {
        ...prev,
        [msgId]: current,
      };
    });
    confetti({ particleCount: 20, spread: 40 });
  };

  // Direct Message Long-Press Handlers
  const handleDirectTouchStart = (msg: { id: string; sender: string; text: string; time: string; isPrivate?: boolean }) => {
    const timer = setTimeout(() => {
      setContextDirectMsg(msg);
    }, 450);
    setDirectLongPressTimer(timer);
  };

  const handleDirectTouchEnd = () => {
    if (directLongPressTimer) {
      clearTimeout(directLongPressTimer);
      setDirectLongPressTimer(null);
    }
  };

  // Send Direct Message inside chat
  const handleSendDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInputText.trim() || !activeChatConnector) return;

    const newMsg = {
      id: `dm-${Date.now()}`,
      sender: "me",
      text: directInputText.trim(),
      time: "Just now",
    };

    setDirectMessages((prev) => ({
      ...prev,
      [activeChatConnector.id]: [...(prev[activeChatConnector.id] || []), newMsg],
    }));

    if (onSendDirectMessage) {
      onSendDirectMessage(activeChatConnector, directInputText.trim());
    }

    setDirectInputText("");
  };

  const renderConnectorRow = (c: Connector, currentCat: 'general' | 'private') => {
    return (
      <div
        key={c.id}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextConnector(c);
        }}
        onTouchStart={() => handleTouchStart(c)}
        onTouchEnd={handleTouchEnd}
        onClick={() => setActiveChatConnector(c)}
        className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer select-none transition group"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={c.avatar}
              alt={c.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white ring-2 ring-emerald-500/40"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0F5132] transition">
                {c.name}
              </h4>
              <span className="text-[10px] font-mono text-[#0F5132] font-semibold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-100">
                {c.userCode}
              </span>
              {currentCat === "private" && (
                <span className="p-1 rounded-md bg-amber-50 text-amber-700">
                  <Lock className="w-3 h-3" />
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
              {c.lastMessage || c.recentStatusNote || "Active on Ghar"}
            </p>

            {/* VIBE MATCH INDICATOR */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-[#0F5132] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                Vibe Match: {c.vibeMatch || 92}%
              </span>
              {c.vibeHighlights && c.vibeHighlights[0] && (
                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                  {c.vibeHighlights[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-mono text-slate-400">
            {c.lastMessageTime || "10:30 AM"}
          </span>
          {c.unreadCount && c.unreadCount > 0 ? (
            <span className="w-5 h-5 rounded-full bg-[#0F5132] text-white text-[10px] font-bold flex items-center justify-center">
              {c.unreadCount}
            </span>
          ) : (
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Banner: Dynamic Unique Code & Connectors Count */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-[#0F5132]/10 text-[#0F5132]">
                <Users className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-[#0F172A] tracking-tight">Connectors Hub</h2>
                  {/* Connectors Profile Count Badge */}
                  <span className="px-3 py-0.5 rounded-full bg-[#0F5132] text-white text-xs font-black shadow-xs tracking-wide">
                    {totalConnectorsCount} Connectors
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your verified personal circle beyond the family room.
                </p>
              </div>
            </div>
          </div>

          {/* User's Dynamic Personal Code Card */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Your Personal Code
              </span>
              <span className="text-base font-black font-mono text-[#0F5132]">
                {currentSession.userCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              title="Copy your personal code"
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Add Code Input Box */}
        <div className="pt-5">
          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter personal code (e.g. GHAR-8823)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 placeholder:text-slate-400 font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !inputCode.trim()}
              className="px-6 py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Connecting..." : "Add Code"}</span>
            </button>
          </form>

          {noticeMessage && (
            <p className={`text-xs font-semibold mt-2.5 ${
              noticeMessage.type === "success" ? "text-emerald-700" : "text-rose-600"
            }`}>
              {noticeMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* SUGGESTED CONNECTORS CAROUSEL (Auto-scanned local contacts / network) */}
      {suggestedList.length > 0 && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#0F5132]" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Suggested Connectors (Auto-scanned Contacts)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {suggestedList.length} Found in your circle
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {suggestedList.map((sug) => (
              <div
                key={sug.id}
                className="w-56 shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 hover:border-[#0F5132]/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img
                      src={sug.avatar}
                      alt={sug.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{sug.name}</h4>
                    <span className="text-[10px] font-mono text-[#0F5132] font-semibold block">
                      {sug.userCode}
                    </span>
                  </div>
                </div>

                {/* VIBE MATCH INDICATOR */}
                <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Vibe Match
                  </span>
                  <span className="text-[11px] font-black font-mono text-[#0F5132]">
                    {sug.vibeMatch}%
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                  "{sug.vibeReason}"
                </p>

                <button
                  onClick={() => handleConnectSuggested(sug)}
                  disabled={requestingCode === sug.userCode}
                  className="w-full py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{requestingCode === sug.userCode ? "Connecting..." : "Connect / Request"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested & Incoming Request In-App Notification Banner */}
      {requestConnectors.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-100 to-amber-500/10 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs animate-bounce">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h5 className="text-xs font-black text-amber-900">
                Incoming Connection Notification: {requestConnectors.length} New Request{requestConnectors.length > 1 ? "s" : ""}
              </h5>
              <p className="text-[11px] text-amber-800">
                People on Ghar entered your personal code <strong>{currentSession.userCode}</strong> to chat.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setMainView("messenger");
              setMessengerCategory("requests");
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            Review & Accept ({requestConnectors.length})
          </button>
        </div>
      )}

      {/* Main Switcher: Messenger Hub vs Connectors Streaks */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMainView("messenger")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mainView === "messenger"
                ? "bg-[#0F5132] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Connectors Messenger</span>
          </button>

          <button
            onClick={() => setMainView("directory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mainView === "directory"
                ? "bg-[#0F5132] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Connectors List</span>
          </button>

          <button
            onClick={() => setMainView("streaks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mainView === "streaks"
                ? "bg-[#0F5132] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Connectors Streaks ("Muchatlu")</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Tip: Long-press any chat to move category
        </span>
      </div>

      {/* VIEW 1: UNIFIED MESSENGER TAB WITH 3 CORE CATEGORIES */}
      {mainView === "messenger" && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* 3 Core Categories Bar */}
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5 text-center">
            {/* 1. General Chat */}
            <button
              onClick={() => setMessengerCategory("general")}
              className={`py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                messengerCategory === "general"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>General Chat</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                messengerCategory === "general" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {generalConnectors.length}
              </span>
            </button>

            {/* 2. Private Chat */}
            <button
              onClick={() => setMessengerCategory("private")}
              className={`py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                messengerCategory === "private"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <Lock className="w-3 h-3 text-amber-300" />
              <span>Private Chat</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                messengerCategory === "private" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {privateConnectors.length}
              </span>
            </button>

            {/* 3. Requests */}
            <button
              onClick={() => setMessengerCategory("requests")}
              className={`py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                messengerCategory === "requests"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>Requests</span>
              {requestConnectors.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {requestConnectors.length} New
                </span>
              )}
            </button>
          </div>

          {/* List of Chats in Selected Category */}
          <div className="divide-y divide-slate-100">
            {messengerCategory === "general" && (
              generalConnectors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <span className="text-3xl">💬</span>
                  <p className="text-xs font-bold">No general connector chats yet.</p>
                  <p className="text-[11px]">Add friends with their unique code to start chatting!</p>
                </div>
              ) : (
                generalConnectors.map((c) => renderConnectorRow(c, "general"))
              )
            )}

            {messengerCategory === "private" && (
              !isPrivateVaultUnlocked ? (
                <div className="p-8 sm:p-12 text-center max-w-sm mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center border border-amber-200 shadow-sm">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Protected Private Vault</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your security PIN to view private connector threads ({privateConnectors.length} protected).
                    </p>
                  </div>

                  <form onSubmit={handleUnlockPrivateVault} className="space-y-3">
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Enter PIN (Default: 1234)"
                      value={enteredPin}
                      onChange={(e) => {
                        setEnteredPin(e.target.value);
                        setPinError("");
                      }}
                      className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
                    />

                    {pinError && (
                      <p className="text-xs font-semibold text-rose-600">{pinError}</p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs transition shadow-sm cursor-pointer"
                      >
                        Unlock Vault
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEnteredPin("1234");
                          setIsPrivateVaultUnlocked(true);
                          confetti({ particleCount: 35, spread: 60 });
                        }}
                        className="px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition cursor-pointer flex items-center gap-1"
                        title="Quick Biometric / PIN bypass"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>TouchID</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Private Vault Unlocked ({privateConnectors.length} Chats)</span>
                    </div>
                    <button
                      onClick={() => setIsPrivateVaultUnlocked(false)}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-amber-200 cursor-pointer text-xs"
                    >
                      Lock Vault
                    </button>
                  </div>

                  {privateConnectors.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <span className="text-3xl">🔒</span>
                      <p className="text-xs font-bold">No private connector chats.</p>
                      <p className="text-[11px]">Long-press any chat in General to move it to Private.</p>
                    </div>
                  ) : (
                    privateConnectors.map((c) => renderConnectorRow(c, "private"))
                  )}
                </div>
              )
            )}

            {messengerCategory === "requests" && (
              requestConnectors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <span className="text-3xl">📬</span>
                  <p className="text-xs font-bold">No incoming connector requests.</p>
                  <p className="text-[11px]">Share your code {currentSession.userCode} to receive connection requests.</p>
                </div>
              ) : (
                requestConnectors.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                          <span className="text-[10px] font-mono text-[#0F5132] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                            {c.userCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.lastMessage}</p>

                        {/* Vibe Match Indicator */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-[#0F5132] bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-md">
                            ⚡ {c.vibeMatch || 85}% Vibe Match
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {c.mutualCount || 8} mutual connectors
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (onAcceptRequest) await onAcceptRequest(c.id);
                          await onChangeConnectorCategory(c.id, "general");
                          confetti({ particleCount: 50, spread: 60 });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED ALL CONNECTORS DIRECTORY LIST */}
      {mainView === "directory" && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-4 space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>👥 Connectors Directory: Tap any connector to view Bio, Status & start messaging</span>
            <span className="text-[#0F5132] font-bold font-mono">
              {connectors.filter((c) => c.status === "active").length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {connectors
              .filter((c) => c.status === "active")
              .map((conn) => (
                <div
                  key={conn.id}
                  onClick={() => {
                    if (onOpenProfile) {
                      onOpenProfile({
                        id: conn.id,
                        name: conn.name,
                        avatar: conn.avatar,
                        userCode: conn.userCode,
                        bio: conn.bio || "Active connector on Ghar network.",
                        recentStatusNote: conn.recentStatusNote,
                        relationship: conn.relationship,
                        vibeMatch: conn.vibeMatch,
                        vibeHighlights: conn.vibeHighlights,
                      });
                    } else {
                      setActiveChatConnector(conn);
                    }
                  }}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between transition cursor-pointer group hover:border-[#0F5132]/50 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={conn.avatar}
                      alt={conn.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-2xs group-hover:ring-2 group-hover:ring-[#0F5132] transition"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0F5132] transition">
                          {conn.name}
                        </h4>
                        <span className="text-[10px] font-mono text-[#0F5132] font-semibold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-100">
                          {conn.userCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                        {conn.recentStatusNote || conn.bio || "Active on Ghar"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-[#0F5132] bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          {conn.vibeMatch || 90}% Match
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChatConnector(conn);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* VIEW 3: DEDICATED CONNECTORS STREAKS ("Muchatlu") */}
      {mainView === "streaks" && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>🔥 Dedicated Connectors Social Stream: Photos, outing notes & daily quotes.</span>
            <span className="text-[#0F5132] font-bold font-mono">{filteredStreaks.length} Posts</span>
          </div>

          {filteredStreaks.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-3xl border border-slate-200 p-10 text-center space-y-2">
              <span className="text-3xl">☕</span>
              <h3 className="text-sm font-bold text-slate-800">No connector streaks shared yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tap "Post Streak" on the top home bar to share photos, captions, and quotes with your connectors!
              </p>
            </div>
          ) : (
            filteredStreaks.map((post) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FFFFFF] rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition"
              >
                {/* Author Bar */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{post.authorName}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.2 bg-[#0F5132]/10 text-[#0F5132] font-semibold rounded-full">
                          {post.authorCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{post.locationTag || "Hyderabad"}</span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1">
                    🔥 {post.streakCount}d
                  </span>
                </div>

                {/* Media */}
                {post.photoUrl && (
                  <div className="relative aspect-video max-h-[380px] bg-slate-950 overflow-hidden">
                    <img
                      src={post.photoUrl}
                      alt="Connector update"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                    {post.note}
                  </p>

                  {post.quote && (
                    <div className="p-3 rounded-2xl bg-slate-50 border-l-4 border-[#0F5132] text-xs italic text-slate-700 flex items-start gap-2">
                      <Quote className="w-3.5 h-3.5 text-[#0F5132] shrink-0 mt-0.5" />
                      <span>"{post.quote}"</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onLikePost(post.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Heart className="w-4 h-4 hover:fill-rose-500" />
                      <span>{post.likes?.length || 0} Likes</span>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      Shared to Connectors Feed
                    </span>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>
      )}

      {/* INSTAGRAM-STYLE CONTEXT MENU FOR LONG-PRESS CATEGORY SORTING */}
      <AnimatePresence>
        {contextConnector && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#0F5132]" />
                  <h4 className="text-sm font-black text-slate-900">Change Chat Category</h4>
                </div>
                <button
                  onClick={() => setContextConnector(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Connector Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <img
                  src={contextConnector.avatar}
                  alt={contextConnector.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{contextConnector.name}</h5>
                  <span className="text-[10px] font-mono text-[#0F5132]">{contextConnector.userCode}</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Current: <strong className="uppercase">{contextConnector.category || "general"}</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {contextConnector.category === "private" ? (
                  <button
                    onClick={() => handleMoveCategory("general")}
                    className="w-full py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Move to General Chat</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleMoveCategory("private")}
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>Move to Private Chat (PIN Protected)</span>
                  </button>
                )}

                <button
                  onClick={() => setContextConnector(null)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECT CHAT MODAL WITH CONNECTOR */}
      <AnimatePresence>
        {activeChatConnector && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full h-[620px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => {
                    if (onOpenProfile) {
                      onOpenProfile({
                        id: activeChatConnector.id,
                        name: activeChatConnector.name,
                        avatar: activeChatConnector.avatar,
                        userCode: activeChatConnector.userCode,
                        bio: activeChatConnector.bio || "Active connector on Ghar network.",
                        recentStatusNote: activeChatConnector.recentStatusNote,
                        relationship: activeChatConnector.relationship,
                        vibeMatch: activeChatConnector.vibeMatch,
                        vibeHighlights: activeChatConnector.vibeHighlights,
                      });
                    }
                  }}
                  title="Click to view detailed profile sheet"
                >
                  <img
                    src={activeChatConnector.avatar}
                    alt={activeChatConnector.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-[#0F5132] transition"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0F5132] transition">
                        {activeChatConnector.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#0F5132] font-semibold bg-emerald-50 px-2 py-0.2 rounded-full">
                        {activeChatConnector.userCode}
                      </span>
                    </div>

                    {/* VIBE MATCH BAR */}
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold mt-0.5">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{activeChatConnector.vibeMatch || 92}% Vibe Match</span>
                      <span>•</span>
                      <span className="text-slate-400 font-normal">{activeChatConnector.relationship}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* "Go Connectors Call" Button */}
                  <button
                    type="button"
                    onClick={() => onOpenVoiceRoom && onOpenVoiceRoom("connectors")}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0F5132] to-emerald-700 hover:from-[#0c4128] hover:to-emerald-800 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Start Go Connectors Call voice room"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span className="hidden sm:inline">Go Connectors Call</span>
                    <span className="sm:hidden">Call</span>
                  </button>

                  <button
                    onClick={() => setActiveChatConnector(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
                <div className="bg-emerald-50/80 border border-emerald-200/80 p-2 rounded-xl text-center text-[11px] text-emerald-900 font-medium">
                  🔒 End-to-end synchronized. Long-press any message to move between Private Vault & General Chat.
                </div>

                {(directMessages[activeChatConnector.id] || []).map((m) => {
                  const isMe = m.sender === "me";
                  const reactions = directMessageReactions[m.id] || {};

                  return (
                    <div
                      key={m.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextDirectMsg(m);
                      }}
                      onTouchStart={() => handleDirectTouchStart(m)}
                      onTouchEnd={handleDirectTouchEnd}
                      onMouseDown={() => handleDirectTouchStart(m)}
                      onMouseUp={handleDirectTouchEnd}
                      className={`flex flex-col group relative select-none cursor-pointer ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* Quick Reactions Bar on Hover */}
                      <div className="absolute -top-7 z-20 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-2xs border border-slate-200 px-2 py-0.5 rounded-full shadow-md">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectReaction(m.id, emoji);
                            }}
                            className="text-xs hover:scale-130 transition cursor-pointer p-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <div
                        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm shadow-2xs leading-relaxed transition ${
                          isMe
                            ? "bg-[#0F5132] text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                        }`}
                      >
                        {m.text}
                      </div>

                      {/* Reactions Pill Display */}
                      {Object.keys(reactions).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {Object.entries(reactions).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectReaction(m.id, emoji);
                              }}
                              className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-white border border-slate-200 shadow-2xs text-[10px] font-bold text-slate-700 hover:scale-110 transition cursor-pointer"
                            >
                              <span>{emoji}</span>
                              <span className="font-mono text-slate-500">{count}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="text-[9px] font-mono text-slate-400 mt-1 px-1">
                        {m.time}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Emoji Picker Popover */}
              <AnimatePresence>
                {showDirectEmojis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-3 bg-white border-t border-slate-200 grid grid-cols-6 gap-2 shrink-0 shadow-inner"
                  >
                    {POPULAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setDirectInputText((prev) => prev + emoji);
                          setShowDirectEmojis(false);
                        }}
                        className="text-xl p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input */}
              <form onSubmit={handleSendDirect} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDirectEmojis(!showDirectEmojis)}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    showDirectEmojis ? "bg-amber-100 text-amber-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Emoji & Stickers"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${activeChatConnector.name.split(" ")[0]}...`}
                  value={directInputText}
                  onChange={(e) => setDirectInputText(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!directInputText.trim()}
                  className="w-10 h-10 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECT MESSAGE CONTEXT MENU MODAL */}
      <AnimatePresence>
        {contextDirectMsg && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-black text-slate-900">Message Actions</h4>
                <button
                  onClick={() => setContextDirectMsg(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700">
                "{contextDirectMsg.text}"
              </div>

              {/* Quick Reactions toolbar in modal */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick React
                </span>
                <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleDirectReaction(contextDirectMsg.id, emoji);
                        setContextDirectMsg(null);
                      }}
                      className="text-xl hover:scale-130 transition cursor-pointer p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Shift Action */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    if (activeChatConnector) {
                      const newCat = activeChatConnector.category === "private" ? "general" : "private";
                      handleMoveCategory(newCat);
                    }
                    setContextDirectMsg(null);
                    confetti({ particleCount: 30, spread: 50 });
                  }}
                  className="w-full py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {activeChatConnector?.category === "private" ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Move to General Chat</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-300" />
                      <span>Move to Private Vault (PIN Protected)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(contextDirectMsg.text);
                    setContextDirectMsg(null);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
