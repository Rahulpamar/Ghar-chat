import React, { useState, useEffect, useRef } from "react";
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneOff, 
  PhoneForwarded, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Radio, 
  ArrowRight, 
  Copy, 
  Check, 
  Flame,
  Clock,
  ShieldAlert,
  Bot,
  UserCheck
} from "lucide-react";
import { AppSettings, CallSession, TranscriptEntry, Contact } from "../types";
import { speakText, stopSpeaking, playAlertSound } from "../lib/speechSynthesis";
import { startAudioRecording, AudioRecorderController } from "../lib/audioRecorder";
import { FrequencyWaveform } from "./FrequencyWaveform";
import { LiveWaveformVisualizer } from "./LiveWaveformVisualizer";

interface TelephonySimulatorProps {
  settings: AppSettings;
  activeCall: CallSession | null;
  onCallUpdate: (call: CallSession) => void;
  onEndCall: (callId: string, durationSeconds: number, audioUrl?: string) => void;
  onRefreshState: () => void;
  initialContact?: Contact | null;
}

export const TelephonySimulator: React.FC<TelephonySimulatorProps> = ({
  settings,
  activeCall,
  onCallUpdate,
  onEndCall,
  onRefreshState,
  initialContact,
}) => {
  const [selectedCaller, setSelectedCaller] = useState({
    name: "Kiran Uncle",
    number: "+91 94401 23456",
    relation: "Family Relative",
  });
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "forwarded">("idle");
  const [callerSpeechInput, setCallerSpeechInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [callMode, setCallMode] = useState<"inbound" | "outbound">("inbound");
  const [outboundScriptText, setOutboundScriptText] = useState(
    "Namaste! Routine family check-in from the Sharma household GharCall AI. Everything alright at your end?"
  );
  const [isTriggeringRetell, setIsTriggeringRetell] = useState(false);
  const [retellCallData, setRetellCallData] = useState<any>(null);

  const durationTimerRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorderController | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-fill and switch to outbound when an initial contact is selected from directory
  useEffect(() => {
    if (initialContact) {
      setCallMode("outbound");
      setCustomName(initialContact.name);
      setCustomNumber(initialContact.phone);
      setOutboundScriptText(
        `Namaskaram ${initialContact.name}! Calling on behalf of ${settings.primaryHostName} Sharma family. Quick check-in for ${initialContact.relationship}. Everything going well?`
      );
    }
  }, [initialContact, settings.primaryHostName]);

  // Sync with global activeCall if one exists
  useEffect(() => {
    if (activeCall) {
      if (activeCall.status === "ringing") {
        setCallStatus("ringing");
        setIsCalling(true);
      } else if (activeCall.status === "urgent-forwarded") {
        setCallStatus("forwarded");
        setIsCalling(true);
      } else if (activeCall.status === "in-progress") {
        setCallStatus("connected");
        setIsCalling(true);
      }
    } else {
      if (callStatus !== "idle") {
        setCallStatus("idle");
        setIsCalling(false);
        setCallDuration(0);
      }
    }
  }, [activeCall]);

  // Duration ticker
  useEffect(() => {
    if (callStatus === "connected" || callStatus === "forwarded") {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callStatus]);

  // Webhook URL
  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/telephony/inbound`
    : "https://gharcall.app/api/telephony/inbound";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Start Inbound Call
  const handleStartInboundCall = async () => {
    const callerName = customName.trim() || selectedCaller.name;
    const callerNumber = customNumber.trim() || selectedCaller.number;

    setIsCalling(true);
    setCallStatus("ringing");
    setCallDuration(0);

    if (soundEnabled) playAlertSound("ring");

    try {
      // Notify server
      const res = await fetch("/api/telephony/simulate-inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerName, callerNumber }),
      });
      const data = await res.json();
      if (data.success && data.call) {
        onCallUpdate(data.call);

        // After a brief ring, AI picks up
        setTimeout(() => {
          setCallStatus("connected");
          if (soundEnabled) playAlertSound("connect");

          // AI speaks dynamic Telugu greeting:
          // "Hi [Caller Name], menu [User Name] ki assistant ni. Cheppandi, emaina urgent ga matalaala?"
          if (soundEnabled) {
            setIsAiSpeaking(true);
            speakText(data.greeting, () => {
              setIsAiSpeaking(false);
            });
          }
        }, 1800);
      }
    } catch (e) {
      console.error("Failed to start call:", e);
      setCallStatus("idle");
      setIsCalling(false);
    }
  };

  // Start Outbound Call via Retell AI Outbound Engine
  const handleStartOutboundCall = async () => {
    const targetName = customName.trim() || selectedCaller.name;
    const targetNumber = customNumber.trim() || selectedCaller.number;
    const script = outboundScriptText.trim() || `Namaste ${targetName} garu! Nenu ${settings.primaryHostName} family assistant ni. Routine family check-in kosam call chesam. Everything alright?`;

    setIsTriggeringRetell(true);
    setIsCalling(true);
    setCallStatus("ringing");
    setCallDuration(0);

    if (soundEnabled) playAlertSound("ring");

    try {
      // Trigger Outbound AI Call (Retell AI Integration with custom_message and caller_name)
      const res = await fetch("/api/telephony/outbound-ai-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPhoneNumber: targetNumber,
          contactName: targetName,
          aiScriptText: script,
        }),
      });
      const data = await res.json();
      setRetellCallData(data.retellResult?.data || null);

      setTimeout(() => {
        setIsTriggeringRetell(false);
        setCallStatus("connected");
        if (soundEnabled) playAlertSound("connect");

        if (data.callSession) {
          onCallUpdate(data.callSession);
        }

        if (soundEnabled) {
          setIsAiSpeaking(true);
          speakText(script, () => {
            setIsAiSpeaking(false);
          });
        }
      }, 1200);
    } catch (err) {
      console.error("Failed to start outbound AI call:", err);
      setIsTriggeringRetell(false);
      setCallStatus("idle");
      setIsCalling(false);
    }
  };

  // Submit Caller Speech (User types or clicks preset or speaks via microphone)
  const handleSendCallerSpeech = async (speechText: string) => {
    if (!speechText.trim() || !activeCall) return;
    setCallerSpeechInput("");

    try {
      const res = await fetch("/api/telephony/simulate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: activeCall.id,
          text: speechText,
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.isUrgent) {
          setCallStatus("forwarded");
          if (soundEnabled) {
            playAlertSound("urgent");
            setIsAiSpeaking(true);
            speakText(data.replyText, () => {
              setIsAiSpeaking(false);
            });
          }
        } else {
          if (soundEnabled && data.replyText) {
            setIsAiSpeaking(true);
            speakText(data.replyText, () => {
              setIsAiSpeaking(false);
            });
          }
        }
        onCallUpdate(data.call);
      }
    } catch (e) {
      console.error("Error sending speech:", e);
    }
  };

  // Toggle Live Microphone Speech Recognition
  const handleToggleMic = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Web Speech Recognition is not supported by your browser. You can type or use the quick response buttons below!");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "te-IN"; // Telugu or English

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCallerSpeechInput(transcript);
        handleSendCallerSpeech(transcript);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Mic speech error:", err);
      setIsListening(false);
    }
  };

  // Hang Up Call
  const handleHangup = async () => {
    stopSpeaking();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (activeCall) {
      await onEndCall(
        activeCall.id,
        callDuration,
        "https://cdn.freesound.org/previews/557/557174_11861866-lq.mp3"
      );
    }

    setCallStatus("idle");
    setIsCalling(false);
    setCallDuration(0);
    setIsAiSpeaking(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const presetCallers = [
    { name: "Kiran Uncle", number: "+91 94401 23456", relation: "Uncle" },
    { name: "Sunita (Mom)", number: "+91 98765 43211", relation: "Mother" },
    { name: "Dr. Rao (Clinic)", number: "+91 98480 11223", relation: "Doctor" },
    { name: "BlueDart Delivery", number: "+91 91234 56789", relation: "Delivery" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Virtual Number & Webhook Setup */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                GharCall Virtual Assistant Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
              {settings.virtualPhoneNumber}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
              Live Inbound/Outbound AI Pipeline • Forwards urgent calls to{" "}
              <span className="font-semibold text-amber-300">{settings.primaryForwardPhone}</span> ({settings.primaryHostName})
            </p>
          </div>

          {/* Twilio Voice Webhook URL Copy */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
            <div className="flex-1 min-w-0">
              <span className="text-stone-400 block text-[10px] uppercase font-mono">Twilio Voice Webhook</span>
              <span className="font-mono text-stone-200 truncate block max-w-xs">{webhookUrl}</span>
            </div>
            <button
              id="copy-webhook-url-btn"
              onClick={handleCopyWebhook}
              className="flex items-center space-x-1 bg-stone-700 hover:bg-stone-600 px-2.5 py-1.5 rounded-lg text-white font-medium transition"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulator & Call Session Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Call Controls & Dialing Pad (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-stone-900">Interactive Call Launcher</span>
              </div>
              <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg text-xs">
                <button
                  id="mode-inbound-btn"
                  onClick={() => setCallMode("inbound")}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    callMode === "inbound" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                  }`}
                >
                  Inbound
                </button>
                <button
                  id="mode-outbound-btn"
                  onClick={() => setCallMode("outbound")}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    callMode === "outbound" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                  }`}
                >
                  Outbound
                </button>
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between text-xs text-stone-600 mb-4 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <span className="flex items-center space-x-1.5">
                <Bot className="w-4 h-4 text-amber-600" />
                <span>AI Voice Synthesis (Telugu / English)</span>
              </span>
              <button
                id="toggle-speech-sound-btn"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sound ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                    <span>Muted</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Contact Selector */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-medium text-stone-500">Select Preset Caller:</label>
              <div className="grid grid-cols-2 gap-2">
                {presetCallers.map((c) => {
                  const isSelected = selectedCaller.name === c.name && !customName;
                  return (
                    <button
                      key={c.name}
                      id={`select-caller-${c.name.replace(/\s+/g, "-")}`}
                      disabled={isCalling}
                      onClick={() => {
                        setSelectedCaller(c);
                        setCustomName("");
                        setCustomNumber("");
                      }}
                      className={`p-2 rounded-xl text-left border transition text-xs ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-900 font-semibold"
                          : "border-stone-200 hover:bg-stone-50 text-stone-700"
                      }`}
                    >
                      <div className="truncate font-semibold">{c.name}</div>
                      <div className="text-[10px] text-stone-400">{c.relation}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Or Custom Caller / Target Phone */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-medium text-stone-500">
                {callMode === "inbound" ? "Or Custom Caller / Number:" : "Target Recipient Name & Phone:"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="custom-caller-name-input"
                  type="text"
                  placeholder={callMode === "inbound" ? "Caller Name" : "Recipient Name"}
                  disabled={isCalling}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <input
                  id="custom-caller-number-input"
                  type="text"
                  placeholder="Target Phone Number"
                  disabled={isCalling}
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Outbound AI Message & Retell Dynamic Variables */}
            {callMode === "outbound" && (
              <div className="space-y-2 mb-4 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <Bot className="w-3.5 h-3.5 text-amber-700" />
                    <span>Retell AI Script (`custom_message`)</span>
                  </label>
                  <span className="text-[10px] font-mono bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                    Dynamic LLM Var
                  </span>
                </div>
                <textarea
                  id="outbound-script-textarea"
                  rows={2}
                  disabled={isCalling}
                  value={outboundScriptText}
                  onChange={(e) => setOutboundScriptText(e.target.value)}
                  placeholder="Enter the message or script text that Retell AI should deliver..."
                  className="w-full text-xs p-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setOutboundScriptText("Namaskaram Dad! Gentle reminder to take your afternoon BP medication and drink lukewarm water.")}
                    className="text-[10px] px-2 py-1 rounded bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 transition"
                  >
                    💊 Medicine Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutboundScriptText("Hi! Sunita Mom prepared special Dum Biryani for dinner tonight, please reach home by 8 PM.")}
                    className="text-[10px] px-2 py-1 rounded bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 transition"
                  >
                    🍲 Biryani Dinner
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutboundScriptText("Quick family check-in: Let us know if you need milk, curd, or fresh groceries on the way home.")}
                    className="text-[10px] px-2 py-1 rounded bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 transition"
                  >
                    🛒 Grocery Check
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isCalling ? (
              <button
                id="start-call-simulation-btn"
                disabled={isTriggeringRetell}
                onClick={callMode === "inbound" ? handleStartInboundCall : handleStartOutboundCall}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition"
              >
                {callMode === "inbound" ? (
                  <>
                    <PhoneIncoming className="w-4 h-4" />
                    <span>Simulate Inbound Call to AI</span>
                  </>
                ) : (
                  <>
                    <PhoneOutgoing className="w-4 h-4" />
                    <span>{isTriggeringRetell ? "Triggering Retell AI Call..." : "Trigger Retell Outbound AI Call"}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="hangup-call-simulation-btn"
                onClick={handleHangup}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition animate-pulse"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End / Hang Up Call ({formatTime(callDuration)})</span>
              </button>
            )}
          </div>

          {/* Dynamic AI Info Card */}
          {callMode === "inbound" ? (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs">
              <div className="flex items-center space-x-2 text-amber-900 font-semibold mb-1">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>GharCall Dynamic AI Greeting</span>
              </div>
              <p className="text-amber-800 italic leading-relaxed">
                "Hi <span className="font-semibold underline">{customName || selectedCaller.name}</span>, menu{" "}
                <span className="font-semibold underline">{settings.primaryHostName}</span> ki assistant ni. Cheppandi,
                emaina urgent ga matalaala?"
              </p>
              <div className="mt-2 text-[11px] text-amber-700/80 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Saying <strong>"Aunu"</strong> or <strong>"Urgent"</strong> instantly bridges to the primary phone.</span>
              </div>
            </div>
          ) : (
            <div className="bg-stone-900 text-white rounded-2xl p-4 text-xs border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-amber-400 font-semibold">
                <span className="flex items-center space-x-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Retell AI v2 Outbound Engine Active</span>
                </span>
                <span className="font-mono text-[10px] text-stone-400">POST /v2/create-phone-call</span>
              </div>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                Dispatches an outbound AI agent call from <span className="font-mono text-amber-300">{settings.virtualPhoneNumber}</span> to{" "}
                <span className="font-mono text-emerald-300">{customNumber || selectedCaller.number}</span> with dynamic variables:
              </p>
              <div className="bg-stone-800/80 rounded-lg p-2 font-mono text-[10px] text-stone-300 space-y-1">
                <div><span className="text-amber-400">caller_name:</span> "{customName || selectedCaller.name}"</div>
                <div className="truncate"><span className="text-amber-400">custom_message:</span> "{outboundScriptText}"</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Call Stage & Streaming Dialogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm min-h-[460px] flex flex-col justify-between">
            {/* Live Call Header */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    callStatus === "forwarded" 
                      ? "bg-red-500 animate-ping" 
                      : callStatus === "connected" 
                      ? "bg-emerald-500" 
                      : callStatus === "ringing" 
                      ? "bg-amber-500 animate-pulse" 
                      : "bg-stone-300"
                  }`} />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                      <span>Live Call Console</span>
                      {callStatus === "forwarded" && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                          <PhoneForwarded className="w-3 h-3 inline" />
                          <span>Urgent Call Bridged</span>
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-stone-500">
                      {callStatus === "idle" && "No active call • Ready for simulation"}
                      {callStatus === "ringing" && "Incoming call ringing..."}
                      {callStatus === "connected" && `Connected • ${formatTime(callDuration)}`}
                      {callStatus === "forwarded" && `Forwarded to ${settings.primaryForwardPhone} • ${formatTime(callDuration)}`}
                    </span>
                  </div>
                </div>

                {isCalling && (
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-stone-800">{formatTime(callDuration)}</div>
                    <span className="text-[10px] text-stone-400">Deepgram Live STT</span>
                  </div>
                )}
              </div>

              {/* Active Frequency Waveform Animation when AI or Caller is speaking */}
              {isCalling && (
                <div className="mb-4">
                  <FrequencyWaveform
                    isPlaying={isAiSpeaking || isListening}
                    audioLevel={isAiSpeaking ? 0.7 : isListening ? 0.5 : 0.2}
                    height={86}
                    theme={isAiSpeaking ? "amber" : "emerald"}
                    title="Live Call Audio Stream"
                    subTitle={
                      isAiSpeaking
                        ? "AI Voice Synthesis • 48 kHz Live Stream"
                        : isListening
                        ? "Deepgram Live STT • Listening to Audio Input"
                        : "Channel Connected • Standby"
                    }
                    showFrequencyBars={true}
                    showTelemetry={true}
                  />
                </div>
              )}

              {/* Live Streaming Transcript Stream */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {!activeCall || activeCall.transcripts.length === 0 ? (
                  <div className="text-center py-14 text-stone-400">
                    <PhoneIncoming className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No live call in progress</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Click "Simulate Inbound Call to AI" to trigger the dynamic greeting and urgency detection.
                    </p>
                  </div>
                ) : (
                  activeCall.transcripts.map((entry) => {
                    if (entry.speaker === "system") {
                      return (
                        <div
                          key={entry.id}
                          className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 text-xs font-mono flex items-start space-x-2 animate-fadeIn"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">SYSTEM EVENT:</span> {entry.text}
                          </div>
                        </div>
                      );
                    }

                    const isAi = entry.speaker === "assistant";
                    return (
                      <div
                        key={entry.id}
                        className={`flex flex-col ${isAi ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-stone-400 mb-0.5">
                          <span className="font-semibold">{isAi ? "🤖 GharCall AI" : `👤 ${activeCall.callerName}`}</span>
                          <span>• {entry.timestamp}</span>
                          {entry.isUrgentKeyword && (
                            <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                              URGENCY KEYWORD
                            </span>
                          )}
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                            isAi
                              ? "bg-stone-100 text-stone-900 rounded-tl-xs"
                              : entry.isUrgentKeyword
                              ? "bg-red-600 text-white font-medium rounded-tr-xs shadow-sm"
                              : "bg-amber-700 text-white rounded-tr-xs"
                          }`}
                        >
                          {entry.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom: Caller Speech Interactive Controls */}
            {isCalling && (
              <div className="border-t border-stone-100 pt-4 mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">Caller Response Simulator:</span>
                  <span className="text-[11px] text-stone-400">Click a response or speak below</span>
                </div>

                {/* Quick Response Preset Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="trigger-urgent-aunu-btn"
                    onClick={() => handleSendCallerSpeech("Aunu, chaala urgent! Doctor daggara nunchi matladuthunnam.")}
                    className="flex items-center justify-between p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-semibold text-left transition group"
                  >
                    <span>⚡ "Aunu, chaala urgent!" (Urgent Trigger)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-red-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  <button
                    id="trigger-urgent-hospital-btn"
                    onClick={() => handleSendCallerSpeech("Aunu, hospital emergency reports verify cheyyali.")}
                    className="flex items-center justify-between p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-semibold text-left transition group"
                  >
                    <span>⚡ "Aunu, hospital emergency"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-red-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  <button
                    id="trigger-casual-speech-btn"
                    onClick={() => handleSendCallerSpeech("Ledu andi, casual call matladukodaniki.")}
                    className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs text-left transition"
                  >
                    <span>"Ledu, casual call matladukodaniki"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  <button
                    id="trigger-callback-msg-btn"
                    onClick={() => handleSendCallerSpeech("Please tell Rahul to call me back in the evening.")}
                    className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs text-left transition"
                  >
                    <span>"Tell Rahul to call me back later"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>

                {/* Speech Input Field + Microphone Button */}
                <div className="flex items-center space-x-2">
                  <button
                    id="caller-mic-toggle-btn"
                    onClick={handleToggleMic}
                    title={isListening ? "Stop Microphone" : "Speak via Microphone"}
                    className={`p-2.5 rounded-xl transition ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <input
                    id="caller-speech-text-input"
                    type="text"
                    placeholder="Type caller response (e.g. 'Aunu', 'Yes urgent')..."
                    value={callerSpeechInput}
                    onChange={(e) => setCallerSpeechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendCallerSpeech(callerSpeechInput);
                    }}
                    className="flex-1 text-xs px-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    id="send-caller-speech-btn"
                    onClick={() => handleSendCallerSpeech(callerSpeechInput)}
                    disabled={!callerSpeechInput.trim()}
                    className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
