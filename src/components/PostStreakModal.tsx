import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Flame, Camera, MapPin, Quote, Users, Sparkles, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { SocialPost, UserAuthSession } from "../types";
import { uploadCompressedMedia } from "../lib/firebase";

interface PostStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserAuthSession;
  onSubmitPost: (post: {
    photoUrl?: string;
    note: string;
    quote?: string;
    locationTag?: string;
    targetAudience: 'family' | 'connectors' | 'all';
  }) => void;
}

const PRESET_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", label: "Cafe Outing ☕" },
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", label: "Dinner Table 🥘" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80", label: "Nature & Walk 🌴" },
  { url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80", label: "Workout 🏋️" },
];

export const PostStreakModal: React.FC<PostStreakModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSubmitPost,
}) => {
  const [targetAudience, setTargetAudience] = useState<'family' | 'connectors'>('family');
  const [photoUrl, setPhotoUrl] = useState(PRESET_PHOTOS[0].url);
  const [noteText, setNoteText] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [locationText, setLocationText] = useState("Hyderabad");
  const [isCompressing, setIsCompressing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const res = await uploadCompressedMedia(file, "streak_photos");
      if (res.success && res.url) {
        setPhotoUrl(res.url);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    onSubmitPost({
      photoUrl: photoUrl.trim() || undefined,
      note: noteText.trim(),
      quote: quoteText.trim() || undefined,
      locationTag: locationText.trim() || "Hyderabad",
      targetAudience,
    });

    setNoteText("");
    setQuoteText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <span className="p-2 rounded-2xl bg-amber-50 text-amber-600">
            <Flame className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900">Post Daily Life Streak</h3>
            <p className="text-xs text-slate-500">Share your daily adventures, photos & quotes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* AUDIENCE SELECTOR POPUP */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Select Audience Destination:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience('family')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  targetAudience === 'family'
                    ? "bg-[#0F5132] text-white border-[#0F5132] shadow-sm ring-1 ring-[#0F5132]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Share to Family</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('connectors')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  targetAudience === 'connectors'
                    ? "bg-[#0F5132] text-white border-[#0F5132] shadow-sm ring-1 ring-[#0F5132]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Share to Connectors</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {targetAudience === 'family' 
                ? "Will be routed exclusively to your Family Room Streaks feed."
                : "Will be routed exclusively to your Connectors Muchatlu feed."}
            </p>
          </div>

          {/* Photo Selection / URL */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Choose or Enter Photo:
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_PHOTOS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPhotoUrl(p.url)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition ${
                    photoUrl === p.url ? "border-[#0F5132] ring-2 ring-[#0F5132]/30" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#0F5132] bg-slate-50 flex items-center justify-center gap-2 text-xs font-medium text-slate-700 cursor-pointer transition">
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F5132]" />
                    <span>Compressing Media...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-[#0F5132]" />
                    <span>Capture / Upload from Gallery</span>
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

            <div className="relative">
              <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                placeholder="Or paste photo URL..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
              />
            </div>
          </div>

          {/* Note / Caption */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Caption / Daily Note:
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Filter coffee with family at Uppal Cafe! Great start to Sunday..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Daily Quote (Optional) */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Daily Quote / Motto (Optional):
            </label>
            <div className="relative">
              <Quote className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Keep smiling, life is beautiful."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
              />
            </div>
          </div>

          {/* Location Tag */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Location Tag:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Hyderabad, Uppal"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!noteText.trim()}
            className="w-full py-3 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Post Streak to {targetAudience === 'family' ? "Family Room" : "Connectors Hub"}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
