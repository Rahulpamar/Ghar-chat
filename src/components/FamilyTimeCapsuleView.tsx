import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Hourglass, 
  Lock, 
  Unlock, 
  Sparkles, 
  Calendar, 
  Plus, 
  X, 
  Image as ImageIcon, 
  Camera, 
  Heart, 
  PartyPopper, 
  ShieldCheck, 
  Users, 
  Flame, 
  Upload, 
  Loader2 
} from "lucide-react";
import confetti from "canvas-confetti";
import { TimeCapsule, UserAuthSession } from "../types";
import { uploadCompressedMedia } from "../lib/firebase";

interface FamilyTimeCapsuleViewProps {
  capsules: TimeCapsule[];
  currentSession: UserAuthSession;
  onCreateCapsule: (capsule: Omit<TimeCapsule, "id" | "createdAt" | "isUnlocked">) => Promise<void>;
  onUnlockCapsule?: (capsuleId: string) => Promise<void>;
}

const OCCASIONS = [
  { tag: "Diwali 🪔", defaultDate: "2026-11-08T00:00:00.000Z", label: "Diwali 2026" },
  { tag: "New Year 🎆", defaultDate: "2027-01-01T00:00:00.000Z", label: "New Year 2027" },
  { tag: "Birthday 🎂", defaultDate: "2026-12-15T00:00:00.000Z", label: "Birthday Special" },
  { tag: "Anniversary 💖", defaultDate: "2026-10-25T00:00:00.000Z", label: "Anniversary" },
  { tag: "Custom ⏳", defaultDate: "2026-12-31T23:59:59.000Z", label: "Custom Date" },
];

