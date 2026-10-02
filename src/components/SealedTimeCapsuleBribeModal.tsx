import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Unlock, 
  X, 
  Sparkles, 
  Send, 
  Gift, 
  Heart, 
  Coffee, 
  PartyPopper,
  ShieldCheck,
  Flame,
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";
import { TimeCapsule, UserAuthSession, TimeCapsuleUnlockRequest } from "../types";

interface SealedTimeCapsuleBribeModalProps {
  isOpen: boolean;
  capsule: TimeCapsule | null;
  currentSession: UserAuthSession;
  onClose: () => void;
  onSubmitBribe: (capsuleId: string, message: string) => Promise<void>;
}

const BRIBE_PRESETS = [
  "Tell me the password and I'll treat you to Dairy Milk! 🍫",
  "Unlock it now and I'll buy you Uppal special Chai & Osmania biscuits ☕",
  "Reveal this memory and I'll do all house chores tomorrow! 🧹",
  "Treat you to Hyderabad Dum Biryani this Sunday if you unlock! 🍲",
  "Pleeease! I promise not to tell anyone else in the group! 🤫",
];

export const SealedTimeCapsuleBribeModal: React.FC<SealedTimeCapsuleBribeModalProps> = ({
  isOpen,
  capsule,
  currentSession,
  onClose,
  onSubmitBribe,
}) => {
  const [bribeText, setBribeText] = useState(BRIBE_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !capsule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bribeText.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitBribe(capsule.id, bribeText.trim());
      setIsSent(true);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        setIsSent(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Failed to submit bribe:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-md w-full p-6 border border-amber-200 shadow-2xl relative overflow-hidden space-y-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Visual Lock Seal Icon */}
        <div className="text-center space-y-2 pt-1">
          <div className="relative inline-block">
            {/* Glowing ripple aura */}
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-md opacity-40 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white mx-auto">
              <Lock className="w-8 h-8 stroke-[2.5] text-amber-950" />
            </div>
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
              {capsule.occasionTag} • Sealed Memory
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">{capsule.title}</h3>
            <p className="text-xs text-slate-500">
              Sealed by <strong className="text-slate-700">{capsule.authorName}</strong> until{" "}
              {new Date(capsule.unlockDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Blurred Teaser Preview with Prominent Lock Seal */}
        {capsule.photoUrl && (
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-amber-200/80 shadow-inner group">
            <img
              src={capsule.photoUrl}
              alt="Sealed capsule"
              className="w-full h-full object-cover filter blur-xl scale-110 opacity-50 select-none pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center p-4 text-center text-white">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/30 border border-amber-400/50 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md mb-2">
                <Lock className="w-6 h-6 animate-bounce" />
              </div>
              <h4 className="text-xs font-black text-amber-200 uppercase tracking-wider">Visual Lock Seal Active</h4>
              <p className="text-[11px] text-slate-300 max-w-xs mt-0.5">
                Send a fun bribe or request below to convince {capsule.authorName} to unlock this early for you!
              </p>
            </div>
          </div>
        )}

        {isSent ? (
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl text-center space-y-2 animate-fadeIn shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-black text-emerald-950">Request Sent to {capsule.authorName}!</h4>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-xs mx-auto">
              A real-time notification with <strong className="font-black text-emerald-900">[Accept]</strong> and <strong className="font-black text-emerald-900">[Reject]</strong> buttons has been delivered to <strong>{capsule.authorName}</strong>. If accepted, this capsule will unlock instantly for you in real-time!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>Choose or Type a Fun Request:</span>
                </label>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  To: {capsule.authorName}
                </span>
              </div>

              {/* Quick Preset Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-32 overflow-y-auto pr-0.5">
                {BRIBE_PRESETS.map((preset) => {
                  const isSelected = bribeText === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBribeText(preset)}
                      className={`text-[11px] px-3 py-1.5 rounded-xl text-left transition border cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs ring-2 ring-amber-400/40"
                          : "bg-slate-50 hover:bg-amber-50/70 border-slate-200 text-slate-700 font-medium"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Custom Request Input Box */}
              <textarea
                value={bribeText}
                onChange={(e) => setBribeText(e.target.value)}
                rows={2}
                placeholder="Type your custom request or bribe message to the owner..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 leading-relaxed font-medium shadow-2xs"
                required
              />
            </div>

            {/* Prominent Send Request Action Button directly below the request options/input box */}
            <div className="space-y-2 pt-0.5">
              <button
                type="submit"
                disabled={isSubmitting || !bribeText.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 active:scale-[0.99] text-white text-sm font-black shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Sending Request..." : "Send Request"}</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Triggers real-time notification to {capsule.authorName}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
