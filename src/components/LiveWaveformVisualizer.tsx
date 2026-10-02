import React, { useEffect, useRef, useState } from "react";
import { Volume2, Radio, Activity, Mic, Sparkles, Waves } from "lucide-react";

interface LiveWaveformVisualizerProps {
  isPlaying: boolean;
  frequencyBands?: number[];
  audioLevel?: number; // 0 to 1
  label?: string;
  subLabel?: string;
  speakerName?: string;
  accentColor?: "emerald" | "amber" | "indigo" | "rose";
  showSpectrumBars?: boolean;
  showDecibelMeter?: boolean;
  className?: string;
}

export const LiveWaveformVisualizer: React.FC<LiveWaveformVisualizerProps> = ({
  isPlaying,
  frequencyBands = new Array(28).fill(12),
  audioLevel = 0.5,
  label = "Live Call Audio Stream",
  subLabel = "48 kHz AI Voice Engine • Frequency Synced Stream",
  speakerName,
  accentColor = "emerald",
  showSpectrumBars = true,
  showDecibelMeter = true,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const [decibels, setDecibels] = useState<number>(-24);

  // Dynamic color palette based on accent
  const colorMap = {
    emerald: {
      primary: "rgb(52, 211, 153)",
      glow: "rgba(16, 185, 129, 0.4)",
      secondary: "rgba(251, 191, 36, 0.65)",
      tertiary: "rgba(45, 212, 191, 0.3)",
      fillGradTop: "rgba(16, 185, 129, 0.25)",
      fillGradBottom: "rgba(5, 150, 105, 0.0)",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    amber: {
      primary: "rgb(251, 191, 36)",
      glow: "rgba(245, 158, 11, 0.4)",
      secondary: "rgba(244, 63, 94, 0.65)",
      tertiary: "rgba(245, 158, 11, 0.3)",
      fillGradTop: "rgba(245, 158, 11, 0.25)",
      fillGradBottom: "rgba(217, 119, 6, 0.0)",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
    },
    indigo: {
      primary: "rgb(129, 140, 248)",
      glow: "rgba(99, 102, 241, 0.4)",
      secondary: "rgba(192, 132, 252, 0.65)",
      tertiary: "rgba(56, 189, 248, 0.3)",
      fillGradTop: "rgba(99, 102, 241, 0.25)",
      fillGradBottom: "rgba(67, 56, 202, 0.0)",
      badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      dot: "bg-indigo-400",
    },
    rose: {
      primary: "rgb(251, 113, 133)",
      glow: "rgba(244, 63, 94, 0.4)",
      secondary: "rgba(251, 146, 60, 0.65)",
      tertiary: "rgba(244, 63, 94, 0.3)",
      fillGradTop: "rgba(244, 63, 94, 0.25)",
      fillGradBottom: "rgba(225, 29, 72, 0.0)",
      badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      dot: "bg-rose-400",
    },
  }[accentColor];

  // Canvas wave rendering loop synced with audio frequency & phase
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Advance phase based on playback status
      const speed = isPlaying ? 0.045 : 0.012;
      phaseRef.current += speed;
      const phase = phaseRef.current;

      // Calculate average frequency energy
      const avgBand =
        frequencyBands.length > 0
          ? frequencyBands.reduce((a, b) => a + b, 0) / frequencyBands.length
          : 20;

      // Modulated amplitude
      const baseAmp = isPlaying
        ? Math.min(height * 0.42, 6 + (avgBand / 100) * (height * 0.36) + audioLevel * 8)
        : 3.5;

      const centerY = height / 2;

      // 1. Draw tertiary background wave (softer phase)
      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 1.5 : 1;
      ctx.strokeStyle = colorMap.tertiary;
      ctx.lineCap = "round";

      for (let x = 0; x <= width; x += 4) {
        const progress = x / width;
        // Window function to taper wave edges gently at left and right boundaries
        const windowFactor = Math.sin(progress * Math.PI);
        const y =
          centerY +
          Math.sin(progress * 7.5 + phase * 0.8) *
            baseAmp *
            0.55 *
            windowFactor +
          Math.cos(progress * 13 - phase * 0.6) *
            baseAmp *
            0.3 *
            windowFactor;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Draw secondary harmonic wave (warm counter-phase)
      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 1.8 : 1;
      ctx.strokeStyle = colorMap.secondary;
      ctx.lineCap = "round";

      for (let x = 0; x <= width; x += 3) {
        const progress = x / width;
        const windowFactor = Math.sin(progress * Math.PI);
        const y =
          centerY +
          Math.cos(progress * 8.5 - phase * 1.1) *
            baseAmp *
            0.75 *
            windowFactor +
          Math.sin(progress * 16.5 + phase * 1.4) *
            baseAmp *
            0.35 *
            windowFactor;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Draw primary main waveform with glowing gradient fill
      const gradFill = ctx.createLinearGradient(0, centerY - baseAmp, 0, height);
      gradFill.addColorStop(0, colorMap.fillGradTop);
      gradFill.addColorStop(1, colorMap.fillGradBottom);

      ctx.beginPath();
      ctx.moveTo(0, height);

      // Points for primary wave
      const points: { x: number; y: number }[] = [];
      for (let x = 0; x <= width; x += 3) {
        const progress = x / width;
        const windowFactor = Math.sin(progress * Math.PI);

        // Mix frequency bands for localized bumps
        const bandIndex = Math.min(
          frequencyBands.length - 1,
          Math.floor(progress * frequencyBands.length)
        );
        const bandValue = (frequencyBands[bandIndex] || 15) / 100;
        const frequencyInfluence = isPlaying ? bandValue * 0.45 : 0.05;

        const y =
          centerY +
          (Math.sin(progress * 9.2 + phase * 1.35) * (baseAmp * 0.85) +
            Math.sin(progress * 19.5 - phase * 2.1) * (baseAmp * 0.3) +
            Math.cos(progress * 4.2 + phase * 0.9) * (baseAmp * 0.4)) *
            windowFactor *
            (1 + frequencyInfluence);

        points.push({ x, y });
      }

      // Draw filled region under main curve
      points.forEach((pt, idx) => {
        if (idx === 0) ctx.lineTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = gradFill;
      ctx.fill();

      // Stroke the main curve with a neon glow
      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 2.2 : 1.2;
      ctx.strokeStyle = colorMap.primary;
      ctx.shadowColor = isPlaying ? colorMap.glow : "transparent";
      ctx.shadowBlur = isPlaying ? 10 : 0;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Dynamic decibel simulation update
      if (isPlaying) {
        const calcDb = Math.round(-38 + (avgBand / 100) * 32);
        setDecibels(calcDb);
      } else {
        setDecibels(-45);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, frequencyBands, audioLevel, colorMap]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-slate-800 shadow-lg ${className}`}
    >
      {/* Ambient background glow behind canvas */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-20 blur-xl transition-all duration-300 ${
          isPlaying
            ? "bg-gradient-to-r from-emerald-600 via-amber-500 to-teal-400"
            : "bg-slate-900"
        }`}
      />

      {/* Top Header Row: Live indicator, title, dynamic bit-rate & decibel readout */}
      <div className="relative z-10 px-3.5 pt-3 pb-1 flex items-center justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Live broadcast pulse ring */}
          <div className="relative flex items-center justify-center">
            {isPlaying && (
              <span className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping opacity-75" />
            )}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                isPlaying ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-slate-600"
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black tracking-wide text-white flex items-center gap-1">
                <span>{label}</span>
                {speakerName && (
                  <span className="text-slate-400 font-normal">({speakerName})</span>
                )}
              </span>

              {isPlaying ? (
                <span className="px-2 py-0.2 rounded-full bg-rose-500/90 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  LIVE STREAM
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[9px] font-mono uppercase tracking-wider">
                  STANDBY
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {isPlaying ? subLabel : "Audio frequency sync activates automatically during playback"}
            </span>
          </div>
        </div>

        {/* Live Audio Telemetry Badge (Decibels & Frequency format) */}
        <div className="flex items-center gap-2 shrink-0 text-right">
          {showDecibelMeter && (
            <div className="hidden sm:flex flex-col items-end font-mono text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-slate-500" />
                <span>LEVEL</span>
              </span>
              <span
                className={`font-bold transition-colors ${
                  isPlaying && decibels > -18
                    ? "text-amber-400"
                    : isPlaying
                    ? "text-emerald-400"
                    : "text-slate-600"
                }`}
              >
                {decibels} dBFS
              </span>
            </div>
          )}

          <div className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1.5 ${colorMap.badgeBg}`}>
            <Waves className={`w-3.5 h-3.5 ${isPlaying ? "animate-pulse" : "opacity-60"}`} />
            <span className="hidden md:inline">FREQ SYNC</span>
            <span className="text-[9px] opacity-80">{isPlaying ? "ACTIVE" : "OFF"}</span>
          </div>
        </div>
      </div>

      {/* Center: Real-Time Synced Wave Canvas */}
      <div className="relative z-10 w-full h-16 sm:h-20 px-2 py-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={80}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Floating subtle frequency badge overlay in center when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-mono tracking-widest text-slate-500/80 bg-slate-950/70 px-3 py-1 rounded-full border border-slate-800">
              AUDIO STREAM READY • 48 kHz
            </span>
          </div>
        )}
      </div>

      {/* Bottom Equalizer Spectrum Bars (Frequency Spectrum) */}
      {showSpectrumBars && (
        <div className="relative z-10 px-3 pb-2.5 pt-0.5 flex items-center justify-between gap-2 border-t border-white/5 bg-black/40">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <Volume2 className={`w-3 h-3 ${isPlaying ? "text-emerald-400 animate-pulse" : "text-slate-600"}`} />
            <span className="hidden sm:inline">300 Hz</span>
            <span className="text-slate-600">•</span>
            <span className="hidden sm:inline">3.4 kHz Voice Band</span>
          </div>

          {/* Equalizer Frequency Spectrum Pin Columns */}
          <div className="flex-1 flex items-center justify-end gap-1 h-5 max-w-xs sm:max-w-md">
            {frequencyBands.slice(0, 24).map((val, idx) => {
              const heightPct = isPlaying ? Math.max(14, Math.min(100, val)) : 14;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col justify-end items-center h-full group"
                  title={`Band ${idx + 1}: ${Math.round(val)}%`}
                >
                  <span
                    className={`w-full max-w-[4px] rounded-full transition-all duration-75 ${
                      isPlaying
                        ? idx % 4 === 0
                          ? "bg-gradient-to-t from-emerald-500 to-amber-300 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                          : idx % 4 === 1
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-300"
                          : idx % 4 === 2
                          ? "bg-gradient-to-t from-amber-500 to-yellow-300"
                          : "bg-gradient-to-t from-teal-500 to-emerald-300"
                        : "bg-slate-800/80"
                    }`}
                    style={{
                      height: `${heightPct}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
