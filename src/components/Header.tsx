import React, { useState } from "react";
import { 
  Users, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Lock, 
  Copy, 
  Check, 
  HeartHandshake,
  Sparkles
} from "lucide-react";
import { FamilyMember } from "../types";

interface HeaderProps {
  currentMember: FamilyMember;
  allMembers: FamilyMember[];
  onSwitchMember: (memberId: string) => void;
  isWsConnected: boolean;
  isMobileView: boolean;
  onToggleMobileView: () => void;
  userCode?: string;
  roomCode?: string;
  onOpenAuth?: () => void;
  onLockApp?: () => void;
  onOpenRewind?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMember,
  allMembers,
  onSwitchMember,
  isWsConnected,
  isMobileView,
  onToggleMobileView,
  userCode = "GHAR-9482",
  roomCode = "GHAR-FAM-7182",
  onOpenAuth,
  onLockApp,
  onOpenRewind,
}) => {
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedUserCode, setCopiedUserCode] = useState(false);

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(userCode);
    setCopiedUserCode(true);
    setTimeout(() => setCopiedUserCode(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Clean Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F5132] flex items-center justify-center text-white shadow-md shadow-[#0F5132]/25">
            <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Ghar</h1>
              <span className="text-[10px] font-bold bg-[#0F5132]/10 text-[#0F5132] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Social & Family Network
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Family Room • Connectors • 24h Notes</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Ghar Rewind Story Montage Action */}
          {onOpenRewind && (
            <button
              onClick={onOpenRewind}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#0F5132] via-emerald-600 to-amber-500 hover:from-[#0c4128] hover:to-amber-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer"
              title="Watch today's Ghar Rewind story montage"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span className="hidden sm:inline">Ghar Rewind</span>
              <span className="sm:hidden">Rewind</span>
            </button>
          )}

          {/* User's Dynamic Personal Code Badge */}
          <button
            onClick={handleCopyUserCode}
            title="Your Unique Personal Connector Code (Click to Copy)"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0F5132]/10 hover:bg-[#0F5132]/20 border border-[#0F5132]/20 text-xs font-bold text-[#0F5132] transition cursor-pointer"
          >
            <span>My Code:</span>
            <span className="font-mono">{userCode}</span>
            {copiedUserCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Room Master Code Badge */}
          <button
            onClick={handleCopyRoom}
            title="Click to copy Family Room Code"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#0F5132]" />
            <span className="font-mono text-[#0F5132] font-bold">{roomCode}</span>
            {copiedRoom ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Real-time sync status */}
          <div 
            id="ws-status-indicator"
            className={`hidden sm:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border ${
              isWsConnected 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {isWsConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="font-bold text-[11px]">Real-Time Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Syncing...</span>
              </>
            )}
          </div>

          {/* Mobile / Responsive Frame Toggle */}
          <button
            id="toggle-viewport-btn"
            onClick={onToggleMobileView}
            title={isMobileView ? "Switch to Desktop View" : "Simulate Mobile Frame"}
            className="flex items-center space-x-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
          >
            {isMobileView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden md:inline">Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden md:inline">Mobile</span>
              </>
            )}
          </button>

          {/* Lock App PIN */}
          {onLockApp && (
            <button
              onClick={onLockApp}
              title="Lock PIN Screen"
              className="p-2 rounded-xl text-slate-500 hover:text-[#0F5132] hover:bg-slate-100 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Active User Avatar */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div 
              onClick={onOpenAuth}
              className="flex items-center space-x-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1 pr-3 rounded-full transition"
            >
              <img
                src={currentMember.avatar}
                alt={currentMember.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                {currentMember.name.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
