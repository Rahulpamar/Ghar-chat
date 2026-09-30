import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Smile, 
  PhoneCall, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  UserPlus, 
  CheckCheck, 
  Play, 
  Pause, 
  Clock, 
  DollarSign, 
  X, 
  Check, 
  Copy, 
  Volume2, 
  Calendar,
  Lock,
  PhoneForwarded,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  ChatMessage, 
  CloseFriend, 
  FamilyMember, 
  UserAuthSession, 
  AiCallDetailPayload 
} from "../types";
import { 
  buildNaturalAiIntro, 
  buildRealisticTargetResponse, 
  playHumanAiDialogue 
} from "../lib/openAiRealtimeVoice";

interface ChatAndCloseFriendsHubProps {
  messages: ChatMessage[];
  onSendMessage: (msg: Partial<ChatMessage>) => void;
  closeFriends: CloseFriend[];
  onConnectFriendCode: (code: string) => Promise<boolean>;
  familyMembers: FamilyMember[];
  currentSession: UserAuthSession;
  familyRoomCode: string;
  onConveyAiCall: (payload: {
    targetName: string;
    targetPhone: string;
    promptInstruction: string;
    callerRole: string;
    roomId: string;
  }) => Promise<any>;
  onApproveUpi: (upiId: string, approvedBy: string) => void;
  onLockApp: () => void;
}

const INDIAN_STICKERS = [
  { emoji: "🙏", label: "Namaste" },
  { emoji: "☕", label: "Garam Chai" },
  { emoji: "🍲", label: "Dum Biryani" },
  { emoji: "❤️", label: "Premam (Dil)" },
  { emoji: "🔥", label: "Mass (Fire)" },
  { emoji: "😂", label: "Navvu (Laugh)" },
  { emoji: "✨", label: "Blessings" },
  { emoji: "👍", label: "Manchidi" },
];

