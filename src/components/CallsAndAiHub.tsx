import React, { useState } from "react";
import { 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Users, 
  Clock, 
  Calendar, 
  FileAudio, 
  Plus, 
  Upload, 
  MessageSquare, 
  Play, 
  Trash2, 
  Edit3, 
  Check, 
  ExternalLink,
  Search,
  Sparkles,
  PhoneForwarded,
  ShieldCheck,
  Globe,
  Repeat,
  RotateCw,
  Pause,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Filter,
  Flag,
  AlertTriangle,
  Loader2,
  BarChart3,
  ArrowUpRight,
  Phone,
  Flame
} from "lucide-react";
import { AppSettings, CallSession, Contact, ScheduledCall, FamilyMember, RecurrenceConfig, CallPriority } from "../types";
import { TelephonySimulator } from "./TelephonySimulator";
import { CallLogsView } from "./CallLogsView";
import { OutboundCallAnalytics } from "./OutboundCallAnalytics";
import { saveFirestoreContact, deleteFirestoreContact, saveFirestoreCallSession } from "../lib/firebase";
import { buildNaturalAiIntro } from "../lib/openAiRealtimeVoice";

interface CallsAndAiHubProps {
  settings: AppSettings;
  activeCall: CallSession | null;
  callLogs: CallSession[];
  contacts: Contact[];
  scheduledCalls: ScheduledCall[];
  members: FamilyMember[];
  currentMember: FamilyMember;
  onCallUpdate: (call: CallSession) => void;
  onEndCall: (callId: string, durationSeconds: number, audioUrl?: string) => void;
  onRefreshState: () => void;
  onBulkDeleteCalls: (callIds: string[]) => void;
  highlightedCallId?: string | null;
}

