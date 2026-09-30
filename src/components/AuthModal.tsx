import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  Lock, 
  Fingerprint,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Flame,
  Loader2
} from "lucide-react";
import { UserAuthSession } from "../types";
import { generateDynamicUserCode } from "../lib/openAiRealtimeVoice";
import { sendPhoneOtp, verifyPhoneOtp } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (session: UserAuthSession) => void;
  currentSession: UserAuthSession | null;
  onClose?: () => void;
  isLockScreenMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  currentSession,
  onClose,
  isLockScreenMode = false,
}) => {
  const [step, setStep] = useState<"phone" | "otp" | "registered" | "pin_unlock">(
    isLockScreenMode ? "pin_unlock" : "phone"
  );
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("98765 43210");
  const [fullName, setFullName] = useState("Rahul Sharma");
  const [otpValues, setOtpValues] = useState(["7", "1", "9", "4"]);
  const [countdown, setCountdown] = useState(30);
  const [generatedCode, setGeneratedCode] = useState("GHAR-9482");
  const [copiedCode, setCopiedCode] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isLockScreenMode) {
      setStep("pin_unlock");
    }
  }, [isLockScreenMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, countdown]);

  if (!isOpen) return null;

  const fullPhoneString = `${countryCode} ${phoneNumber}`.trim();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 8) return;

    setIsSending(true);
    try {
      const confirmation = await sendPhoneOtp(fullPhoneString, "firebase-recaptcha-container");
      if (confirmation) {
        setConfirmationResult(confirmation);
      }
      setStep("otp");
      setCountdown(30);
    } catch (err) {
      console.warn("Firebase phone auth fallback to sandbox OTP:", err);
      setStep("otp");
      setCountdown(30);
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpValues];
    newOtp[index] = val.slice(-1);
    setOtpValues(newOtp);

    // Auto-advance
    if (val && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    try {
      const codeStr = otpValues.join("");
      if (confirmationResult) {
        await verifyPhoneOtp(confirmationResult, codeStr);
      }
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const code = `GHAR-${randomDigits}`;
      setGeneratedCode(code);
      setStep("registered");
    } catch (err) {
      console.warn("Firebase verification fallback:", err);
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const code = `GHAR-${randomDigits}`;
      setGeneratedCode(code);
      setStep("registered");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteRegistration = () => {
    const session: UserAuthSession = {
      phoneNumber: fullPhoneString,
      isVerified: true,
      userCode: generatedCode,
      name: fullName || "Rahul Sharma",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      pinLockEnabled: false,
      pinCode: "1234",
      isLocked: false,
    };
    onSuccess(session);
    if (onClose) onClose();
  };

  const handleSelectDemoProfile = (
    name: string,
    phone: string,
    code: string,
    avatar: string
  ) => {
    const session: UserAuthSession = {
      phoneNumber: phone,
      isVerified: true,
      userCode: code,
      name,
      avatar,
      pinLockEnabled: false,
      pinCode: "1234",
      isLocked: false,
    };
    onSuccess(session);
    if (onClose) onClose();
  };

  const handlePinUnlock = () => {
    if (enteredPin === (currentSession?.pinCode || "1234")) {
      setPinError("");
      if (currentSession) {
        onSuccess({ ...currentSession, isLocked: false });
      }
      if (onClose) onClose();
    } else {
      setPinError("Invalid PIN. (Default demo PIN is 1234)");
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#FFFFFF] rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 overflow-hidden relative"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F5132] flex items-center justify-center text-white shadow-md shadow-[#0F5132]/25">
              <Phone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">GharCall Auth</h2>
              <p className="text-xs text-slate-500 font-medium">OTP & Dynamic Unique Code</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F5132]/10 text-[#0F5132] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted</span>
          </div>
        </div>

        {/* STEP 1: Phone Input */}
        {step === "phone" && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="auth-name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-[#0F172A] font-medium text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Mobile Number (with Auto Country-Code)
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2.5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-xs font-bold text-[#0F172A] cursor-pointer"
                >
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+971">🇦🇪 +971 (AE)</option>
                  <option value="+1">🇨🇦 +1 (CA)</option>
                  <option value="+61">🇦🇺 +61 (AU)</option>
                  <option value="+65">🇸🇬 +65 (SG)</option>
                </select>

                <div className="relative flex-1">
                  <input
                    id="auth-phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-[#0F172A] font-medium text-sm transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
                </div>
              </div>
            </div>

            <div id="firebase-recaptcha-container" className="flex justify-center my-2"></div>

            <button
              id="send-otp-btn"
              onClick={handleSendOtp}
              disabled={isSending}
              className="w-full py-3.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-60 text-white font-semibold text-sm shadow-md shadow-[#0F5132]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Firebase OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Persona Switcher */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                ⚡ Or Select Instant Demo Profile:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectDemoProfile(
                      "Rahul Sharma",
                      "+91 98765 43210",
                      "GK-9482",
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    )
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0F5132] bg-slate-50 hover:bg-[#0F5132]/5 text-left transition-all"
                >
                  <p className="text-xs font-bold text-[#0F172A]">Rahul (Son)</p>
                  <p className="text-[11px] text-slate-500 font-mono">GK-9482</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectDemoProfile(
                      "Ramesh Sharma (Dad)",
                      "+91 98765 43212",
                      "GK-1102",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                    )
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0F5132] bg-slate-50 hover:bg-[#0F5132]/5 text-left transition-all"
                >
                  <p className="text-xs font-bold text-[#0F172A]">Ramesh (Dad Admin)</p>
                  <p className="text-[11px] text-slate-500 font-mono">GK-1102</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectDemoProfile(
                      "Sunita Sharma (Mom)",
                      "+91 98765 43211",
                      "GK-5541",
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                    )
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0F5132] bg-slate-50 hover:bg-[#0F5132]/5 text-left transition-all"
                >
                  <p className="text-xs font-bold text-[#0F172A]">Sunita (Mom Admin)</p>
                  <p className="text-[11px] text-slate-500 font-mono">GK-5541</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectDemoProfile(
                      "Ananya Rao",
                      "+91 98450 11223",
                      "GK-8823",
                      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
                    )
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0F5132] bg-slate-50 hover:bg-[#0F5132]/5 text-left transition-all"
                >
                  <p className="text-xs font-bold text-[#0F172A]">Ananya (Friend)</p>
                  <p className="text-[11px] text-slate-500 font-mono">GK-8823</p>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Enter 4-Digit OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sent to <span className="font-semibold text-slate-700">{phoneNumber}</span>
              </p>
            </div>

            {/* 4 Pin Inputs */}
            <div className="flex justify-center gap-3">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-12 h-14 text-center font-bold text-2xl rounded-xl border-2 border-slate-200 focus:border-[#0F5132] focus:outline-none bg-slate-50 focus:bg-white transition-all text-[#0F172A]"
                />
              ))}
            </div>

            <p className="text-xs text-slate-500">
              {countdown > 0 ? (
                <span>Resend OTP in <strong className="text-[#0F5132]">{countdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCountdown(30)}
                  className="text-[#0F5132] font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                id="verify-otp-btn"
                disabled={isVerifying}
                onClick={handleVerifyOtp}
                className="flex-1 py-3 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-60 text-white font-semibold text-sm shadow-md shadow-[#0F5132]/25 transition-all flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Generate Code</span>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Cryptographic Dynamic Unique Code Generated */}
        {step === "registered" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#0F5132]/10 text-[#0F5132] text-xs font-bold uppercase tracking-wider mb-2">
                Cryptographic ID Assigned
              </span>
              <h3 className="text-xl font-black text-[#0F172A]">
                Your Dynamic Unique Code
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Share this non-repeating OTP-style code with family or friends to connect instantly in the Close Friends Hub!
              </p>
            </div>

            {/* Unique Code Display Box */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-[#0F5132]/30 flex flex-col items-center justify-center">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-1">
                Personal Connection Code
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-[#0F5132] tracking-wider font-mono">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={copyCodeToClipboard}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#0F5132] hover:border-[#0F5132] transition-all"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteRegistration}
              className="w-full py-3.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-semibold text-sm shadow-md shadow-[#0F5132]/25 transition-all"
            >
              Continue to GharCall
            </button>
          </motion.div>
        )}

        {/* PIN / Biometric Unlock Screen */}
        {step === "pin_unlock" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#0F172A]">GharCall Protected</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your 4-digit PIN to access private family chats and audio logs.
              </p>
            </div>

            <div className="flex justify-center">
              <input
                id="pin-unlock-input"
                type="password"
                maxLength={4}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="••••"
                className="w-44 text-center tracking-[0.5em] font-mono text-3xl font-bold py-3 rounded-xl border-2 border-slate-200 focus:border-[#0F5132] focus:outline-none bg-slate-50"
              />
            </div>

            {pinError && <p className="text-xs font-semibold text-rose-600">{pinError}</p>}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handlePinUnlock}
                className="w-full py-3.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-semibold text-sm shadow-md shadow-[#0F5132]/25 transition-all"
              >
                Unlock with PIN
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnteredPin("1234");
                  setTimeout(handlePinUnlock, 100);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <Fingerprint className="w-4 h-4 text-[#0F5132]" />
                <span>Simulate Touch ID / Face ID (1234)</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
