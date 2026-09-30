import React, { useState } from "react";
import { 
  Settings, 
  Users, 
  KeyRound, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Trash2, 
  Clock, 
  Save, 
  Bot, 
  Phone, 
  Sparkles, 
  Radio, 
  ExternalLink 
} from "lucide-react";
import { AppSettings, FamilyMember, InviteToken, Role } from "../types";

interface FamilySettingsViewProps {
  currentMember: FamilyMember;
  members: FamilyMember[];
  invites: InviteToken[];
  settings: AppSettings;
  onCreateInvite: (maxUses: number, defaultRole: Role) => void;
  onUpdateRole: (memberId: string, newRole: Role) => void;
  onRemoveMember: (memberId: string) => void;
  onOpenInviteModal: (token: string) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const FamilySettingsView: React.FC<FamilySettingsViewProps> = ({
  currentMember,
  members,
  invites,
  settings,
  onCreateInvite,
  onUpdateRole,
  onRemoveMember,
  onOpenInviteModal,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"invites-rbac" | "telephony-config">("invites-rbac");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newInviteRole, setNewInviteRole] = useState<Role>("member");
  const [maxUses, setMaxUses] = useState(5);

  // Telephony form state
  const [virtualPhoneNumber, setVirtualPhoneNumber] = useState(settings.virtualPhoneNumber);
  const [primaryForwardPhone, setPrimaryForwardPhone] = useState(settings.primaryForwardPhone);
  const [primaryHostName, setPrimaryHostName] = useState(settings.primaryHostName);
  const [greetingTemplate, setGreetingTemplate] = useState(settings.greetingTemplate);
  const [urgencyKeywords, setUrgencyKeywords] = useState(settings.urgencyKeywords.join(", "));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const isAdmin = currentMember.role === "admin";
  const familyRoomCode = "GHAR-SHARMA-8921";

  const handleCopyLink = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(familyRoomCode);
    setCopiedToken("room-code");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleShareWhatsApp = (url: string) => {
    const text = `Namaste! Join our Sharma Family hub on GharCall using Room Code *${familyRoomCode}* or link: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCreateInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateInvite(maxUses, newInviteRole);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    onUpdateSettings({
      virtualPhoneNumber,
      primaryForwardPhone,
      primaryHostName,
      greetingTemplate,
      urgencyKeywords: urgencyKeywords.split(",").map((k) => k.trim()).filter(Boolean),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/telephony/inbound`
    : "https://gharcall.app/api/telephony/inbound";

  return (
    <div className="space-y-6">
      {/* Sub Tab Switcher */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <button
            id="tab-btn-invites-rbac"
            onClick={() => setActiveTab("invites-rbac")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "invites-rbac"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Room Code & Member RBAC</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono">
              {members.length}
            </span>
          </button>

          <button
            id="tab-btn-telephony-config"
            onClick={() => setActiveTab("telephony-config")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "telephony-config"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Settings className="w-4 h-4 text-amber-500" />
            <span>Virtual Line & AI Config</span>
          </button>
        </div>
      </div>

      {/* 1. ROOM CODE & ADMIN RBAC TAB */}
      {activeTab === "invites-rbac" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* UNIQUE FAMILY ROOM CODE BANNER */}
          <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full">
                Permanent Household Identifier
              </span>
              <h2 className="text-xl sm:text-2xl font-black">Family Room Unique Code</h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Family members can enter this unique room code upon app launch to automatically pair with the Sharma household hub.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <div className="text-center sm:text-left">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Room Code</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 tracking-wider">
                  {familyRoomCode}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="copy-room-code-btn"
                  onClick={handleCopyRoomCode}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-amber-100 transition shadow-md"
                >
                  {copiedToken === "room-code" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedToken === "room-code" ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(window.location.origin)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* ADMIN CONTROLS & DYNAMIC PRIVILEGES */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Family Members & Admin Access Control</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isAdmin
                    ? "As an Administrator, you can grant or revoke admin privileges dynamically for any member."
                    : "Standard Member View: Only Administrators can toggle roles or remove members."}
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                isAdmin ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-700"
              }`}>
                You are: {currentMember.role.toUpperCase()}
              </span>
            </div>

            {/* Member Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member, idx) => (
                <div
                  key={`member-card-${member.id || member.phone || idx}-${idx}`}
                  id={`member-rbac-card-${member.id || idx}`}
                  className="bg-stone-50/80 rounded-2xl border border-stone-200 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-stone-900">{member.name}</h4>
                          {member.id === currentMember.id && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-sm font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500">{member.relationship}</p>
                        <p className="text-xs font-mono text-stone-400">{member.phone}</p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        member.role === "admin"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {member.role === "admin" ? "👑 Admin" : "Member"}
                    </span>
                  </div>

                  {/* Actions (Admin Toggle & Remove) */}
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="text-stone-400">
                      {member.isOnline ? "🟢 Online" : "Last seen recently"}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        {member.role === "admin" ? (
                          <button
                            id={`revoke-admin-btn-${member.id}`}
                            disabled={member.id === currentMember.id}
                            onClick={() => onUpdateRole(member.id, "member")}
                            className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-200 font-semibold transition disabled:opacity-40"
                          >
                            Revoke Admin
                          </button>
                        ) : (
                          <button
                            id={`grant-admin-btn-${member.id}`}
                            onClick={() => onUpdateRole(member.id, "admin")}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold transition shadow-2xs"
                          >
                            Grant Admin
                          </button>
                        )}

                        {member.id !== currentMember.id && (
                          <button
                            id={`remove-member-btn-${member.id}`}
                            onClick={() => onRemoveMember(member.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INVITE LINK GENERATION SECTION */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                  <span>Invite Link Generation</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Generate instant secure onboarding links for cousins, grandparents, and household aides.
                </p>
              </div>
            </div>

            {isAdmin && (
              <form onSubmit={handleCreateInviteSubmit} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-stone-700">Assign Role:</span>
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value as Role)}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium"
                  >
                    <option value="member">Standard Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-stone-700">Max Uses:</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 bg-white border border-stone-200 rounded-xl text-center font-mono"
                  />
                </div>

                <button
                  id="generate-invite-link-btn"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-2xs"
                >
                  Generate Invite Link
                </button>
              </form>
            )}

            {/* Active Invites List */}
            <div className="space-y-3 pt-2">
              {invites.map((inv, idx) => {
                const inviteUrl = `${window.location.origin}/join?token=${inv.token}`;
                return (
                  <div
                    key={`invite-card-${inv.id || inv.token || idx}-${idx}`}
                    className="bg-stone-50 rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-900 font-mono">{inv.token}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {inv.defaultRole.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-stone-500 font-mono text-[11px] truncate max-w-sm">{inviteUrl}</p>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleCopyLink(inviteUrl, inv.token)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-semibold"
                      >
                        {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToken === inv.token ? "Copied" : "Copy"}</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(inviteUrl)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. TELEPHONY & VIRTUAL LINE CONFIG */}
      {activeTab === "telephony-config" && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <Bot className="w-5 h-5 text-amber-600" />
                <span>Virtual Line & Telephony Integration Config</span>
              </h3>
              <p className="text-xs text-stone-500">Configure virtual SIP number, forwarding phones, and AI urgency trigger keywords.</p>
            </div>

            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center space-x-1 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">GharCall Virtual Phone Number</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={virtualPhoneNumber}
                  onChange={(e) => setVirtualPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Primary Forwarding Phone (Admin Host)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={primaryForwardPhone}
                  onChange={(e) => setPrimaryForwardPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Primary Host Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={primaryHostName}
                  onChange={(e) => setPrimaryHostName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Urgency Keywords (Multilingual, comma separated)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={urgencyKeywords}
                  onChange={(e) => setUrgencyKeywords(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">AI Inbound Greeting Template</label>
              <textarea
                rows={3}
                disabled={!isAdmin}
                value={greetingTemplate}
                onChange={(e) => setGreetingTemplate(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration Changes</span>
                </button>
              </div>
            )}
          </form>

          {/* Telephony Webhook URL for Twilio / Exotel */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
            <span className="font-bold text-stone-800">Twilio / Exotel Inbound Voice Webhook Endpoint:</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-mono text-stone-600 text-xs"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold"
              >
                {copiedWebhook ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Retell AI Outbound Telephony Integration Card */}
          <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-sm text-amber-400">Retell AI Outbound Telephony Engine</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                settings.retellConfigured
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {settings.retellConfigured ? "Live Retell Line Connected" : "Sandbox / Ready"}
              </span>
            </div>

            <p className="text-stone-300 text-xs leading-relaxed">
              Outbound calls dispatch conversational AI agents using Retell AI v2 API (<code className="text-amber-300">/v2/create-phone-call</code>).
              Dynamic LLM variables (<code className="text-amber-300">caller_name</code>, <code className="text-amber-300">custom_message</code>) are passed per recipient.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono text-[11px]">
              <div className="bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/60">
                <span className="text-stone-400 block text-[10px] uppercase">Retell Agent ID</span>
                <span className="text-emerald-300 font-bold">{settings.retellAgentId || "agent_default_gharcall"}</span>
              </div>
              <div className="bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/60">
                <span className="text-stone-400 block text-[10px] uppercase">Twilio Outbound Caller ID</span>
                <span className="text-amber-300 font-bold">{settings.virtualPhoneNumber || "+18005550199"}</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-stone-400 block text-[10px] uppercase font-mono mb-1">Retell Post-Call Analysis Webhook:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/api/telephony/retell-webhook` : "https://gharcall.app/api/telephony/retell-webhook"}
                  className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-xl font-mono text-stone-300 text-xs"
                />
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/api/telephony/retell-webhook`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-semibold"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
