import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Unlock, X, Check, XCircle, ShieldAlert, Sparkles, Heart } from "lucide-react";
import { TimeCapsuleUnlockRequest } from "../types";

interface TimeCapsuleUnlockNotificationToastProps {
  requests: TimeCapsuleUnlockRequest[];
  onAccept: (request: TimeCapsuleUnlockRequest) => void;
  onReject?: (request: TimeCapsuleUnlockRequest) => void;
  onDecline?: (request: TimeCapsuleUnlockRequest) => void;
}

export const TimeCapsuleUnlockNotificationToast: React.FC<TimeCapsuleUnlockNotificationToastProps> = ({
  requests,
  onAccept,
  onReject,
  onDecline,
}) => {
  const [actingState, setActingState] = useState<Record<string, "accepted" | "rejected">>({});
  const rejectHandler = onReject || onDecline || (() => {});

  // Only show pending requests that haven't been acted on locally
  const pendingRequests = requests.filter(
    (r) => r.status === "pending" && !actingState[r.id]
  );

  if (pendingRequests.length === 0 && Object.keys(actingState).length === 0) return null;

  const handleAcceptClick = (req: TimeCapsuleUnlockRequest) => {
    setActingState((prev) => ({ ...prev, [req.id]: "accepted" }));
    onAccept(req);
    setTimeout(() => {
      setActingState((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
    }, 2200);
  };

  const handleRejectClick = (req: TimeCapsuleUnlockRequest) => {
    setActingState((prev) => ({ ...prev, [req.id]: "rejected" }));
    rejectHandler(req);
    setTimeout(() => {
      setActingState((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
    }, 2000);
  };

  return (
    <aside aria-label="Time capsule notifications" className="fixed bottom-20 right-4 z-50 max-w-sm w-full space-y-2.5 pointer-events-auto">
      <AnimatePresence>
        {requests
          .filter((r) => r.status === "pending" || actingState[r.id])
          .slice(0, 3)
          .map((req) => {
            const currentStatus = actingState[req.id];

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88, y: 16 }}
                className="p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white rounded-3xl border border-amber-400/40 shadow-2xl space-y-3 relative overflow-hidden"
              >
                {/* Subtle ambient amber pulse behind card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                {currentStatus === "accepted" ? (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-center space-y-1 animate-fadeIn">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-black text-xs">
                      <Unlock className="w-4 h-4" />
                      <span>Unlocked for {req.requesterName}!</span>
                    </div>
                    <p className="text-[11px] text-emerald-200/90">
                      The visual lock seal has been opened in real-time on {req.requesterName}'s feed.
                    </p>
                  </div>
                ) : currentStatus === "rejected" ? (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-center space-y-1 animate-fadeIn">
                    <div className="flex items-center justify-center gap-1.5 text-rose-400 font-black text-xs">
                      <XCircle className="w-4 h-4" />
                      <span>Request Rejected</span>
                    </div>
                    <p className="text-[11px] text-rose-200/90">
                      The capsule remains strictly sealed. Nothing has been opened.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header: Title & Close */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                          <Gift className="w-4 h-4 animate-bounce" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-amber-300 flex items-center gap-1">
                            <span>Capsule Unlock Request</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          </h4>
                          <span className="text-[10px] text-slate-300 font-medium line-clamp-1">
                            Memory: "{req.capsuleTitle}"
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRejectClick(req)}
                        className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                        title="Reject & Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Requester's Custom Message */}
                    <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={req.requesterAvatar}
                          alt={req.requesterName}
                          className="w-5 h-5 rounded-full object-cover border border-amber-300"
                        />
                        <span className="text-[11px] font-bold text-amber-200">
                          {req.requesterName} sent a request:
                        </span>
                      </div>
                      <p className="text-xs text-white italic leading-relaxed pl-1">
                        "{req.message}"
                      </p>
                    </div>

                    {/* Action Buttons: [Reject] and [Accept] */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleRejectClick(req)}
                        className="flex-1 py-2 px-3 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/50 active:scale-95 text-rose-300 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAcceptClick(req)}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Accept</span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
      </AnimatePresence>
    </aside>
  );
};

