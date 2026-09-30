import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Sparkles, MapPin, Smile, Ghost, Users, Clock, Flame } from "lucide-react";
import { StoryNote, UserAuthSession } from "../types";

interface InstagramNotesBarProps {
  notes: StoryNote[];
  currentSession: UserAuthSession;
  onPostNote: (note: { 
    note: string; 
    emoji: string; 
    location?: string;
    isGhost?: boolean;
    targetAudience?: 'family' | 'connectors' | 'all';
  }) => void;
  isTriggerModalOpen?: boolean;
  onCloseTriggerModal?: () => void;
}

const QUICK_EMOJIS = ["☕", "🌟", "🥘", "🚀", "❤️", "🏡", "✈️", "🌴", "💪", "😴", "👻", "🎉"];

export const InstagramNotesBar: React.FC<InstagramNotesBarProps> = ({
  notes,
  currentSession,
  onPostNote,
  isTriggerModalOpen = false,
  onCloseTriggerModal,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = internalModalOpen || isTriggerModalOpen;

  const [noteText, setNoteText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("☕");
  const [locationText, setLocationText] = useState("Uppal Cafe");
  const [isGhostNote, setIsGhostNote] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<'family' | 'connectors' | 'all'>('family');

  const myNote = notes.find((n) => n.authorCode === currentSession.userCode);
  const otherNotes = notes.filter((n) => n.authorCode !== currentSession.userCode);

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (onCloseTriggerModal) onCloseTriggerModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    onPostNote({
      note: noteText.trim(),
      emoji: isGhostNote ? (selectedEmoji === "☕" ? "👻" : selectedEmoji) : selectedEmoji,
      location: locationText.trim() || undefined,
      isGhost: isGhostNote,
      targetAudience: selectedAudience,
    });

    setNoteText("");
    setIsGhostNote(false);
    handleCloseModal();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h left`;
    return `${mins}m left`;
  };

  return (
    <div className="w-full bg-[#FFFFFF] border-b border-slate-100 py-3.5 px-4">
      {/* Header Label / Status Indicator */}
      <div className="flex items-center justify-between pb-2 mb-1 px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#0F5132]" />
          <span>Active 24h & Ghost Notes</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          Unified Family & Connectors Bar
        </span>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto scrollbar-none pb-1">
        {/* Current User Note / Add Note Bubble */}
        <div className="flex flex-col items-center shrink-0 cursor-pointer group">
          <div className="relative" onClick={() => setInternalModalOpen(true)}>
            {/* Note Bubble (Instagram Cloud Shape) */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`absolute -top-3.5 left-1/2 -translate-x-1/2 shadow-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold max-w-[100px] truncate flex items-center gap-1 z-10 ${
                myNote?.isGhost 
                  ? "bg-purple-900 text-purple-100 border border-purple-400 shadow-purple-500/20" 
                  : "bg-[#FFFFFF] text-slate-900 border border-slate-200/90"
              }`}
            >
              <span>{myNote ? myNote.emoji : "💬"}</span>
              <span className="truncate">{myNote ? myNote.note : "Add note..."}</span>
              {myNote?.isGhost && <Ghost className="w-2.5 h-2.5 text-purple-300 animate-pulse shrink-0" />}
            </motion.div>

            {/* Avatar with Story Ring (Purple glowing ring for ghost, emerald for normal) */}
            <div className={`w-14 h-14 rounded-full p-0.5 mt-3 transition ${
              myNote?.isGhost 
                ? "bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-600 ring-2 ring-purple-300 animate-pulse" 
                : "bg-gradient-to-tr from-[#0F5132] via-emerald-400 to-[#0F5132]"
            }`}>
              <img
                src={currentSession.avatar}
                alt={currentSession.name}
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
            </div>

            {/* Small Plus Overlay */}
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
              myNote?.isGhost ? "bg-purple-600 text-white" : "bg-[#0F5132] text-white"
            }`}>
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-800 mt-1 max-w-[70px] truncate text-center">
            {myNote?.isGhost ? "👻 Ghost" : "Your note"}
          </span>
        </div>

        {/* Other Members & Connectors Notes */}
        {otherNotes.map((item) => (
          <div key={item.id} className="flex flex-col items-center shrink-0 cursor-pointer group">
            <div className="relative">
              {/* Floating Instagram-style Note Bubble */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 shadow-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold max-w-[105px] truncate flex items-center gap-1 z-10 ${
                  item.isGhost
                    ? "bg-purple-950 text-purple-100 border border-purple-400 shadow-purple-600/30"
                    : "bg-[#FFFFFF] text-slate-900 border border-slate-200"
                }`}
                title={`${item.authorName}: ${item.note}${item.location ? ` at ${item.location}` : ""} (${getTimeRemaining(item.expiresAt)})`}
              >
                <span>{item.emoji}</span>
                <span className="truncate">{item.note}</span>
                {item.isGhost && <Ghost className="w-2.5 h-2.5 text-purple-300 shrink-0" />}
              </motion.div>

              {/* Avatar with Emerald Active Story Ring (or purple for ghost) */}
              <div className={`w-14 h-14 rounded-full p-0.5 mt-3 ${
                item.isGhost 
                  ? "bg-gradient-to-tr from-purple-600 via-fuchsia-400 to-indigo-600 ring-2 ring-purple-300"
                  : "bg-gradient-to-tr from-[#0F5132] via-emerald-300 to-[#0F5132]"
              }`}>
                <img
                  src={item.authorAvatar}
                  alt={item.authorName}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] font-medium text-slate-700 max-w-[60px] truncate text-center">
                {item.authorName.split(" ")[0]}
              </span>
              {item.isGhost && (
                <span className="text-[9px] font-mono text-purple-700 bg-purple-100 px-1 rounded-sm font-bold">
                  1h
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Post a Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-3xl max-w-sm w-full p-5 border shadow-2xl relative transition ${
                isGhostNote ? "bg-slate-950 text-white border-purple-500/50" : "bg-[#FFFFFF] text-slate-900 border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2">
                {/* Note Bubble Preview above Avatar */}
                <div className="inline-block relative mb-3">
                  <div className={`px-4 py-1.5 rounded-2xl shadow-sm text-xs font-bold flex items-center gap-1.5 mb-2 ${
                    isGhostNote 
                      ? "bg-purple-900/80 border border-purple-400 text-purple-100" 
                      : "bg-slate-50 border border-slate-200 text-slate-900"
                  }`}>
                    <span className="text-base">{selectedEmoji}</span>
                    <span>{noteText || (isGhostNote ? "Drop a secret ghost note..." : "Share a thought...")}</span>
                    {isGhostNote && <Ghost className="w-3 h-3 text-purple-300" />}
                  </div>
                  <div className={`w-16 h-16 rounded-full mx-auto p-0.5 border-2 ${
                    isGhostNote ? "border-purple-400 ring-2 ring-purple-500/50" : "border-[#0F5132]"
                  }`}>
                    <img
                      src={currentSession.avatar}
                      alt={currentSession.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                <h3 className="text-base font-black">
                  {isGhostNote ? "Drop a Secret Ghost Note" : "Share a 24h Note"}
                </h3>
                <p className={`text-xs mt-0.5 ${isGhostNote ? "text-purple-300" : "text-slate-500"}`}>
                  {isGhostNote ? "Self-destructs automatically after 1 hour! 👻" : "Visible for 24 hours to your selected audience."}
                </p>
              </div>

              {/* AUDIENCE SELECTOR POPUP */}
              <div className="mt-4 pt-3 border-t border-slate-200/20">
                <label className={`text-[11px] font-bold block mb-1.5 ${isGhostNote ? "text-purple-200" : "text-slate-700"}`}>
                  Who can see this?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAudience('family')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      selectedAudience === 'family'
                        ? "bg-[#0F5132] text-white border-[#0F5132] shadow-xs"
                        : isGhostNote
                        ? "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Share to Family</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAudience('connectors')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      selectedAudience === 'connectors'
                        ? "bg-[#0F5132] text-white border-[#0F5132] shadow-xs"
                        : isGhostNote
                        ? "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Share to Connectors</span>
                  </button>
                </div>
              </div>

              {/* GHOST NOTE TOGGLE SWITCH */}
              <div className={`mt-3 p-3 rounded-2xl border flex items-center justify-between transition ${
                isGhostNote ? "bg-purple-950/60 border-purple-500/50" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
                    <Ghost className="w-4 h-4" />
                  </span>
                  <div>
                    <span className={`text-xs font-bold block ${isGhostNote ? "text-purple-200" : "text-slate-800"}`}>
                      Ghost Note (1h Self-Destruct)
                    </span>
                    <span className="text-[10px] text-slate-400 block">Vanishes forever after 60 mins</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGhostNote}
                    onChange={(e) => {
                      setIsGhostNote(e.target.checked);
                      if (e.target.checked) setSelectedEmoji("👻");
                      else setSelectedEmoji("☕");
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                {/* Text Note Input */}
                <div>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder={isGhostNote ? "Secret note (vanishes in 1 hour)..." : "e.g., At Uppal Cafe ☕"}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl focus:outline-hidden font-medium border ${
                      isGhostNote
                        ? "bg-slate-900 border-purple-500/40 text-purple-100 placeholder:text-purple-400/50 focus:ring-2 focus:ring-purple-400"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F5132]"
                    }`}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 px-1 mt-1 font-mono">
                    <span>Max 60 characters</span>
                    <span>{noteText.length}/60</span>
                  </div>
                </div>

                {/* Emoji Bar */}
                <div>
                  <label className={`text-[11px] font-semibold block mb-1 ${isGhostNote ? "text-purple-200" : "text-slate-700"}`}>
                    Choose vibe emoji:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`text-lg p-1.5 rounded-xl transition ${
                          selectedEmoji === emoji 
                            ? isGhostNote ? "bg-purple-600/40 ring-2 ring-purple-400" : "bg-[#0F5132]/10 ring-2 ring-[#0F5132]" 
                            : "hover:bg-slate-100/10"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Tag */}
                <div>
                  <label className={`text-[11px] font-semibold block mb-1 ${isGhostNote ? "text-purple-200" : "text-slate-700"}`}>
                    Location (Optional):
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad, Uppal Cafe"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl focus:outline-hidden border ${
                        isGhostNote
                          ? "bg-slate-900 border-purple-500/40 text-purple-100 placeholder:text-purple-400/50 focus:ring-2 focus:ring-purple-400"
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-[#0F5132]"
                      }`}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer ${
                    isGhostNote
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                      : "bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-50 text-white"
                  }`}
                >
                  {isGhostNote ? "Post 1-Hour Ghost Note 👻" : "Share 24h Note"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
