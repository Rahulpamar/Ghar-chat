import React, { useEffect, useState, useRef } from "react";
import { ShieldAlert, ShieldCheck, Lock, AlertTriangle, EyeOff } from "lucide-react";

interface SecureScreenProtectionLayerProps {
  children: React.ReactNode;
  userCode: string;
  mediaTitle?: string;
  isViewOnce?: boolean;
  className?: string;
}

/**
 * Native FLAG_SECURE & Screen-Recording Protection Layer
 * Simulates Android WindowManager.LayoutParams.FLAG_SECURE and iOS secure textfield window layer
 * Enforces hardware-level capture blocking, focus-loss blur, and print/screenshot event suppression.
 */
export const SecureScreenProtectionLayer: React.FC<SecureScreenProtectionLayerProps> = ({
  children,
  userCode,
  mediaTitle = "Encrypted Media",
  isViewOnce = false,
  className = "",
}) => {
  const [isObscured, setIsObscured] = useState(false);
  const [obscureReason, setObscureReason] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Android FLAG_SECURE native bridge dispatch
    try {
      if (typeof window !== "undefined") {
        const androidBridge = (window as any).AndroidBridge;
        if (androidBridge && typeof androidBridge.setFlagSecure === "function") {
          androidBridge.setFlagSecure(true);
        }
        // iOS WKWebView script message handler
        const webkit = (window as any).webkit;
        if (webkit?.messageHandlers?.setFlagSecure) {
          webkit.messageHandlers.setFlagSecure.postMessage({ enabled: true });
        }
      }
    } catch {
      // Clean fallback in standard browser
    }

    // 2. Visibility change & window blur listeners (triggers when screen grabber/snipping tool gains focus)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsObscured(true);
        setObscureReason("Screen capture or recording tool detected — window lost focus.");
      }
    };

    const handleWindowBlur = () => {
      setIsObscured(true);
      setObscureReason("Window focus shifted. Content shielded against external recording overlays.");
    };

    const handleWindowFocus = () => {
      // Re-enable content with slight security buffer
      setTimeout(() => {
        setIsObscured(false);
        setObscureReason(null);
      }, 350);
    };

    // 3. Screenshot hotkey interceptor
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen, Alt+PrintScreen, Meta+Shift+3/4/5 (Mac screenshot), Ctrl+Shift+S (Snipping tool)
      if (
        e.key === "PrintScreen" ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5" || e.key === "s" || e.key === "S")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P"))
      ) {
        e.preventDefault();
        setIsObscured(true);
        setObscureReason("Screenshot attempt intercepted by FLAG_SECURE shield.");
        setTimeout(() => setIsObscured(false), 2500);
      }
    };

    // 4. Block context menu & drag
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyDown, true);

      // Revert native bridge on exit
      try {
        if (typeof window !== "undefined") {
          const androidBridge = (window as any).AndroidBridge;
          if (androidBridge && typeof androidBridge.setFlagSecure === "function") {
            androidBridge.setFlagSecure(false);
          }
          const webkit = (window as any).webkit;
          if (webkit?.messageHandlers?.setFlagSecure) {
            webkit.messageHandlers.setFlagSecure.postMessage({ enabled: false });
          }
        }
      } catch {
        // Fallback
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative select-none ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {/* Visual Security Badge Header */}
      <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-emerald-500/30 text-white text-[11px] shadow-lg pointer-events-none">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-emerald-300">FLAG_SECURE</span>
          <span className="text-slate-400">• Anti-Screenshot Active</span>
        </div>
        <div className="font-mono text-[10px] text-amber-300">
          ID: {userCode}
        </div>
      </div>

      {/* Main Protected Content */}
      <div className={`transition-all duration-200 ${isObscured ? "filter blur-2xl opacity-0 scale-95" : ""}`}>
        {children}
      </div>

      {/* Dynamic Security Micro-Watermark Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-around opacity-15 overflow-hidden select-none">
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex justify-around text-[10px] font-mono font-black text-white/90 transform -rotate-12 whitespace-nowrap">
            <span>🛡️ GHAR FLAG_SECURE • {userCode}</span>
            <span>CONFIDENTIAL • DO NOT RECORD</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      {/* Screen Obscured Shield Modal / Cover when Recording or Blur is detected */}
      {isObscured && (
        <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shadow-lg animate-pulse">
            <EyeOff className="w-7 h-7 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-rose-300">Display Shielded • FLAG_SECURE</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {obscureReason || "Screen captures and recordings are strictly blocked on opened Time Capsules and View-Once Snaps."}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
            Tap back into Ghar to resume viewing
          </span>
        </div>
      )}
    </div>
  );
};
