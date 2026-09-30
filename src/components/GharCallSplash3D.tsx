import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PhoneCall, ShieldCheck, Sparkles, Home, ArrowRight } from "lucide-react";

interface GharCallSplash3DProps {
  onDismiss?: () => void;
  onComplete?: () => void;
  autoDismissMs?: number;
}

export const GharCallSplash3D: React.FC<GharCallSplash3DProps> = ({
  onDismiss,
  onComplete,
  autoDismissMs = 2600,
}) => {
  const [hasStartedAudio, setHasStartedAudio] = useState(false);

  const handleDismiss = () => {
    if (typeof onDismiss === "function") {
      onDismiss();
    }
    if (typeof onComplete === "function") {
      onComplete();
    }
  };

  useEffect(() => {
    // Elegant soft chime on mount using Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.18); // E5 note
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.35); // G5 note
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
        setHasStartedAudio(true);
      }
    } catch {
      // Audio autoplay gracefully handled
    }

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [onDismiss, onComplete, autoDismissMs]);

  return (
    <motion.div
      id="gharcall-3d-splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFFFFF] px-6 select-none overflow-hidden"
      style={{ perspective: 1200 }}
    >
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(15,81,50,0.06)_0%,rgba(255,255,255,1)_70%)]" />

      {/* 3D Motion Pop-Up Emblem Container */}
      <motion.div
        className="relative flex flex-col items-center justify-center"
        initial={{ scale: 0.2, rotateX: 60, rotateZ: -15, y: 100, opacity: 0 }}
        animate={{
          scale: [0.2, 1.15, 1],
          rotateX: [60, -10, 0],
          rotateZ: [-15, 4, 0],
          y: [100, -10, 0],
          opacity: 1,
        }}
        transition={{
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Animated Radial Pulse Rings */}
        <motion.div
          animate={{
            scale: [1, 1.45, 1.8],
            opacity: [0.4, 0.15, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.4,
            ease: "easeOut",
          }}
          className="absolute -inset-8 rounded-full border border-[#0F5132]/30"
        />

        <motion.div
          animate={{
            scale: [1, 1.25, 1.5],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.4,
            delay: 0.4,
            ease: "easeOut",
          }}
          className="absolute -inset-4 rounded-full border-2 border-[#0F5132]/25"
        />

        {/* 3D Glowing Card Emblem */}
        <motion.div
          whileHover={{ scale: 1.05, rotateY: 15 }}
          className="relative w-32 h-32 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br from-[#0F5132] via-[#146c43] to-[#0A3622] p-1 shadow-[0_20px_50px_rgba(15,81,50,0.35),0_0_0_1px_rgba(15,81,50,0.2)] flex items-center justify-center"
          style={{
            transform: "translateZ(50px)",
            boxShadow: "0 25px 50px -12px rgba(15, 81, 50, 0.38), 0 0 0 1px rgba(15, 81, 50, 0.15)",
          }}
        >
          {/* Internal Glass Highlight */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />

          {/* Central Logo Icons (Phone + Home Synergy) */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
              className="relative z-10"
            >
              <PhoneCall className="w-14 h-14 md:w-16 md:h-16 text-white drop-shadow-md stroke-[2.2]" />
            </motion.div>
            
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 15 }}
              className="absolute -bottom-1 -right-1 bg-white text-[#0F5132] p-1.5 rounded-xl shadow-lg border border-[#0F5132]/20"
            >
              <Home className="w-5 h-5 stroke-[2.5]" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Typography with Pristine Contrast */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="mt-8 text-center flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F5132]/10 text-[#0F5132] text-xs font-bold tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Social & Family Network</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0F172A]">
          Ghar<span className="text-[#0F5132]">.</span>
        </h1>
        <p className="mt-2 text-xs md:text-sm text-slate-600 max-w-xs font-medium">
          Family Room • Connectors Hub • Daily Streaks • Time Capsules • SOS Panic
        </p>

        {/* E2EE Security Badge */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
          <span>Cloud Firestore Live Real-Time Synchronization</span>
        </div>
      </motion.div>

      {/* Skip / Enter Button for fast access */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="mt-10"
      >
        <button
          id="splash-skip-btn"
          onClick={handleDismiss}
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0F5132] hover:bg-[#0c4128] text-white text-sm font-semibold shadow-md shadow-[#0F5132]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>Enter GharCall</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </motion.div>
  );
};
