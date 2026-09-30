import React, { useState } from "react";
import { 
  Users, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Shield,
  Smartphone
} from "lucide-react";
import { FamilyMember, InviteToken, Role } from "../types";

interface MemberManagementProps {
  currentMember: FamilyMember;
  members: FamilyMember[];
  invites: InviteToken[];
  onCreateInvite: (maxUses: number, defaultRole: Role) => void;
  onUpdateRole: (memberId: string, newRole: Role) => void;
  onRemoveMember: (memberId: string) => void;
  onOpenInviteModal: (token: string) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  currentMember,
  members,
  invites,
  onCreateInvite,
  onUpdateRole,
  onRemoveMember,
  onOpenInviteModal,
}) => {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newInviteRole, setNewInviteRole] = useState<Role>("member");
  const [maxUses, setMaxUses] = useState(5);

  const isAdmin = currentMember.role === "admin";

  const handleCopyLink = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleShareWhatsApp = (url: string) => {
    const text = `Join our family communication hub on GharCall! Link: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCreateInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateInvite(maxUses, newInviteRole);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: RBAC Status */}
      <div className={`rounded-2xl p-5 border shadow-xs ${
        isAdmin 
          ? "bg-amber-50/80 border-amber-200 text-amber-950" 
          : "bg-stone-50 border-stone-200 text-stone-800"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAdmin ? "bg-amber-700 text-white" : "bg-stone-300 text-stone-700"
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">
                  {isAdmin ? "Admin Role-Based Access Control (RBAC)" : "Family Member Directory"}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isAdmin ? "bg-amber-200 text-amber-900" : "bg-stone-200 text-stone-700"
                }`}>
                  Your Role: {currentMember.role}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {isAdmin
                  ? "You have full administrator privileges to generate deep-linked invites, toggle member permissions, and manage access."
                  : "Standard members can view directory and notes. Administrator permissions are managed by family hosts."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Deep-Linked Invite Generation Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
          <LinkIcon className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-stone-900">Dynamic Invite Link Generator</h3>
        </div>

        <form onSubmit={handleCreateInviteSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-stone-600">Default Role upon Joining:</label>
            <select
              id="invite-default-role-select"
              value={newInviteRole}
              disabled={!isAdmin}
              onChange={(e) => setNewInviteRole(e.target.value as Role)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="member">Standard Member (Inherited Access)</option>
              {isAdmin && <option value="admin">Administrator (Full Access)</option>}
            </select>
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-stone-600">Max Member Uses:</label>
            <select
              id="invite-max-uses-select"
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value={1}>1 time use only</option>
              <option value={5}>Up to 5 members</option>
              <option value={10}>Up to 10 members</option>
              <option value={50}>Family reunion (50 members)</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <button
              type="submit"
              id="generate-invite-link-btn"
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Generate Deep-Link</span>
            </button>
          </div>
        </form>

        {/* Existing Active Invites */}
        <div className="space-y-2.5 pt-2">
          <span className="text-xs font-semibold text-stone-500 block">Active Deep-Linked Invite Links:</span>
          {invites
            .filter((invite, index, self) => self.findIndex((i) => i.token === invite.token) === index)
            .map((invite) => {
            const isCopied = copiedToken === invite.token;
            // Generate full deep link URL
            const joinUrl = typeof window !== "undefined"
              ? `${window.location.origin}/join?token=${invite.token}`
              : invite.url;

            return (
              <div
                key={invite.token}
                id={`invite-token-row-${invite.token}`}
                className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      gharcall.app/join?token={invite.token}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      ({invite.usedCount}/{invite.maxUses} joined)
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1 flex items-center space-x-2">
                    <span>Created by {invite.createdByName}</span>
                    <span>•</span>
                    <span>Inherits: {invite.defaultRole}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    id={`copy-invite-btn-${invite.token}`}
                    onClick={() => handleCopyLink(joinUrl, invite.token)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg text-stone-700 font-medium transition"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    id={`whatsapp-invite-btn-${invite.token}`}
                    onClick={() => handleShareWhatsApp(joinUrl)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    id={`simulate-join-btn-${invite.token}`}
                    onClick={() => onOpenInviteModal(invite.token)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Onboard</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Directory & Admin RBAC Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Family Members & Permissions ({members.length})
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            {isAdmin ? "Admins can toggle roles instantly" : "Read-only view"}
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {members
            .filter((member, index, self) => self.findIndex((m) => m.id === member.id) === index)
            .map((member) => {
            const isSelf = member.id === currentMember.id;

            return (
              <div
                key={member.id}
                id={`member-row-${member.id}`}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200"
                    />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      member.isOnline ? "bg-emerald-500" : "bg-stone-300"
                    }`} />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900 text-sm">{member.name}</span>
                      {isSelf && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-semibold">
                          You
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5 ${
                        member.role === "admin"
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : "bg-stone-100 text-stone-600"
                      }`}>
                        {member.role === "admin" && <ShieldCheck className="w-3 h-3 text-amber-700" />}
                        <span className="capitalize">{member.role}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-stone-400 mt-0.5 text-[11px]">
                      <span className="font-medium text-stone-600">{member.relationship}</span>
                      <span>•</span>
                      <span className="font-mono">{member.phone}</span>
                      <span>•</span>
                      <span>Active {member.lastActive}</span>
                    </div>
                  </div>
                </div>

                {/* Admin RBAC Toggles */}
                {isAdmin ? (
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {/* Toggle Admin Privilege */}
                    <button
                      id={`toggle-role-btn-${member.id}`}
                      disabled={isSelf}
                      onClick={() =>
                        onUpdateRole(member.id, member.role === "admin" ? "member" : "admin")
                      }
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition ${
                        member.role === "admin"
                          ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                      } ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {member.role === "admin" ? "Demote to Member" : "Promote to Admin"}
                    </button>

                    {/* Remove Member */}
                    {!isSelf && (
                      <button
                        id={`remove-member-btn-${member.id}`}
                        onClick={() => {
                          if (confirm(`Remove ${member.name} from Sharma Parivar?`)) {
                            onRemoveMember(member.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-stone-400 text-[11px]">
                    {member.role === "admin" ? "Family Administrator" : "Standard Family Access"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