export const FamilyTimeCapsuleView: React.FC<FamilyTimeCapsuleViewProps> = ({
  capsules,
  currentSession,
  onCreateCapsule,
  onUnlockCapsule,
}) => {
  const [filter, setFilter] = useState<"all" | "locked" | "unlocked">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);

  // Create Capsule Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occasionTag, setOccasionTag] = useState(OCCASIONS[0].tag);
  const [unlockDate, setUnlockDate] = useState(OCCASIONS[0].defaultDate.slice(0, 10));
  const [targetAudience, setTargetAudience] = useState<"family" | "connectors">("family");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800&auto=format&fit=crop&q=80");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time countdown helper
  const calculateTimeLeft = (dateString: string) => {
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return { expired: true, text: "Ready to open!" };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    if (days > 0) return { expired: false, text: `${days}d ${hours}h left` };
    return { expired: false, text: `${hours}h ${minutes}m left` };
  };

  const filteredCapsules = capsules.filter((c) => {
    const isReady = new Date(c.unlockDate) <= new Date() || c.isUnlocked;
    if (filter === "locked") return !isReady;
    if (filter === "unlocked") return isReady;
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const result = await uploadCompressedMedia(file, "time_capsules");
      if (result.success && result.url) {
        setPhotoUrl(result.url);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !unlockDate) return;

    setIsSubmitting(true);
    try {
      const fullIsoDate = new Date(`${unlockDate}T12:00:00.000Z`).toISOString();
      await onCreateCapsule({
        title: title.trim(),
        description: description.trim(),
        photoUrl: photoUrl.trim() || undefined,
        authorId: currentSession.userCode,
        authorName: currentSession.name,
        authorAvatar: currentSession.avatar,
        targetAudience,
        unlockDate: fullIsoDate,
        occasionTag,
      });

      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCapsule = (capsule: TimeCapsule) => {
    setSelectedCapsule(capsule);
    const isReady = new Date(capsule.unlockDate) <= new Date() || capsule.isUnlocked;
    if (isReady) {
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
      if (onUnlockCapsule && !capsule.isUnlocked) {
        onUnlockCapsule(capsule.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center shadow-md">
            <Hourglass className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Family Time Capsule</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200 uppercase tracking-wider">
                Viral Memory Vault
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lock secret letters, memories & photos to unlock together on future festivals or dates.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Lock New Capsule</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filter === "all" ? "bg-[#0F5132] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Capsules ({capsules.length})
        </button>
        <button
          onClick={() => setFilter("locked")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === "locked" ? "bg-[#0F5132] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-300" />
          <span>Locked</span>
        </button>
        <button
          onClick={() => setFilter("unlocked")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === "unlocked" ? "bg-[#0F5132] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Unlock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Unlocked</span>
        </button>
      </div>

      {/* Grid of Capsules */}
      {filteredCapsules.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Hourglass className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800">No time capsules found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Drop a secret letter or photo sealed until Diwali 2026, New Year, or your family anniversary!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-bold hover:bg-[#0c4128] transition cursor-pointer"
          >
            Create Your First Capsule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCapsules.map((capsule) => {
            const timeLeft = calculateTimeLeft(capsule.unlockDate);
            const isUnlocked = capsule.isUnlocked || timeLeft.expired;

            return (
              <motion.div
                key={capsule.id}
                whileHover={{ y: -3 }}
                onClick={() => handleOpenCapsule(capsule)}
                className={`rounded-3xl border p-5 cursor-pointer relative overflow-hidden transition flex flex-col justify-between ${
                  isUnlocked
                    ? "bg-gradient-to-b from-amber-50/50 via-white to-white border-amber-200 shadow-sm hover:border-amber-400"
                    : "bg-[#FFFFFF] border-slate-200 shadow-xs hover:border-[#0F5132]/50 hover:shadow-md"
                }`}
              >
                {/* Occasion & Status Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-800">
                    {capsule.occasionTag}
                  </span>

                  {isUnlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                      <Unlock className="w-3 h-3 text-emerald-600" />
                      <span>Unlocked 🎉</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-mono font-bold border border-amber-200 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>{timeLeft.text}</span>
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="py-4 space-y-2.5 flex-1">
                  <h3 className="text-sm font-black text-slate-900 line-clamp-1">{capsule.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {isUnlocked ? capsule.description : "🔒 Content sealed until unlock date. Tap to view countdown details."}
                  </p>

                  {/* Thumbnail Preview */}
                  {capsule.photoUrl && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden mt-3 bg-slate-900">
                      <img
                        src={capsule.photoUrl}
                        alt="Time capsule"
                        className={`w-full h-full object-cover transition duration-300 ${
                          isUnlocked ? "" : "blur-md scale-105 opacity-60"
                        }`}
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                          <Lock className="w-6 h-6 text-amber-300 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Photo Sealed</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={capsule.authorAvatar}
                      alt={capsule.authorName}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-[11px] font-medium text-slate-700 truncate max-w-[110px]">
                      {capsule.authorName.split(" ")[0]}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(capsule.unlockDate).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE CAPSULE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <Hourglass className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Lock a Family Time Capsule</h3>
                  <p className="text-xs text-slate-500">Sealed memories that unlock together on a future date</p>
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                {/* Audience Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Who can unlock this capsule?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetAudience("family")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        targetAudience === "family"
                          ? "bg-[#0F5132] text-white border-[#0F5132] shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Share to Family</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetAudience("connectors")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        targetAudience === "connectors"
                          ? "bg-[#0F5132] text-white border-[#0F5132] shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Share to Connectors</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Capsule Title:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Diwali 2026 Secret Wishes & Child Memories"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
                  />
                </div>

                {/* Secret Message / Description */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Secret Message & Prayers (Sealed):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write your secret blessings, future goals, or heartfelt thoughts..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
                  />
                </div>

                {/* Occasion & Preset Dates */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Select Occasion Preset:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {OCCASIONS.map((occ) => (
                      <button
                        key={occ.tag}
                        type="button"
                        onClick={() => {
                          setOccasionTag(occ.tag);
                          setUnlockDate(occ.defaultDate.slice(0, 10));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border ${
                          occasionTag === occ.tag
                            ? "bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-300/40"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {occ.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unlock Date Picker */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Unlock Date (When the vault opens):
                  </label>
                  <input
                    type="date"
                    required
                    value={unlockDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
                  />
                </div>

                {/* Photo Attachment & Compression */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Attach Memory Photo (Compressed for Storage):
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#0F5132] bg-slate-50 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 cursor-pointer transition">
                      {isCompressing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#0F5132]" />
                          <span>Compressing Media...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-[#0F5132]" />
                          <span>Upload from Camera / Gallery</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="url"
                    placeholder="Or paste image URL directly..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-900"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="w-full py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? "Locking Capsule in Firestore..." : "Lock Memory Capsule 🔒"}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW SINGLE CAPSULE MODAL */}
      <AnimatePresence>
        {selectedCapsule && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedCapsule(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {(() => {
                const isReady = new Date(selectedCapsule.unlockDate) <= new Date() || selectedCapsule.isUnlocked;
                const timeLeft = calculateTimeLeft(selectedCapsule.unlockDate);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                        {selectedCapsule.occasionTag}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(selectedCapsule.unlockDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900">{selectedCapsule.title}</h3>

                    {isReady ? (
                      /* Unlocked Content View */
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                          <PartyPopper className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>This capsule is unlocked! Share the joy with family.</span>
                        </div>

                        {selectedCapsule.photoUrl && (
                          <div className="rounded-2xl overflow-hidden aspect-video bg-slate-950 shadow-xs">
                            <img
                              src={selectedCapsule.photoUrl}
                              alt="Unlocked capsule"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                          {selectedCapsule.description}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={selectedCapsule.authorAvatar}
                              alt={selectedCapsule.authorName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{selectedCapsule.authorName}</span>
                              <span className="text-[10px] text-slate-400">Created {new Date(selectedCapsule.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => confetti({ particleCount: 50, spread: 60 })}
                            className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Celebrate 🎉</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Locked Countdown View */
                      <div className="text-center py-6 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                          <Lock className="w-10 h-10 animate-bounce" />
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900">Vault Currently Sealed</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                            The secret message and photos inside will be revealed automatically on {new Date(selectedCapsule.unlockDate).toLocaleDateString()}.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-lg font-bold tracking-wider inline-block">
                          ⏳ {timeLeft.text}
                        </div>

                        <div className="text-xs text-slate-400">
                          Sealed by <strong className="text-slate-700">{selectedCapsule.authorName}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
