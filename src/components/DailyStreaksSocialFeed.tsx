import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  MapPin, 
  Heart, 
  MessageCircle, 
  Send, 
  Plus, 
  Image as ImageIcon, 
  Sparkles, 
  Quote, 
  X, 
  Smile, 
  Share2,
  Check
} from "lucide-react";
import confetti from "canvas-confetti";
import { SocialPost, UserAuthSession } from "../types";

interface DailyStreaksSocialFeedProps {
  posts: SocialPost[];
  currentSession: UserAuthSession;
  onCreatePost: (post: Partial<SocialPost>) => void;
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, commentText: string) => void;
}

const PRESET_QUOTES = [
  "Food tastes best when shared with people who dream with you.",
  "One step at a time, every single day.",
  "Family isn't an important thing. It's everything.",
  "Chai, conversations, and positive energy!",
  "Keep your face always toward the sunshine, and shadows will fall behind you.",
];

const PRESET_LOCATIONS = [
  "Paradise Food Court, Secunderabad",
  "KBR National Park, Jubilee Hills",
  "DLF CyberCity, Hitec City",
  "Banjara Hills Road No. 12",
  "Charminar Old City, Hyderabad",
  "Home Terrace Garden",
];

const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", // Biryani
  "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80", // Park
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", // Restaurant
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80", // Vacation
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80", // Family
];

export const DailyStreaksSocialFeed: React.FC<DailyStreaksSocialFeedProps> = ({
  posts,
  currentSession,
  onCreatePost,
  onLikePost,
  onCommentPost,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLocationTag, setNewLocationTag] = useState(PRESET_LOCATIONS[0]);
  const [newPhotoUrl, setNewPhotoUrl] = useState(PRESET_IMAGES[0]);
  const [newNote, setNewNote] = useState("");
  const [newQuote, setNewQuote] = useState(PRESET_QUOTES[0]);

  // Comment input per post
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    onCreatePost({
      authorId: currentSession.userCode,
      authorName: currentSession.name,
      authorAvatar: currentSession.avatar,
      authorCode: currentSession.userCode,
      locationTag: newLocationTag,
      photoUrl: newPhotoUrl,
      note: newNote.trim(),
      quote: newQuote,
      streakCount: 15,
    });

    setNewNote("");
    setIsCreateModalOpen(false);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
  };

  const handleSendComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    onCommentPost(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div id="gharcall-social-feed" className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      {/* 1. TOP STREAK HIGHLIGHT BANNER */}
      <div className="bg-[#FFFFFF] border-b border-slate-100 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200">
              <Flame className="w-7 h-7 stroke-[2.2] animate-bounce text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-[#0F172A]">Family Daily Streaks</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  🔥 14-Day Global Streak
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Share daily location check-ins, moments & memories with your inner circle.
              </p>
            </div>
          </div>

          {/* New Streak Post Button */}
          <button
            id="share-streak-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold shadow-md shadow-[#0F5132]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Share Daily Streak</span>
          </button>
        </div>

        {/* Member Streak Rings */}
        <div className="flex items-center gap-4 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {[
            { name: "Rahul (You)", streak: 14, avatar: currentSession.avatar },
            { name: "Sunita (Mom)", streak: 21, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
            { name: "Ramesh (Dad)", streak: 8, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
            { name: "Pooja (Sister)", streak: 19, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
            { name: "Ananya (Friend)", streak: 11, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
          ].map((m) => (
            <div key={m.name} className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative p-0.5 rounded-full ring-2 ring-amber-500 ring-offset-2">
                <img src={m.avatar} alt={m.name} className="w-11 h-11 rounded-full object-cover" />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black shadow-xs">
                  🔥{m.streak}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 max-w-[65px] truncate text-center">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SOCIAL FEED POSTS LIST */}
      <div className="max-w-2xl w-full mx-auto p-4 space-y-5">
        {posts.map((post) => {
          const isLiked = post.likes?.includes(currentSession.userCode);
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FFFFFF] rounded-3xl border border-slate-100 shadow-md overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0F172A]">{post.authorName}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                        {post.authorCode}
                      </span>
                    </div>
                    {post.locationTag && (
                      <div className="flex items-center gap-1 text-[11px] text-[#0F5132] font-semibold mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{post.locationTag}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>{post.streakCount || 14} Day Streak</span>
                </div>
              </div>

              {/* High-Res Photo */}
              <div className="relative aspect-4/3 sm:aspect-16/10 bg-slate-100 overflow-hidden">
                <img
                  src={post.photoUrl}
                  alt="Post Photo"
                  className="w-full h-full object-cover transition-transform hover:scale-102 duration-500"
                />
              </div>

              {/* Inspiring Quote Sticker */}
              {post.quote && (
                <div className="px-4 py-2.5 bg-[#0F5132]/5 border-y border-[#0F5132]/10 flex items-center gap-2 text-xs italic text-[#0F5132] font-medium">
                  <Quote className="w-4 h-4 shrink-0 text-[#0F5132]" />
                  <span>"{post.quote}"</span>
                </div>
              )}

              {/* Note Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-800 font-normal leading-relaxed">
                  {post.note}
                </p>

                {/* Interaction Action Row (Like, Comment, Reactions) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                        isLiked ? "text-rose-600 scale-105" : "text-slate-600 hover:text-rose-600"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{post.likes?.length || 0}</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveCommentPostId(
                          activeCommentPostId === post.id ? null : post.id
                        )
                      }
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F5132] transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(post.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Comments List */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2 text-xs">
                        <img
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          className="w-5 h-5 rounded-full object-cover mt-0.5"
                        />
                        <div className="flex-1 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-100">
                          <span className="font-bold text-[#0F172A] mr-1.5">
                            {comment.authorName}
                          </span>
                          <span className="text-slate-700">{comment.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Comment Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendComment(post.id);
                      }
                    }}
                    placeholder="Drop an emoji or warm comment..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                  <button
                    onClick={() => handleSendComment(post.id)}
                    className="p-2 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. POST CREATION MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    🔥
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">Share Daily Streak Post</h3>
                    <p className="text-xs text-slate-500 font-medium">Keep your family streak alive!</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Photo
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_IMAGES.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewPhotoUrl(imgUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        newPhotoUrl === imgUrl ? "border-[#0F5132] scale-105" : "border-transparent opacity-70"
                      }`}
                    >
                      <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Tag */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Location Tag
                </label>
                <select
                  value={newLocationTag}
                  onChange={(e) => setNewLocationTag(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] font-semibold text-slate-800"
                >
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      📍 {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Quote Sticker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Daily Quote Sticker
                </label>
                <select
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] italic text-slate-800"
                >
                  {PRESET_QUOTES.map((q) => (
                    <option key={q} value={q}>
                      "{q}"
                    </option>
                  ))}
                </select>
              </div>

              {/* Note Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Note & Memory
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="What's happening today? Sharing moments with family..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  disabled={!newNote.trim()}
                  className="flex-2 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs shadow-md shadow-[#0F5132]/25 cursor-pointer disabled:opacity-50"
                >
                  Publish Daily Streak Post
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
