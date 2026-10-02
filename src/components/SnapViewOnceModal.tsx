import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Flame, MapPin, EyeOff, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { SocialPost } from "../types";
import { SecureScreenProtectionLayer } from "./SecureScreenProtectionLayer";

interface SnapViewOnceModalProps {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSelfDestruct: (postId: string) => void;
}

export const SnapViewOnceModal: React.FC<SnapViewOnceModalProps> = ({
  post,
  isOpen,
  onClose,
  onSelfDestruct,
}) => {
  const duration = post?.viewDurationSeconds || 7;
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [progressPercent, setProgressPercent] = useState(100);
  const [isBurned, setIsBurned] = useState(false);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen || !post) return;

    setSecondsLeft(duration);
    setProgressPercent(100);
    setIsBurned(false);
    startTimeRef.current = Date.now();

    const interval = 50; // smooth update every 50ms
    const totalMs = duration * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingSecs = Math.ceil(remainingMs / 1000);
      const pct = (remainingMs / totalMs) * 100;

      setSecondsLeft(remainingSecs);
      setProgressPercent(pct);

      if (remainingMs <= 0) {
        clearInterval(timerRef.current);
        handleExpire();
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, post?.id]);

  const handleExpire = () => {
    setIsBurned(true);
    confetti({
      particleCount: 50,
      spread: 70,
      colors: ["#f59e0b", "#ef4444", "#dc2626", "#0F5132"],
    });

    setTimeout(() => {
      if (post) {
        onSelfDestruct(post.id);
      }
      onClose();
    }, 900);
  };

  const handleManualClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleExpire();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: isBurned ? 0.95 : 1, opacity: isBurned ? 0.2 : 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md h-[92vh] max-h-[760px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-amber-500/30"
      >
        {/* TOP COUNTDOWN PROGRESS BAR */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-4 space-y-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <motion.div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-75"
            />
          </div>

          <div className="flex items-center justify-between text-white text-xs font-semibold px-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                View-Once Disappearing Streak
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/30">
                ⏱️ {secondsLeft}s
              </span>
              <button
                onClick={handleManualClose}
                className="w-7 h-7 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* IMAGE DISPLAY WITH NATIVE FLAG_SECURE SCREEN RECORDING & CAPTURE PROTECTION */}
        <SecureScreenProtectionLayer
          userCode={post.authorCode || "GHAR-SNAP"}
          mediaTitle={`View-Once Streak from ${post.authorName}`}
          isViewOnce={true}
          className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden"
        >
          {post.photoUrl ? (
            <img
              src={post.photoUrl}
              alt="View once streak"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="p-8 text-center space-y-3">
              <Flame className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
              <p className="text-white text-lg font-bold">"{post.note}"</p>
            </div>
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
        </SecureScreenProtectionLayer>

        {/* BOTTOM METADATA BAR */}
        <div className="relative z-30 p-4 pb-6 space-y-2.5 bg-gradient-to-t from-black via-black/80 to-transparent text-white">
          <div className="flex items-center gap-3">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 ring-2 ring-black"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold tracking-tight text-white">{post.authorName}</h4>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.2 rounded-full font-semibold">
                  {post.authorCode}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{post.locationTag || "Hyderabad"}</span>
                <span>•</span>
                <span>🔥 {post.streakCount}d streak</span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-100 font-normal leading-relaxed">
            {post.note}
          </p>

          {post.quote && (
            <p className="text-xs italic text-amber-200/90 font-serif border-l-2 border-amber-400 pl-2 py-0.5">
              "{post.quote}"
            </p>
          )}

          <div className="pt-1 flex items-center justify-between text-[11px] text-amber-300 font-semibold border-t border-white/10">
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" />
              This photo permanently disappears when closed
            </span>
            <button
              onClick={handleManualClose}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        {/* SELF DESTRUCT BURN OVERLAY */}
        <AnimatePresence>
          {isBurned && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-gradient-to-t from-red-600/90 via-orange-600/80 to-amber-500/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white"
            >
              <Flame className="w-20 h-20 text-white animate-bounce drop-shadow-lg" />
              <h3 className="text-2xl font-black tracking-tight mt-2">Streak Burned!</h3>
              <p className="text-xs font-semibold text-white/90 mt-1">
                This media self-destructed and vanished permanently.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
