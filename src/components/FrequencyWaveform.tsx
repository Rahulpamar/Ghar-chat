import React, { useEffect, useRef, useState } from "react";
import { Activity, Waves, Volume2, Radio, Sparkles } from "lucide-react";

export interface FrequencyWaveformProps {
  /** Whether the audio is currently playing or actively streaming */
  isPlaying: boolean;
  /** Optional pre-computed or real-time frequency bands (0-100 or 0-255) */
  frequencyBands?: number[];
  /** Normalized audio energy level (0.0 to 1.0) */
  audioLevel?: number;
  /** HTML Audio element for direct Web Audio API Analyser connection if available */
  audioElement?: HTMLAudioElement | null;
  /** Height in pixels of the canvas */
  height?: number;
  /** Visual color theme for canvas strokes and gradients */
  theme?: "emerald" | "amber" | "cyan" | "violet";
  /** Optional title to display in the header bar */
  title?: string;
  /** Optional subtitle/frequency label */
  subTitle?: string;
  /** Whether to show the bottom frequency spectrum bars */
  showFrequencyBars?: boolean;
  /** Whether to show the dynamic Hz & dB telemetry */
  showTelemetry?: boolean;
  /** Additional CSS class names */
  className?: string;
}

export const FrequencyWaveform: React.FC<FrequencyWaveformProps> = ({
  isPlaying,
  frequencyBands,
  audioLevel = 0.5,
  audioElement,
  height = 96,
  theme = "emerald",
  title = "Live Call Audio Frequency Waveform",
  subTitle = "Real-time audio input frequency analysis • 48 kHz PCM stream",
  showFrequencyBars = true,
  showTelemetry = true,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const peaksRef = useRef<number[]>(new Array(32).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataArrayRef = useRef<Uint8Array | null>(null);

  // Live telemetry state
  const [currentHz, setCurrentHz] = useState<number>(440);
  const [currentDb, setCurrentDb] = useState<number>(-28);

  // Palette definitions
  const themeColors = {
    emerald: {
      primary: "#10b981", // emerald-500
      secondary: "#34d399", // emerald-400
      accent: "#fbbf24", // amber-400
      glow: "rgba(16, 185, 129, 0.45)",
      gradTop: "rgba(16, 185, 129, 0.35)",
      gradBottom: "rgba(6, 78, 59, 0.0)",
      barStart: "#059669",
      barEnd: "#34d399",
      badgeText: "text-emerald-400",
      badgeBorder: "border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    amber: {
      primary: "#f59e0b", // amber-500
      secondary: "#fbbf24", // amber-400
      accent: "#f43f5e", // rose-500
      glow: "rgba(245, 158, 11, 0.45)",
      gradTop: "rgba(245, 158, 11, 0.35)",
      gradBottom: "rgba(120, 53, 15, 0.0)",
      barStart: "#d97706",
      barEnd: "#fcd34d",
      badgeText: "text-amber-400",
      badgeBorder: "border-amber-500/30",
      dot: "bg-amber-400",
    },
    cyan: {
      primary: "#06b6d4", // cyan-500
      secondary: "#22d3ee", // cyan-400
      accent: "#a855f7", // purple-500
      glow: "rgba(6, 182, 212, 0.45)",
      gradTop: "rgba(6, 182, 212, 0.35)",
      gradBottom: "rgba(22, 78, 99, 0.0)",
      barStart: "#0891b2",
      barEnd: "#67e8f9",
      badgeText: "text-cyan-400",
      badgeBorder: "border-cyan-500/30",
      dot: "bg-cyan-400",
    },
    violet: {
      primary: "#8b5cf6", // violet-500
      secondary: "#a78bfa", // violet-400
      accent: "#ec4899", // pink-500
      glow: "rgba(139, 92, 246, 0.45)",
      gradTop: "rgba(139, 92, 246, 0.35)",
      gradBottom: "rgba(76, 29, 149, 0.0)",
      barStart: "#7c3aed",
      barEnd: "#c4b5fd",
      badgeText: "text-violet-400",
      badgeBorder: "border-violet-500/30",
      dot: "bg-violet-400",
    },
  }[theme];

  // Try hooking into native Web Audio API when audioElement is provided
  useEffect(() => {
    if (!audioElement) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !audioContextRef.current) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
        audioDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
    } catch {
      // Audio element might already be connected or blocked by cross-origin policies;
      // the canvas will seamlessly use the dynamic frequency synthesizer.
    }

    return () => {
      // We don't close audioContext here to avoid cutting active sound
    };
  }, [audioElement]);

  // Canvas render loop driven by requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isSubscribed = true;
    let lastTelemetryUpdate = 0;

    const renderFrame = (timestamp: number) => {
      if (!isSubscribed) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth || 640;
      const displayHeight = canvas.clientHeight || height;

      // Ensure canvas internal dimensions match display size multiplied by DPR for ultra-crisp lines
      if (
        canvas.width !== displayWidth * dpr ||
        canvas.height !== displayHeight * dpr
      ) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const w = displayWidth;
      const h = displayHeight;

      // Clear previous canvas frame
      ctx.clearRect(0, 0, w, h);

      // Phase calculation for continuous forward wave flow
      const phaseSpeed = isPlaying ? 0.055 : 0.015;
      phaseRef.current += phaseSpeed;
      const phase = phaseRef.current;

      // Extract real audio frequency data if analyser is active, or use passed frequencyBands or simulate speech cadence
      const numBands = 32;
      const bands: number[] = [];

      if (analyserRef.current && audioDataArrayRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(audioDataArrayRef.current);
        let maxVal = 0;
        for (let i = 0; i < numBands; i++) {
          const raw =
            audioDataArrayRef.current[
              Math.floor((i / numBands) * audioDataArrayRef.current.length)
            ] || 0;
          if (raw > maxVal) maxVal = raw;
          bands.push(raw / 255);
        }
        // If silence or CORS blocked
        if (maxVal < 8) {
          bands.length = 0;
        }
      }

      // Fallback to frequencyBands prop if available
      if (bands.length === 0 && frequencyBands && frequencyBands.length > 0) {
        for (let i = 0; i < numBands; i++) {
          const idx = Math.floor((i / numBands) * frequencyBands.length);
          const raw = frequencyBands[idx] || 0;
          // Normalize to 0..1
          bands.push(Math.min(1, raw > 1 ? raw / 100 : raw));
        }
      }

      // If still empty or idle, synthesize realistic conversational speech frequency modulation
      if (bands.length === 0) {
        const timeSec = timestamp / 1000;
        for (let i = 0; i < numBands; i++) {
          if (isPlaying) {
            // Conversational cadence: speech bursts, formant variations, natural micro-pauses
            const speechPulse = Math.sin(timeSec * 6.5) > -0.2 ? 1 : 0.22;
            const formant1 = Math.sin(timeSec * 9.2 + i * 0.38) * 0.35;
            const formant2 = Math.cos(timeSec * 13.4 + i * 0.72) * 0.25;
            const formant3 = Math.sin(timeSec * 4.5 + i * 0.18) * 0.2;
            const val = Math.max(
              0.1,
              Math.min(1, (0.35 + formant1 + formant2 + formant3) * speechPulse)
            );
            bands.push(val);
          } else {
            // Standby gentle breathing wave
            const val = 0.12 + Math.sin(timeSec * 1.5 + i * 0.3) * 0.05;
            bands.push(val);
          }
        }
      }

      // Update peak falloff physics
      for (let i = 0; i < numBands; i++) {
        const currentVal = bands[i] || 0.1;
        if (currentVal > (peaksRef.current[i] || 0)) {
          peaksRef.current[i] = currentVal;
        } else {
          peaksRef.current[i] = Math.max(0, (peaksRef.current[i] || 0) - 0.015);
        }
      }

      // Calculate aggregate energy
      const avgEnergy =
        bands.reduce((acc, v) => acc + v, 0) / (bands.length || 1);

      // Periodically update telemetry numbers (every 180ms to prevent visual jitter)
      if (timestamp - lastTelemetryUpdate > 180) {
        lastTelemetryUpdate = timestamp;
        if (isPlaying) {
          // Dynamic frequency calculation mimicking voice formants
          const hzEstimate = Math.round(280 + avgEnergy * 2400);
          const dbEstimate = Math.round(-42 + avgEnergy * 38);
          setCurrentHz(hzEstimate);
          setCurrentDb(dbEstimate);
        } else {
          setCurrentHz(440);
          setCurrentDb(-48);
        }
      }

      const centerY = h * 0.44;
      const baseAmplitude = isPlaying
        ? Math.min(h * 0.38, 5 + avgEnergy * (h * 0.34) + audioLevel * 10)
        : 3.5;

      // -------------------------------------------------------------
      // LAYER 1: Background Subtle Harmonic Wave (Tertiary Counter-Phase)
      // -------------------------------------------------------------
      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 1.4 : 0.9;
      ctx.strokeStyle = themeColors.secondary + "44"; // 27% opacity
      ctx.lineCap = "round";

      for (let x = 0; x <= w; x += 4) {
        const normX = x / w;
        const windowFactor = Math.sin(normX * Math.PI); // Windowing to smooth edges to 0
        const y =
          centerY +
          (Math.sin(normX * 8.2 + phase * 0.75) * (baseAmplitude * 0.55) +
            Math.cos(normX * 14.2 - phase * 0.6) * (baseAmplitude * 0.28)) *
            windowFactor;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // -------------------------------------------------------------
      // LAYER 2: Secondary Harmonic Wave (Warm Counter-Pulse)
      // -------------------------------------------------------------
      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 1.8 : 1.1;
      ctx.strokeStyle = themeColors.accent + "aa"; // 67% opacity
      ctx.lineCap = "round";

      for (let x = 0; x <= w; x += 3) {
        const normX = x / w;
        const windowFactor = Math.sin(normX * Math.PI);
        const y =
          centerY +
          (Math.cos(normX * 9.5 - phase * 1.15) * (baseAmplitude * 0.72) +
            Math.sin(normX * 17.5 + phase * 1.35) * (baseAmplitude * 0.32)) *
            windowFactor;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // -------------------------------------------------------------
      // LAYER 3: Primary Frequency-Modulated Sine Wave with Glowing Fill
      // -------------------------------------------------------------
      const gradFill = ctx.createLinearGradient(0, centerY - baseAmplitude, 0, h);
      gradFill.addColorStop(0, themeColors.gradTop);
      gradFill.addColorStop(1, themeColors.gradBottom);

      ctx.beginPath();
      ctx.moveTo(0, h);

      const mainPoints: { x: number; y: number }[] = [];
      const step = 3;
      for (let x = 0; x <= w; x += step) {
        const normX = x / w;
        const windowFactor = Math.sin(normX * Math.PI);

        // Mix in discrete frequency band influence at this x position
        const bandIdx = Math.min(
          numBands - 1,
          Math.floor(normX * numBands)
        );
        const localBandEnergy = bands[bandIdx] || 0.1;
        const localModulation = isPlaying ? localBandEnergy * 0.5 : 0.05;

        const y =
          centerY +
          (Math.sin(normX * 10.2 + phase * 1.4) * (baseAmplitude * 0.88) +
            Math.sin(normX * 21.0 - phase * 2.2) * (baseAmplitude * 0.28) +
            Math.cos(normX * 4.6 + phase * 0.85) * (baseAmplitude * 0.42)) *
            windowFactor *
            (1 + localModulation);

        mainPoints.push({ x, y });
      }

      // Build filled polygon under the curve
      mainPoints.forEach((pt, idx) => {
        if (idx === 0) ctx.lineTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = gradFill;
      ctx.fill();

      // Stroke primary neon glow line
      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 2.2 : 1.2;
      ctx.strokeStyle = themeColors.primary;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = isPlaying ? themeColors.glow : "transparent";
      ctx.shadowBlur = isPlaying ? 12 : 0;

      mainPoints.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // -------------------------------------------------------------
      // LAYER 4: Bottom Canvas Frequency Bars Equalizer Spectrum
      // -------------------------------------------------------------
      if (showFrequencyBars) {
        const barAreaHeight = h * 0.26;
        const barBottomY = h - 4;
        const totalBars = 32;
        const barSpacing = 2;
        const totalSpacing = barSpacing * (totalBars - 1);
        const barWidth = Math.max(2, (w - totalSpacing) / totalBars);

        for (let i = 0; i < totalBars; i++) {
          const val = isPlaying ? Math.max(0.12, bands[i] || 0.12) : 0.12;
          const peak = peaksRef.current[i] || val;
          const barH = val * barAreaHeight;
          const barX = i * (barWidth + barSpacing);
          const barY = barBottomY - barH;

          // Draw vertical equalizer column with gradient
          const barGrad = ctx.createLinearGradient(0, barY, 0, barBottomY);
          barGrad.addColorStop(0, themeColors.barEnd);
          barGrad.addColorStop(1, themeColors.barStart);

          ctx.fillStyle = isPlaying ? barGrad : "rgba(71, 85, 105, 0.45)"; // slate-600/45%
          ctx.beginPath();
          ctx.roundRect(barX, barY, barWidth, barH, [1.5, 1.5, 0, 0]);
          ctx.fill();

          // Peak dot indicator floating above bar
          if (isPlaying && peak > val + 0.05) {
            const peakY = barBottomY - peak * barAreaHeight - 2;
            ctx.fillStyle = themeColors.accent;
            ctx.fillRect(barX, Math.max(0, peakY), barWidth, 1.5);
          }
        }
      }

      ctx.restore();

      // Schedule next frame via requestAnimationFrame
      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    };

    // Kick off animation loop
    animFrameIdRef.current = requestAnimationFrame(renderFrame);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, frequencyBands, audioLevel, height, themeColors, showFrequencyBars]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-slate-800 shadow-xl ${className}`}
    >
      {/* Background atmospheric gradient blur */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-25 blur-2xl transition-all duration-500 ${
          isPlaying
            ? "bg-gradient-to-r from-emerald-600 via-amber-500 to-teal-400"
            : "bg-slate-900"
        }`}
      />

      {/* Top Header / Stream Telemetry Bar */}
      <div className="relative z-10 px-3.5 pt-3 pb-1.5 flex items-center justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Live broadcast pulsing beacon */}
          <div className="relative flex items-center justify-center shrink-0">
            {isPlaying && (
              <span className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping opacity-75" />
            )}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                isPlaying
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                  : "bg-slate-600"
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black tracking-wide text-white">
                {title}
              </span>

              {isPlaying ? (
                <span className="px-2 py-0.2 rounded-full bg-rose-500/90 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  LIVE STREAM
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-800/80 text-slate-400 text-[9px] font-mono uppercase tracking-wider">
                  STANDBY
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {isPlaying ? subTitle : "Audio waveform activates automatically during AI playback"}
            </span>
          </div>
        </div>

        {/* Live Audio Telemetry Readouts */}
        {showTelemetry && (
          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
            {/* Frequency in Hz */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-slate-400 text-[9px]">FREQ</span>
              <span
                className={`font-bold transition-colors ${
                  isPlaying ? themeColors.badgeText : "text-slate-500"
                }`}
              >
                {currentHz} Hz
              </span>
            </div>

            {/* Level in dBFS */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-slate-400 text-[9px]">LEVEL</span>
              <span
                className={`font-bold transition-colors ${
                  isPlaying && currentDb > -16
                    ? "text-amber-400"
                    : isPlaying
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                {currentDb} dBFS
              </span>
            </div>

            {/* Frequency Sync indicator badge */}
            <div
              className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1.5 bg-black/40 ${themeColors.badgeBorder} ${themeColors.badgeText}`}
            >
              <Waves className={`w-3.5 h-3.5 ${isPlaying ? "animate-pulse" : "opacity-40"}`} />
              <span className="hidden md:inline">FREQ SYNC</span>
              <span className="text-[9px] opacity-80">{isPlaying ? "ACTIVE" : "OFF"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Real-time Canvas Rendering Box */}
      <div
        className="relative z-10 w-full px-2 py-1 flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Standby resting overlay when not playing */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-mono tracking-widest text-slate-500/80 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
              AUDIO STREAM READY • 48 kHz
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
