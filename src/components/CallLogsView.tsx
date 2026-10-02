import React, { useState, useRef, useEffect } from "react";
import { 
  FileAudio, 
  Search, 
  Play, 
  Pause, 
  Download, 
  PhoneForwarded, 
  PhoneIncoming, 
  PhoneOutgoing, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  Sparkles, 
  Filter, 
  Volume2, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Folder
} from "lucide-react";
import { CallSession, FamilyMember, Contact } from "../types";
import { FrequencyWaveform } from "./FrequencyWaveform";
import { LiveWaveformVisualizer } from "./LiveWaveformVisualizer";

interface CallLogsViewProps {
  callLogs: CallSession[];
  currentMember?: FamilyMember;
  isAdmin?: boolean;
  onBulkDelete?: (callIds: string[]) => Promise<void> | void;
  onBulkDeleteCalls?: (callIds: string[]) => Promise<void> | void;
  highlightedCallId?: string | null;
  contacts?: Contact[];
  contactFolders?: string[];
}

export const CallLogsView: React.FC<CallLogsViewProps> = ({ 
  callLogs,
  currentMember,
  isAdmin: propIsAdmin,
  onBulkDelete,
  onBulkDeleteCalls,
  highlightedCallId,
  contacts = [],
  contactFolders = []
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "urgent" | "completed">("all");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(callLogs[0]?.id || null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [frequencyBands, setFrequencyBands] = useState<number[]>(new Array(28).fill(12));
  const [audioLevel, setAudioLevel] = useState<number>(0.2);
  const animFrameRef = useRef<number | null>(null);
  
  // Bulk Delete State for Admin users
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedCallIds, setSelectedCallIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isAdmin = propIsAdmin ?? (currentMember?.role === "admin");
  const deleteHandler = onBulkDelete || onBulkDeleteCalls;

  // Auto-expand and scroll to highlighted call if provided
  useEffect(() => {
    if (highlightedCallId) {
      setExpandedCallId(highlightedCallId);
      const elem = document.getElementById(`call-log-card-${highlightedCallId}`);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightedCallId]);

  // Helper to match a call session to a contact
  const getContactForCall = (call: CallSession) => {
    return contacts.find(
      (c) => c.phone === call.callerNumber || c.name.toLowerCase() === call.callerName.toLowerCase()
    );
  };

  const filteredLogs = callLogs.filter((call) => {
    const matchesSearch =
      call.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.callerNumber.includes(searchQuery) ||
      (call.summary && call.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === "urgent" && !call.isUrgent) return false;
    if (filterType === "completed" && call.isUrgent) return false;

    if (selectedFolder !== "all") {
      const matched = getContactForCall(call);
      const folder = matched?.folder || "Unassigned";
      if (folder.toLowerCase() !== selectedFolder.toLowerCase()) return false;
    }

    return true;
  });

  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
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

    const targetUrl = audioUrl || "https://cdn.freesound.org/previews/557/557174_11861866-lq.mp3";
    const audio = new Audio(targetUrl);
    audio.crossOrigin = "anonymous";
    audioPlayerRef.current = audio;
    setPlayingCallId(callId);
    setExpandedCallId(callId);

    const startTime = Date.now();
    const renderLoop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const bands: number[] = [];

      for (let i = 0; i < 28; i++) {
        const speechPulse = Math.sin(elapsed * 7) > -0.2 ? 1 : 0.28;
        const wave1 = Math.sin(elapsed * 8.5 + i * 0.42) * 32;
        const wave2 = Math.cos(elapsed * 12 + i * 0.68) * 22;
        const wave3 = Math.sin(elapsed * 4.6 + i * 0.22) * 18;
        const h = Math.max(12, Math.min(98, Math.round((32 + wave1 + wave2 + wave3) * speechPulse)));
        bands.push(h);
      }

      const avgLevel = bands.reduce((a, b) => a + b, 0) / (bands.length * 100);
      setAudioLevel(avgLevel);
      setFrequencyBands(bands);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    audio.play().then(() => {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    }).catch(() => {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    });

    audio.onended = () => {
      stopAudio();
    };
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Export to CSV Function
  const handleExportToCsv = (exportMode: "filtered" | "all" = "filtered") => {
    const dataset = exportMode === "all" ? callLogs : filteredLogs;
    if (dataset.length === 0) {
      setExportNotice("No call logs available to export.");
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    const formatCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "Call ID",
      "Direction",
      "Caller Name",
      "Caller Number",
      "Contact Folder",
      "Target Host / Member",
      "Call Status",
      "Start Time (ISO)",
      "Start Time (Formatted)",
      "Duration (Seconds)",
      "Duration (Formatted)",
      "Is Urgent",
      "Urgency Reason",
      "Forwarded To",
      "Telephony Provider",
      "AI Summary",
      "Transcripts"
    ];

    const rows = dataset.map((call) => {
      const matched = getContactForCall(call);
      const folderName = matched?.folder || "Unassigned";

      return [
        formatCell(call.id),
        formatCell(call.direction),
        formatCell(call.callerName),
        formatCell(call.callerNumber),
        formatCell(folderName),
        formatCell(call.targetUserName),
        formatCell(call.status),
        formatCell(call.startTime),
        formatCell(formatDate(call.startTime)),
        formatCell(call.durationSeconds),
        formatCell(formatDuration(call.durationSeconds)),
        formatCell(call.isUrgent ? "YES" : "NO"),
        formatCell(call.urgencyReason || "None"),
        formatCell(call.forwardedToNumber || "None"),
        formatCell(call.telephonyProvider || "Standard"),
        formatCell(call.summary || "No summary available"),
        formatCell((call.transcripts || []).map((t) => `${t.speaker}: ${t.text}`).join(" | "))
      ].join(",");
    });

    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `gharcall_call_history_${exportMode}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${dataset.length} call history records to CSV successfully!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Bulk Selection Handlers
  const handleToggleSelectCall = (callId: string) => {
    setSelectedCallIds((prev) =>
      prev.includes(callId) ? prev.filter((id) => id !== callId) : [...prev, callId]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedCallIds.length === filteredLogs.length) {
      setSelectedCallIds([]);
    } else {
      setSelectedCallIds(filteredLogs.map((c) => c.id));
    }
  };

  const handleSelectAllNonUrgent = () => {
    const nonUrgentIds = filteredLogs.filter((c) => !c.isUrgent).map((c) => c.id);
    setSelectedCallIds(nonUrgentIds);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedCallIds.length === 0 || !deleteHandler) return;
    setIsDeleting(true);
    try {
      await deleteHandler(selectedCallIds);
      setSelectedCallIds([]);
      setIsBulkMode(false);
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Bulk delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const nonUrgentCount = filteredLogs.filter((c) => !c.isUrgent).length;

  return (
    <div className="space-y-4">
      {/* Export Success Notification Toast */}
      {exportNotice && (
        <div 
          id="call-logs-export-notice"
          className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar: Search, Filters, Folder Filter & Admin/Export Action Triggers */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="call-logs-search-input"
              type="text"
              placeholder="Search caller name, phone number, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap gap-y-2">
            <Filter className="w-3.5 h-3.5 text-stone-400 mr-1" />
            <button
              id="filter-all-logs-btn"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All Calls ({callLogs.length})
            </button>
            <button
              id="filter-urgent-logs-btn"
              onClick={() => setFilterType("urgent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === "urgent" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              Urgent Forwarded ({callLogs.filter((c) => c.isUrgent).length})
            </button>
            <button
              id="filter-completed-logs-btn"
              onClick={() => setFilterType("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === "completed" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Completed
            </button>

            {/* Export to CSV Button */}
            <div className="flex items-center space-x-1 pl-1 border-l border-stone-200 ml-1">
              <button
                id="export-call-logs-csv-btn"
                type="button"
                onClick={() => handleExportToCsv("filtered")}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-300 shadow-2xs transition"
                title="Download call history log as structured spreadsheet for documentation or archiving"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>Export to CSV</span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded-full font-mono">
                  {filteredLogs.length}
                </span>
              </button>

              {isAdmin && filteredLogs.length !== callLogs.length && (
                <button
                  id="export-all-call-logs-csv-btn"
                  type="button"
                  onClick={() => handleExportToCsv("all")}
                  className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition"
                  title="Export all call logs including un-filtered history"
                >
                  All ({callLogs.length})
                </button>
              )}
            </div>

            {/* Admin Bulk Delete Mode Trigger */}
            {isAdmin && (
              <button
                id="toggle-bulk-cleanup-mode-btn"
                type="button"
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  if (isBulkMode) setSelectedCallIds([]);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ml-1 ${
                  isBulkMode
                    ? "bg-red-50 text-red-700 border-red-200 shadow-2xs"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{isBulkMode ? "Exit Bulk" : "Bulk Cleanup"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Contact Folders Filter Bar to organize call logs */}
        {contactFolders && contactFolders.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-400 font-medium text-[11px] uppercase tracking-wider mr-1 flex items-center space-x-1 flex-shrink-0">
              <Folder className="w-3 h-3 text-amber-600" />
              <span>Filter by Contact Folder:</span>
            </span>
            <button
              id="filter-folder-all-btn"
              onClick={() => setSelectedFolder("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedFolder === "all"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All Folders ({callLogs.length})
            </button>
            {contactFolders.map((f) => {
              const folderCount = callLogs.filter((call) => {
                const matched = getContactForCall(call);
                return matched?.folder?.toLowerCase() === f.toLowerCase();
              }).length;

              return (
                <button
                  key={f}
                  id={`filter-folder-${f.toLowerCase().replace(/\s+/g, "-")}-btn`}
                  onClick={() => setSelectedFolder(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center space-x-1 ${
                    selectedFolder.toLowerCase() === f.toLowerCase()
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200"
                  }`}
                >
                  <span>📁</span>
                  <span>{f}</span>
                  <span className="text-[10px] font-mono opacity-80">({folderCount})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Bulk Actions Toolbar */}
      {isBulkMode && isAdmin && (
        <div 
          id="admin-bulk-actions-toolbar"
          className="bg-red-50/70 border border-red-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-red-900">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span>Admin Bulk Cleanup:</span>
            </div>

            <button
              id="bulk-select-non-urgent-btn"
              type="button"
              onClick={handleSelectAllNonUrgent}
              className="text-xs bg-white hover:bg-red-50 text-red-800 border border-red-200 rounded-lg px-2.5 py-1 font-medium transition shadow-2xs"
              title="Select routine non-urgent calls for cleanup while keeping urgent calls safe"
            >
              Select Non-Urgent ({nonUrgentCount})
            </button>

            <button
              id="bulk-select-all-btn"
              type="button"
              onClick={handleSelectAllVisible}
              className="text-xs bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-lg px-2.5 py-1 font-medium transition"
            >
              {selectedCallIds.length === filteredLogs.length ? "Deselect All" : "Select All Visible"}
            </button>

            <span className="text-xs text-stone-600 font-medium">
              {selectedCallIds.length} call{selectedCallIds.length === 1 ? "" : "s"} selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="bulk-delete-selected-btn"
              type="button"
              disabled={selectedCallIds.length === 0 || isDeleting}
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedCallIds.length})</span>
            </button>

            <button
              id="cancel-bulk-mode-btn"
              type="button"
              onClick={() => {
                setIsBulkMode(false);
                setSelectedCallIds([]);
              }}
              className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Call Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 shadow-sm">
            <FileAudio className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold">No call records found</p>
            <p className="text-xs text-stone-400 mt-1">
              Try adjusting your search query or launch an interactive call from the AI Call Assistant tab.
            </p>
          </div>
        ) : (
          filteredLogs
            .filter((call, index, self) => self.findIndex((c) => c.id === call.id) === index)
            .map((call) => {
            const isExpanded = expandedCallId === call.id;
            const isPlaying = playingCallId === call.id;
            const isSelected = selectedCallIds.includes(call.id);
            const isHighlighted = highlightedCallId === call.id;

            return (
              <div
                key={call.id}
                id={`call-log-card-${call.id}`}
                className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
                  isSelected
                    ? "border-red-400 ring-2 ring-red-400/40 bg-red-50/20"
                    : isHighlighted
                    ? "border-amber-400 ring-2 ring-amber-400/50 bg-amber-50/20"
                    : call.isUrgent
                    ? "border-amber-300 bg-amber-50/10"
                    : "border-stone-200"
                }`}
              >
                {/* Card Header Summary */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    {/* Bulk Selection Checkbox */}
                    {isBulkMode && isAdmin && (
                      <button
                        type="button"
                        id={`select-call-checkbox-${call.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectCall(call.id);
                        }}
                        className="mt-1 text-red-600 hover:scale-110 transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-red-100 text-red-600" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-300 hover:text-stone-500" />
                        )}
                      </button>
                    )}

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        call.isUrgent
                          ? "bg-red-100 text-red-700"
                          : call.direction === "inbound"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {call.isUrgent ? (
                        <PhoneForwarded className="w-5 h-5" />
                      ) : call.direction === "inbound" ? (
                        <PhoneIncoming className="w-5 h-5" />
                      ) : (
                        <PhoneOutgoing className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="text-sm font-bold text-stone-900">{call.callerName}</h4>
                        <span className="text-xs font-mono text-stone-500">{call.callerNumber}</span>
                        {(() => {
                          const contact = getContactForCall(call);
                          if (contact?.folder) {
                            return (
                              <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <span>📁</span>
                                <span>{contact.folder}</span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {call.isUrgent ? (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                            <ShieldAlert className="w-3 h-3 inline" />
                            <span>Urgent Bridged</span>
                          </span>
                        ) : (
                          <span className="bg-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Routine Call
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-stone-500 mt-1 flex-wrap">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(call.startTime)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(call.durationSeconds)}</span>
                        </span>
                        <span className="text-stone-400 capitalize">
                          via {call.telephonyProvider}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header Controls */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {call.audioUrl && (
                      <button
                        id={`play-call-audio-btn-${call.id}`}
                        onClick={() => handleTogglePlayAudio(call.id, call.audioUrl)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          isPlaying
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Play Recording</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      id={`expand-call-details-btn-${call.id}`}
                      onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                      title={isExpanded ? "Collapse Transcript" : "View Transcript"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* AI Call Summary Banner */}
                {call.summary && (
                  <div className="px-4 sm:px-5 pb-3">
                    <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs text-stone-800 flex items-start space-x-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-stone-900 mr-1.5">AI Summary:</span>
                        <span>{call.summary}</span>
                        {call.urgencyReason && (
                          <div className="text-red-700 font-medium text-[11px] mt-1 flex items-center space-x-1">
                            <span>🚨 Trigger:</span>
                            <span>{call.urgencyReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Full Dialogue Transcript */}
                {isExpanded && (
                  <div className="border-t border-stone-100 p-4 sm:p-5 bg-stone-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span>Live Call Audio Transcript</span>
                      <span className="text-[11px] font-normal text-stone-400 font-mono">
                        {call.transcripts.length} dialogue turns
                      </span>
                    </div>

                    {/* Canvas-based Frequency Waveform synced with requestAnimationFrame */}
                    <FrequencyWaveform
                      isPlaying={isPlaying}
                      frequencyBands={frequencyBands}
                      audioLevel={audioLevel}
                      audioElement={audioPlayerRef.current}
                      height={90}
                      theme="amber"
                      title="Live Call Audio Transcript"
                      subTitle="Real-time frequency waveform • 48 kHz voice stream"
                      showFrequencyBars={true}
                      showTelemetry={true}
                    />

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {call.transcripts.map((entry) => {
                        if (entry.speaker === "system") {
                          return (
                            <div
                              key={entry.id}
                              className="text-center text-[11px] text-amber-800 bg-amber-100/60 rounded-lg py-1 px-2.5 my-1 flex items-center justify-center space-x-1.5 font-medium"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                              <span>{entry.text}</span>
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
                              <span className="font-semibold flex items-center gap-1">
                                <span>{isAi ? "🤖 GharCall AI" : `👤 ${call.callerName}`}</span>
                                {isAi && isPlaying && (
                                  <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                    <span className="w-0.5 h-2 bg-amber-600 rounded-full animate-pulse" />
                                    <span className="w-0.5 h-3 bg-amber-700 rounded-full animate-bounce" />
                                    <span className="w-0.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                  </span>
                                )}
                              </span>
                              <span>• {entry.timestamp}</span>
                            </div>
                            <div
                              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                isAi
                                  ? isPlaying
                                    ? "bg-amber-50/90 text-amber-950 border border-amber-300 ring-1 ring-amber-300/60"
                                    : "bg-white border border-stone-200 text-stone-800"
                                  : entry.isUrgentKeyword
                                  ? "bg-red-600 text-white font-medium shadow-xs"
                                  : "bg-stone-800 text-white"
                              }`}
                            >
                              {entry.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Bulk Delete */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-900">
                Confirm Bulk Deletion
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                You are about to permanently delete <strong className="text-stone-900">{selectedCallIds.length} call records</strong> from the Sharma family call history. This will sync across all family members' devices.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                id="cancel-bulk-delete-confirm-btn"
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                id="execute-bulk-delete-btn"
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmBulkDelete}
                className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : `Delete ${selectedCallIds.length} Calls`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
