import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Mic, 
  Smile, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Users, 
  CheckCheck, 
  Play, 
  Pause, 
  Volume2, 
  KeyRound, 
  Trash2, 
  X,
  Pin,
  Flame,
  Heart,
  MapPin,
  Quote,
  Radio,
  Plus,
  Sparkles,
  PhoneCall,
  Eye,
  EyeOff,
  Timer,
  Square,
  Hourglass,
  Gift
} from "lucide-react";
import confetti from "canvas-confetti";
import { ChatMessage, UserAuthSession, SocialPost, TimeCapsule } from "../types";
import { SnapViewOnceModal } from "./SnapViewOnceModal";
import { SealedTimeCapsuleBribeModal } from "./SealedTimeCapsuleBribeModal";
import { SecureScreenProtectionLayer } from "./SecureScreenProtectionLayer";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

interface FamilyChatAndVaultHubProps {
  messages: ChatMessage[];
  currentSession: UserAuthSession;
  familyRoomCode: string;
  onSendMessage: (msg: Partial<ChatMessage>) => void;
  onTogglePrivateVault: (messageId: string, isPrivate: boolean) => Promise<void>;
  onUpdateUserPin: (newPin: string) => void;
  familyPosts?: SocialPost[];
  timeCapsules?: TimeCapsule[];
  onRequestTimeCapsuleUnlock?: (capsuleId: string, message: string) => Promise<void>;
  onLikePost?: (postId: string) => void;
  onJoinFamilyRoom?: (code: string) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onDeletePost?: (postId: string) => void;
  onMarkViewOnceViewed?: (postId: string) => void;
  onOpenRewind?: () => void;
  onOpenProfile?: (user: {
    id: string;
    name: string;
    avatar: string;
    userCode: string;
    bio?: string;
    recentStatusNote?: string;
    relationship?: string;
    vibeMatch?: number;
  }) => void;
  onOpenVoiceRoom?: (roomType: "family" | "connectors") => void;
}

const INDIAN_STICKERS = [
  { emoji: "🙏", label: "Namaste" },
  { emoji: "☕", label: "Garam Chai" },
  { emoji: "🍲", label: "Dum Biryani" },
  { emoji: "❤️", label: "Premam" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "😂", label: "Navvu" },
  { emoji: "✨", label: "Blessings" },
  { emoji: "👍", label: "Manchidi" },
];

