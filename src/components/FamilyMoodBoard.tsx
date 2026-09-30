import React, { useState, useRef } from "react";
import { 
  HeartHandshake, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  Send, 
  Smile, 
  Play, 
  Pause, 
  X, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Upload, 
  Camera, 
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Pin
} from "lucide-react";
import { FamilyMember, FamilyMoodNote, MoodType, LiveStatusType } from "../types";
import { startAudioRecording, AudioRecorderController, generateSyntheticAudioNote } from "../lib/audioRecorder";

interface FamilyMoodBoardProps {
  currentMember: FamilyMember;
  members?: FamilyMember[];
  notes: FamilyMoodNote[];
  onAddNote: (noteData: {
    authorId: string;
    content: string;
    mood: MoodType;
    imageUrl?: string;
    audioSnippetUrl?: string;
    audioDuration?: number;
  }) => void;
  onAddComment: (noteId: string, authorId: string, content: string) => void;
  onToggleReaction: (noteId: string, emoji: string, userId: string) => void;
  onTogglePinNote: (noteId: string) => void;
  onUpdateLiveStatus?: (memberId: string, status: LiveStatusType, label: string, emoji: string, customNote?: string) => void;
}

const MOODS: { id: MoodType; label: string; emoji: string; color: string }[] = [
  { id: "joyful", label: "Joyful", emoji: "😊", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "peaceful", label: "Peaceful", emoji: "😌", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "cooking", label: "Cooking / Food", emoji: "🍲", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { id: "excited", label: "Excited", emoji: "🎉", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "busy", label: "Busy at Work", emoji: "💼", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "stressed", label: "Need Support", emoji: "⚡", color: "bg-red-100 text-red-800 border-red-300" },
  { id: "missing-home", label: "Missing Home", emoji: "🏡", color: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "casual", label: "Casual Check-in", emoji: "☕", color: "bg-stone-100 text-stone-800 border-stone-300" },
];

export const FamilyMoodBoard: React.FC<FamilyMoodBoardProps> = ({
  currentMember,
  members = [],
  notes,
  onAddNote,
  onAddComment,
  onToggleReaction,
  onTogglePinNote,
  onUpdateLiveStatus,
}) => {
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodType>("joyful");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; duration: number } | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [playingSnippetId, setPlayingSnippetId] = useState<string | null>(null);
  const [activeTabMood, setActiveTabMood] = useState<string>("all");
  const [customStatusNote, setCustomStatusNote] = useState("");
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRecorderRef = useRef<AudioRecorderController | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const audioSnippetPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Handle Image File Upload (Camera or File Picker)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Voice Recording Snippet
  const handleStartVoiceRecord = async () => {
    try {
      setRecordingSeconds(0);
      setIsRecordingAudio(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      const controller = await startAudioRecording((level) => {
        setAudioLevel(level);
      });
      audioRecorderRef.current = controller;
    } catch (err) {
      console.warn("Microphone not available, using synthetic voice snippet fallback:", err);
      // Fast fallback snippet
      const fallback = generateSyntheticAudioNote("Family voice check-in");
      setRecordedAudio({ url: fallback.dataUrl, duration: fallback.duration });
      setIsRecordingAudio(false);
    }
  };

  // Stop Voice Recording Snippet
  const handleStopVoiceRecord = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (audioRecorderRef.current) {
      const result = await audioRecorderRef.current.stop();
      setRecordedAudio({ url: result.dataUrl, duration: result.duration });
      audioRecorderRef.current = null;
    }
    setIsRecordingAudio(false);
  };

  const handleCancelVoiceRecord = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancel();
      audioRecorderRef.current = null;
    }
    setRecordedAudio(null);
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  // Submit Note
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() && !selectedImage && !recordedAudio) return;

    onAddNote({
      authorId: currentMember.id,
      content: newNoteContent.trim(),
      mood: selectedMood,
      imageUrl: selectedImage || undefined,
      audioSnippetUrl: recordedAudio?.url || undefined,
      audioDuration: recordedAudio?.duration || undefined,
    });

    // Reset Form
    setNewNoteContent("");
    setSelectedImage(null);
    setRecordedAudio(null);
    setRecordingSeconds(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Play/Pause Voice Snippet Inline
  const handleTogglePlaySnippet = (snippetId: string, url?: string) => {
    if (playingSnippetId === snippetId) {
      audioSnippetPlayerRef.current?.pause();
      setPlayingSnippetId(null);
      return;
    }

    if (audioSnippetPlayerRef.current) {
      audioSnippetPlayerRef.current.pause();
    }

    if (!url) return;

    const audio = new Audio(url);
    audioSnippetPlayerRef.current = audio;
    setPlayingSnippetId(snippetId);

    audio.play().catch(() => {
      setPlayingSnippetId(null);
    });

    audio.onended = () => {
      setPlayingSnippetId(null);
    };
  };

  // Submit Comment on Note
  const handleSendComment = (noteId: string) => {
    const text = (commentInputs[noteId] || "").trim();
    if (!text) return;
    onAddComment(noteId, currentMember.id, text);
    setCommentInputs((prev) => ({ ...prev, [noteId]: "" }));
  };

  const sortedNotes = [...notes].sort((a, b) => {
    // Pinned notes always remain at the top for all family members
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) {
      return new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pinnedNotesCount = notes.filter((n) => n.isPinned).length;

  const filteredNotes = activeTabMood === "all"
    ? sortedNotes
    : activeTabMood === "pinned"
    ? sortedNotes.filter((n) => n.isPinned)
    : sortedNotes.filter((n) => n.mood === activeTabMood);

  return (
    <div className="space-y-6">
      {/* Top Banner / Mood Board Introduction */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">Family Mood Board</h2>
              <p className="text-xs text-stone-600">
                Live multimedia family thoughts, captured moments, and audio snippets synced across all devices.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-800 bg-white px-3 py-1.5 rounded-xl border border-amber-200 self-start sm:self-auto">
            <span>Posting as:</span>
            <img src={currentMember.avatar} alt={currentMember.name} className="w-4 h-4 rounded-full object-cover" />
            <span>{currentMember.name} ({currentMember.relationship})</span>
          </div>
        </div>
      </div>

      {/* 2. Family Live Status & Radar Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Family Status Radar</span>
            </h3>
            <p className="text-xs text-stone-500">Real-time availability, mood, and daily check-ins for all household members</p>
          </div>

          {/* Quick status updater button */}
          <button
            id="toggle-status-picker-btn"
            onClick={() => setIsStatusPickerOpen(!isStatusPickerOpen)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition self-start sm:self-auto"
          >
            <Smile className="w-3.5 h-3.5 text-amber-700" />
            <span>Update My Status</span>
            <span className="ml-1 text-sm">{currentMember.liveStatus?.emoji || "😊"}</span>
          </button>
        </div>

        {/* Status Picker Panel */}
        {isStatusPickerOpen && (
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 animate-in fade-in duration-150">
            <div className="text-xs font-bold text-stone-800">Choose your status preset:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { status: "happy" as const, label: "Happy", emoji: "😊", color: "hover:border-emerald-400" },
                { status: "busy" as const, label: "Busy", emoji: "🔴", color: "hover:border-rose-400" },
                { status: "tired" as const, label: "Tired", emoji: "🟡", color: "hover:border-amber-400" },
                { status: "sick" as const, label: "Under Weather", emoji: "🤒", color: "hover:border-purple-400" },
                { status: "cooking" as const, label: "Cooking", emoji: "🍲", color: "hover:border-orange-400" },
                { status: "traveling" as const, label: "Traveling", emoji: "✈️", color: "hover:border-blue-400" },
              ].map((preset) => (
                <button
                  key={preset.status}
                  id={`status-preset-${preset.status}`}
                  onClick={() => {
                    if (onUpdateLiveStatus) {
                      onUpdateLiveStatus(currentMember.id, preset.status, preset.label, preset.emoji, customStatusNote);
                    }
                    setIsStatusPickerOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-stone-200 ${preset.color} hover:bg-stone-100/80 transition text-center shadow-2xs`}
                >
                  <span className="text-xl">{preset.emoji}</span>
                  <span className="text-xs font-bold text-stone-800 mt-1">{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                id="custom-status-note-input"
                type="text"
                placeholder="Optional short note (e.g., 'Back by 7 PM', 'In team presentation')..."
                value={customStatusNote}
                onChange={(e) => setCustomStatusNote(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                id="submit-status-note-btn"
                onClick={() => {
                  if (onUpdateLiveStatus) {
                    const current = currentMember.liveStatus || { status: "happy" as const, label: "Happy", emoji: "😊" };
                    onUpdateLiveStatus(currentMember.id, current.status, current.label, current.emoji, customStatusNote);
                  }
                  setIsStatusPickerOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Member Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {members.map((member) => {
            const status = member.liveStatus || {
              status: "happy" as const,
              label: "Available",
              emoji: "😊",
              customNote: "",
            };

            const statusColors: Record<string, string> = {
              happy: "bg-emerald-50 text-emerald-800 border-emerald-200",
              busy: "bg-rose-50 text-rose-800 border-rose-200",
              tired: "bg-amber-50 text-amber-800 border-amber-200",
              sick: "bg-purple-50 text-purple-800 border-purple-200",
              cooking: "bg-orange-50 text-orange-800 border-orange-200",
              traveling: "bg-blue-50 text-blue-800 border-blue-200",
            };

            return (
              <div
                key={member.id}
                id={`live-status-card-${member.id}`}
                className="bg-stone-50/70 rounded-2xl border border-stone-200 p-3 flex items-start space-x-3 hover:bg-stone-50 transition"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                  />
                  <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full p-0.5 shadow-2xs leading-none">
                    {status.emoji}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{member.name}</h4>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {member.isOnline ? "Online" : "Away"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        statusColors[status.status] || statusColors.happy
                      }`}
                    >
                      {status.emoji} {status.label}
                    </span>
                  </div>
                  {status.customNote && (
                    <p className="text-[11px] text-stone-600 mt-1 truncate italic">
                      "{status.customNote}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note Creation Form Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
        <form onSubmit={handleSubmitNote} className="space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={currentMember.avatar}
              alt={currentMember.name}
              className="w-9 h-9 rounded-full object-cover border border-stone-200 flex-shrink-0"
            />
            <div className="flex-1">
              <span className="text-xs font-semibold text-stone-900 block">
                {currentMember.name} • {currentMember.relationship}
              </span>
              <span className="text-[11px] text-stone-400">Share your current mood, photo, or voice snippet...</span>
            </div>
          </div>

          {/* Mood Tag Selector */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-2">How are you feeling right now?</label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    id={`mood-chip-${m.id}`}
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      isSelected
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Text Input */}
          <div>
            <textarea
              id="mood-note-textarea"
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="What's happening? (e.g. 'Dinner is ready!', 'Traffic delay on highway', 'Missing everyone at home')..."
              className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Image Preview if selected */}
          {selectedImage && (
            <div className="relative inline-block border border-stone-200 rounded-xl overflow-hidden max-w-sm">
              <img src={selectedImage} alt="Upload preview" className="max-h-48 object-cover rounded-xl" />
              <button
                type="button"
                id="remove-selected-image-btn"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-stone-900/80 hover:bg-stone-900 text-white p-1 rounded-full shadow transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Voice Snippet Recorder & Preview */}
          {isRecordingAudio && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span className="text-xs font-semibold text-red-900">
                  Recording Voice Snippet... {recordingSeconds}s
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="stop-recording-snippet-btn"
                  onClick={handleStopVoiceRecord}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                >
                  Done
                </button>
                <button
                  type="button"
                  id="cancel-recording-snippet-btn"
                  onClick={handleCancelVoiceRecord}
                  className="px-2 py-1 text-xs text-red-700 hover:text-red-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {recordedAudio && !isRecordingAudio && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-medium text-stone-800">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>Voice Snippet attached ({recordedAudio.duration}s)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="test-play-recorded-audio-btn"
                  onClick={() => handleTogglePlaySnippet("preview-snippet", recordedAudio.url)}
                  className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium flex items-center space-x-1"
                >
                  {playingSnippetId === "preview-snippet" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{playingSnippetId === "preview-snippet" ? "Pause" : "Test Play"}</span>
                </button>
                <button
                  type="button"
                  id="remove-recorded-audio-btn"
                  onClick={() => setRecordedAudio(null)}
                  className="text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Form Actions bar */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <div className="flex items-center space-x-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="mood-image-upload-input"
              />
              <button
                type="button"
                id="attach-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl transition"
              >
                <Camera className="w-3.5 h-3.5 text-stone-500" />
                <span>Add Photo</span>
              </button>

              <button
                type="button"
                id="record-voice-snippet-btn"
                disabled={isRecordingAudio}
                onClick={handleStartVoiceRecord}
                className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl border transition ${
                  recordedAudio
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 border-stone-200"
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-stone-500" />
                <span>{recordedAudio ? "Re-record Voice" : "Voice Note"}</span>
              </button>
            </div>

            <button
              type="submit"
              id="publish-mood-note-btn"
              disabled={!newNoteContent.trim() && !selectedImage && !recordedAudio}
              className="flex items-center space-x-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post to Family</span>
            </button>
          </div>
        </form>
      </div>

      {/* Mood Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          id="filter-mood-all-btn"
          onClick={() => setActiveTabMood("all")}
          className={`text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
            activeTabMood === "all" ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"
          }`}
        >
          All Notes ({notes.length})
        </button>
        {pinnedNotesCount > 0 && (
          <button
            id="filter-mood-pinned-btn"
            onClick={() => setActiveTabMood("pinned")}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap flex items-center space-x-1.5 transition ${
              activeTabMood === "pinned"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Pin className="w-3 h-3 fill-current rotate-45" />
            <span>Pinned ({pinnedNotesCount})</span>
          </button>
        )}
        {MOODS.map((m) => (
          <button
            key={m.id}
            id={`filter-mood-${m.id}-btn`}
            onClick={() => setActiveTabMood(m.id)}
            className={`text-xs px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap flex items-center space-x-1 transition ${
              activeTabMood === m.id ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"
            }`}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Notes Stream */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 shadow-sm">
            <HeartHandshake className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold">No notes in this category yet</p>
            <p className="text-xs text-stone-400 mt-1">Be the first to share a note with the family above!</p>
          </div>
        ) : (
          filteredNotes
            .filter((note, index, self) => self.findIndex((n) => n.id === note.id) === index)
            .map((note) => {
            const moodConfig = MOODS.find((m) => m.id === note.mood) || MOODS[0];
            const isPlayingSnippet = playingSnippetId === note.id;

            return (
              <div
                key={note.id}
                id={`mood-note-card-${note.id}`}
                className={`rounded-2xl border p-5 shadow-sm space-y-3.5 transition-all ${
                  note.isPinned
                    ? "bg-amber-50/20 border-amber-300 ring-1 ring-amber-300/50"
                    : "bg-white border-stone-200"
                }`}
              >
                {/* Pinned Note Banner */}
                {note.isPinned && (
                  <div className="flex items-center justify-between bg-amber-100/70 border border-amber-200/80 rounded-xl px-3 py-1.5 text-xs text-amber-950 font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <Pin className="w-3.5 h-3.5 fill-amber-700 text-amber-700 rotate-45" />
                      <span>PINNED ANNOUNCEMENT</span>
                      {note.pinnedBy && (
                        <span className="text-amber-800 font-normal hidden sm:inline">• Pinned by {note.pinnedBy}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-700 font-mono">Kept at top</span>
                  </div>
                )}

                {/* Note Author Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={note.authorAvatar}
                      alt={note.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-sm font-bold text-stone-900 truncate">{note.authorName}</h4>
                        <span className="text-xs text-stone-500 capitalize">({note.authorRelationship})</span>
                        {note.authorRole === "admin" && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full flex items-center space-x-0.5">
                            <ShieldCheck className="w-3 h-3 inline" />
                            <span>Admin</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Mood Pill */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Pin / Unpin Button */}
                    <button
                      id={`pin-note-btn-${note.id}`}
                      type="button"
                      onClick={() => onTogglePinNote(note.id)}
                      title={note.isPinned ? "Unpin this note" : "Pin this note to stay at the top for everyone"}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        note.isPinned
                          ? "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 font-bold shadow-2xs"
                          : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Pin className={`w-3 h-3 ${note.isPinned ? "fill-amber-700 text-amber-700 rotate-45" : "text-stone-400"}`} />
                      <span className="hidden sm:inline">{note.isPinned ? "Pinned" : "Pin"}</span>
                    </button>

                    {/* Mood Pill */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${moodConfig.color}`}>
                      <span>{moodConfig.emoji}</span>
                      <span className="hidden sm:inline">{moodConfig.label}</span>
                    </div>
                  </div>
                </div>

                {/* Content Text */}
                {note.content && (
                  <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}

                {/* Inline Image Upload View */}
                {note.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-stone-200 max-h-96">
                    <img
                      src={note.imageUrl}
                      alt="Family moment"
                      className="w-full h-auto object-cover max-h-96"
                    />
                  </div>
                )}

                {/* Voice Record Snippet Audio Player */}
                {note.audioSnippetUrl && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        id={`play-snippet-${note.id}`}
                        onClick={() => handleTogglePlaySnippet(note.id, note.audioSnippetUrl)}
                        className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition shadow-xs"
                      >
                        {isPlayingSnippet ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                      <div>
                        <div className="text-xs font-semibold text-amber-950 flex items-center space-x-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Voice Snippet from {note.authorName}</span>
                        </div>
                        <span className="text-[10px] text-amber-800/80">
                          Duration: {note.audioDuration || 6} seconds
                        </span>
                      </div>
                    </div>

                    {/* Visual audio bars */}
                    <div className="flex items-center space-x-1 h-5 mr-2">
                      {[1, 2, 3, 4, 5, 6].map((bar) => (
                        <span
                          key={bar}
                          className={`w-1 rounded-full ${
                            isPlayingSnippet ? "bg-amber-600 animate-pulse" : "bg-amber-300"
                          }`}
                          style={{ height: `${(bar % 3 + 1) * 5}px` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reactions bar */}
                <div className="flex items-center space-x-1.5 pt-2 border-t border-stone-100">
                  {["❤️", "😋", "👏", "🤗", "🙏"].map((emoji) => {
                    const count = (note.reactions?.[emoji] || []).length;
                    const hasReacted = (note.reactions?.[emoji] || []).includes(currentMember.id);

                    return (
                      <button
                        key={emoji}
                        id={`reaction-btn-${note.id}-${emoji}`}
                        onClick={() => onToggleReaction(note.id, emoji, currentMember.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs transition ${
                          hasReacted
                            ? "bg-amber-100 text-amber-900 font-bold border border-amber-300"
                            : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="text-[11px] ml-0.5">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Threaded Comments / Replies */}
                <div className="bg-stone-50/70 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Replies ({note.comments.length})</span>
                    </span>
                  </div>

                  {/* List comments */}
                  {note.comments.length > 0 && (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {note.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-2 text-xs">
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            className="w-5 h-5 rounded-full object-cover mt-0.5"
                          />
                          <div className="bg-white border border-stone-200/80 rounded-xl px-3 py-1.5 flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-stone-900">{comment.authorName}</span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-stone-700">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Reply Input */}
                  <div className="flex items-center space-x-2 pt-1">
                    <img
                      src={currentMember.avatar}
                      alt={currentMember.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <input
                      id={`comment-input-${note.id}`}
                      type="text"
                      placeholder="Write a family reply..."
                      value={commentInputs[note.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [note.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendComment(note.id);
                      }}
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      id={`send-comment-${note.id}`}
                      onClick={() => handleSendComment(note.id)}
                      className="p-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition"
                      title="Post Reply"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
