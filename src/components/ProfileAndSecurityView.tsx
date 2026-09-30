import React, { useState } from "react";
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  User, 
  Phone, 
  Users, 
  Copy, 
  Check, 
  Sparkles,
  Smartphone,
  Save,
  CheckCircle2
} from "lucide-react";
import { UserAuthSession, FamilyMember } from "../types";

interface ProfileAndSecurityViewProps {
  currentSession: UserAuthSession;
  familyMembers: FamilyMember[];
  familyRoomCode: string;
  onUpdateSession: (updated: Partial<UserAuthSession>) => void;
  onLockVaultNow?: () => void;
}

export const ProfileAndSecurityView: React.FC<ProfileAndSecurityViewProps> = ({
  currentSession,
  familyMembers,
  familyRoomCode,
  onUpdateSession,
  onLockVaultNow,
}) => {
  const [pinCode, setPinCode] = useState(currentSession.pinCode || "1234");
  const [displayName, setDisplayName] = useState(currentSession.name);
  const [phoneNumber, setPhoneNumber] = useState(currentSession.phoneNumber);
  const [pinLockEnabled, setPinLockEnabled] = useState(currentSession.pinLockEnabled !== false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSession({
      name: displayName.trim(),
      phoneNumber: phoneNumber.trim(),
      pinCode: pinCode.trim(),
      pinLockEnabled,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(currentSession.userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(familyRoomCode);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Profile Card */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full border-2 border-[#0F5132] p-0.5 overflow-hidden shrink-0">
            <img
              src={currentSession.avatar}
              alt={currentSession.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0F172A] tracking-tight">{currentSession.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-[#0F5132] bg-[#0F5132]/10 px-2.5 py-0.5 rounded-full">
                Personal Code: {currentSession.userCode}
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                Verified Account
              </span>
            </div>
          </div>
        </div>

        {/* Quick Codes Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Connectors Code</span>
              <span className="text-sm font-black font-mono text-[#0F5132]">{currentSession.userCode}</span>
            </div>
            <button
              onClick={handleCopyUserCode}
              className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Family Room Code</span>
              <span className="text-sm font-black font-mono text-[#0F5132]">{familyRoomCode}</span>
            </div>
            <button
              onClick={handleCopyRoomCode}
              className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              {copiedRoom ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Security & PIN Settings */}
      <form onSubmit={handleSave} className="bg-[#FFFFFF] rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-5 h-5 text-[#0F5132]" />
          <div>
            <h3 className="text-base font-black text-[#0F172A]">Private Protected Vault & PIN Security</h3>
            <p className="text-xs text-slate-500">
              Set your private 4-digit PIN code to lock private family messages and personal vault items.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Personal Security PIN (Used for Private Vault)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="4-digit PIN (e.g. 1234)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 font-mono tracking-widest text-base font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Any message added to Private from the Family Room is encrypted and accessible only with this PIN.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Require PIN for Private Vault</span>
              <span className="text-[11px] text-slate-500">Prompt for PIN before unlocking saved private chat items</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinLockEnabled}
                onChange={(e) => setPinLockEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:after:w-5 after:transition-all peer-checked:bg-[#0F5132]"></div>
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5132] text-slate-900 text-xs sm:text-sm font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & PIN</span>
          </button>

          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved in real-time!</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
