import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  Zap, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  PhoneCall, 
  Heart,
  MapPin,
  Clock
} from "lucide-react";
import confetti from "canvas-confetti";

export interface UserProfileData {
  id: string;
  name: string;
  avatar: string;
  userCode: string;
  bio?: string;
  recentStatusNote?: string;
  relationship?: string;
  phone?: string;
  vibeMatch?: number;
  vibeHighlights?: string[];
  location?: string;
}

interface UserProfileSheetModalProps {
  user: UserProfileData | null;
  onClose: () => void;
  onStartDirectMessage: (user: UserProfileData) => void;
}

export const UserProfileSheetModal: React.FC<UserProfileSheetModalProps> = ({
  user,
  onClose,
  onStartDirectMessage,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!user) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleMessageClick = () => {
    onStartDirectMessage(user);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header & Avatar */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white ring-4 ring-[#0F5132]/30 shadow-md"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <h3 className="text-lg font-black text-slate-900">{user.name}</h3>
            {user.relationship && (
              <span className="text-xs font-semibold text-[#0F5132] mt-0.5">
                {user.relationship}
              </span>
            )}

            {/* Unique Personal Code */}
            <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
              <span className="text-xs font-mono font-bold text-[#0F5132]">
                {user.userCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="text-[#0F5132] hover:text-emerald-800 cursor-pointer"
                title="Copy personal code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bio & Status Note */}
          <div className="mt-5 space-y-3">
            {/* 24-hr Status Note */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                  Active Status Note
                </span>
                <p className="text-xs font-medium text-slate-800 mt-0.5">
                  "{user.recentStatusNote || "Active on Ghar social network ✨"}"
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Bio
              </span>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                {user.bio || "Family & friend connection • Enjoying daily moments & streaks on Ghar."}
              </p>
            </div>

            {/* Vibe Match Indicator */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-slate-800">Vibe Match</span>
              </div>
              <span className="text-xs font-black text-[#0F5132] bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                {user.vibeMatch || 94}% Compatibility
              </span>
            </div>

            {user.vibeHighlights && user.vibeHighlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.vibeHighlights.map((vh, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                  >
                    {vh}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={handleMessageClick}
              className="flex-1 py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct Message</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
