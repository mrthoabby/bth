'use client';
import { useRef, useState, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'stopped' | 'done' | 'error';

function generateSessionId() {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getBestMime() {
  return MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';
}

export function useRecording() {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Each track type gets its own recorder + chunk counter
  const camRecorderRef    = useRef<MediaRecorder | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const allStreamsRef      = useRef<MediaStream[]>([]);
  const sessionIdRef      = useRef<string>('');
  const camChunkRef       = useRef(0);
  const screenChunkRef    = useRef(0);
  const camStreamRef      = useRef<MediaStream | null>(null);
  const screenStreamRef   = useRef<MediaStream | null>(null);

  // ── Upload helpers ─────────────────────────────────────────────────────────
  const uploadChunk = useCallback(async (
    blob: Blob, chunkIndex: number, trackSession: string,
  ) => {
    try {
      const fd = new FormData();
      fd.append('sessionId', trackSession);
      fd.append('chunkIndex', String(chunkIndex));
      fd.append('chunk', blob, `chunk-${chunkIndex}.webm`);
      const res = await fetch('/api/upload-chunk', { method: 'POST', body: fd });
      if (!res.ok) console.warn(`[rec] chunk ${chunkIndex} failed for ${trackSession}`);
    } catch (err) {
      console.warn('[rec] chunk upload error:', err);
    }
  }, []);

  const flushBeacon = useCallback((blob: Blob, chunkIndex: number, trackSession: string) => {
    if (!navigator.sendBeacon) return;
    const fd = new FormData();
    fd.append('sessionId', trackSession);
    fd.append('chunkIndex', String(chunkIndex));
    fd.append('chunk', blob, `chunk-${chunkIndex}.webm`);
    navigator.sendBeacon('/api/upload-chunk', fd);
  }, []);

  // ── Build one MediaRecorder for a given stream ─────────────────────────────
  const makeRecorder = useCallback((
    stream: MediaStream,
    trackSession: string,
    chunkRef: React.MutableRefObject<number>,
  ): MediaRecorder => {
    const mimeType = getBestMime();
    const rec = new MediaRecorder(stream, { mimeType });

    rec.ondataavailable = (e) => {
      if (e.data.size < 100) return;
      const idx = chunkRef.current++;
      uploadChunk(e.data, idx, trackSession);
    };

    rec.onstop = () => {
      console.log(`[rec] ${trackSession} stopped — chunks: ${chunkRef.current}`);
    };

    rec.start(8000); // chunk every 8 s
    return rec;
  }, [uploadChunk]);

  // ── Start ──────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    try {
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;
      camChunkRef.current = 0;
      screenChunkRef.current = 0;

      // Camera + mic stream
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      camStreamRef.current = camStream;
      setCamStream(camStream);
      allStreamsRef.current = [camStream];

      // Camera recorder
      camRecorderRef.current = makeRecorder(
        camStream,
        `${sessionId}-cam`,
        camChunkRef,
      );

      // Screen capture — REQUIRED (throws if denied, blocking the whole start)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30 },
        } as MediaTrackConstraints,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        // @ts-ignore
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
      } as DisplayMediaStreamOptions);

      screenStreamRef.current = screenStream;
      setScreenStream(screenStream);
      allStreamsRef.current.push(screenStream);
      screenRecorderRef.current = makeRecorder(
        screenStream,
        `${sessionId}-screen`,
        screenChunkRef,
      );

      // Stop screen recorder if user cancels share from browser UI
      screenStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (screenRecorderRef.current?.state !== 'inactive') {
          screenRecorderRef.current?.stop();
        }
      });

      setState('recording');
      console.log(`[rec] Session started: ${sessionId}`);
    } catch (err) {
      console.error('[rec] start error:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar grabación');
      setState('error');
    }
  }, [makeRecorder]);

  // ── Stop ───────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    [camRecorderRef.current, screenRecorderRef.current].forEach((rec) => {
      if (rec && rec.state !== 'inactive') rec.stop();
    });
    allStreamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    setState('done');
  }, []);

  // ── Safety net on page close ───────────────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      const sessionId = sessionIdRef.current;

      [
        { rec: camRecorderRef.current,    chunkRef: camChunkRef,    suffix: '-cam' },
        { rec: screenRecorderRef.current, chunkRef: screenChunkRef, suffix: '-screen' },
      ].forEach(({ rec, chunkRef, suffix }) => {
        if (!rec || rec.state === 'inactive') return;
        const trackSession = `${sessionId}${suffix}`;
        const idx = chunkRef.current;
        rec.addEventListener('dataavailable', (e) => {
          if (e.data.size > 100) flushBeacon(e.data, idx, trackSession);
        }, { once: true });
        rec.requestData();
        rec.stop();
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [flushBeacon]);

  return { state, error, start, stop, sessionId: sessionIdRef, camStream, screenStream };
}
