import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  Battery, 
  PhoneCall, 
  CheckCircle, 
  X, 
  ExternalLink, 
  Radio, 
  Volume2, 
  AlertCircle 
} from "lucide-react";
import { EmergencySosEvent, UserAuthSession } from "../types";

interface EmergencySosPanicHubProps {
  activeSos: EmergencySosEvent | null;
  currentSession: UserAuthSession;
  onTriggerSos: (payload: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    senderPhone: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    batteryLevel?: number;
  }) => Promise<void>;
  onResolveSos: (alertId: string) => Promise<void>;
}

export const EmergencySosPanicHub: React.FC<EmergencySosPanicHubProps> = ({
  activeSos,
  currentSession,
  onTriggerSos,
  onResolveSos,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Play subtle warning audio tone when active SOS is present
  useEffect(() => {
    if (activeSos && activeSos.status === "active") {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        }
      } catch {
        // Audio policy handled gracefully
      }
    }
  }, [activeSos?.id]);

  // Countdown for panic abort
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConfirmOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (isConfirmOpen && countdown === 0) {
      executeBroadcast();
    }
    return () => clearTimeout(timer);
  }, [isConfirmOpen, countdown]);

  const handleStartPanic = () => {
    setCountdown(3);
    setIsConfirmOpen(true);
  };

  const handleCancelPanic = () => {
    setIsConfirmOpen(false);
    setCountdown(3);
  };

  const executeBroadcast = async () => {
    setIsConfirmOpen(false);
    setIsBroadcasting(true);

    let lat = 17.3850;
    let lng = 78.4867;
    let address = "Road No. 12, Banjara Hills, Hyderabad";
    let batteryLevel = 84;

    // Get live geolocation if permitted
    try {
      if ("geolocation" in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        address = `Live GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Hyderabad)`;
      }
    } catch (e) {
      console.warn("Geolocation fetch fallback:", e);
    }

    // Get battery level if supported
    try {
      if ("getBattery" in navigator) {
        const battery: any = await (navigator as any).getBattery();
        batteryLevel = Math.round((battery.level || 0.84) * 100);
      }
    } catch {
      // Battery fallback
    }

    try {
      await onTriggerSos({
        senderId: currentSession.userCode,
        senderName: currentSession.name,
        senderAvatar: currentSession.avatar,
        senderPhone: currentSession.phoneNumber,
        latitude: lat,
        longitude: lng,
        address,
        batteryLevel,
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <>
      {/* 1. TOP PULSING SOS EMERGENCY ALERT BANNER (Active across family network) */}
      <AnimatePresence>
        {activeSos && activeSos.status === "active" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full bg-rose-600 text-white p-3.5 sm:p-4 rounded-3xl shadow-xl border-2 border-rose-400 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-rose-600 flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-200 text-[10px] font-black uppercase tracking-wider">
                    🚨 Live Family SOS Alert
                  </span>
                  <span className="text-xs font-mono font-bold">
                    {new Date(activeSos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-sm font-black mt-0.5">
                  {activeSos.senderName} pressed Emergency SOS Panic Button!
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-rose-100 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeSos.address}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Battery className="w-3.5 h-3.5" />
                    <span>{activeSos.batteryLevel}% Battery</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-rose-500">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeSos.latitude},${activeSos.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open GPS Route</span>
              </a>

              <a
                href={`tel:${activeSos.senderPhone}`}
                className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-950 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>

              <button
                onClick={() => onResolveSos(activeSos.id)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>I Am Safe / Dismiss</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING EMERGENCY SOS PANIC BUTTON (Bottom Right) */}
      <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleStartPanic}
          title="Emergency SOS Panic Drop - Broadcast live location to Family Room"
          className="relative group p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-2xl border-2 border-white ring-4 ring-rose-500/30 flex items-center gap-2 cursor-pointer transition"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
          <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-black uppercase tracking-wider pr-1 hidden sm:inline">
            SOS Panic
          </span>
        </motion.button>
      </div>

      {/* 3. CONFIRMATION COUNTDOWN MODAL (3-Second Abort Safeguard) */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border-2 border-rose-500 shadow-2xl relative"
            >
              <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border-2 border-rose-400 animate-pulse">
                <span className="text-3xl font-black font-mono">{countdown}</span>
              </div>

              <h3 className="text-lg font-black text-slate-900">
                Broadcasting Emergency SOS
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                In <strong>{countdown} seconds</strong>, your live GPS coordinates, battery status, and urgent alarm will be sent to the entire <strong>Family Room network</strong>.
              </p>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={executeBroadcast}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
                >
                  Send Immediately 🚨
                </button>

                <button
                  type="button"
                  onClick={handleCancelPanic}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel / False Alarm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
