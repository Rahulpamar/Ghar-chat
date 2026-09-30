import React, { useState, useRef } from "react";
import { 
  Radio, 
  Lock, 
  Unlock, 
  Play, 
  Pause, 
  Sparkles, 
  FileText, 
  Send, 
  CheckCircle2, 
  Plus, 
  EyeOff, 
  ShieldAlert, 
  KeyRound, 
  Calendar, 
  IndianRupee, 
  Volume2, 
  VolumeX, 
  Gift,
  Clock,
  CheckSquare,
  Square
} from "lucide-react";
import { FamilyMember, FamilyPodcastEpisode, ConspiratorPlan } from "../types";
import { speakText, stopSpeaking } from "../lib/speechSynthesis";

interface HubExtrasViewProps {
  currentMember: FamilyMember;
  members: FamilyMember[];
  podcasts: FamilyPodcastEpisode[];
  conspiratorPlans: ConspiratorPlan[];
  onGeneratePodcast: () => Promise<void>;
  onSendConspiratorMessage: (planId: string, text: string) => void;
  onToggleChecklist: (planId: string, itemId: string) => void;
  onAddChecklistItem: (planId: string, text: string, assignedToName: string) => void;
}

export const HubExtrasView: React.FC<HubExtrasViewProps> = ({
  currentMember,
  members,
  podcasts,
  conspiratorPlans,
  onGeneratePodcast,
  onSendConspiratorMessage,
  onToggleChecklist,
  onAddChecklistItem,
}) => {
  const [activeSection, setActiveSection] = useState<"podcast" | "secret-room">("podcast");
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);

  // Secret Room PIN State
  const [isRoomUnlocked, setIsRoomUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [secretMessageInput, setSecretMessageInput] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newChecklistAssignee, setNewChecklistAssignee] = useState("Rahul");

  const latestPodcast = podcasts[0];
  const activePlan = conspiratorPlans[0];

  // Check if current user is the excluded surprise target
  const isExcludedTarget = activePlan && activePlan.excludedMemberIds.includes(currentMember.id);

  // Toggle Podcast Playback (Browser speech or audio snippet)
  const handleTogglePlayPodcast = (episode: FamilyPodcastEpisode) => {
    if (playingEpisodeId === episode.id && isPlayingPodcast) {
      stopSpeaking();
      setIsPlayingPodcast(false);
      setPlayingEpisodeId(null);
    } else {
      stopSpeaking();
      setPlayingEpisodeId(episode.id);
      setIsPlayingPodcast(true);
      speakText(episode.script, () => {
        setIsPlayingPodcast(false);
        setPlayingEpisodeId(null);
      });
    }
  };

  // Generate Podcast Trigger
  const handleGenerate = async () => {
    setIsGeneratingPodcast(true);
    try {
      await onGeneratePodcast();
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  // Unlock Secret Room with PIN
  const handleUnlockRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1234") {
      setIsRoomUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Send Secret Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretMessageInput.trim() || !activePlan) return;
    onSendConspiratorMessage(activePlan.id, secretMessageInput);
    setSecretMessageInput("");
  };

  // Add Checklist Item
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || !activePlan) return;
    onAddChecklistItem(activePlan.id, newChecklistText, newChecklistAssignee);
    setNewChecklistText("");
  };

  return (
    <div className="space-y-6">
      {/* SECTION SELECTOR HEADER */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <button
            id="tab-btn-podcast"
            onClick={() => setActiveSection("podcast")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeSection === "podcast"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Radio className="w-4 h-4 text-amber-500" />
            <span>Daily Family Audio Podcast</span>
          </button>

          <button
            id="tab-btn-secret-room"
            onClick={() => setActiveSection("secret-room")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeSection === "secret-room"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <EyeOff className="w-4 h-4 text-rose-500" />
            <span>Secret Conspirator Room</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
              Encrypted
            </span>
          </button>
        </div>
      </div>

      {/* 1. DAILY FAMILY AUDIO PODCAST (1-MINUTE AI RECAP) */}
      {activeSection === "podcast" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Main Featured Podcast Player Card */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Background Soundwave Graphics */}
            <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none flex items-end space-x-1.5 h-48 pr-6">
              {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 30, 85, 65, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-2.5 bg-amber-400 rounded-t-full"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="relative z-10 max-w-2xl space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>1-Minute AI Nightly Recap</span>
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {latestPodcast?.date ? new Date(latestPodcast.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Today"}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  {latestPodcast?.title || "Sharma Parivar Evening Digest"}
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                  {latestPodcast?.summary || "AI synthesized daily summary of call activity, mood check-ins, and dinner plans."}
                </p>
              </div>

              {/* Topics Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(latestPodcast?.topicsCovered || ["Daily Calls", "Family Moods", "Dinner Updates"]).map((topic, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium bg-white/10 text-stone-200 px-2.5 py-1 rounded-lg backdrop-blur-xs"
                  >
                    ✨ {topic}
                  </span>
                ))}
              </div>

              {/* Play & Generate Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {latestPodcast && (
                  <button
                    id="play-latest-podcast-btn"
                    onClick={() => handleTogglePlayPodcast(latestPodcast)}
                    className="flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition shadow-lg"
                  >
                    {playingEpisodeId === latestPodcast.id && isPlayingPodcast ? (
                      <>
                        <Pause className="w-5 h-5 fill-current" />
                        <span>Pause Podcast Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>Listen to 1-Min Podcast</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  id="generate-fresh-podcast-btn"
                  disabled={isGeneratingPodcast}
                  onClick={handleGenerate}
                  className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-amber-400 ${isGeneratingPodcast ? "animate-spin" : ""}`} />
                  <span>{isGeneratingPodcast ? "AI Synthesizing Recap..." : "Generate Fresh Podcast"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Full Voice Script & Audio Waveform Breakdown */}
          {latestPodcast && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Nightly Audio Podcast Script</span>
                </h3>
                <span className="text-xs text-stone-400 font-mono">60s Duration</span>
              </div>

              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                "{latestPodcast.script}"
              </div>
            </div>
          )}

          {/* Episode Archive */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Past Nightly Episodes Archive</h3>
            <div className="space-y-3">
              {podcasts.map((ep) => (
                <div
                  key={ep.id}
                  id={`podcast-ep-${ep.id}`}
                  className="bg-stone-50 rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-amber-700 font-bold">{ep.date}</span>
                    <h4 className="text-sm font-bold text-stone-900">{ep.title}</h4>
                    <p className="text-xs text-stone-500 line-clamp-1">{ep.summary}</p>
                  </div>

                  <button
                    onClick={() => handleTogglePlayPodcast(ep)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold transition self-start sm:self-auto shadow-2xs"
                  >
                    {playingEpisodeId === ep.id && isPlayingPodcast ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Play Episode</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SECRET CONSPIRATOR ROOM (SURPRISE PLANNING) */}
      {activeSection === "secret-room" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Target Excluded Lock Banner (If Ramesh logs in) */}
          {isExcludedTarget ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center mx-auto">
                <Gift className="w-8 h-8 animate-bounce" />
              </div>
              <div className="max-w-md mx-auto">
                <span className="text-xs font-black uppercase tracking-widest bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
                  🔒 TOP SECRET: CLASSIFIED
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-3">
                  Restricted Access for {currentMember.name}!
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  You are the VIP guest of honor for an upcoming family milestone surprise! This room is encrypted and invisible to you so your celebration remains 100% unexpected.
                </p>
              </div>
            </div>
          ) : !isRoomUnlocked ? (
            /* PIN Lock Screen for Authorized Family Conspirators */
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-stone-200 p-8 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900">Secret Conspirator Room</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Enter family surprise PIN code to access secret planning, gift budget, and surprise timeline.
                </p>
              </div>

              <form onSubmit={handleUnlockRoom} className="space-y-3">
                <div>
                  <input
                    id="secret-room-pin-input"
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN (Default: 1234)"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  {pinError && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      Incorrect PIN. Hint: Default PIN is 1234.
                    </p>
                  )}
                </div>

                <button
                  id="unlock-secret-room-btn"
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Room</span>
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked Secret Conspirator Room */
            <div className="space-y-6 animate-in zoom-in-95 duration-150">
              {/* Event Overview Card */}
              <div className="bg-gradient-to-r from-rose-900 via-stone-900 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/40 px-2.5 py-0.5 rounded-full">
                      Surprise Operation Active
                    </span>
                    <span className="text-xs text-stone-300">Target: Dad Ramesh (60th Birthday)</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">{activePlan?.title || "Dad's 60th Surprise Gala"}</h2>
                  <p className="text-xs text-stone-300">{activePlan?.description}</p>
                </div>

                <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                  <div>
                    <span className="text-[10px] text-stone-300 uppercase block font-semibold">Secret Budget</span>
                    <span className="text-base sm:text-lg font-black text-amber-300">
                      ₹{activePlan?.targetBudget.toLocaleString() || "35,000"}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div>
                    <span className="text-[10px] text-stone-300 uppercase block font-semibold">Surprise Date</span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {activePlan?.targetDate || "Oct 12, 2026"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SURPRISE CHECKLIST */}
                <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-rose-600" />
                      <span>Surprise Action Checklist</span>
                    </h3>
                    <span className="text-xs text-stone-500 font-mono">
                      {activePlan?.checklist.filter((c) => c.completed).length} / {activePlan?.checklist.length} Done
                    </span>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2.5">
                    {activePlan?.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onToggleChecklist(activePlan.id, item.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                          item.completed
                            ? "bg-stone-50 border-stone-200 text-stone-400 line-through"
                            : "bg-white border-stone-200 hover:border-amber-300 text-stone-800 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          )}
                          <span className="text-xs font-semibold">{item.text}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                          {item.assignedToName}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add New Task Form */}
                  <form onSubmit={handleAddChecklist} className="pt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add surprise mission task..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                    />
                    <select
                      value={newChecklistAssignee}
                      onChange={(e) => setNewChecklistAssignee(e.target.value)}
                      className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    >
                      {members.filter((m) => !activePlan?.excludedMemberIds.includes(m.id)).map((m) => (
                        <option key={m.id} value={m.name.split(" ")[0]}>
                          {m.name.split(" ")[0]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* SECRET CHAT WALL */}
                <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                      <EyeOff className="w-4 h-4 text-rose-600" />
                      <span>Conspirators Secret Chat Wall</span>
                    </h3>
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                      Dad Cannot See
                    </span>
                  </div>

                  {/* Message History */}
                  <div className="space-y-3 h-64 overflow-y-auto pr-1">
                    {activePlan?.messages.map((msg) => (
                      <div key={msg.id} className="flex items-start space-x-3 text-xs">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover border border-stone-200 flex-shrink-0"
                        />
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">{msg.senderName}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{msg.timestamp}</span>
                          </div>
                          <p className="text-stone-700 mt-1">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Send Message Input */}
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2 border-t border-stone-100">
                    <input
                      type="text"
                      placeholder="Type secret planning note..."
                      value={secretMessageInput}
                      onChange={(e) => setSecretMessageInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-stone-900 hover:bg-rose-600 text-white transition shadow-2xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
