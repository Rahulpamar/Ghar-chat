import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Mic, 
  MicOff, 
  X, 
  PhoneCall, 
  HeartHandshake, 
  AlertTriangle, 
  Pin, 
  ArrowRight, 
  Sparkles, 
  FileText,
  Volume2,
  Calendar,
  User
} from "lucide-react";
import { CallSession, FamilyMoodNote } from "../types";

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  callLogs: CallSession[];
  moodNotes: FamilyMoodNote[];
  onSelectCall: (callId: string) => void;
  onSelectNote: (noteId: string) => void;
  initialQuery?: string;
  autoStartVoice?: boolean;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  callLogs,
  moodNotes,
  onSelectCall,
  onSelectNote,
  initialQuery = "",
  autoStartVoice = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "calls" | "notes">("all");
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Handle modal open & auto-start
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
      }
      if (autoStartVoice) {
        startListening();
      }
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen, autoStartVoice]);

  // Audio analyzer for realistic pulsing wave animation
  const startAudioMeter = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch (e) {
      console.warn("Could not start visual audio meter:", e);
    }
  };

  const stopAudioMeter = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage("Speech recognition is not natively supported in this browser. You can type in the search box below.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Family english / natural tone

      recognition.onstart = () => {
        setIsListening(true);
        startAudioMeter();
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          setQuery(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone permission was denied. Please allow microphone access in your browser settings.");
        } else if (event.error !== "no-speech") {
          setErrorMessage(`Microphone input: ${event.error}`);
        }
        setIsListening(false);
        stopAudioMeter();
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioMeter();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      stopAudioMeter();
      setErrorMessage("Could not initialize microphone input.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    stopAudioMeter();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isOpen) return null;

  // Search filtering logic
  const normalizedQuery = query.toLowerCase().trim();
  const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  const matchesText = (text?: string) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return searchTerms.length > 0 && searchTerms.some((term) => lower.includes(term));
  };

  // 1. Filter Calls
  const matchingCalls = callLogs.filter((call) => {
    if (!normalizedQuery) return true;
    if (matchesText(call.callerName)) return true;
    if (matchesText(call.callerNumber)) return true;
    if (matchesText(call.targetUserName)) return true;
    if (matchesText(call.summary)) return true;
    if (matchesText(call.urgencyReason)) return true;
    if (call.isUrgent && (normalizedQuery.includes("urgent") || normalizedQuery.includes("emergency") || normalizedQuery.includes("hospital") || normalizedQuery.includes("doctor"))) return true;
    if (normalizedQuery.includes("inbound") && call.direction === "inbound") return true;
    if (normalizedQuery.includes("outbound") && call.direction === "outbound") return true;

    // Search inside transcript lines
    return call.transcripts.some((t) => matchesText(t.text));
  });

  // 2. Filter Mood Notes
  const matchingNotes = moodNotes.filter((note) => {
    if (!normalizedQuery) return true;
    if (matchesText(note.content)) return true;
    if (matchesText(note.authorName)) return true;
    if (matchesText(note.authorRelationship)) return true;
    if (matchesText(note.mood)) return true;
    if (note.isPinned && (normalizedQuery.includes("pin") || normalizedQuery.includes("pinned") || normalizedQuery.includes("top") || normalizedQuery.includes("important"))) return true;
    if (note.audioSnippetUrl && (normalizedQuery.includes("voice") || normalizedQuery.includes("audio") || normalizedQuery.includes("snippet") || normalizedQuery.includes("recording"))) return true;

    // Search comments
    return note.comments.some((c) => matchesText(c.content) || matchesText(c.authorName));
  });

  const totalResults = (activeFilter === "all" ? matchingCalls.length + matchingNotes.length : activeFilter === "calls" ? matchingCalls.length : matchingNotes.length);

  const sampleVoicePrompts = [
    "Urgent medical calls",
    "Dad's chai notes",
    "Calls from Dr. Verma",
    "Dinner recipes and cooking",
    "Pinned family updates",
    "Calls bridged to Rahul",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        id="voice-search-modal-card"
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header / Voice Input Control */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-50/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <span>Global Voice & Natural Search</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                    Microphone API
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  Search across Sharma family call transcripts, voicemails, and mood board notes
                </p>
              </div>
            </div>
            <button
              id="close-voice-search-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar with Microphone Button */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
            <input
              id="voice-search-text-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Speak or type: e.g. 'urgent doctor call', 'mom's food note', 'voicemails'..."
              className="w-full pl-10 pr-24 py-3 bg-white border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 outline-hidden transition shadow-xs"
            />
            <div className="absolute right-2 flex items-center space-x-1">
              {query && (
                <button
                  id="clear-search-query-btn"
                  onClick={() => setQuery("")}
                  className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-600 rounded-lg text-xs"
                  title="Clear text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                id="toggle-voice-mic-btn"
                type="button"
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start speaking with microphone"}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isListening
                    ? "bg-red-600 text-white animate-pulse shadow-md"
                    : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Mic</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Waveform & Listening Banner */}
          {isListening && (
            <div 
              id="voice-listening-active-banner" 
              className="bg-amber-100/80 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="relative flex h-3 w-3 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <span className="font-medium truncate">
                  Speak into your microphone now... <span className="text-amber-800">"{query || 'Awaiting family voice...'}"</span>
                </span>
              </div>

              {/* Dynamic Animated Soundbars */}
              <div className="flex items-center space-x-1 h-5 flex-shrink-0">
                {[12, 24, 18, 28, 16, 22].map((height, i) => {
                  const dynamicHeight = Math.max(4, Math.min(22, (audioLevel / 100) * height + (i % 2 === 0 ? 5 : 2)));
                  return (
                    <span
                      key={i}
                      className="w-1 bg-amber-600 rounded-full transition-all duration-75"
                      style={{ height: `${dynamicHeight}px` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Suggested Natural Language Voice Queries */}
          {!query && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-stone-400 block">Try natural voice queries:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleVoicePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    id={`suggested-voice-prompt-${prompt.replace(/\s+/g, "-").toLowerCase()}`}
                    type="button"
                    onClick={() => setQuery(prompt)}
                    className="text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-600 transition flex items-center space-x-1"
                  >
                    <span>💬</span>
                    <span>"{prompt}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Filtering Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <button
              id="filter-results-all-btn"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeFilter === "all"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All Matches ({matchingCalls.length + matchingNotes.length})
            </button>
            <button
              id="filter-results-calls-btn"
              onClick={() => setActiveFilter("calls")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeFilter === "calls"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              📞 Call Logs ({matchingCalls.length})
            </button>
            <button
              id="filter-results-notes-btn"
              onClick={() => setActiveFilter("notes")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeFilter === "notes"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              💬 Family Mood Notes ({matchingNotes.length})
            </button>
          </div>
          <span className="text-[11px] text-stone-400 hidden sm:inline">
            Found {totalResults} result{totalResults === 1 ? "" : "s"}
          </span>
        </div>

        {/* Scrollable Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 divide-y divide-stone-100">
          {totalResults === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Search className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">No matching records found</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Try speaking a different keyword like "doctor", "urgent", "dinner", "Pooja", or "voicemail".
              </p>
            </div>
          ) : (
            <>
              {/* Call Log Results */}
              {(activeFilter === "all" || activeFilter === "calls") && matchingCalls.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 pb-1">
                    <span className="flex items-center space-x-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                      <span>Matching Call Transcripts ({matchingCalls.length})</span>
                    </span>
                  </div>

                  {matchingCalls.map((call) => (
                    <div
                      key={call.id}
                      id={`voice-search-call-result-${call.id}`}
                      onClick={() => {
                        onSelectCall(call.id);
                        onClose();
                      }}
                      className="group bg-stone-50 hover:bg-amber-50/60 border border-stone-200 hover:border-amber-300 rounded-2xl p-3.5 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-stone-900 text-sm">{call.callerName}</span>
                          <span className="text-xs text-stone-500 font-mono">{call.callerNumber}</span>
                          {call.isUrgent && (
                            <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.2 rounded font-bold uppercase">
                              Urgent Bridged
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded capitalize ${
                            call.direction === "inbound" ? "bg-stone-200 text-stone-700" : "bg-blue-100 text-blue-800"
                          }`}>
                            {call.direction}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-amber-700 font-medium group-hover:translate-x-0.5 transition">
                          <span>View Call</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>

                      {call.summary && (
                        <p className="text-xs text-stone-700 leading-relaxed bg-white border border-stone-200/80 p-2 rounded-xl">
                          {call.summary}
                        </p>
                      )}

                      {/* Matching transcript snippet */}
                      {query && call.transcripts.some((t) => matchesText(t.text)) && (
                        <div className="text-[11px] text-stone-500 bg-amber-100/50 p-1.5 rounded-lg font-mono">
                          🔍 Snippet: "{call.transcripts.find((t) => matchesText(t.text))?.text}"
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
                        <span>Duration: {call.durationSeconds}s • Provider: {call.telephonyProvider}</span>
                        <span>{new Date(call.startTime).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mood Note Results */}
              {(activeFilter === "all" || activeFilter === "notes") && matchingNotes.length > 0 && (
                <div className="space-y-2.5 pt-3">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 pb-1">
                    <span className="flex items-center space-x-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                      <span>Matching Mood Notes ({matchingNotes.length})</span>
                    </span>
                  </div>

                  {matchingNotes.map((note) => (
                    <div
                      key={note.id}
                      id={`voice-search-note-result-${note.id}`}
                      onClick={() => {
                        onSelectNote(note.id);
                        onClose();
                      }}
                      className="group bg-stone-50 hover:bg-amber-50/60 border border-stone-200 hover:border-amber-300 rounded-2xl p-3.5 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={note.authorAvatar}
                            alt={note.authorName}
                            className="w-6 h-6 rounded-full object-cover border border-stone-200"
                          />
                          <span className="font-bold text-stone-900 text-sm">{note.authorName}</span>
                          <span className="text-xs text-stone-400 capitalize">({note.authorRelationship})</span>
                          {note.isPinned && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded font-bold flex items-center space-x-0.5">
                              <Pin className="w-2.5 h-2.5" />
                              <span>Pinned</span>
                            </span>
                          )}
                          <span className="text-xs bg-white border border-stone-200 px-2 py-0.5 rounded-full capitalize">
                            {note.mood}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-amber-700 font-medium group-hover:translate-x-0.5 transition">
                          <span>View on Board</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>

                      <p className="text-xs text-stone-800 leading-relaxed font-serif text-sm">
                        "{note.content}"
                      </p>

                      {note.audioSnippetUrl && (
                        <div className="flex items-center space-x-1.5 text-[11px] text-amber-800 bg-amber-100/60 px-2 py-1 rounded-lg">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Includes voice recording ({note.audioDuration || 6}s)</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
                        <span>{note.comments.length} comments • {Object.keys(note.reactions || {}).length} reactions</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono shadow-2xs">ESC</kbd>
            <span>to close</span>
          </div>
          <button
            id="close-voice-search-footer-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
