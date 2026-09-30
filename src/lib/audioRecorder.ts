/**
 * In-app audio recording utility for voice notes and live call simulation
 */

export interface AudioRecorderController {
  stop: () => Promise<{ blob: Blob; dataUrl: string; duration: number }>;
  cancel: () => void;
  getDuration: () => number;
}

export async function startAudioRecording(
  onLevelChange?: (level: number) => void
): Promise<AudioRecorderController> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Microphone access is not supported by your browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  let animFrameId: number;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  if (onLevelChange) {
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, avg / 128);
      onLevelChange(normalized);
      animFrameId = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  }

  const mediaRecorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  const startTime = Date.now();

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  mediaRecorder.start(100);

  const cleanup = () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    stream.getTracks().forEach((t) => t.stop());
    if (audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
    }
  };

  return {
    getDuration: () => Math.round((Date.now() - startTime) / 1000),
    stop: async () => {
      return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          cleanup();
          const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const mimeType = mediaRecorder.mimeType || "audio/webm";
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result as string,
              duration,
            });
          };
          reader.readAsDataURL(blob);
        };
        mediaRecorder.stop();
      });
    },
    cancel: () => {
      cleanup();
      try {
        mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    },
  };
}

/**
 * Synthetic audio note generator for fast fallback if microphone unavailable
 */
export function generateSyntheticAudioNote(text: string): { dataUrl: string; duration: number } {
  // Return audio data URL
  return {
    dataUrl: "https://cdn.freesound.org/previews/557/557174_11861866-lq.mp3",
    duration: Math.min(12, Math.max(3, Math.round(text.length / 10))),
  };
}
