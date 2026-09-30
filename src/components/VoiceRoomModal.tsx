import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Radio, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  Zap, 
  AudioWaveform as Waveform 
} from "lucide-react";
import { UserAuthSession } from "../types";

export interface VoiceParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isSpeaking: boolean;
  role: string;
}

interface VoiceRoomModalProps {
  isOpen: boolean;
  roomType: "family" | "connectors";
  currentSession: UserAuthSession;
  onClose: () => void;
}

const DEFAULT_FAMILY_PARTICIPANTS: VoiceParticipant[] = [
  {
    id: "p-1",
    name: "Sunita Sharma (Mom)",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    isMuted: false,
    isSpeaking: true,
    role: "Family Host",
  },
  {
    id: "p-2",
    name: "Ramesh Sharma (Dad)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isMuted: true,
    isSpeaking: false,
    role: "Member",
  },
  {
    id: "p-3",
    name: "Kavya Sharma (Sister)",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    isMuted: false,
    isSpeaking: false,
    role: "Member",
  },
];

const DEFAULT_CONNECTOR_PARTICIPANTS: VoiceParticipant[] = [
  {
    id: "c-1",
    name: "Ananya Rao",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isMuted: false,
    isSpeaking: true,
    role: "Connector",
  },
  {
    id: "c-2",
    name: "Karthik Reddy",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    isMuted: false,
    isSpeaking: false,
    role: "Connector",
  },
  {
    id: "c-3",
    name: "Pooja Hegde",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    isMuted: true,
    isSpeaking: false,
    role: "Connector",
  },
];

export const VoiceRoomModal: React.FC<VoiceRoomModalProps> = ({
  isOpen,
  roomType,
  currentSession,
  onClose,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [myAudioLevel, setMyAudioLevel] = useState(30);

  // Initialize participants on open
  useEffect(() => {
    if (isOpen) {
      const base = roomType === "family" ? DEFAULT_FAMILY_PARTICIPANTS : DEFAULT_CONNECTOR_PARTICIPANTS;
      const me: VoiceParticipant = {
        id: currentSession.userCode,
        name: `${currentSession.name} (You)`,
        avatar: currentSession.avatar,
        isMuted: false,
        isSpeaking: !isMuted,
        role: "You",
      };
      setParticipants([me, ...base]);
      setCallDuration(0);

      // Play soft connection chime
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.45);
        }
      } catch {
        // audio policy
      }
    }
  }, [isOpen, roomType]);

  // Call timer and simulated speaker activity
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCallDuration((d) => d + 1);

      // Randomly cycle talking participant
      setParticipants((prev) =>
        prev.map((p, idx) => {
          if (p.id === currentSession.userCode) {
            return { ...p, isMuted, isSpeaking: !isMuted && Math.random() > 0.4 };
          }
          if (p.isMuted) return { ...p, isSpeaking: false };
          return { ...p, isSpeaking: Math.random() > 0.65 };
        })
      );

      // Simulate audio level visualizer
      setMyAudioLevel(!isMuted ? Math.floor(20 + Math.random() * 65) : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isMuted]);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  const roomTitle = roomType === "family" ? "Go Fam Call 🎙️" : "Go Connectors Call 🎧";
  const roomSubtitle =
    roomType === "family"
      ? "Real-time in-app Family Audio Lounge • WebRTC Voice Sync"
      : "Real-time in-app Connectors Audio Lounge • Multi-talk Voice Room";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]"
        >
          {/* Top Bar */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-emerald-50 text-[#0F5132]">
                  <Radio className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{roomTitle}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                      {formatDuration(callDuration)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{roomSubtitle}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Call Active Participants Grid */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                    participant.isSpeaking
                      ? "bg-emerald-50/70 border-emerald-400 shadow-sm ring-2 ring-emerald-500/30"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  {/* Speaking Indicator Badge */}
                  {participant.isSpeaking && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Talking
                    </span>
                  )}

                  {/* Avatar with Pulsing Waves */}
                  <div className="relative my-2">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className={`w-16 h-16 rounded-full object-cover border-2 ${
                        participant.isSpeaking
                          ? "border-emerald-500 ring-4 ring-emerald-300"
                          : "border-white"
                      }`}
                    />
                    {participant.isMuted && (
                      <span className="absolute bottom-0 right-0 p-1 rounded-full bg-rose-500 text-white shadow-xs">
                        <MicOff className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {participant.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {participant.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audio Waveform Bar */}
          <div className="my-4 py-2 px-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold">Audio Sync Active</span>
            </div>

            <div className="flex items-center gap-1">
              {[18, 35, 60, 45, 80, 50, 25, 65, 40].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: !isMuted ? [8, h * 0.35, 8] : 6 }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.08 }}
                  className="w-1 bg-emerald-400 rounded-full"
                />
              ))}
            </div>

            <span className="text-xs font-mono text-emerald-300">
              {isMuted ? "Muted" : `${myAudioLevel} dB`}
            </span>
          </div>

          {/* Bottom Call Controls Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {/* Mic Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full flex items-center justify-center transition cursor-pointer shadow-sm ${
                isMuted
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full flex items-center justify-center transition cursor-pointer shadow-sm ${
                isSpeakerOn
                  ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
              title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Leave Call (Red Button) */}
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Call</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