export const CallsAndAiHub: React.FC<CallsAndAiHubProps> = ({
  settings,
  activeCall,
  callLogs,
  contacts,
  scheduledCalls,
  members,
  currentMember,
  onCallUpdate,
  onEndCall,
  onRefreshState,
  onBulkDeleteCalls,
  highlightedCallId,
}) => {
  const [hubView, setHubView] = useState<"launcher" | "contacts" | "scheduled" | "logs" | "analytics">("launcher");
  const [contactsSubTab, setContactsSubTab] = useState<"list" | "dialer">("list");
  const [contactSearch, setContactSearch] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedContactForCall, setSelectedContactForCall] = useState<Contact | null>(null);

  // Custom Separate Number Dialing state
  const [dialerNumber, setDialerNumber] = useState("+91 94401 23456");
  const [dialerName, setDialerName] = useState("");
  const [dialerRelation, setDialerRelation] = useState("Family Contact");
  const [dialerPrompt, setDialerPrompt] = useState(
    "Arre namasthe! Nenu Rahul assistant ni matladthunna. Quick family check-in kosam call chesam. Everything alright kada?"
  );
  const [isDialingCustom, setIsDialingCustom] = useState(false);
  const [dialerFeedback, setDialerFeedback] = useState<string | null>(null);

  // Auto-switch to logs when user clicks notification toast for a completed call
  React.useEffect(() => {
    if (highlightedCallId) {
      setHubView("logs");
    }
  }, [highlightedCallId]);

  // Scheduled calls filtering and editing
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "recurring" | "one-off" | "active" | "paused">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [editingSchedule, setEditingSchedule] = useState<ScheduledCall | null>(null);
  const [callingScheduleId, setCallingScheduleId] = useState<string | null>(null);

  // New Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "Friend",
    notes: "",
    preferredLanguage: "Telugu" as "Telugu" | "Hindi" | "English",
  });

  // Schedule Call Form State with full recurring and priority support
  const [scheduleForm, setScheduleForm] = useState({
    contactName: "",
    contactPhone: "",
    scheduledTime: "",
    reminderNote: "",
    promptGoal: "",
    priority: "medium" as CallPriority,
    isRecurring: true,
    frequency: "custom" as "hourly" | "daily" | "weekly" | "custom",
    intervalValue: 12,
    intervalUnit: "hours" as "hours" | "days" | "weeks",
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    maxRuns: "",
    endDate: "",
    active: true,
  });

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch) ||
      c.relationship.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Save New or Edited Contact (REST + Real-Time Firestore Sync)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) return;

    const contactId = editingContact ? editingContact.id : `c-${Date.now()}`;
    const contactObj: Contact = {
      id: contactId,
      name: contactForm.name,
      phone: contactForm.phone,
      email: contactForm.email || "",
      relationship: contactForm.relationship,
      notes: contactForm.notes || "",
      preferredLanguage: contactForm.preferredLanguage as any,
      avatar: editingContact?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };

    try {
      if (editingContact) {
        await fetch(`/api/contacts/${editingContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactForm),
        });
      } else {
        await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactForm),
        });
      }

      // Real-time Firestore write
      await saveFirestoreContact(contactObj);

      setIsAddContactOpen(false);
      setEditingContact(null);
      setContactForm({
        name: "",
        phone: "",
        email: "",
        relationship: "Friend",
        notes: "",
        preferredLanguage: "Telugu",
      });
      onRefreshState();
    } catch (err) {
      console.error("Failed to save contact:", err);
    }
  };

  // Open Edit Contact
  const handleOpenEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      relationship: contact.relationship,
      notes: contact.notes || "",
      preferredLanguage: contact.preferredLanguage || "Telugu",
    });
    setIsAddContactOpen(true);
  };

  // Delete Contact (REST + Real-Time Firestore Sync)
  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
      await deleteFirestoreContact(contactId);
      onRefreshState();
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  };

  // Direct Dial Custom Number with AI and Verified Caller ID
  const handleTriggerDirectDial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dialerNumber.trim()) return;

    setIsDialingCustom(true);
    setDialerFeedback(null);

    const verifiedCallerId = settings.primaryForwardPhone || "+91 98765 43210";
    const contactName = dialerName.trim() || "Family Contact";

    try {
      const res = await fetch("/api/telephony/outbound-ai-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPhoneNumber: dialerNumber,
          contactName,
          aiScriptText: dialerPrompt,
          callerId: verifiedCallerId,
          userCallerId: verifiedCallerId,
        }),
      });

      const data = await res.json();
      if (data.callSession) {
        onCallUpdate(data.callSession);
        await saveFirestoreCallSession(data.callSession);
      }

      setDialerFeedback(`Connected to ${contactName} (${dialerNumber})! Audio routed via Telephony Gateway with verified Caller ID: ${verifiedCallerId}`);
      setTimeout(() => {
        setDialerFeedback(null);
        setSelectedContactForCall({
          id: `c-direct-${Date.now()}`,
          name: contactName,
          phone: dialerNumber,
          relationship: dialerRelation,
          preferredLanguage: "Telugu",
        });
        setHubView("launcher");
      }, 1400);
    } catch (err) {
      console.error("Direct dial outbound call failed:", err);
      setDialerFeedback("Failed to trigger outbound call. Please check line status.");
    } finally {
      setIsDialingCustom(false);
    }
  };

  // Bulk Sync / Import preset contacts
  const handleSyncPresetContacts = async () => {
    const sampleImport = [
      {
        name: "Apollo Pharmacy 24/7",
        phone: "+91 99887 76655",
        email: "care@apollopharmacy.org",
        relationship: "Emergency Chemist",
        notes: "Prescription emergency refills and delivery",
        preferredLanguage: "English",
      },
      {
        name: "Security Gate Guard (Society)",
        phone: "+91 94444 33221",
        relationship: "Building Management",
        notes: "Main gate visitor verification",
        preferredLanguage: "Hindi",
      },
      {
        name: "Suresh Babai (Warangal)",
        phone: "+91 98480 12345",
        relationship: "Relative (Uncle)",
        notes: "Dad's childhood friend from Warangal",
        preferredLanguage: "Telugu",
      },
    ];

    try {
      await fetch("/api/contacts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importedContacts: sampleImport }),
      });
      setIsSyncModalOpen(false);
      onRefreshState();
    } catch (err) {
      console.error("Failed to sync contacts:", err);
    }
  };

  // Indian Family Care & Reminder Presets
  const CARE_REMINDER_PRESETS = [
    {
      title: "💊 BP & Sugar Meds (Every 12h)",
      note: "Remind Dad about evening BP tablet & warm water",
      prompt: "Gentle reminder in Telugu: 'Namaskaram Nanna garu, evening BP tablet vesukunnara? Lukewarm water tagandi.'",
      intervalValue: 12,
      intervalUnit: "hours" as const,
      priority: "critical" as CallPriority,
    },
    {
      title: "🌅 Morning Walk & Warm Water (Daily)",
      note: "Morning walk & warm lemon water check-in",
      prompt: "Polite Telugu/Hindi greeting: 'Good morning! Please drink warm water and enjoy a brisk 20 min walk in the park.'",
      intervalValue: 1,
      intervalUnit: "days" as const,
      priority: "low" as CallPriority,
    },
    {
      title: "💧 Afternoon Hydration & Break (Every 4h)",
      note: "Drink fresh buttermilk and stay hydrated",
      prompt: "Caring reminder in Telugu: 'Amma, please have a glass of water or buttermilk and take some rest now.'",
      intervalValue: 4,
      intervalUnit: "hours" as const,
      priority: "medium" as CallPriority,
    },
    {
      title: "🏥 Pharmacy & Refills Check (Every 7d)",
      note: "Check diabetic strip stock and medicine refills",
      prompt: "Check medicine stock and confirm if Apollo Pharmacy order is needed for next week.",
      intervalValue: 1,
      intervalUnit: "weeks" as const,
      priority: "high" as CallPriority,
    },
  ];

  // Open Create Schedule Modal
  const handleOpenCreateSchedule = (preset?: typeof CARE_REMINDER_PRESETS[0]) => {
    const inOneHour = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
    setEditingSchedule(null);
    setScheduleForm({
      contactName: preset ? (preset.note.includes("Dad") ? "Ramesh Sharma (Dad)" : preset.note.includes("Mom") ? "Sunita Sharma (Mom)" : "") : "",
      contactPhone: preset ? (preset.note.includes("Dad") ? "+91 98765 43212" : preset.note.includes("Mom") ? "+91 98765 43211" : "") : "",
      scheduledTime: inOneHour,
      reminderNote: preset ? preset.note : "",
      promptGoal: preset ? preset.prompt : "",
      priority: preset ? preset.priority : "medium",
      isRecurring: true,
      frequency: "custom",
      intervalValue: preset ? preset.intervalValue : 4,
      intervalUnit: preset ? preset.intervalUnit : "hours",
      daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      maxRuns: "",
      endDate: "",
      active: true,
    });
    setIsScheduleModalOpen(true);
  };

  // Open Edit Schedule Modal
  const handleOpenEditSchedule = (sch: ScheduledCall) => {
    setEditingSchedule(sch);
    setScheduleForm({
      contactName: sch.contactName,
      contactPhone: sch.contactPhone,
      scheduledTime: sch.scheduledTime ? new Date(sch.scheduledTime).toISOString().slice(0, 16) : "",
      reminderNote: sch.reminderNote,
      promptGoal: sch.promptGoal,
      priority: sch.priority || "medium",
      isRecurring: sch.isRecurring || false,
      frequency: sch.recurrence?.frequency || "custom",
      intervalValue: sch.recurrence?.intervalValue || 12,
      intervalUnit: sch.recurrence?.intervalUnit || "hours",
      daysOfWeek: sch.recurrence?.daysOfWeek || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      maxRuns: sch.recurrence?.maxRuns ? String(sch.recurrence.maxRuns) : "",
      endDate: sch.recurrence?.endDate ? sch.recurrence.endDate.slice(0, 16) : "",
      active: sch.active !== false,
    });
    setIsScheduleModalOpen(true);
  };

  // Handle Save (Create or Update) Schedule Call
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.contactName || !scheduleForm.scheduledTime) return;

    const payload = {
      contactName: scheduleForm.contactName,
      contactPhone: scheduleForm.contactPhone,
      scheduledTime: new Date(scheduleForm.scheduledTime).toISOString(),
      reminderNote: scheduleForm.reminderNote,
      promptGoal: scheduleForm.promptGoal,
      createdByName: currentMember.name,
      priority: scheduleForm.priority,
      isRecurring: scheduleForm.isRecurring,
      active: scheduleForm.active,
      recurrence: scheduleForm.isRecurring
        ? {
            frequency: scheduleForm.frequency,
            intervalValue: Math.max(1, Number(scheduleForm.intervalValue) || 1),
            intervalUnit: scheduleForm.intervalUnit,
            daysOfWeek: scheduleForm.daysOfWeek,
            maxRuns: scheduleForm.maxRuns ? Number(scheduleForm.maxRuns) : undefined,
            endDate: scheduleForm.endDate ? new Date(scheduleForm.endDate).toISOString() : undefined,
          }
        : undefined,
    };

    try {
      if (editingSchedule) {
        await fetch(`/api/scheduled-calls/${editingSchedule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/scheduled-calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      onRefreshState();
      setHubView("scheduled");
    } catch (err) {
      console.error("Failed to save scheduled call:", err);
    }
  };

  // Quick Priority Update for a reminder
  const handleUpdatePriority = async (id: string, priority: CallPriority) => {
    try {
      await fetch(`/api/scheduled-calls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      onRefreshState();
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  // Toggle Active/Paused Status for a recurring reminder
  const handleToggleActiveSchedule = async (id: string) => {
    try {
      await fetch(`/api/scheduled-calls/${id}/toggle-active`, { method: "PATCH" });
      onRefreshState();
    } catch (err) {
      console.error("Failed to toggle schedule active status:", err);
    }
  };

  // Trigger Scheduled Call Now (Call Now Shortcut)
  const handleTriggerScheduleNow = async (id: string) => {
    try {
      setCallingScheduleId(id);
      const res = await fetch(`/api/scheduled-calls/${id}/trigger`, { method: "POST" });
      const data = await res.json();
      if (data.callSession) {
        onCallUpdate(data.callSession);
        setHubView("launcher");
      }
      onRefreshState();
    } catch (err) {
      console.error("Failed to trigger scheduled call:", err);
    } finally {
      setCallingScheduleId(null);
    }
  };

  // Cancel / Delete Scheduled Call
  const handleCancelSchedule = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this reminder?")) return;
    try {
      await fetch(`/api/scheduled-calls/${id}`, { method: "DELETE" });
      onRefreshState();
    } catch (err) {
      console.error("Failed to cancel scheduled call:", err);
    }
  };

  // Direct WhatsApp Quick Redirect Helper
  const getWhatsAppLink = (phone: string, name: string) => {
    // Sanitize phone number to international digits without '+'
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const defaultMsg = encodeURIComponent(
      `Hi ${name}, this is a message from the Sharma family GharCall AI hub. Please let us know if you need anything!`
    );
    return `https://wa.me/${cleanPhone}?text=${defaultMsg}`;
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Pill Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          <button
            id="hub-tab-launcher"
            onClick={() => setHubView("launcher")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              hubView === "launcher"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <PhoneCall className="w-4 h-4 text-amber-500" />
            <span>AI Call Launcher</span>
            {activeCall && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
            )}
          </button>

          <button
            id="hub-tab-contacts"
            onClick={() => setHubView("contacts")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              hubView === "contacts"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Contacts & WhatsApp</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono">
              {contacts.length}
            </span>
          </button>

          <button
            id="hub-tab-scheduled"
            onClick={() => setHubView("scheduled")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              hubView === "scheduled"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Voice Reminders & Schedules</span>
            {scheduledCalls.filter((s) => s.isRecurring).length > 0 && (
              <span className="flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono" title="Recurring Reminders">
                <Repeat className="w-2.5 h-2.5 inline mr-0.5" />
                <span>{scheduledCalls.filter((s) => s.isRecurring).length}</span>
              </span>
            )}
            {scheduledCalls.filter((s) => s.status === "pending").length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-mono">
                {scheduledCalls.filter((s) => s.status === "pending").length}
              </span>
            )}
          </button>

          <button
            id="hub-tab-logs"
            onClick={() => setHubView("logs")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              hubView === "logs"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <FileAudio className="w-4 h-4 text-amber-500" />
            <span>Call Logs & Audio</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono">
              {callLogs.length}
            </span>
          </button>

          <button
            id="hub-tab-analytics"
            onClick={() => setHubView("analytics")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              hubView === "analytics"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span>Outbound Analytics & Peak Times</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold">
              {callLogs.filter((c) => c.direction === "outbound").length}
            </span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {hubView === "contacts" && (
            <>
              <button
                id="btn-sync-contacts-modal"
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>Sync Contacts</span>
              </button>
              <button
                id="btn-add-contact-modal"
                onClick={() => {
                  setEditingContact(null);
                  setContactForm({
                    name: "",
                    phone: "",
                    email: "",
                    relationship: "Friend",
                    notes: "",
                    preferredLanguage: "Telugu",
                  });
                  setIsAddContactOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </>
          )}

          {hubView === "scheduled" && (
            <button
              id="btn-add-scheduled-call-modal"
              onClick={() => handleOpenCreateSchedule()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Voice Reminder</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. AI CALL LAUNCHER (Interactive Inbound/Outbound Toggle) */}
      {hubView === "launcher" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <TelephonySimulator
            settings={settings}
            activeCall={activeCall}
            onCallUpdate={onCallUpdate}
            onEndCall={onEndCall}
            onRefreshState={onRefreshState}
            initialContact={selectedContactForCall}
          />
        </div>
      )}

      {/* 2. SYNC & EDIT CONTACTS + WHATSAPP DIRECT LINK */}
      {hubView === "contacts" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Subtabs for Contacts vs Custom Dialing */}
          <div className="flex items-center justify-between bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
            <div className="flex items-center space-x-2">
              <button
                id="btn-subtab-contacts-list"
                onClick={() => setContactsSubTab("list")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                  contactsSubTab === "list"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Saved Contacts ({filteredContacts.length})</span>
              </button>

              <button
                id="btn-subtab-custom-dialer"
                onClick={() => setContactsSubTab("dialer")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                  contactsSubTab === "dialer"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dial Separate Number</span>
                <span className="px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 text-[10px] font-mono">
                  Verified Caller ID
                </span>
              </button>
            </div>
          </div>

          {/* CUSTOM SEPARATE NUMBER DIALER VIEW */}
          {contactsSubTab === "dialer" && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                    <PhoneForwarded className="w-5 h-5 text-emerald-600" />
                    <span>Outbound AI Dial to Any Separate Number</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Input any target phone number. Audio routes via outbound Telephony gateway trunk (Retell/Twilio) using your verified personal number as Caller ID to avoid spam flagging.
                  </p>
                </div>

                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-emerald-900 font-semibold">
                    Caller ID: <strong className="font-mono">{settings.primaryForwardPhone || "+91 98765 43210"}</strong> (Verified)
                  </span>
                </div>
              </div>

              {dialerFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{dialerFeedback}</span>
                </div>
              )}

              <form onSubmit={handleTriggerDirectDial} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-600 mb-1.5">
                      Target Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        id="separate-phone-number-input"
                        type="tel"
                        required
                        value={dialerNumber}
                        onChange={(e) => setDialerNumber(e.target.value)}
                        placeholder="+91 94401 23456 or +1 555 123 4567"
                        className="w-full px-4 py-2.5 pl-10 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1 block">
                      Include country code (e.g. +91 for India, +1 for US).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-600 mb-1.5">
                      Recipient Name (Optional)
                    </label>
                    <input
                      id="separate-recipient-name-input"
                      type="text"
                      value={dialerName}
                      onChange={(e) => setDialerName(e.target.value)}
                      placeholder="e.g. Suresh Mama, Apollo Pharmacy, Doctor"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 mb-1.5">
                    Telangana Telugu Voice Prompt / Purpose
                  </label>
                  <textarea
                    id="separate-voice-prompt-input"
                    rows={2}
                    value={dialerPrompt}
                    onChange={(e) => setDialerPrompt(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Telangana Telugu Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    ⚡ Quick Telangana Telugu Conversational Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDialerPrompt(
                          "Arre namasthe Dad! BP tablets afternoon vesukunnara? Doctor garu time ki vesukomannaru kada, take rest now."
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs text-left"
                    >
                      💊 Medicine & BP Check
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDialerPrompt(
                          "Arre namasthe Mom! Sayantram intiki tondaraga vasthunna. Fresh ga chai or snacks cheyandi please!"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs text-left"
                    >
                      🍲 Evening Check-in & Food
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDialerPrompt(
                          "Arre Kiran anna! Kirana dukanam nunchi fresh milk mariyu vegetables teeskuraagalara? Urgent ga avasaram."
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs text-left"
                    >
                      🛒 Groceries / Vegetable Delivery
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-stone-500">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Real-time Firestore Call Logging Active</span>
                  </div>

                  <button
                    id="trigger-direct-dial-btn"
                    type="submit"
                    disabled={isDialingCustom || !dialerNumber.trim()}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isDialingCustom ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Dialing via Telephony Trunk...</span>
                      </>
                    ) : (
                      <>
                        <PhoneOutgoing className="w-4 h-4" />
                        <span>Call with Telangana Telugu AI</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SAVED CONTACTS LIST */}
          {contactsSubTab === "list" && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                  <input
                    id="search-contacts-input"
                    type="text"
                    placeholder="Search by name, phone or relation..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  Showing <span className="font-bold text-stone-800">{filteredContacts.length}</span> verified contacts
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                id={`contact-card-${contact.id}`}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={contact.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                      alt={contact.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{contact.name}</h4>
                      <p className="text-xs text-amber-700 font-medium">{contact.relationship}</p>
                      <p className="text-xs font-mono text-stone-500">{contact.phone}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                    {contact.preferredLanguage || "Telugu"}
                  </span>
                </div>

                {contact.notes && (
                  <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 line-clamp-2 italic">
                    "{contact.notes}"
                  </p>
                )}

                {/* Actions: Edit, WhatsApp, Launch AI Call */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1">
                    {/* WhatsApp Direct Link Button */}
                    <a
                      id={`whatsapp-btn-${contact.id}`}
                      href={getWhatsAppLink(contact.phone, contact.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open WhatsApp Direct Chat"
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Edit Contact */}
                    <button
                      id={`edit-contact-btn-${contact.id}`}
                      onClick={() => handleOpenEditContact(contact)}
                      title="Edit Contact Name & Details"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      id={`delete-contact-btn-${contact.id}`}
                      onClick={() => handleDeleteContact(contact.id)}
                      title="Delete Contact"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Launch AI Call button */}
                  <button
                    id={`trigger-ai-call-${contact.id}`}
                    onClick={() => {
                      setSelectedContactForCall(contact);
                      setHubView("launcher");
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-amber-600 transition shadow-2xs"
                  >
                    <PhoneOutgoing className="w-3 h-3 text-amber-400" />
                    <span>Call with AI</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      )}

      {/* 3. TIME SCHEDULING / RECURRING REMINDERS */}
      {hubView === "scheduled" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Peak Communication Times Quick Recharts Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-stone-900">Peak Communication Times Identified</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-200 text-amber-900">
                    🔥 6:00 PM – 8:00 PM Peak
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Outbound AI voice calls to elders scheduled between 5:30 PM–7:30 PM have a 98% immediate pickup rate.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-view-peak-analytics-banner"
              onClick={() => setHubView("analytics")}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition shadow-2xs shrink-0 self-end sm:self-auto"
            >
              <span>View Recharts Volume</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Automated AI Voice Call Reminders & Schedules</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                  GharCall AI automatically dials family members at scheduled intervals to check in, deliver medication reminders, or verify wellness in Telugu, Hindi, or English.
                </p>
              </div>
              <button
                id="schedule-new-call-header-btn"
                onClick={() => handleOpenCreateSchedule()}
                className="self-start sm:self-auto flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Voice Reminder</span>
              </button>
            </div>

            {/* Care Presets Quick Launcher */}
            <div className="pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quick Care Presets</span>
                </span>
                <span className="text-[11px] text-stone-400">Click to pre-fill schedule</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {CARE_REMINDER_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenCreateSchedule(preset)}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-amber-50/60 hover:border-amber-300 text-left transition text-xs group"
                  >
                    <div className="font-semibold text-stone-800 group-hover:text-amber-900 truncate">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">
                      {preset.note}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Pills and Search */}
            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  <button
                    type="button"
                    onClick={() => setScheduleFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      scheduleFilter === "all"
                        ? "bg-stone-900 text-white shadow-2xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    All ({scheduledCalls.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleFilter("recurring")}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition ${
                      scheduleFilter === "recurring"
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    <Repeat className="w-3 h-3" />
                    <span>Recurring ({scheduledCalls.filter((s) => s.isRecurring).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleFilter("one-off")}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      scheduleFilter === "one-off"
                        ? "bg-stone-900 text-white shadow-2xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    One-Off ({scheduledCalls.filter((s) => !s.isRecurring).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleFilter("active")}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      scheduleFilter === "active"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    Active ({scheduledCalls.filter((s) => s.active !== false && s.status === "pending").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleFilter("paused")}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      scheduleFilter === "paused"
                        ? "bg-stone-700 text-white shadow-2xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Paused ({scheduledCalls.filter((s) => s.active === false).length})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search reminders & contacts..."
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Priority Filters */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-semibold text-stone-500 flex items-center space-x-1 mr-1 shrink-0">
                  <Filter className="w-3 h-3 text-stone-400" />
                  <span>Priority:</span>
                </span>
                {[
                  { id: "all", label: "All Priorities", activeClass: "bg-stone-800 text-white" },
                  { id: "critical", label: "🚨 Critical", activeClass: "bg-rose-700 text-white" },
                  { id: "high", label: "🟠 High", activeClass: "bg-amber-600 text-white" },
                  { id: "medium", label: "🔵 Medium", activeClass: "bg-sky-600 text-white" },
                  { id: "low", label: "🟢 Low", activeClass: "bg-emerald-600 text-white" },
                ].map((p) => {
                  const isSelected = priorityFilter === p.id;
                  const count =
                    p.id === "all"
                      ? scheduledCalls.length
                      : scheduledCalls.filter((s) => (s.priority || "medium") === p.id).length;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriorityFilter(p.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                        isSelected
                          ? p.activeClass
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {p.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const displayed = scheduledCalls.filter((sch) => {
                const term = scheduleSearch.toLowerCase();
                const matchesSearch =
                  !term ||
                  sch.contactName.toLowerCase().includes(term) ||
                  sch.contactPhone.toLowerCase().includes(term) ||
                  sch.reminderNote.toLowerCase().includes(term) ||
                  (sch.promptGoal && sch.promptGoal.toLowerCase().includes(term));

                if (!matchesSearch) return false;

                if (scheduleFilter === "recurring") return !!sch.isRecurring;
                if (scheduleFilter === "one-off") return !sch.isRecurring;
                if (scheduleFilter === "active") return sch.active !== false && sch.status === "pending";
                if (scheduleFilter === "paused") return sch.active === false;

                if (priorityFilter !== "all" && (sch.priority || "medium") !== priorityFilter) return false;

                return true;
              });

              if (displayed.length === 0) {
                return (
                  <div className="col-span-2 bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500 text-sm space-y-2">
                    <p className="font-semibold text-stone-700">No voice reminders match your filter criteria.</p>
                    <p className="text-xs text-stone-400">
                      Click "New Voice Reminder" or pick a Quick Care Preset above to create recurring calls.
                    </p>
                  </div>
                );
              }

              return displayed.map((sch) => {
                const dateObj = new Date(sch.scheduledTime);
                const isPending = sch.status === "pending";
                const isActive = sch.active !== false;
                const priority = sch.priority || "medium";

                return (
                  <div
                    key={sch.id}
                    id={`scheduled-card-${sch.id}`}
                    className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3.5 transition ${
                      !isActive
                        ? "border-stone-200 bg-stone-50/50 opacity-75"
                        : priority === "critical"
                        ? "border-rose-300 ring-1 ring-rose-200 hover:border-rose-400"
                        : priority === "high"
                        ? "border-amber-300 hover:border-amber-400"
                        : sch.isRecurring
                        ? "border-emerald-200 hover:border-emerald-300"
                        : isPending
                        ? "border-amber-200 hover:border-amber-300"
                        : "border-stone-200"
                    }`}
                  >
                    {/* Top Row: Status, Recurrence Badge, Priority Badge, Active Toggle */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-100 text-amber-800"
                              : sch.status === "triggered"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {sch.status}
                        </span>

                        {/* Priority Badge with quick change dropdown */}
                        <div className="relative group/priority">
                          <button
                            type="button"
                            className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                              priority === "critical"
                                ? "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                                : priority === "high"
                                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                                : priority === "low"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200"
                            }`}
                            title={`Priority: ${priority.toUpperCase()} (Click to change)`}
                          >
                            {priority === "critical" ? (
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            ) : (
                              <Flag className="w-2.5 h-2.5" />
                            )}
                            <span className="capitalize">{priority}</span>
                          </button>
                          <div className="hidden group-hover/priority:flex absolute left-0 top-full mt-1 z-20 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 flex-col space-y-0.5 w-28">
                            <span className="text-[9px] font-bold text-stone-400 px-2 py-0.5">SET PRIORITY</span>
                            {(["critical", "high", "medium", "low"] as CallPriority[]).map((pr) => (
                              <button
                                key={pr}
                                type="button"
                                onClick={() => handleUpdatePriority(sch.id, pr)}
                                className={`text-left text-[10px] font-semibold px-2 py-1 rounded-md capitalize transition flex items-center justify-between ${
                                  priority === pr
                                    ? "bg-stone-100 text-stone-900 font-bold"
                                    : "text-stone-600 hover:bg-stone-50"
                                }`}
                              >
                                <span>{pr}</span>
                                {priority === pr && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {sch.isRecurring && (
                          <span
                            className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"
                            title={`Recurring every ${sch.recurrence?.intervalValue || 1} ${sch.recurrence?.intervalUnit || "days"}`}
                          >
                            <Repeat className="w-2.5 h-2.5" />
                            <span>
                              Every {sch.recurrence?.intervalValue || 1}{" "}
                              {sch.recurrence?.intervalUnit || "hours"}
                            </span>
                          </span>
                        )}

                        {sch.isRecurring && (
                          <button
                            type="button"
                            onClick={() => handleToggleActiveSchedule(sch.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition flex items-center space-x-1 ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                            }`}
                            title="Click to pause or resume recurrence"
                          >
                            {isActive ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-2.5 h-2.5 text-stone-500" />
                                <span>Paused</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Scheduled Time info */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-stone-800 flex items-center justify-end space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{dateObj.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        </span>
                        <span className="text-xs font-bold text-amber-700 block">
                          {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{sch.contactName}</h4>
                      <p className="text-xs font-mono text-stone-500 mt-0.5">{sch.contactPhone}</p>
                    </div>

                    {/* Recurrence Details Pill (if recurring) */}
                    {sch.isRecurring && sch.recurrence && (
                      <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>Interval: Repeat every {sch.recurrence.intervalValue} {sch.recurrence.intervalUnit}</span>
                          </span>
                          <span className="font-mono text-[10px] bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-800">
                            Run count: {sch.recurrence.runCount || 0}
                          </span>
                        </div>
                        {sch.recurrence.daysOfWeek && sch.recurrence.daysOfWeek.length < 7 && (
                          <div className="flex items-center space-x-1 pt-0.5">
                            <span className="text-emerald-700">Days:</span>
                            <div className="flex flex-wrap gap-1">
                              {sch.recurrence.daysOfWeek.map((day) => (
                                <span key={day} className="px-1 py-0.2 bg-white rounded text-[9px] font-bold text-emerald-800 border border-emerald-200">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {sch.lastTriggeredAt && (
                          <p className="text-[10px] text-emerald-700/80">
                            Last call triggered: {new Date(sch.lastTriggeredAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                        {sch.recurrence.maxRuns && (
                          <p className="text-[10px] text-emerald-700/80">
                            Limit: Max {sch.recurrence.maxRuns} total runs
                          </p>
                        )}
                        {sch.recurrence.endDate && (
                          <p className="text-[10px] text-emerald-700/80">
                            Ends on: {new Date(sch.recurrence.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Goal & Prompt Details */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1 text-xs">
                      <p className="font-semibold text-stone-800">📌 Goal: {sch.reminderNote}</p>
                      {sch.promptGoal && (
                        <p className="text-stone-600 italic">"Prompt: {sch.promptGoal}"</p>
                      )}
                    </div>

                    {/* Card Actions Footer with Call Now Shortcut Button */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>Queued by {sch.createdByName}</span>
                      <div className="flex items-center space-x-2">
                        {/* 'Call Now' shortcut button */}
                        <button
                          id={`call-now-btn-${sch.id}`}
                          onClick={() => handleTriggerScheduleNow(sch.id)}
                          disabled={callingScheduleId === sch.id}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                          title="Call Now: Immediately trigger an outbound AI call for this scheduled event"
                        >
                          {callingScheduleId === sch.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Calling...</span>
                            </>
                          ) : (
                            <>
                              <PhoneCall className="w-3.5 h-3.5 text-white" />
                              <span>Call Now</span>
                            </>
                          )}
                        </button>

                        <button
                          id={`edit-schedule-${sch.id}`}
                          onClick={() => handleOpenEditSchedule(sch)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition"
                          title="Edit Reminder, Priority & Recurrence Intervals"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`cancel-schedule-${sch.id}`}
                          onClick={() => handleCancelSchedule(sch.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove Scheduled Reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 4. CALL LOGS & TRANSCRIPTS */}
      {hubView === "logs" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <CallLogsView
            callLogs={callLogs}
            isAdmin={currentMember.role === "admin"}
            onBulkDelete={onBulkDeleteCalls}
            highlightedCallId={highlightedCallId}
          />
        </div>
      )}

      {/* 5. OUTBOUND AI CALL VOLUME & PEAK COMMUNICATION ANALYTICS (RECHARTS) */}
      {hubView === "analytics" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <OutboundCallAnalytics
            callLogs={callLogs}
            scheduledCalls={scheduledCalls}
            contacts={contacts}
            onOpenScheduleModal={handleOpenCreateSchedule}
            onCallContact={(contactName, phone) => {
              const matched = contacts.find((c) => c.phone === phone || c.name === contactName);
              if (matched) {
                setSelectedContactForCall(matched);
                setHubView("launcher");
              } else {
                setSelectedContactForCall({
                  id: `cnt-${Date.now()}`,
                  name: contactName,
                  phone: phone,
                  relationship: "Family Contact",
                });
                setHubView("launcher");
              }
            }}
          />
        </div>
      )}

      {/* MODAL: ADD / EDIT CONTACT */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                {editingContact ? "Edit Contact Details" : "Add Family Contact"}
              </h3>
              <button
                onClick={() => {
                  setIsAddContactOpen(false);
                  setEditingContact(null);
                }}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. S. K. Verma or Kiran Uncle"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="Physician / Uncle / Pharmacy"
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="doctor@hospital.org"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Preferred AI Language</label>
                <select
                  value={contactForm.preferredLanguage}
                  onChange={(e) => setContactForm({ ...contactForm, preferredLanguage: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Important Details / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Needs monthly diabetes meds; available between 6pm-9pm."
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddContactOpen(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SYNC CONTACTS */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <span>Sync Contacts from Phone / Email</span>
              </h3>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Import verified family physicians, emergency pharmacies, and close relatives directly into the GharCall Hub.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
              <p className="font-bold">✨ Quick Preset Pack Ready to Import:</p>
              <ul className="list-disc pl-5 space-y-1 text-amber-800">
                <li>Apollo Pharmacy 24/7 (+91 99887 76655)</li>
                <li>Society Security Gate (+91 94444 33221)</li>
                <li>Suresh Babai - Warangal (+91 98480 12345)</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSyncPresetContacts}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
              >
                Import Contacts Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE / EDIT AI VOICE CALL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{editingSchedule ? "Edit Voice Call Reminder & Intervals" : "Schedule Automated AI Voice Call"}</span>
              </h3>
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setEditingSchedule(null);
                }}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets (Only when creating new) */}
            {!editingSchedule && (
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Autofill with Indian Care Preset</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CARE_REMINDER_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setScheduleForm({
                          ...scheduleForm,
                          reminderNote: p.note,
                          promptGoal: p.prompt,
                          isRecurring: true,
                          intervalValue: p.intervalValue,
                          intervalUnit: p.intervalUnit,
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-amber-400 text-[11px] text-stone-700 font-medium transition"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pick Contact or Enter Name *</label>
                <div className="flex space-x-2 mb-2">
                  <select
                    onChange={(e) => {
                      const c = contacts.find((item) => item.id === e.target.value);
                      if (c) {
                        setScheduleForm({
                          ...scheduleForm,
                          contactName: c.name,
                          contactPhone: c.phone,
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose from Contacts --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Target Contact Name"
                  value={scheduleForm.contactName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, contactName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={scheduleForm.contactPhone}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {scheduleForm.isRecurring ? "First Call Date & Time *" : "Scheduled Date & Time *"}
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduledTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Priority Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Flag className="w-3.5 h-3.5 text-stone-500" />
                    <span>Priority Level *</span>
                  </span>
                  <span className="text-[11px] text-stone-400 font-normal">Sets urgency & call priority</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      key: "low" as CallPriority,
                      label: "Low",
                      desc: "Routine / Casual",
                      icon: Flag,
                      selectedClass: "bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500",
                    },
                    {
                      key: "medium" as CallPriority,
                      label: "Medium",
                      desc: "Standard Check-in",
                      icon: Flag,
                      selectedClass: "bg-sky-50 border-sky-500 text-sky-900 ring-1 ring-sky-500",
                    },
                    {
                      key: "high" as CallPriority,
                      label: "High",
                      desc: "Important / Refills",
                      icon: Flag,
                      selectedClass: "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500",
                    },
                    {
                      key: "critical" as CallPriority,
                      label: "Critical",
                      desc: "Urgent Meds / BP",
                      icon: AlertTriangle,
                      selectedClass: "bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500",
                    },
                  ].map((lvl) => {
                    const isSelected = scheduleForm.priority === lvl.key;
                    const IconComp = lvl.icon;
                    return (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setScheduleForm({ ...scheduleForm, priority: lvl.key })}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? lvl.selectedClass
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center space-x-1 text-xs font-bold">
                            <IconComp className="w-3 h-3 shrink-0" />
                            <span>{lvl.label}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-stone-500 mt-1">{lvl.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RECURRING OPTIONS CARD */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.isRecurring}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, isRecurring: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                    />
                    <span className="text-xs font-bold text-stone-900 flex items-center space-x-1.5">
                      <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Repeat this voice call automatically (Recurring)</span>
                    </span>
                  </label>

                  {scheduleForm.isRecurring && (
                    <label className="flex items-center space-x-1.5 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleForm.active}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, active: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                      />
                      <span className="text-[11px] font-semibold">Active</span>
                    </label>
                  )}
                </div>

                {scheduleForm.isRecurring && (
                  <div className="space-y-3 pt-2 border-t border-emerald-100">
                    {/* Interval Quick Presets */}
                    <div>
                      <span className="block text-[11px] font-bold text-emerald-950 mb-1.5">
                        Quick Interval Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Every 2 Hours", val: 2, unit: "hours" as const },
                          { label: "Every 4 Hours", val: 4, unit: "hours" as const },
                          { label: "Every 6 Hours", val: 6, unit: "hours" as const },
                          { label: "Every 12 Hours", val: 12, unit: "hours" as const },
                          { label: "Daily (24h)", val: 1, unit: "days" as const },
                          { label: "Every 2 Days", val: 2, unit: "days" as const },
                          { label: "Weekly", val: 1, unit: "weeks" as const },
                        ].map((preset, idx) => {
                          const isSelected =
                            scheduleForm.intervalValue === preset.val &&
                            scheduleForm.intervalUnit === preset.unit;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setScheduleForm({
                                  ...scheduleForm,
                                  intervalValue: preset.val,
                                  intervalUnit: preset.unit,
                                });
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border ${
                                isSelected
                                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                                  : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Interval Number & Unit */}
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                        Custom Repeat Interval *
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-stone-600 font-medium">Every</span>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          required={scheduleForm.isRecurring}
                          value={scheduleForm.intervalValue}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              intervalValue: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-20 px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-stone-800 text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                        <select
                          value={scheduleForm.intervalUnit}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              intervalUnit: e.target.value as "hours" | "days" | "weeks",
                            })
                          }
                          className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                        </select>
                        <span className="text-[11px] text-emerald-800/80 italic ml-1">
                          (Calls will trigger every {scheduleForm.intervalValue} {scheduleForm.intervalUnit})
                        </span>
                      </div>
                    </div>

                    {/* Days of Week Selection */}
                    <div>
                      <span className="block text-[11px] font-bold text-emerald-950 mb-1.5">
                        Active Days of the Week:
                      </span>
                      <div className="flex items-center space-x-1">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                          const isDaySelected = scheduleForm.daysOfWeek.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = isDaySelected
                                  ? scheduleForm.daysOfWeek.filter((d) => d !== day)
                                  : [...scheduleForm.daysOfWeek, day];
                                setScheduleForm({
                                  ...scheduleForm,
                                  daysOfWeek: newDays.length > 0 ? newDays : [day],
                                });
                              }}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition ${
                                isDaySelected
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional End Conditions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                          Stop After Runs (Optional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 10 (or leave blank)"
                          value={scheduleForm.maxRuns}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, maxRuns: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                          End Date (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleForm.endDate}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Reminder Goal / Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remind Dad about evening BP tablet & warm water"
                  value={scheduleForm.reminderNote}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, reminderNote: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Specific Prompt Goal for AI</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Speak politely in Telugu: 'Namaskaram Nanna garu, did you take your evening tablet? Please drink lukewarm water.'"
                  value={scheduleForm.promptGoal}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, promptGoal: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setEditingSchedule(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
                >
                  {editingSchedule ? "Update Reminder" : "Queue & Schedule Call"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