export const FamilyChatAndVaultHub: React.FC<FamilyChatAndVaultHubProps> = ({
  messages,
  currentSession,
  familyRoomCode,
  onSendMessage,
  onTogglePrivateVault,
  onUpdateUserPin,
  familyPosts = [],
  timeCapsules = [],
  onRequestTimeCapsuleUnlock,
  onLikePost,
  onJoinFamilyRoom,
  onReactMessage,
  onDeletePost,
  onMarkViewOnceViewed,
  onOpenRewind,
  onOpenProfile,
  onOpenVoiceRoom,
}) => {
  // Tabs: 'room' (Public Family Chat) vs 'streaks' (Dedicated Family Streaks) vs 'vault' (Private Protected Vault)
  const [activeTab, setActiveTab] = useState<"room" | "streaks" | "vault">("room");

  // Inputs
  const [inputText, setInputText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  // Private Vault PIN Lock State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");

  // View-Once Snap Modal & Secret Vault Voice Drop Recording
  const [snapViewingPost, setSnapViewingPost] = useState<SocialPost | null>(null);
  const [bribingCapsule, setBribingCapsule] = useState<TimeCapsule | null>(null);
  const [voiceRecordDuration, setVoiceRecordDuration] = useState(0);
  const voiceTimerRef = useRef<any>(null);

  // Context Menu for Long-Press / Right-Click / Touch Hold
  const [contextMenuMsg, setContextMenuMsg] = useState<ChatMessage | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);

  // Audio Playback
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const handleJoinRoomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!joinRoomCodeInput.trim()) return;
    if (onJoinFamilyRoom) {
      onJoinFamilyRoom(joinRoomCodeInput.trim().toUpperCase());
      confetti({ particleCount: 50, spread: 70 });
      setJoinRoomCodeInput("");
    }
  };

  const handleQuickReaction = (msgId: string, emoji: string) => {
    if (onReactMessage) {
      onReactMessage(msgId, emoji);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeTab]);

  // Filter messages by public room vs private vault
  const roomMessages = messages.filter((m) => !m.isPrivate);
  const vaultMessages = messages.filter(
    (m) => m.isPrivate && (m.privateForUserCode === currentSession.userCode || m.senderId === currentSession.userCode)
  );

  // Send Public Message
  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage({
      roomId: "family-main",
      senderId: currentSession.userCode,
      senderName: currentSession.name,
      senderAvatar: currentSession.avatar,
      text: inputText.trim(),
      type: "text",
      isPrivate: false,
    });

    setInputText("");
    setShowStickers(false);
  };

  // Send Sticker
  const handleSendSticker = (sticker: typeof INDIAN_STICKERS[0]) => {
    onSendMessage({
      roomId: "family-main",
      senderId: currentSession.userCode,
      senderName: currentSession.name,
      senderAvatar: currentSession.avatar,
      text: sticker.emoji,
      type: "sticker",
      stickerEmoji: sticker.emoji,
      isPrivate: false,
    });
    setShowStickers(false);
  };

  // Start Voice Drop Recording
  const handleStartVoiceRecording = () => {
    setIsRecordingVoice(true);
    setVoiceRecordDuration(0);
    voiceTimerRef.current = setInterval(() => {
      setVoiceRecordDuration((prev) => prev + 1);
    }, 1000);
  };

  // Complete and Dispatch Voice Drop (Public vs Secret Vault Drop)
  const handleCompleteVoiceDrop = (isSecretVault: boolean = false) => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setIsRecordingVoice(false);
    const duration = Math.max(2, voiceRecordDuration || 4);

    onSendMessage({
      roomId: "family-main",
      senderId: currentSession.userCode,
      senderName: currentSession.name,
      senderAvatar: currentSession.avatar,
      text: isSecretVault ? "🔐 Secret Vault Voice Drop" : `Voice Note (${duration}s)`,
      type: "voice",
      voiceUrl: "https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3",
      voiceDuration: duration,
      isPrivate: isSecretVault,
      privateForUserCode: isSecretVault ? currentSession.userCode : undefined,
    });

    setVoiceRecordDuration(0);
    if (isSecretVault) {
      confetti({ particleCount: 45, spread: 60 });
    }
  };

  const handleCancelVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setIsRecordingVoice(false);
    setVoiceRecordDuration(0);
  };

  // Audio Playback
  const handlePlayVoice = (msgId: string, url?: string) => {
    if (playingMessageId === msgId) {
      audioRef.current?.pause();
      setPlayingMessageId(null);
    } else {
      audioRef.current?.pause();
      const audio = new Audio(url || "https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3");
      audioRef.current = audio;
      setPlayingMessageId(msgId);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingMessageId(null);
    }
  };

  // Long press start
  const handleTouchStart = (msg: ChatMessage) => {
    const timer = setTimeout(() => {
      setContextMenuMsg(msg);
    }, 450); // 450ms for long press
    setLongPressTimer(timer);
  };

  // Long press cancel
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Move to Private Vault
  const handleAddToPrivate = async (msg: ChatMessage) => {
    await onTogglePrivateVault(msg.id, true);
    setContextMenuMsg(null);
    confetti({ particleCount: 35, spread: 50 });
  };

  // Remove from Private Vault
  const handleRemoveFromPrivate = async (msg: ChatMessage) => {
    await onTogglePrivateVault(msg.id, false);
    setContextMenuMsg(null);
  };

  // Verify PIN
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = currentSession.pinCode || "1234";
    if (enteredPin === correctPin) {
      setIsVaultUnlocked(true);
      setPinError("");
      confetti({ particleCount: 40, spread: 60 });
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }
  };

  // Update PIN
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length >= 4) {
      onUpdateUserPin(newPinInput);
      setIsChangingPin(false);
      setNewPinInput("");
    }
  };

  return (
    <div className="h-[750px] bg-[#FFFFFF] rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
      {/* Top Header & Tab Switcher */}
      <div className="bg-[#FFFFFF] border-b border-slate-100 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("room")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "room"
                ? "bg-[#0F5132] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Family Room Chat</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white">
              {roomMessages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("streaks")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "streaks"
                ? "bg-[#0F5132] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Family Streaks</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === "streaks" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }`}>
              {familyPosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "vault"
                ? "bg-[#0F5132] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Lock className="w-4 h-4 text-amber-300" />
            <span>Protected Vault (PIN)</span>
            {vaultMessages.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 font-black">
                {vaultMessages.length}
              </span>
            )}
          </button>
        </div>

        {/* Header Right Actions: Go Fam Call & Add Room Code */}
        <div className="flex flex-wrap items-center gap-2">
          {/* "Go Fam Call" Group Voice Room Button */}
          <button
            onClick={() => onOpenVoiceRoom && onOpenVoiceRoom("family")}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0F5132] to-emerald-700 hover:from-[#0c4128] hover:to-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Start or Join in-app live audio conference"
          >
            <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Go Fam Call</span>
          </button>

          {/* Add Family Room Code Box */}
          <form onSubmit={handleJoinRoomSubmit} className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1">
            <input
              type="text"
              placeholder="Add Room Code..."
              value={joinRoomCodeInput}
              onChange={(e) => setJoinRoomCodeInput(e.target.value)}
              className="w-28 text-[11px] font-mono text-slate-800 bg-transparent focus:outline-hidden placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!joinRoomCodeInput.trim()}
              className="px-2 py-0.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-40 text-white text-[10px] font-bold transition cursor-pointer"
            >
              + Add
            </button>
          </form>

          {/* Current Room Code Badge */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
            <span>Room:</span>
            <strong className="text-[#0F5132]">{familyRoomCode}</strong>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "room" ? (
        /* Family Public Chat Screen */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>💡 Tip: Long-press any message to move it to your <strong>Protected Private Vault</strong>.</span>
            <span className="text-[#0F5132] font-semibold">Public Room</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {roomMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <span className="text-4xl">🏡</span>
                <p className="text-xs font-semibold">No messages in Family Room yet.</p>
                <p className="text-[11px]">Send a greeting or voice note to your family!</p>
              </div>
            ) : (
              roomMessages.map((msg) => {
                const isMe = msg.senderId === currentSession.userCode;

                return (
                  <div
                    key={msg.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuMsg(msg);
                    }}
                    onTouchStart={() => handleTouchStart(msg)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(msg)}
                    onMouseUp={handleTouchEnd}
                    className={`flex items-end gap-2 group select-none cursor-pointer ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMe && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenProfile) {
                            onOpenProfile({
                              id: msg.senderId,
                              name: msg.senderName,
                              avatar: msg.senderAvatar,
                              userCode: msg.senderId,
                              relationship: "Family Member",
                              recentStatusNote: "Active in Family Room 🏡",
                              vibeMatch: 98,
                            });
                          }
                        }}
                        title={`Click to view ${msg.senderName}'s profile`}
                        className="w-7 h-7 rounded-full object-cover mb-1 shrink-0 border border-slate-200 cursor-pointer hover:ring-2 hover:ring-[#0F5132] transition"
                      />
                    )}

                    <div
                      className={`max-w-[78%] md:max-w-md rounded-2xl px-3.5 py-2.5 shadow-2xs relative transition ${
                        isMe
                          ? "bg-[#0F5132] text-white rounded-br-xs"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                      }`}
                    >
                      {/* WhatsApp-Style Quick Reactions Bar */}
                      <div className="absolute -top-6 right-2 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-2xs border border-slate-200 px-2 py-0.5 rounded-full shadow-md z-20">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickReaction(msg.id, emoji);
                            }}
                            className="text-xs hover:scale-130 transition cursor-pointer p-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {!isMe && (
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenProfile) {
                              onOpenProfile({
                                id: msg.senderId,
                                name: msg.senderName,
                                avatar: msg.senderAvatar,
                                userCode: msg.senderId,
                                relationship: "Family Member",
                                recentStatusNote: "Active in Family Room 🏡",
                                vibeMatch: 98,
                              });
                            }
                          }}
                          className="text-[11px] font-bold text-[#0F5132] mb-0.5 cursor-pointer hover:underline"
                        >
                          {msg.senderName}
                        </p>
                      )}

                      {/* Text */}
                      {msg.type === "text" && (
                        <p className="text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                      )}

                      {/* Sticker */}
                      {msg.type === "sticker" && (
                        <div className="text-3xl my-1 select-none animate-bounce">
                          {msg.stickerEmoji}
                        </div>
                      )}

                      {/* Voice Note */}
                      {msg.type === "voice" && (
                        <div className="flex items-center gap-2 py-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayVoice(msg.id, msg.voiceUrl);
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                              isMe ? "bg-white text-[#0F5132]" : "bg-[#0F5132] text-white"
                            }`}
                          >
                            {playingMessageId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                          <span className={`text-[11px] font-mono ${isMe ? "text-emerald-100" : "text-slate-600"}`}>
                            Voice Note ({msg.voiceDuration || 5}s)
                          </span>
                        </div>
                      )}

                      {/* Reaction Pills */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Object.entries(msg.reactions).map(([emoji, userCodes]) => {
                            const codes = Array.isArray(userCodes) ? (userCodes as string[]) : [];
                            return (
                              <span
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickReaction(msg.id, emoji);
                                }}
                                className={`text-[10px] px-1.5 py-0.2 rounded-full border flex items-center gap-0.5 transition cursor-pointer ${
                                  codes.includes(currentSession.userCode)
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                                    : isMe ? "bg-emerald-800 text-emerald-100 border-emerald-700" : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="font-mono">{codes.length}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp & Read Receipt */}
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                          isMe ? "text-emerald-200" : "text-slate-400"
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Stickers Tray */}
          {showStickers && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
              {INDIAN_STICKERS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSendSticker(s)}
                  className="text-2xl p-1.5 rounded-xl hover:bg-slate-200 transition"
                  title={s.label}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Bar with Embedded Secret Vault Voice Drops */}
          {isRecordingVoice ? (
            <div className="p-3 bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border-t border-rose-200 flex items-center justify-between gap-3 shrink-0 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-rose-600 animate-pulse" />
                  Recording Audio Note ({voiceRecordDuration}s)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelVoiceRecording}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteVoiceDrop(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Voice Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteVoiceDrop(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm ring-1 ring-emerald-600"
                  title="Directly encrypt and drop into PIN-protected Secret Vault"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>🔐 Secret Vault Drop</span>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSendTextMessage}
              className="p-3 bg-[#FFFFFF] border-t border-slate-100 flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={() => setShowStickers(!showStickers)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition cursor-pointer"
                title="Stickers"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleStartVoiceRecording}
                className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Record Voice Drop"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleStartVoiceRecording}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                title="Secret Vault Voice Drop (PIN protected)"
              >
                <Lock className="w-3 h-3 text-amber-700" />
                <span className="hidden sm:inline">Vault Drop</span>
              </button>

              <input
                type="text"
                placeholder="Type message to Family Room..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          )}
        </div>
      ) : activeTab === "streaks" ? (
        /* Dedicated Family Streaks Feed */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60 p-4 overflow-y-auto space-y-4">
          <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <span>🏡 Dedicated Family Streaks & Outing Photos</span>
              <span className="text-[#0F5132] font-bold font-mono">({familyPosts.length})</span>
            </div>
            {onOpenRewind && (
              <button
                type="button"
                onClick={onOpenRewind}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0F5132] via-emerald-600 to-amber-500 text-white text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>Ghar Rewind</span>
              </button>
            )}
          </div>

          {/* SEALED FAMILY TIME CAPSULES WITH PROMINENT LOCK SEAL & BRIBE TRIGGER */}
          {timeCapsules.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700">
                    <Hourglass className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Sealed Family Time Capsules ({timeCapsules.length})
                    </h4>
                    <span className="text-[10px] text-amber-800">
                      Tap lock to send a fun bribe and request early unlock!
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
                  🔒 Locked Feeds
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {timeCapsules.map((capsule) => {
                  const isReady = new Date(capsule.unlockDate) <= new Date() || capsule.isUnlocked;
                  const isUnlockedForMe = isReady || capsule.unlockedForUsers?.includes(currentSession.userCode);
                  const isAuthor = capsule.authorCode === currentSession.userCode || capsule.authorId === currentSession.userCode;

                  return (
                    <div
                      key={capsule.id}
                      onClick={() => {
                        if (!isUnlockedForMe && !isAuthor) {
                          setBribingCapsule(capsule);
                        }
                      }}
                      className="bg-white rounded-2xl border border-amber-200 p-3 shadow-xs hover:shadow-md transition cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900 truncate max-w-[140px] group-hover:text-amber-800 transition">
                          {capsule.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                          {capsule.occasionTag}
                        </span>
                      </div>

                      {/* Photo with prominent visual lock seal icon */}
                      {capsule.photoUrl && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950">
                          {isUnlockedForMe ? (
                            <SecureScreenProtectionLayer
                              userCode={currentSession.userCode}
                              mediaTitle={capsule.title}
                              className="w-full h-full"
                            >
                              <img
                                src={capsule.photoUrl}
                                alt="Unlocked capsule"
                                className="w-full h-full object-cover select-none pointer-events-none"
                                draggable={false}
                              />
                            </SecureScreenProtectionLayer>
                          ) : (
                            <>
                              <img
                                src={capsule.photoUrl}
                                alt="Sealed capsule"
                                className="w-full h-full object-cover filter blur-md scale-105 opacity-60"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 flex flex-col items-center justify-center p-2 text-center text-white">
                                <div className="relative mb-1">
                                  <div className="absolute -inset-1.5 bg-amber-400 rounded-full blur-xs opacity-60 animate-pulse" />
                                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white">
                                    <Lock className="w-5 h-5 stroke-[2.5]" />
                                  </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                                  Visual Lock Seal
                                </span>
                                <span className="text-[9px] text-amber-100 font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/30 mt-0.5">
                                  🎁 Tap to Bribe Owner
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                        <span>By {capsule.authorName}</span>
                        {isUnlockedForMe ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-amber-800 font-bold flex items-center gap-0.5">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Sealed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {familyPosts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <span className="text-4xl">🔥</span>
              <p className="text-xs font-bold text-slate-700">No family streaks posted yet.</p>
              <p className="text-[11px]">Use the "Post Streak" button at the top to share photos with the family room!</p>
            </div>
          ) : (
            familyPosts.map((post) => {
              const isAuthor = post.authorCode === currentSession.userCode || post.authorId === currentSession.userCode;
              const hasViewedOnce = post.isViewOnce && post.disappearedFor?.includes(currentSession.userCode);
              const isUnviewedSnap = post.isViewOnce && !isAuthor && !hasViewedOnce;

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition"
                >
                  <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{post.authorName}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.2 bg-[#0F5132]/10 text-[#0F5132] font-semibold rounded-full">
                            {post.authorCode}
                          </span>
                          {post.isViewOnce && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                              <EyeOff className="w-3 h-3 text-amber-700" />
                              View-Once
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{post.locationTag || "Hyderabad"}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1">
                        🔥 {post.streakCount}d
                      </span>

                      {/* Instant Delete Streak Option for Author */}
                      {isAuthor && onDeletePost && (
                        <button
                          type="button"
                          onClick={() => onDeletePost(post.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete this streak permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Media Rendering: View-Once Disappeared vs Unviewed Snap vs Normal Photo */}
                  {hasViewedOnce ? (
                    <div className="p-8 aspect-video max-h-[360px] bg-slate-900 flex flex-col items-center justify-center text-center space-y-2 text-white">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center border border-slate-700 shadow-xs">
                        <EyeOff className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="text-xs font-bold text-amber-300">View-Once Media Disappeared</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        You opened this family streak and it permanently self-destructed.
                      </p>
                    </div>
                  ) : isUnviewedSnap ? (
                    <div
                      onClick={() => setSnapViewingPost(post)}
                      className="relative aspect-video max-h-[360px] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/70 flex flex-col items-center justify-center p-6 text-center text-white cursor-pointer group hover:border-amber-500/50 transition overflow-hidden"
                    >
                      <div className="w-14 h-14 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition shadow-lg mb-2">
                        <Flame className="w-8 h-8 animate-bounce text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                          Snapchat Style
                        </span>
                        <h4 className="text-sm font-black text-white">1-Time View-Once Streak</h4>
                        <p className="text-xs text-slate-300">Tap to open • {post.viewDurationSeconds || 7}s timer before self-destruct</p>
                      </div>
                      <button
                        type="button"
                        className="mt-3 px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
                      >
                        Tap to Open 🔥
                      </button>
                    </div>
                  ) : post.photoUrl ? (
                    <div className="relative aspect-video max-h-[360px] bg-slate-950 overflow-hidden">
                      <img
                        src={post.photoUrl}
                        alt="Family streak update"
                        className="w-full h-full object-cover"
                      />
                      {post.isViewOnce && isAuthor && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-xs border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>View-Once • Opened by {post.viewedBy?.length || 0}</span>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="p-4 space-y-3">
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                      {post.note}
                    </p>

                    {post.quote && (
                      <div className="p-3 rounded-2xl bg-slate-50 border-l-4 border-[#0F5132] text-xs italic text-slate-700 flex items-start gap-2">
                        <Quote className="w-3.5 h-3.5 text-[#0F5132] shrink-0 mt-0.5" />
                        <span>"{post.quote}"</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => onLikePost && onLikePost(post.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Heart className="w-4 h-4 hover:fill-rose-500" />
                        <span>{post.likes?.length || 0} Likes</span>
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Family Room Exclusive
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
      ) : (
        /* Protected Vault Screen (Protected by PIN) */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {!isVaultUnlocked ? (
            /* PIN Lock Prompt */
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-sm w-full bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-lg space-y-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 stroke-[2.2]" />
                </div>

                <div>
                  <h3 className="text-base font-black text-[#0F172A]">Protected Private Vault</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your security PIN to access saved private family messages.
                  </p>
                </div>

                <form onSubmit={handleVerifyPin} className="space-y-3">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Enter PIN (Default: 1234)"
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError("");
                    }}
                    className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
                  />

                  {pinError && (
                    <p className="text-xs font-semibold text-rose-600">{pinError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    Unlock Private Vault
                  </button>
                </form>
              </motion.div>
            </div>
          ) : (
            /* Unlocked Vault Feed */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Vault Unlocked ({vaultMessages.length} Protected Items)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsChangingPin(!isChangingPin)}
                    className="text-xs text-slate-500 hover:text-[#0F5132] font-semibold cursor-pointer"
                  >
                    Change PIN
                  </button>
                  <button
                    onClick={() => {
                      setIsVaultUnlocked(false);
                      setEnteredPin("");
                    }}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Lock Vault
                  </button>
                </div>
              </div>

              {/* Change PIN Box */}
              {isChangingPin && (
                <form onSubmit={handleSaveNewPin} className="p-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="New 4-digit PIN"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#0F5132] text-white text-xs font-bold rounded-xl"
                  >
                    Update
                  </button>
                </form>
              )}

              {/* Vault Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {vaultMessages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <span className="text-4xl">🔐</span>
                    <p className="text-xs font-semibold">Your Private Vault is empty.</p>
                    <p className="text-[11px]">
                      Go to the Family Room, long-press any message, and choose "Add to Private".
                    </p>
                  </div>
                ) : (
                  vaultMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-slate-900">{msg.senderName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFromPrivate(msg)}
                          title="Restore back to public Family Room"
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Remove from Vault
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 font-medium">
                        {msg.text}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Protected by Personal Security PIN</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Long-Press Action Modal / Context Menu */}
      <AnimatePresence>
        {contextMenuMsg && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-black text-slate-900">Message Options</h4>
                <button
                  onClick={() => setContextMenuMsg(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 max-h-24 overflow-y-auto">
                <span className="font-bold text-slate-900 block mb-0.5">{contextMenuMsg.senderName}:</span>
                "{contextMenuMsg.text}"
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {!contextMenuMsg.isPrivate ? (
                  <button
                    onClick={() => handleAddToPrivate(contextMenuMsg)}
                    className="w-full py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>Add to Private (Protected Vault)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRemoveFromPrivate(contextMenuMsg)}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Move to Public Family Room</span>
                  </button>
                )}

                <button
                  onClick={() => setContextMenuMsg(null)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SNAPCHAT-STYLE 1-TIME VIEW-ONCE STREAK MODAL */}
      <SnapViewOnceModal
        post={snapViewingPost}
        isOpen={!!snapViewingPost}
        onClose={() => setSnapViewingPost(null)}
        onSelfDestruct={(postId) => {
          if (onMarkViewOnceViewed) {
            onMarkViewOnceViewed(postId);
          }
        }}
      />

      {/* INTERACTIVE SEALED TIME CAPSULE & BRIBE MODAL */}
      <SealedTimeCapsuleBribeModal
        isOpen={!!bribingCapsule}
        capsule={bribingCapsule}
        currentSession={currentSession}
        onClose={() => setBribingCapsule(null)}
        onSubmitBribe={async (capsuleId, message) => {
          if (onRequestTimeCapsuleUnlock) {
            await onRequestTimeCapsuleUnlock(capsuleId, message);
          }
        }}
      />
    </div>
  );
};
