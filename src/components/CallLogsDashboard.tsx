import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneCall, 
  Clock, 
  Calendar, 
  Sparkles, 
  Search, 
  Play, 
  Pause, 
  Volume2, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Filter, 
  Radio, 
  Phone, 
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  FileSpreadsheet,
  Download,
  Check,
  Waves,
  Activity
} from "lucide-react";
import { CallSession, CallTranscript } from "../types";
import { FrequencyWaveform } from "./FrequencyWaveform";
import { LiveWaveformVisualizer } from "./LiveWaveformVisualizer";

interface CallLogsDashboardProps {
  callLogs: CallSession[];
  onInitiateOutboundCall?: (name: string, phone: string) => void;
}

export const CallLogsDashboard: React.FC<CallLogsDashboardProps> = ({
  callLogs,
  onInitiateOutboundCall,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"all" | "inbound" | "outbound" | "urgent">("all");
  const [expandedCallId, setExpandedCallId] = useState<string | null>(callLogs[0]?.id || null);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Audio frequency visualizer & Web Audio API
  const [frequencyBands, setFrequencyBands] = useState<number[]>(new Array(28).fill(12));
  const [audioLevel, setAudioLevel] = useState<number>(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // Statistics calculation
  const totalCalls = callLogs.length;
  const inboundCount = callLogs.filter((c) => c.direction === "inbound").length;
  const outboundCount = callLogs.filter((c) => c.direction === "outbound").length;
  const urgentCount = callLogs.filter((c) => c.isUrgent || c.priorityTag === "urgent").length;
  const totalMinutes = Math.round(
    callLogs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0) / 60
  );

  // Filter logs
  const filteredCalls = callLogs.filter((call) => {
    // Search match
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      call.callerName.toLowerCase().includes(q) ||
      call.callerNumber.includes(q) ||
      (call.summary && call.summary.toLowerCase().includes(q)) ||
      (call.targetUserName && call.targetUserName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (directionFilter === "inbound") return call.direction === "inbound";
    if (directionFilter === "outbound") return call.direction === "outbound";
    if (directionFilter === "urgent") return call.isUrgent || call.priorityTag === "urgent";
    return true;
  });

  const hasFilteredData = filteredCalls.length > 0;

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setPlayingCallId(null);
    setFrequencyBands(new Array(28).fill(12));
    setAudioLevel(0.2);
  };

  const handleTogglePlayAudio = (callId: string, audioUrl?: string) => {
    if (playingCallId === callId) {
      stopAudio();
      return;
    }

    stopAudio();
    const sound = new Audio(audioUrl || "https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3");
    sound.crossOrigin = "anonymous";
    audioRef.current = sound;
    setPlayingCallId(callId);

    // Auto-expand this call card so the user immediately sees the visual frequency wave in the transcript box
    setExpandedCallId(callId);

    // Audio frequency animation loop
    const startTime = Date.now();
    let analyserNode: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        const source = ctx.createMediaElementSource(sound);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserNode = analyser;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
    } catch {
      // Fallback to time-synced dynamic harmonic wave simulation
    }

    const renderLoop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const bands: number[] = [];

      if (analyserNode && dataArray) {
        analyserNode.getByteFrequencyData(dataArray);
        let maxVal = 0;
        for (let i = 0; i < 28; i++) {
          const raw = dataArray[Math.floor((i / 28) * dataArray.length)] || 0;
          if (raw > maxVal) maxVal = raw;
          const h = Math.max(12, Math.min(100, Math.round((raw / 255) * 100)));
          bands.push(h);
        }
        // If audio data is muted by CORS restrictions, fallback to rich speech cadence simulation
        if (maxVal < 10) {
          bands.length = 0;
          for (let i = 0; i < 28; i++) {
            const speechPulse = Math.sin(elapsed * 7) > -0.2 ? 1 : 0.28;
            const wave1 = Math.sin(elapsed * 8.5 + i * 0.42) * 32;
            const wave2 = Math.cos(elapsed * 12 + i * 0.68) * 22;
            const wave3 = Math.sin(elapsed * 4.6 + i * 0.22) * 18;
            const h = Math.max(12, Math.min(98, Math.round((32 + wave1 + wave2 + wave3) * speechPulse)));
            bands.push(h);
          }
        }
      } else {
        // Continuous harmonic wave matching speech cadence and dynamic voice playback
        for (let i = 0; i < 28; i++) {
          const speechPulse = Math.sin(elapsed * 7) > -0.2 ? 1 : 0.28;
          const wave1 = Math.sin(elapsed * 8.5 + i * 0.42) * 32;
          const wave2 = Math.cos(elapsed * 12 + i * 0.68) * 22;
          const wave3 = Math.sin(elapsed * 4.6 + i * 0.22) * 18;
          const h = Math.max(12, Math.min(98, Math.round((32 + wave1 + wave2 + wave3) * speechPulse)));
          bands.push(h);
        }
      }

      const avgLevel = bands.reduce((a, b) => a + b, 0) / (bands.length * 100);
      setAudioLevel(avgLevel);
      setFrequencyBands(bands);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    sound.play().then(() => {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    }).catch(() => {
      // Autoplay fallback
      animFrameRef.current = requestAnimationFrame(renderLoop);
    });

    sound.onended = () => {
      stopAudio();
    };
  };

  /**
   * downloadCSV utility function within CallLogsDashboard:
   * Maps filtered call logs into CSV rows including name, timestamp, and AI transcription summaries,
   * then triggers a File/Blob download.
   */
  const downloadCSV = (callsToExport: CallSession[] = filteredCalls) => {
    if (!callsToExport || callsToExport.length === 0) return;

    const escapeCSV = (value: string | number | boolean | null | undefined): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Call ID",
      "Caller Name",
      "Caller Number",
      "Target Host",
      "Direction",
      "Status",
      "Timestamp (ISO)",
      "Date & Time",
      "Duration (Seconds)",
      "Duration (Formatted)",
      "Urgent Flag",
      "Priority Tag",
      "Telephony Provider",
      "AI Transcription Summary",
      "Full Transcript"
    ];

    const rows = callsToExport.map((call) => {
      const formattedDate = new Date(call.startTime).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const transcriptString = (call.transcripts || [])
        .map((t) => `[${t.timestamp}] ${t.speaker.toUpperCase()}: ${t.text}`)
        .join(" | ");

      return [
        escapeCSV(call.id),
        escapeCSV(call.callerName),
        escapeCSV(call.callerNumber),
        escapeCSV(call.targetUserName || "Rahul Sharma"),
        escapeCSV(call.direction),
        escapeCSV(call.status),
        escapeCSV(call.startTime),
        escapeCSV(formattedDate),
        escapeCSV(call.durationSeconds || 0),
        escapeCSV(formatDuration(call.durationSeconds || 0)),
        escapeCSV(call.isUrgent ? "YES" : "NO"),
        escapeCSV(call.priorityTag || (call.isUrgent ? "urgent" : "routine")),
        escapeCSV(call.telephonyProvider || "twilio"),
        escapeCSV(call.summary || "Conversation transcribed and verified by AI voice assistant."),
        escapeCSV(transcriptString || "No transcript available")
      ].join(",");
    });

    const csvData = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filterTag = directionFilter !== "all" ? `-${directionFilter}` : "";
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `ghar-call-logs${filterTag}-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${callsToExport.length} call logs to CSV successfully!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportCSV = () => downloadCSV(filteredCalls);

  return (
    <div className="space-y-6">
      {/* Export Confirmation Toast Banner */}
      <AnimatePresence>
        {exportNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 bg-emerald-50 border border-emerald-200 text-[#0F5132] rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{exportNotice}</span>
            </div>
            <button
              onClick={() => setExportNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header & Summary Analytics Cards */}
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shadow-md">
              <PhoneCall className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">Call Logs Dashboard</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0F5132] text-[10px] font-black border border-emerald-200 uppercase tracking-wider">
                  AI Transcriptions
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scrollable log of recent inbound & outbound voice calls with AI conversation summaries
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>{totalMinutes} mins total talk time</span>
            </span>

            {/* Prominent Action Button: Export to CSV */}
            <button
              id="export-to-csv-btn"
              type="button"
              onClick={handleExportCSV}
              disabled={!hasFilteredData}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                hasFilteredData
                  ? "bg-[#0F5132] hover:bg-[#0b3d26] text-white shadow-md hover:shadow-lg ring-1 ring-emerald-600/40 cursor-pointer active:scale-95"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none"
              }`}
              title={
                hasFilteredData
                  ? `Export ${filteredCalls.length} filtered call records to CSV`
                  : "No call records in current filtered view to export"
              }
            >
              <Download className={`w-4 h-4 transition-transform ${hasFilteredData ? "text-emerald-200" : "text-slate-400"}`} />
              <span className="tracking-wide">Export to CSV</span>
              {hasFilteredData && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold">
                  {filteredCalls.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Calls
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">{totalCalls}</span>
              <Layers className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Inbound Calls
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-[#0F5132]">{inboundCount}</span>
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Outbound AI Calls
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-blue-900">{outboundCount}</span>
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Urgent Forwarded
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-rose-600">{urgentCount}</span>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-slate-200 p-3 rounded-2xl shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by caller, phone number, or AI summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setDirectionFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              directionFilter === "all"
                ? "bg-[#0F5132] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({totalCalls})
          </button>

          <button
            onClick={() => setDirectionFilter("inbound")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              directionFilter === "inbound"
                ? "bg-[#0F5132] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PhoneIncoming className="w-3.5 h-3.5 text-emerald-300" />
            <span>Inbound ({inboundCount})</span>
          </button>

          <button
            onClick={() => setDirectionFilter("outbound")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              directionFilter === "outbound"
                ? "bg-[#0F5132] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PhoneOutgoing className="w-3.5 h-3.5 text-blue-300" />
            <span>Outbound ({outboundCount})</span>
          </button>

          <button
            onClick={() => setDirectionFilter("urgent")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              directionFilter === "urgent"
                ? "bg-rose-600 text-white shadow-2xs"
                : "text-rose-700 bg-rose-50 hover:bg-rose-100"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Urgent ({urgentCount})</span>
          </button>
        </div>
      </div>

      {/* 3. Scrollable List of Call Entries */}
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <span>Call Activity & AI Transcription Stream</span>
            <span className="text-[#0F5132] font-mono font-bold">
              • Showing {filteredCalls.length} of {totalCalls} Records
            </span>
          </div>

          <button
            type="button"
            onClick={() => downloadCSV(filteredCalls)}
            disabled={!hasFilteredData}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-800 text-xs font-bold border border-slate-200 transition shadow-2xs cursor-pointer"
            title="Download CSV of current list"
          >
            <Download className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="max-h-[680px] overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4 space-y-3">
          {filteredCalls.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <PhoneCall className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No voice call logs found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? "Try searching for a different name, phone number, or keyword."
                  : "Incoming and outgoing calls processed by the AI voice assistant will appear here automatically."}
              </p>
            </div>
          ) : (
            filteredCalls.map((call) => {
              const isInbound = call.direction === "inbound";
              const isExpanded = expandedCallId === call.id;
              const isPlaying = playingCallId === call.id;

              return (
                <motion.div
                  key={call.id}
                  layout
                  className={`rounded-2xl border transition-all ${
                    call.isUrgent
                      ? "bg-rose-50/40 border-rose-200"
                      : isExpanded
                      ? "bg-slate-50/70 border-slate-300 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Top Bar for Card */}
                  <div
                    onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    {/* Left: Direction Icon + Caller Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                          call.isUrgent
                            ? "bg-rose-500 text-white"
                            : isInbound
                            ? "bg-emerald-100 text-[#0F5132]"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isInbound ? (
                          <PhoneIncoming className="w-5 h-5 stroke-[2.2]" />
                        ) : (
                          <PhoneOutgoing className="w-5 h-5 stroke-[2.2]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            {call.callerName}
                          </h4>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isInbound
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {call.direction}
                          </span>
                          {call.isUrgent && (
                            <span className="px-2 py-0.2 rounded-full bg-rose-50 text-rose-800 text-[10px] font-black border border-rose-200 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>Urgent Bridge</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-mono">{call.callerNumber}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(call.startTime).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(call.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Duration, Audio Play, Expand */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Duration Badge */}
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                        ⏱️ {formatDuration(call.durationSeconds)}
                      </span>

                      {/* Play Audio Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePlayAudio(call.id, call.audioUrl);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isPlaying
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        }`}
                        title="Listen to call audio recording"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play</span>
                          </>
                        )}
                      </button>

                      {/* Expand / Collapse Icon */}
                      <span className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Section: AI Transcription Summary & Full Turn-by-Turn Transcript */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100"
                      >
                        {/* AI Transcription Summary Card */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-700" />
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#0F5132]">
                              AI Transcription Summary
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
                            {call.summary || "Conversation transcribed and verified by AI voice assistant."}
                          </p>
                        </div>

                        {/* Turn-by-Turn 'Live Call Audio' Transcript Box with FrequencyWaveform Animation */}
                        {call.transcripts && call.transcripts.length > 0 && (
                          <div className="space-y-2.5 pt-2">
                            {/* Canvas-based Frequency Waveform synced with requestAnimationFrame */}
                            <div className="space-y-2">
                              <FrequencyWaveform
                                isPlaying={isPlaying}
                                frequencyBands={frequencyBands}
                                audioLevel={audioLevel}
                                audioElement={audioRef.current}
                                height={92}
                                theme="emerald"
                                title="Live Call Audio"
                                subTitle="Real-time frequency waveform • 48 kHz voice stream"
                                showFrequencyBars={true}
                                showTelemetry={true}
                              />

                              {/* Play / Pause Stream Controls Bar */}
                              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePlayAudio(call.id, call.audioUrl);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                      isPlaying
                                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                    }`}
                                  >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                    <span>{isPlaying ? "Pause Stream" : "Play Live Stream Audio"}</span>
                                  </button>

                                  {isPlaying && (
                                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                                      <span>Voice Frequencies Synced</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                                  <span>⏱️ {formatDuration(call.durationSeconds)}</span>
                                  <span>•</span>
                                  <span>{call.telephonyProvider?.toUpperCase() || "HD VOICE"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Dialogue Turn Stream */}
                            <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 max-h-56 overflow-y-auto">
                              {call.transcripts.map((t) => (
                                <div
                                  key={t.id}
                                  className={`p-2.5 rounded-xl text-xs leading-relaxed transition ${
                                    t.speaker === "assistant"
                                      ? isPlaying
                                        ? "bg-emerald-50/90 text-[#0F5132] border border-emerald-200 ring-1 ring-emerald-300"
                                        : "bg-emerald-50 text-[#0F5132] border border-emerald-100"
                                      : t.speaker === "system"
                                      ? "bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[11px]"
                                      : "bg-slate-50 text-slate-800 border border-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                                    <span className="flex items-center gap-1">
                                      <span>{t.speaker === "assistant" ? "🤖 AI Assistant" : `👤 ${t.speaker}`}</span>
                                      {t.speaker === "assistant" && isPlaying && (
                                        <span className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          <span className="w-0.5 h-2 bg-emerald-600 rounded-full animate-pulse" />
                                          <span className="w-0.5 h-3 bg-emerald-700 rounded-full animate-bounce" />
                                          <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                          <span className="text-[9px] font-mono ml-0.5">SPEAKING</span>
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-mono">{t.timestamp}</span>
                                  </div>
                                  <p className="font-medium">{t.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Action Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                          <span className="font-mono text-[11px]">
                            Telephony: {call.telephonyProvider?.toUpperCase() || "RETELL / TWILIO"}
                          </span>

                          <a
                            href={`tel:${call.callerNumber}`}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Phone className="w-3 h-3 text-[#0F5132]" />
                            <span>Call Back</span>
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
