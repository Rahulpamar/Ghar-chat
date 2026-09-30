import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Navigation, 
  AlertTriangle, 
  CreditCard, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Radio, 
  Zap, 
  PhoneCall, 
  DollarSign,
  Send,
  Check
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  GeofenceAlert, 
  SosAlert, 
  UpiPaymentRequest, 
  FamilyMember, 
  UserAuthSession 
} from "../types";

interface GeofenceAndEmergencyHubProps {
  geofenceAlerts: GeofenceAlert[];
  onTriggerGeofence: (distanceKm: number, etaMinutes: number) => void;
  activeSosAlert: SosAlert | null;
  onTriggerSos: () => void;
  onResolveSos: () => void;
  upiRequests: UpiPaymentRequest[];
  onRequestUpi: (amount: number, purpose: string) => void;
  onApproveUpi: (upiId: string, approvedBy: string) => void;
  currentSession: UserAuthSession;
  familyMembers: FamilyMember[];
}

export const GeofenceAndEmergencyHub: React.FC<GeofenceAndEmergencyHubProps> = ({
  geofenceAlerts,
  onTriggerGeofence,
  activeSosAlert,
  onTriggerSos,
  onResolveSos,
  upiRequests,
  onRequestUpi,
  onApproveUpi,
  currentSession,
  familyMembers,
}) => {
  const [upiAmount, setUpiAmount] = useState("200");
  const [upiPurpose, setUpiPurpose] = useState("Auto fare & college books");
  const [isRequestingUpi, setIsRequestingUpi] = useState(false);

  const handleSendUpiRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(upiAmount);
    if (!amount || isNaN(amount)) return;

    onRequestUpi(amount, upiPurpose.trim() || "Pocket money");
    setIsRequestingUpi(false);
    confetti({ particleCount: 40, spread: 50 });
  };

  return (
    <div id="gharcall-safety-upi-hub" className="flex flex-col h-full bg-slate-50/50 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* 1. ACTIVE EMERGENCY SOS BANNER (IF ACTIVE) */}
      <AnimatePresence>
        {activeSosAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 rounded-3xl bg-rose-600 text-white shadow-2xl border-2 border-rose-400 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center font-bold shadow-lg">
                <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider">
                  EMERGENCY SOS BROADCAST ACTIVE
                </h3>
                <p className="text-xs text-rose-100 font-medium">
                  {activeSosAlert.message} (GPS: {activeSosAlert.lat.toFixed(4)}, {activeSosAlert.lng.toFixed(4)})
                </p>
              </div>
            </div>

            <button
              onClick={onResolveSos}
              className="px-5 py-2.5 rounded-full bg-white text-rose-700 font-black text-xs hover:bg-rose-50 shadow-md cursor-pointer transition-transform hover:scale-105"
            >
              Resolve / Cancel SOS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TOP GRID: SMART GEOFENCING & PANIC BUTTON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Smart Geofencing Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
                <Radio className="w-5 h-5 stroke-[2.2] animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Smart Geofencing Engine</h3>
                <p className="text-xs text-slate-500 font-medium">5km Home Radius Radar</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Background Worker Active
            </span>
          </div>

          {/* Visual Geofence Radar Box */}
          <div className="relative h-44 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 overflow-hidden flex flex-col justify-between text-white">
            {/* Concentric Radar Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-32 h-32 rounded-full border border-emerald-400 animate-ping" />
              <div className="w-20 h-20 rounded-full border border-emerald-400 absolute" />
              <div className="w-8 h-8 rounded-full bg-emerald-500/40 absolute" />
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Home Perimeter: 5.0 km
              </span>
              <span className="text-[10px] font-mono text-slate-300">Live GPS Polling</span>
            </div>

            {/* Member Arrival Status */}
            <div className="relative z-10 bg-slate-800/90 backdrop-blur-md rounded-xl p-3 border border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>🚗 Rahul Sharma</span>
                <span className="text-emerald-400 font-mono">ETA: 9 Mins (2.4 km)</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Entered 5km zone at Road No. 12, Banjara Hills
              </p>
            </div>

            <button
              onClick={() => {
                onTriggerGeofence(3.1, 10);
                confetti({ particleCount: 30, spread: 45 });
              }}
              className="relative z-10 w-full py-2 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate 5km Arrival Alert ("Arriving in 10 mins")</span>
            </button>
          </div>

          {/* Recent Geofence Alerts Log */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Perimeter Crossings
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {geofenceAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={alert.avatar}
                      alt={alert.memberName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-slate-700 font-medium">{alert.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency SOS Panic Drop-In Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Emergency SOS Drop-in</h3>
                  <p className="text-xs text-slate-500 font-medium">Instant Family Network Alert</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                High Priority
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Pressing the emergency panic button immediately broadcasts your exact GPS coordinates, sounds loud siren notifications on all family devices, and bridges priority emergency calls.
            </p>
          </div>

          {/* Big Panic Button */}
          <div className="py-4 flex flex-col items-center">
            <button
              id="emergency-sos-panic-btn"
              onClick={onTriggerSos}
              className="group relative w-36 h-36 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white font-black text-base shadow-[0_15px_35px_rgba(225,29,72,0.4)] flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping pointer-events-none" />
              <AlertTriangle className="w-9 h-9 mb-1 stroke-[2.5]" />
              <span>SOS PANIC</span>
              <span className="text-[10px] font-medium opacity-90">TAP TO BROADCAST</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Network: 4 Active Devices Synced</span>
            <span className="font-bold text-[#0F5132]">E2EE Live GPS</span>
          </div>
        </div>
      </div>

      {/* 3. POCKET MONEY & ONE-TAP RAZORPAY UPI PAY */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Pocket Money & Instant UPI Pay</h3>
              <p className="text-xs text-slate-500 font-medium">
                Voice / One-Tap Razorpay UPI Approvals for Family Admins
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRequestingUpi(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Request Pocket Money</span>
          </button>
        </div>

        {/* List of UPI Requests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {upiRequests.map((req) => {
            const isApproved = req.status === "approved";
            return (
              <div
                key={req.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isApproved
                    ? "bg-emerald-50/70 border-emerald-200"
                    : "bg-white border-amber-200 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                      ₹
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">{req.requesterName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{req.purpose}</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-[#0F172A]">₹{req.amount}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {isApproved ? (
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Approved: {req.transactionId}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onApproveUpi(req.id, currentSession.name);
                        confetti({ particleCount: 50, spread: 60 });
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>One-Tap Approve UPI (Razorpay ₹{req.amount})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Request Pocket Money */}
      <AnimatePresence>
        {isRequestingUpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center font-bold">
                    ₹
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">Request Pocket Money</h3>
                    <p className="text-xs text-slate-500 font-medium">Sends instant UPI notification to Admins</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendUpiRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      placeholder="200"
                      className="w-full pl-8 pr-3 py-2 text-base font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-2 mt-2">
                    {["100", "200", "500", "1000"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setUpiAmount(preset)}
                        className="flex-1 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:border-[#0F5132] bg-slate-50 hover:bg-[#0F5132]/10 transition-colors"
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Purpose / Notes
                  </label>
                  <input
                    type="text"
                    value={upiPurpose}
                    onChange={(e) => setUpiPurpose(e.target.value)}
                    placeholder="e.g. Auto fare & university printouts"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestingUpi(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white font-bold text-xs shadow-md shadow-[#0F5132]/25 cursor-pointer"
                  >
                    Send Request to Dad/Mom
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
