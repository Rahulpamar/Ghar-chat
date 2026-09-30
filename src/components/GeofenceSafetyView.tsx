import React, { useState } from "react";
import { 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Navigation, 
  Radio, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Compass, 
  RefreshCw,
  Bell,
  Home
} from "lucide-react";
import { FamilyMember, GeofenceAlert, SosAlert } from "../types";

interface GeofenceSafetyViewProps {
  currentMember: FamilyMember;
  members: FamilyMember[];
  geofenceAlerts: GeofenceAlert[];
  activeSosAlert: SosAlert | null;
  onTriggerSos: (latitude?: number, longitude?: number, locationName?: string) => void;
  onResolveSos: () => void;
  onSimulateMovement: (memberId: string, distanceKm: number, locationName: string, etaMinutes: number) => void;
}

export const GeofenceSafetyView: React.FC<GeofenceSafetyViewProps> = ({
  currentMember,
  members,
  geofenceAlerts,
  activeSosAlert,
  onTriggerSos,
  onResolveSos,
  onSimulateMovement,
}) => {
  const [isSosConfirmOpen, setIsSosConfirmOpen] = useState(false);
  const [selectedSimMemberId, setSelectedSimMemberId] = useState(members[0]?.id || "");
  const [simDistance, setSimDistance] = useState(3.2);
  const [simEta, setSimEta] = useState(11);
  const [simLocation, setSimLocation] = useState("Banjara Hills Rd 12");
  const [soundMuted, setSoundMuted] = useState(false);

  // Play browser emergency siren using Web Audio API
  const playSirenSound = () => {
    if (soundMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio Context warning:", e);
    }
  };

  const handleConfirmSos = () => {
    playSirenSound();
    // Attempt HTML5 Geolocation API with graceful fallback
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onTriggerSos(
            pos.coords.latitude,
            pos.coords.longitude,
            "Live GPS Coordinates Pinpoint"
          );
        },
        () => {
          // Fallback location
          onTriggerSos(
            17.4399,
            78.4983,
            "Near Sharma Niwas, Banjara Hills, Hyderabad"
          );
        },
        { timeout: 5000 }
      );
    } else {
      onTriggerSos(17.4399, 78.4983, "Banjara Hills, Hyderabad");
    }
    setIsSosConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ACTIVE SOS EMERGENCY BANNER (If Triggered) */}
      {activeSosAlert && (
        <div className="bg-rose-600 text-white rounded-3xl p-6 shadow-xl border-4 border-rose-400 animate-pulse space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white text-rose-600 flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest bg-rose-700/80 px-2.5 py-1 rounded-md">
                  🚨 PANIC SOS ACTIVE
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">
                  EMERGENCY ALERT: {activeSosAlert.senderName}
                </h2>
                <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
                  Location: {activeSosAlert.locationName} • Phone: {activeSosAlert.senderPhone}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://www.google.com/maps?q=${activeSosAlert.latitude},${activeSosAlert.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white text-rose-700 font-bold text-xs sm:text-sm hover:bg-rose-50 shadow-md transition"
              >
                <Compass className="w-4 h-4" />
                <span>Open Live GPS Map</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`tel:${activeSosAlert.senderPhone}`}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-950 text-white font-bold text-xs sm:text-sm hover:bg-rose-900 shadow-md transition"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Call {activeSosAlert.senderName}</span>
              </a>

              <button
                onClick={onResolveSos}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve SOS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP PANIC SOS & GEOFENCE RADAR OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANIC SOS RED BUTTON CARD */}
        <div className="bg-gradient-to-br from-rose-50 via-white to-red-50 rounded-3xl border border-rose-200 p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider bg-rose-100 px-2.5 py-0.5 rounded-full">
                Instant Protection
              </span>
              <button
                onClick={() => setSoundMuted(!soundMuted)}
                className="text-stone-400 hover:text-stone-700 text-xs p-1"
                title={soundMuted ? "Unmute Siren" : "Mute Siren"}
              >
                {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <h3 className="text-lg font-bold text-stone-900">Panic SOS Red Button</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Instantly broadcasts your live GPS coordinates, triggers an emergency siren alert across all family screens, and readies emergency dispatch.
            </p>
          </div>

          {/* Big Interactive SOS Trigger Button */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              id="panic-sos-red-button"
              onClick={() => setIsSosConfirmOpen(true)}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-4 border-rose-200 flex flex-col items-center justify-center group focus:outline-hidden focus:ring-4 focus:ring-rose-300"
            >
              <ShieldAlert className="w-10 h-10 text-white group-hover:animate-pulse" />
              <span className="text-xl font-black tracking-wider mt-1">PANIC SOS</span>
              <span className="text-[10px] text-rose-100 uppercase tracking-widest font-semibold">1-Tap Drop</span>
            </button>
            <span className="text-[11px] text-stone-500 mt-3 font-medium text-center">
              Tap above to trigger immediate household emergency broadcast
            </span>
          </div>

          {/* Quick Speed-Dials for Emergency Services in India */}
          <div className="pt-3 border-t border-rose-100 flex items-center justify-between gap-2 text-xs">
            <a
              href="tel:112"
              className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 transition shadow-2xs"
            >
              <span>👮 112 Police</span>
            </a>
            <a
              href="tel:108"
              className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 transition shadow-2xs"
            >
              <span>🚑 108 Medical</span>
            </a>
            <a
              href="tel:101"
              className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-100 transition shadow-2xs"
            >
              <span>🚒 101 Fire</span>
            </a>
          </div>
        </div>

        {/* 5KM SMART GEOFENCE RADAR VISUALIZER */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-base font-bold text-stone-900">Smart Geofence 5km Radius Tracker</h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Center: <span className="font-semibold text-stone-800">Sharma Niwas (Home Base)</span> • Auto-alerts when family enters 5km zone
              </p>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                5km Perimeter Active
              </span>
            </div>
          </div>

          {/* Interactive Radar Visual Canvas Graphic */}
          <div className="relative w-full h-64 bg-gradient-to-b from-stone-900 to-stone-950 rounded-2xl overflow-hidden border border-stone-800 p-4 flex items-center justify-center shadow-inner">
            {/* Radar Grid Circles */}
            <div className="absolute w-56 h-56 rounded-full border border-emerald-500/20 animate-pulse" />
            <div className="absolute w-40 h-40 rounded-full border border-emerald-500/30" />
            <div className="absolute w-24 h-24 rounded-full border border-emerald-500/40" />

            {/* Radar Sweep Line */}
            <div className="absolute w-56 h-56 rounded-full border border-transparent border-t-emerald-400/40 animate-spin" style={{ animationDuration: "6s" }} />

            {/* 5km Perimeter Ring Label */}
            <div className="absolute top-3 left-4 text-[10px] text-emerald-400 font-mono tracking-wider flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>GEOFENCE PERIMETER: 5.0 KM</span>
            </div>

            {/* Home Base Center Marker */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                <Home className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-300 mt-1 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                Sharma Niwas
              </span>
            </div>

            {/* Member Markers plotted relative to distance */}
            {members.map((m, idx) => {
              const dist = m.location?.distanceKm ?? 2.5;
              const isAtHome = dist <= 0.2;
              const angle = (idx * 90 + 30) * (Math.PI / 180);
              const r = isAtHome ? 25 : Math.min(100, Math.max(40, (dist / 5) * 105));
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;

              return (
                <div
                  key={m.id}
                  className="absolute z-20 transition-all duration-700 flex flex-col items-center"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <div className="relative">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-8 h-8 rounded-full border-2 border-emerald-400 object-cover shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                  </div>
                  <span className="text-[9px] font-semibold text-white bg-black/70 px-1.5 py-0.5 rounded-sm whitespace-nowrap mt-0.5">
                    {m.name.split(" ")[0]}: {dist}km
                  </span>
                </div>
              );
            })}
          </div>

          {/* Member Distance & ETA Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {members.map((m) => {
              const loc = m.location || {
                distanceKm: 2.1,
                isInsideGeofence: true,
                etaMinutes: 8,
                locationName: "Jubilee Hills Road",
                lastUpdated: "Just now",
              };

              const isAtHome = loc.distanceKm <= 0.2;

              return (
                <div
                  key={m.id}
                  id={`geofence-member-${m.id}`}
                  className="bg-stone-50 rounded-2xl border border-stone-200 p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{m.name}</h4>
                      <p className="text-[11px] text-stone-500 truncate max-w-[140px]">{loc.locationName}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isAtHome ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        🏡 At Home
                      </span>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-stone-900">
                          {loc.distanceKm} km away
                        </div>
                        <div className="text-[10px] font-semibold text-amber-700 flex items-center justify-end space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>ETA ~{loc.etaMinutes} mins</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SIMULATE MOVEMENT / ARRIVAL CONTROLS (TESTING SUITE) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-amber-600" />
              <span>Live Movement Simulator & Geofence Verification</span>
            </h3>
            <p className="text-xs text-stone-500">
              Test real-time proximity triggers and automatic household arrival alerts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Select Family Member</label>
            <select
              id="sim-member-select"
              value={selectedSimMemberId}
              onChange={(e) => setSelectedSimMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.relationship})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Distance from Home ({simDistance} km)
            </label>
            <input
              type="range"
              min="0.1"
              max="15.0"
              step="0.2"
              value={simDistance}
              onChange={(e) => {
                const d = parseFloat(e.target.value);
                setSimDistance(d);
                setSimEta(Math.max(1, Math.round(d * 3.5)));
              }}
              className="w-full accent-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Landmark / Location</label>
            <input
              type="text"
              value={simLocation}
              onChange={(e) => setSimLocation(e.target.value)}
              placeholder="e.g. Banjara Hills Rd 12"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              id="btn-simulate-movement"
              onClick={() => {
                onSimulateMovement(selectedSimMemberId, simDistance, simLocation, simEta);
              }}
              className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate Movement</span>
            </button>
          </div>
        </div>

        {/* Quick Simulator Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-stone-400 font-semibold">Quick Presets:</span>
          <button
            onClick={() => onSimulateMovement(members[0]?.id, 2.4, "Road No. 12 Checkpoint", 8)}
            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition"
          >
            🚗 Rahul entering 5km (ETA 8m)
          </button>
          <button
            onClick={() => onSimulateMovement(members[0]?.id, 0.1, "Main Entrance Gate", 0)}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium hover:bg-emerald-100 transition"
          >
            🏡 Rahul arrived Home!
          </button>
          <button
            onClick={() => onSimulateMovement(members[3]?.id || members[0]?.id, 1.5, "Metro Station Crossing", 5)}
            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition"
          >
            🚇 Pooja nearing home (ETA 5m)
          </button>
        </div>
      </div>

      {/* GEOFENCE RECENT ALERTS FEED */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <span>Geofence Alert History Feed</span>
        </h3>

        <div className="space-y-3">
          {geofenceAlerts.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No geofence triggers yet today.</p>
          ) : (
            geofenceAlerts.map((alert) => (
              <div
                key={alert.id}
                id={`geofence-alert-${alert.id}`}
                className="bg-stone-50 rounded-2xl border border-stone-200 p-3.5 flex items-start space-x-3"
              >
                <img
                  src={alert.avatar}
                  alt={alert.memberName}
                  className="w-9 h-9 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{alert.memberName}</span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 mt-0.5">{alert.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: SOS CONFIRMATION TO PREVENT ACCIDENTAL CLICKS */}
      {isSosConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-rose-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-900">Confirm Emergency SOS?</h3>
              <p className="text-xs text-stone-600 mt-1">
                This will instantly sound alarms and dispatch your current live GPS coordinates to all family members.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSosConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSos}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition shadow-md"
              >
                Trigger SOS Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