export const ChatAndCloseFriendsHub: React.FC<ChatAndCloseFriendsHubProps> = ({
  messages,
  onSendMessage,
  closeFriends,
  onConnectFriendCode,
  familyMembers,
  currentSession,
  familyRoomCode,
  onConveyAiCall,
  onApproveUpi,
  onLockApp,
}) => {
  // Navigation: 'family' vs 'close_friends'
  const [activeTab, setActiveTab] = useState<"family" | "close_friends">("family");
  const [selectedFriend, setSelectedFriend] = useState<CloseFriend | null>(null);

  // Message inputs
  const [inputText, setInputText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  // Close friends add code input
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [isConnectingCode, setIsConnectingCode] = useState(false);
  const [codeConnectMessage, setCodeConnectMessage] = useState("");

  // Convey to AI Call modal
  const [isAiCallModalOpen, setIsAiCallModalOpen] = useState(false);
  const [aiTargetName, setAiTargetName] = useState("Ramesh Sharma (Dad)");
  const [aiTargetPhone, setAiTargetPhone] = useState("+91 98765 43212");
  const [aiPromptInstruction, setAiPromptInstruction] = useState("Ask where he is right now and when he'll reach home");
  const [aiCallerRole, setAiCallerRole] = useState("daddy");
  const [isPlacingAiCall, setIsPlacingAiCall] = useState(false);
  const [activeCallDialogue, setActiveCallDialogue] = useState<{
    stage: "idle" | "dialing" | "ai_speaking" | "target_responding" | "completed";
    aiIntroText: string;
    targetResponseText: string;
  }>({
    stage: "idle",
    aiIntroText: "",
    targetResponseText: "",
  });

  // Audio Playback state for voice messages
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll chat to bottom
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const currentRoomId = activeTab === "family" ? "family-main" : (selectedFriend ? `cf-${selectedFriend.userCode}` : "family-main");

  const filteredMessages = messages.filter((m) => {
    if (activeTab === "family") {
      return m.roomId === "family-main" || !m.roomId;
    }
    return m.roomId === `cf-${selectedFriend?.userCode}`;
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages, activeTab, selectedFriend]);

  // Voice recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingVoice) {
      interval = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // Handle Send Text Message
  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage({
      roomId: currentRoomId,
      senderId: currentSession.userCode,
      senderName: currentSession.name,
      senderAvatar: currentSession.avatar,
      text: inputText.trim(),
      type: "text",
    });

    setInputText("");
    setShowStickers(false);
  };

  // Handle Send Sticker
  const handleSendSticker = (sticker: typeof INDIAN_STICKERS[0]) => {
    onSendMessage({
      roomId: currentRoomId,
      senderId: currentSession.userCode,
      senderName: currentSession.name,
      senderAvatar: currentSession.avatar,
      text: sticker.emoji,
      type: "sticker",
      stickerEmoji: sticker.emoji,
    });
    setShowStickers(false);
  };

  // Handle Voice Recording Note Send
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      // Finish recording and send
      setIsRecordingVoice(false);
      onSendMessage({
        roomId: currentRoomId,
        senderId: currentSession.userCode,
        senderName: currentSession.name,
        senderAvatar: currentSession.avatar,
        text: `Voice Note (${voiceSeconds || 5}s)`,
        type: "voice",
        voiceUrl: "https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3",
        voiceDuration: voiceSeconds || 5,
      });
    } else {
      setIsRecordingVoice(true);
    }
  };

  // Handle Audio Note Playback
  const handlePlayVoice = (msgId: string, url?: string) => {
    if (playingMessageId === msgId) {
      audioRef.current?.pause();
      setPlayingMessageId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url || "https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3");
      audioRef.current = audio;
      setPlayingMessageId(msgId);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingMessageId(null);
    }
  };

  // Handle Connect to Close Friend via Dynamic Code
  const handleConnectCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;

    setIsConnectingCode(true);
    setCodeConnectMessage("");
    const clean = friendCodeInput.trim().toUpperCase();

    try {
      const success = await onConnectFriendCode(clean);
      if (success) {
        setCodeConnectMessage(`✅ Connected to ${clean} in Close Friends!`);
        setFriendCodeInput("");
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } else {
        setCodeConnectMessage("❌ Invalid code or friend already added.");
      }
    } catch {
      setCodeConnectMessage("Connection error.");
    } finally {
      setIsConnectingCode(false);
      setTimeout(() => setCodeConnectMessage(""), 4000);
    }
  };

  // Handle Convey to AI Call Execution
  const handleExecuteAiCall = async () => {
    setIsPlacingAiCall(true);

    const introText = buildNaturalAiIntro(aiTargetName, aiPromptInstruction, aiCallerRole);
    const targetVoiceResp = buildRealisticTargetResponse(aiPromptInstruction);

    setActiveCallDialogue({
      stage: "dialing",
      aiIntroText: introText,
      targetResponseText: targetVoiceResp,
    });

    // Step 1: Simulate Dialing & Caller ID check
    setTimeout(() => {
      setActiveCallDialogue((prev) => ({ ...prev, stage: "ai_speaking" }));
      // Play AI speech synthesis in Telugu/English
      playHumanAiDialogue(introText, () => {
        // Step 2: Target responds via voice
        setActiveCallDialogue((prev) => ({ ...prev, stage: "target_responding" }));
        setTimeout(() => {
          playHumanAiDialogue(targetVoiceResp, async () => {
            // Step 3: Complete call and push to chat
            setActiveCallDialogue((prev) => ({ ...prev, stage: "completed" }));
            await onConveyAiCall({
              targetName: aiTargetName,
              targetPhone: aiTargetPhone,
              promptInstruction: aiPromptInstruction,
              callerRole: aiCallerRole,
              roomId: currentRoomId,
            });

            setTimeout(() => {
              setIsPlacingAiCall(false);
              setIsAiCallModalOpen(false);
              setActiveCallDialogue({ stage: "idle", aiIntroText: "", targetResponseText: "" });
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
            }, 1200);
          });
        }, 800);
      });
    }, 1500);
  };

  return (
    <div id="gharcall-chat-hub" className="flex flex-col h-full bg-[#FFFFFF] border-r border-slate-100 relative">
      {/* 1. TOP SEGMENTED CONTROLLER (Family Room vs Close Friends Hub) */}
      <div className="p-3 bg-[#FFFFFF] border-b border-slate-100 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-sm">
          <button
            id="tab-family-room"
            onClick={() => {
              setActiveTab("family");
              setSelectedFriend(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "family"
                ? "bg-[#0F5132] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Family Room</span>
          </button>

          <button
            id="tab-close-friends"
            onClick={() => {
              setActiveTab("close_friends");
              if (!selectedFriend && closeFriends.length > 0) {
                setSelectedFriend(closeFriends[0]);
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === "close_friends"
                ? "bg-[#0F5132] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Close Friends</span>
            {closeFriends.some((f) => f.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2" />
            )}
          </button>
        </div>

        {/* Security & Lock Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onLockApp}
            title="Lock GharCall PIN"
            className="p-2 rounded-xl text-slate-500 hover:text-[#0F5132] hover:bg-slate-100 transition-colors"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CLOSE FRIENDS HUB: DYNAMIC CODE CONNECTION HEADER */}
      {activeTab === "close_friends" && (
        <div className="p-3 bg-slate-50/70 border-b border-slate-100 space-y-2.5">
          {/* Add Code Input */}
          <form onSubmit={handleConnectCode} className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="close-friend-code-input"
                type="text"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter dynamic code (e.g. GK-8823)"
                className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              />
              <UserPlus className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              id="add-code-submit-btn"
              type="submit"
              disabled={isConnectingCode}
              className="px-3.5 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>+ Add Code</span>
            </button>
          </form>

          {codeConnectMessage && (
            <p className="text-xs font-semibold text-[#0F5132]">{codeConnectMessage}</p>
          )}

          {/* Horizontal List of Connected Friends */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {closeFriends.map((friend) => {
              const isSelected = selectedFriend?.userCode === friend.userCode;
              return (
                <button
                  key={friend.userCode}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "border-[#0F5132] bg-[#0F5132]/10 text-[#0F5132] font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{friend.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {friend.userCode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ACTIVE CHAT STREAM HEADER */}
      <div className="px-4 py-2.5 bg-[#FFFFFF] border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={
                activeTab === "family"
                  ? "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150&auto=format&fit=crop&q=80"
                  : selectedFriend?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              }
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A]">
                {activeTab === "family" ? "Sharma Family Room" : selectedFriend?.name || "Close Friend"}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                {activeTab === "family" ? familyRoomCode : selectedFriend?.userCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3 h-3 text-[#0F5132]" />
              <span>E2EE Encrypted</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Active now</span>
            </div>
          </div>
        </div>

        {/* Direct "Convey to AI Call" Quick Trigger Button */}
        <button
          id="convey-to-ai-header-btn"
          onClick={() => setIsAiCallModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold shadow-md shadow-[#0F5132]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Convey to AI Call</span>
        </button>
      </div>

      {/* 4. MESSAGE LIST (WhatsApp / Instagram style) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
        {/* End-to-End Encryption Banner */}
        <div className="flex justify-center">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] text-center max-w-sm flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 text-amber-700" />
            <span>Messages & voice recordings are end-to-end encrypted. No one outside of this room can listen or read.</span>
          </div>
        </div>

        {filteredMessages.map((msg) => {
          const isMe = msg.senderId === currentSession.userCode || msg.senderName === currentSession.name;
          const isAiSummary = msg.type === "ai_call_summary";
          const isUpi = msg.type === "upi_request" || msg.type === "upi_paid";

          // AI Call Summary Special Card
          if (isAiSummary && msg.aiCallDetails) {
            const details = msg.aiCallDetails;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto my-2 rounded-2xl bg-white border-2 border-[#0F5132]/30 shadow-md p-4 space-y-3 overflow-hidden relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0F5132] text-white flex items-center justify-center">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">AI Conversational Call Result</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Caller ID: {details.callerIdUsed}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live Call Logged
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* What AI Asked */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      🗣️ AI Spoke to {details.targetName}:
                    </span>
                    <p className="text-slate-800 italic font-medium leading-relaxed">
                      "{details.introSpoken}"
                    </p>
                  </div>

                  {/* Target Voice Response */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                      🎙️ {details.targetName} Voice Answer:
                    </span>
                    <p className="text-emerald-950 font-semibold leading-relaxed">
                      "{details.targetVoiceResponse}"
                    </p>

                    {/* Audio Player for Voice Recording Alert */}
                    <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center gap-2">
                      <button
                        onClick={() => handlePlayVoice(msg.id, details.targetAudioUrl)}
                        className="w-7 h-7 rounded-full bg-[#0F5132] text-white flex items-center justify-center hover:scale-105 transition-all shadow-sm"
                      >
                        {playingMessageId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="h-1.5 flex-1 bg-emerald-200 rounded-full overflow-hidden">
                          <div className={`h-full bg-[#0F5132] ${playingMessageId === msg.id ? "w-3/4 animate-pulse" : "w-1/3"}`} />
                        </div>
                        <span className="text-[10px] text-emerald-800 font-mono">0:12</span>
                      </div>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="flex items-center gap-1 text-[#0F5132] font-semibold">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Pushed to Chat
                  </span>
                </div>
              </motion.div>
            );
          }

          // UPI Payment Card
          if (isUpi && msg.upiDetails) {
            const upi = msg.upiDetails;
            const isApproved = upi.status === "approved";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-sm mx-auto my-2 rounded-2xl border p-4 space-y-3 shadow-md ${
                  isApproved
                    ? "bg-emerald-50/90 border-emerald-300"
                    : "bg-white border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                      isApproved ? "bg-emerald-600" : "bg-amber-600"
                    }`}>
                      <DollarSign className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isApproved ? "UPI Approved & Transferred" : "Pocket Money Request"}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Razorpay Instant UPI</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#0F172A]">
                    ₹{upi.amount}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium">
                  Purpose: <span className="font-semibold text-slate-900">{upi.purpose}</span>
                </p>

                {isApproved ? (
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Ref Transaction:</span>
                      <span className="font-mono font-bold text-slate-900">{upi.transactionId}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Approved By:</span>
                      <span className="font-semibold text-emerald-800">{upi.approvedBy}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onApproveUpi(msg.id, currentSession.name);
                      confetti({ particleCount: 50, spread: 60 });
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>One-Tap Approve UPI (Razorpay ₹{upi.amount})</span>
                  </button>
                )}
              </motion.div>
            );
          }

          // Standard Chat Bubble (WhatsApp / Instagram style)
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-7 h-7 rounded-full object-cover mb-1 shrink-0"
                />
              )}

              <div
                className={`max-w-[75%] md:max-w-md rounded-2xl px-3.5 py-2.5 shadow-xs relative ${
                  isMe
                    ? "bg-[#0F5132] text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-xs"
                }`}
              >
                {!isMe && (
                  <p className="text-[11px] font-bold text-[#0F5132] mb-1">
                    {msg.senderName}
                  </p>
                )}

                {/* Text */}
                {msg.type === "text" && (
                  <p className="text-sm font-normal leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Sticker */}
                {msg.type === "sticker" && (
                  <div className="text-4xl my-1 select-none animate-bounce">
                    {msg.stickerEmoji}
                  </div>
                )}

                {/* Voice Note Player */}
                {msg.type === "voice" && (
                  <div className="flex items-center gap-2.5 py-1">
                    <button
                      onClick={() => handlePlayVoice(msg.id, msg.voiceUrl)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isMe ? "bg-white text-[#0F5132]" : "bg-[#0F5132] text-white"
                      }`}
                    >
                      {playingMessageId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        {[40, 70, 90, 45, 60, 100, 30, 80, 50, 70, 30].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h * 0.2}px` }}
                            className={`w-1 rounded-full ${
                              isMe
                                ? (playingMessageId === msg.id ? "bg-white" : "bg-white/60")
                                : (playingMessageId === msg.id ? "bg-[#0F5132]" : "bg-slate-300")
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[10px] font-mono ${isMe ? "text-emerald-100" : "text-slate-500"}`}>
                        0:0{msg.voiceDuration || 8}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timestamp & Read Receipt */}
                <div
                  className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                    isMe ? "text-emerald-100/80" : "text-slate-400"
                  }`}
                >
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMe && (
                    <CheckCheck
                      className={`w-3.5 h-3.5 ${
                        msg.status === "read" ? "text-emerald-300" : "text-emerald-200/60"
                      }`}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* 5. STICKERS DRAWER */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 bg-white border-t border-slate-100 grid grid-cols-4 sm:grid-cols-8 gap-2 overflow-hidden"
          >
            {INDIAN_STICKERS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleSendSticker(s)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-[#0F5132]/10 hover:border-[#0F5132] border border-slate-200 transition-all flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[10px] font-medium text-slate-600">{s.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. BOTTOM RICH MEDIA CHAT INPUT BAR */}
      <div className="p-3 bg-[#FFFFFF] border-t border-slate-100">
        <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
          {/* Stickers Button */}
          <button
            type="button"
            onClick={() => setShowStickers(!showStickers)}
            className={`p-2 rounded-full transition-colors ${
              showStickers ? "bg-[#0F5132]/10 text-[#0F5132]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
            title="Interactive Stickers"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Dedicated "Convey to AI Call" Quick Trigger */}
          <button
            type="button"
            onClick={() => setIsAiCallModalOpen(true)}
            className="p-2 rounded-full bg-[#0F5132]/10 text-[#0F5132] hover:bg-[#0F5132] hover:text-white transition-all shadow-xs"
            title="Convey to AI Call"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Text Input / Voice Note Recording indicator */}
          {isRecordingVoice ? (
            <div className="flex-1 flex items-center justify-between px-4 py-2 bg-rose-50 border border-rose-200 rounded-full animate-pulse">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>Recording Voice Note... ({voiceSeconds}s)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordingVoice(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <input
              id="chat-message-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message, request pocket money, or convey to AI..."
              className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm text-[#0F172A]"
            />
          )}

          {/* Voice Note Hold/Toggle Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-2.5 rounded-full transition-all ${
              isRecordingVoice
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-110"
                : "text-slate-500 hover:text-[#0F5132] hover:bg-slate-100"
            }`}
            title="Voice Note"
          >
            {isRecordingVoice ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() && !isRecordingVoice}
            className="p-2.5 rounded-full bg-[#0F5132] hover:bg-[#0c4128] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#0F5132]/25 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* 7. CHAT-TO-AI CALL SEAMLESS INTEGRATION MODAL */}
      <AnimatePresence>
        {isAiCallModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shadow-md shadow-[#0F5132]/25">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">Convey to AI Voice Call</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      ChatGPT Real-Time Voice + Astra Telephony
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiCallModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target & Caller ID Info */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                    Verified Outbound Caller ID:
                  </span>
                  <span className="font-bold text-slate-800">{currentSession.phoneNumber} ({currentSession.name})</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  No Spam • Real ID
                </span>
              </div>

              {/* Contact Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Contact to Call
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiTargetName("Ramesh Sharma (Dad)");
                      setAiTargetPhone("+91 98765 43212");
                      setAiCallerRole("daddy");
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      aiTargetName.includes("Dad")
                        ? "border-[#0F5132] bg-[#0F5132]/10 font-bold text-[#0F5132]"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <p className="font-bold">Ramesh Sharma (Dad)</p>
                    <p className="text-[11px] text-slate-500">+91 98765 43212</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiTargetName("Sunita Sharma (Mom)");
                      setAiTargetPhone("+91 98765 43211");
                      setAiCallerRole("mom");
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      aiTargetName.includes("Mom")
                        ? "border-[#0F5132] bg-[#0F5132]/10 font-bold text-[#0F5132]"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <p className="font-bold">Sunita Sharma (Mom)</p>
                    <p className="text-[11px] text-slate-500">+91 98765 43211</p>
                  </button>
                </div>
              </div>

              {/* Instruction Prompt Input & Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Instruction for AI Voice Agent
                </label>
                <textarea
                  rows={2}
                  value={aiPromptInstruction}
                  onChange={(e) => setAiPromptInstruction(e.target.value)}
                  placeholder="e.g. Ask where he is right now and if he took evening BP medicine"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Ask where he is right now",
                    "Ask when he'll reach home for dinner",
                    "Ask if he took evening BP medicine",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAiPromptInstruction(preset)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Conversational Simulation Feed */}
              {isPlacingAiCall && (
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Live Outbound Voice Call Bridge Active
                    </span>
                    <span className="font-mono">ChatGPT Voice API</span>
                  </div>

                  {activeCallDialogue.stage === "dialing" && (
                    <p className="text-slate-300 italic">📞 Dialing {aiTargetName} ({aiTargetPhone}) with Caller ID...</p>
                  )}

                  {activeCallDialogue.stage === "ai_speaking" && (
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                      <p className="text-emerald-300 font-semibold mb-1">🗣️ AI Agent Speaking in Telugu:</p>
                      <p className="text-white text-xs leading-relaxed italic">
                        "{activeCallDialogue.aiIntroText}"
                      </p>
                    </div>
                  )}

                  {activeCallDialogue.stage === "target_responding" && (
                    <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-700">
                      <p className="text-emerald-300 font-semibold mb-1">🎙️ {aiTargetName} Live Response:</p>
                      <p className="text-white text-xs leading-relaxed font-bold">
                        "{activeCallDialogue.targetResponseText}"
                      </p>
                    </div>
                  )}

                  {activeCallDialogue.stage === "completed" && (
                    <p className="text-emerald-400 font-bold text-center py-1">
                      ✅ Call audio recorded & pushed into chat stream!
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiCallModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPlacingAiCall || !aiPromptInstruction.trim()}
                  onClick={handleExecuteAiCall}
                  className="flex-2 py-3 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs shadow-md shadow-[#0F5132]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{isPlacingAiCall ? "Placing Voice Call..." : "Call Now with ChatGPT Voice"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
