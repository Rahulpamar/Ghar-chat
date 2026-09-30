import React from "react";
import { AlertTriangle, PhoneForwarded, PhoneCall, X, ArrowRight } from "lucide-react";

interface UrgentCallAlertModalProps {
  alert: {
    callId: string;
    callerName: string;
    callerNumber: string;
    timestamp: string;
    forwardedTo: string;
  } | null;
  onDismiss?: () => void;
  onOpenCallConsole?: () => void;
}

export const UrgentCallAlertModal: React.FC<UrgentCallAlertModalProps> = ({
  alert,
  onDismiss,
  onOpenCallConsole,
}) => {
  if (!alert) return null;

  const handleDismiss = () => {
    if (typeof onDismiss === "function") {
      onDismiss();
    }
  };

  const handleOpenCallConsole = () => {
    if (typeof onOpenCallConsole === "function") {
      onOpenCallConsole();
    }
    handleDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 bg-red-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border-2 border-red-500 shadow-2xl max-w-md w-full p-6 space-y-5 animate-bounce-short">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                Live Urgent Bridge Active
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-0.5">Emergency Phone Call!</h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2 text-xs text-red-900">
          <p className="leading-relaxed">
            The caller responded <strong>"Aunu" (Yes, Urgent)</strong> to GharCall's AI assistant. The call
            has been bridged live to the primary mobile number.
          </p>

          <div className="divide-y divide-red-200/60 pt-2 font-mono">
            <div className="py-1.5 flex justify-between">
              <span className="text-red-700 font-sans font-medium">Caller:</span>
              <span className="font-bold">{alert.callerName}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-red-700 font-sans font-medium">From Number:</span>
              <span>{alert.callerNumber}</span>
            </div>
            <div className="py-1.5 flex justify-between text-amber-900 font-bold">
              <span className="text-red-700 font-sans font-medium">Forwarded Live To:</span>
              <span>{alert.forwardedTo}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <button
            id="dismiss-urgent-modal-btn"
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-3 border border-stone-200 text-stone-700 hover:bg-stone-100 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Acknowledge
          </button>
          <button
            id="view-urgent-console-btn"
            onClick={handleOpenCallConsole}
            className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <span>Open Call Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
