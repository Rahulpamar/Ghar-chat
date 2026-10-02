import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Flame, MapPin, ChevronLeft, ChevronRight, Volume2, VolumeX, RotateCcw, Share2, Quote } from "lucide-react";
import confetti from "canvas-confetti";
import { GharRewindMoment } from "../types";

interface GharRewindModalProps {
  isOpen: boolean;
  onClose: () => void;
  moments: GharRewindMoment[];
}

export const GharRewindModal: React.FC<GharRewindModalProps> = ({
  isOpen,
  onClose,
  moments,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 for active story
  const [isCompleted, setIsCompleted] = useState(false);

  const durationPerStory = 4500; // 4.5 seconds per moment
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen || moments.length === 0) return;

    setCurrentIndex(0);
    setProgress(0);
    setIsCompleted(false);

    // Play subtle ambient sound if not muted
    const audio = new Audio("https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3");
    audio.volume = 0.3;
    audioRef.current = audio;
    if (!isMuted) {
      audio.play().catch(() => {});
    }

    confetti({ particleCount: 60, spread: 80, origin: { y: 0.4 } });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioRef.current?.pause();
    };
  }, [isOpen]);

  // Story Timer
  useEffect(() => {
    if (!isOpen || isPaused || isCompleted || moments.length === 0) return;

    const interval = 50;
    const step = (interval / durationPerStory) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isPaused, isCompleted, moments.length]);

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 90 });
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleReplay = () => {
    setCurrentIndex(0);
    setProgress(0);
    setIsCompleted(false);
  };

  const toggleSound = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      if (!isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  if (!isOpen || moments.length === 0) return null;

  const currentMoment = moments[currentIndex];

  return (
    <div className="fixed inset-0 z-70 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-md h-[92vh] max-h-[760px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-emerald-500/30">
        
        {/* TOP SEGMENTED PROGRESS BARS (INSTAGRAM STYLE) */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-4 space-y-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
          <div className="flex items-center gap-1.5 w-full">
            {moments.map((m, idx) => (
              <div key={m.id} className="flex-1 bg-white/20 h-1 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < currentIndex
                        ? "100%"
                        : idx === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-white text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="ig-story-ring flex items-center justify-center">
                <img
                  src={currentMoment.authorAvatar}
                  alt={currentMoment.authorName}
                  className="w-7 h-7 rounded-full object-cover border border-white"
                />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs tracking-tight text-white">{currentMoment.authorName}</span>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
                    {currentMoment.authorCode}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 block">{currentMoment.timeOfDayLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black text-white/90 cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black text-white/90 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TAP NAVIGATION TOUCH ZONES (LEFT / RIGHT) */}
        {!isCompleted && (
          <div
            className="absolute inset-0 z-20 flex"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            />
            <div className="w-1/3 h-full" />
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            />
          </div>
        )}

        {/* MAIN VISUAL CONTENT */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!isCompleted ? (
              <motion.div
                key={currentMoment.id}
                initial={{ opacity: 0.4, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.2, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full relative flex items-center justify-center"
              >
                {currentMoment.photoUrl ? (
                  <img
                    src={currentMoment.photoUrl}
                    alt={currentMoment.note}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-8 text-center space-y-4">
                    <Sparkles className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
                    <p className="text-white text-xl font-bold font-serif">"{currentMoment.note}"</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
              </motion.div>
            ) : (
              /* REWIND SUMMARY SCREEN */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 text-center text-white space-y-5 max-w-sm"
              >
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0F5132] to-emerald-400 text-white flex items-center justify-center mx-auto shadow-lg">
                  <Sparkles className="w-8 h-8 text-amber-300 animate-spin" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Ghar Daily Rewind</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    You've caught up with all {moments.length} shared moments across Family & Connectors today!
                  </p>
                </div>

                <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">Daily Streak Maintained</span>
                    <span className="text-[10px] text-amber-300 font-mono font-semibold">14 Days Active • Check in tomorrow</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleReplay}
                    className="w-full py-2.5 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Watch Again</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM STORY METADATA */}
        {!isCompleted && (
          <div className="relative z-30 p-4 pb-6 space-y-2 bg-gradient-to-t from-black via-black/85 to-transparent text-white pointer-events-none">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{currentMoment.locationTag}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {currentMoment.streakCount}d
              </span>
            </div>

            <p className="text-sm font-medium leading-snug text-slate-100">
              {currentMoment.note}
            </p>

            {currentMoment.quote && (
              <p className="text-xs italic text-amber-200/90 font-serif border-l-2 border-emerald-400 pl-2">
                "{currentMoment.quote}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
